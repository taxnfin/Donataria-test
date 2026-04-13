from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional
import io
from database import db
from models import User
from utils import get_current_user, add_logo_to_story
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()


@router.get("/dashboard/semaforo")
async def get_semaforo_cumplimiento(user: User = Depends(get_current_user)):
    """Semaforo de cumplimiento: combines compliance score, KYC %, 10% control, AML alerts"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    now = datetime.now(timezone.utc)
    year = now.year

    # 1. Score de cumplimiento
    all_obligations = await db.obligaciones.find({"organizacion_id": org_id}, {"_id": 0}).to_list(1000)
    cumplidas = sum(1 for o in all_obligations if o.get("estado") == "cumplida")
    vencidas = 0
    omitidas = sum(1 for o in all_obligations if o.get("estado") == "omitida")
    for obl in all_obligations:
        fl = obl.get("fecha_limite")
        if isinstance(fl, str):
            try:
                fl = datetime.fromisoformat(fl.replace("Z", "+00:00"))
            except:
                continue
        if fl.tzinfo is None:
            fl = fl.replace(tzinfo=timezone.utc)
        if obl.get("estado") in ["pendiente", "en_proceso"] and fl < now:
            vencidas += 1
    past = cumplidas + vencidas + omitidas
    score_cumplimiento = round((cumplidas / past * 100) if past > 0 else 100, 1)

    # 2. KYC %
    donantes = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    kyc_completo = 0
    for d in donantes:
        if d.get("tiene_identificacion") and d.get("tiene_constancia_fiscal") and d.get("beneficiario_controlador"):
            kyc_completo += 1
    kyc_pct = round(kyc_completo / len(donantes) * 100) if donantes else 100

    # 3. Control 10%
    dec = await db.declaraciones_anuales.find_one(
        {"organizacion_id": org_id, "ejercicio_fiscal": year}, {"_id": 0}
    )
    control_10_pct = 0
    control_10_ok = True
    if dec:
        total_ingresos = sum([
            dec.get("ingresos_donativos_efectivo", 0), dec.get("ingresos_donativos_especie", 0),
            dec.get("ingresos_cuotas_asociados", 0), dec.get("ingresos_actividades_propias", 0),
            dec.get("ingresos_actividades_no_relacionadas", 0), dec.get("ingresos_intereses", 0),
            dec.get("ingresos_otros", 0),
        ])
        no_rel = dec.get("ingresos_actividades_no_relacionadas", 0)
        control_10_pct = round((no_rel / total_ingresos * 100) if total_ingresos > 0 else 0, 1)
        control_10_ok = control_10_pct <= 10

    # 4. Alertas AML pendientes
    alertas_pendientes = await db.alerts.count_documents(
        {"organizacion_id": org_id, "estado": {"$in": ["nueva", "en_revision"]}}
    )
    alertas_total = await db.alerts.count_documents({"organizacion_id": org_id})

    # Compute overall score (weighted average)
    w_cumplimiento = 0.35
    w_kyc = 0.25
    w_control10 = 0.20
    w_aml = 0.20

    # AML score: inversely proportional to pending alerts
    aml_score = max(0, 100 - (alertas_pendientes * 15))

    # Control 10 score
    control_10_score = 100 if control_10_ok else max(0, 100 - (control_10_pct - 10) * 10)

    overall = round(
        score_cumplimiento * w_cumplimiento +
        kyc_pct * w_kyc +
        control_10_score * w_control10 +
        aml_score * w_aml
    , 1)

    # Semaforo color
    if overall >= 80:
        semaforo = "verde"
    elif overall >= 60:
        semaforo = "ambar"
    else:
        semaforo = "rojo"

    return {
        "semaforo": semaforo,
        "score_general": overall,
        "indicadores": {
            "cumplimiento": {
                "score": score_cumplimiento,
                "label": "Score de Cumplimiento",
                "detalle": f"{cumplidas}/{past} obligaciones cumplidas",
                "color": "verde" if score_cumplimiento >= 80 else "ambar" if score_cumplimiento >= 60 else "rojo",
            },
            "kyc": {
                "score": kyc_pct,
                "label": "KYC Completado",
                "detalle": f"{kyc_completo}/{len(donantes)} donantes completos",
                "color": "verde" if kyc_pct >= 80 else "ambar" if kyc_pct >= 50 else "rojo",
            },
            "control_10": {
                "score": control_10_score,
                "porcentaje": control_10_pct,
                "label": "Control 10%",
                "detalle": f"{control_10_pct}% actividades no relacionadas" if dec else "Sin declaracion",
                "color": "verde" if control_10_ok else "rojo",
            },
            "aml": {
                "score": aml_score,
                "label": "Alertas AML",
                "detalle": f"{alertas_pendientes} pendientes de {alertas_total} total",
                "color": "verde" if alertas_pendientes == 0 else "ambar" if alertas_pendientes <= 3 else "rojo",
            },
        }
    }


@router.get("/dashboard/reportes-operativos")
async def get_reportes_operativos(user: User = Depends(get_current_user)):
    """Operational reports: donations by period, top donors, concentration, especie, extranjero, conciliation"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    year = datetime.now().year

    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    donantes = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    cfdis = await db.cfdis.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    donantes_map = {d["donante_id"]: d for d in donantes}

    # --- Por tipo ---
    por_tipo = {}
    for d in donativos:
        tipo = d.get("tipo_donativo", "otro")
        por_tipo.setdefault(tipo, {"count": 0, "monto": 0})
        por_tipo[tipo]["count"] += 1
        por_tipo[tipo]["monto"] += d.get("monto", 0)

    # --- Top donantes + concentracion 80/20 ---
    donante_totals = {}
    for d in donativos:
        did = d.get("donante_id")
        donante_totals.setdefault(did, 0)
        donante_totals[did] += d.get("monto", 0)

    sorted_donantes = sorted(donante_totals.items(), key=lambda x: x[1], reverse=True)
    total_donativos_monto = sum(v for _, v in sorted_donantes)
    top_donantes = []
    acumulado = 0
    for did, monto in sorted_donantes[:20]:
        dn = donantes_map.get(did, {})
        acumulado += monto
        top_donantes.append({
            "donante_id": did,
            "nombre": dn.get("nombre", "Desconocido"),
            "rfc": dn.get("rfc", ""),
            "monto": round(monto, 2),
            "porcentaje": round(monto / total_donativos_monto * 100, 1) if total_donativos_monto else 0,
            "acumulado_pct": round(acumulado / total_donativos_monto * 100, 1) if total_donativos_monto else 0,
        })

    # Concentracion 80/20
    top_80_count = 0
    acc = 0
    for _, monto in sorted_donantes:
        acc += monto
        top_80_count += 1
        if total_donativos_monto > 0 and acc / total_donativos_monto >= 0.8:
            break

    # --- Donativos en especie ---
    especie = [d for d in donativos if d.get("es_especie")]
    especie_list = []
    for d in especie:
        dn = donantes_map.get(d.get("donante_id"), {})
        especie_list.append({
            "donativo_id": d.get("donativo_id"),
            "donante": dn.get("nombre", ""),
            "monto": d.get("monto", 0),
            "descripcion": d.get("descripcion_especie", ""),
            "fecha": d.get("fecha_donativo", ""),
        })

    # --- Donativos del extranjero ---
    extranjero_ids = [d["donante_id"] for d in donantes if d.get("es_extranjero")]
    donativos_extranjero = [d for d in donativos if d.get("donante_id") in extranjero_ids]
    extranjero_list = []
    for d in donativos_extranjero:
        dn = donantes_map.get(d.get("donante_id"), {})
        extranjero_list.append({
            "donativo_id": d.get("donativo_id"),
            "donante": dn.get("nombre", ""),
            "pais": dn.get("pais", ""),
            "monto": d.get("monto", 0),
            "moneda": d.get("moneda", "MXN"),
            "fecha": d.get("fecha_donativo", ""),
        })

    # --- Conciliacion CFDI vs donativos ---
    donativos_con_cfdi = sum(1 for d in donativos if d.get("cfdi_id"))
    donativos_sin_cfdi = len(donativos) - donativos_con_cfdi
    cfdis_timbrados = sum(1 for c in cfdis if c.get("estado") == "timbrado")
    cfdis_cancelados = sum(1 for c in cfdis if c.get("estado") == "cancelado")

    # --- Donativos cancelados / con CFDI cancelado ---
    cfdi_cancelado_ids = {c.get("donativo_id") for c in cfdis if c.get("estado") == "cancelado"}
    donativos_cfdi_cancelado = [d for d in donativos if d.get("donativo_id") in cfdi_cancelado_ids]

    return {
        "ejercicio": year,
        "resumen": {
            "total_donativos": len(donativos),
            "total_monto": round(total_donativos_monto, 2),
            "total_donantes_activos": len(donante_totals),
        },
        "por_tipo": [{"tipo": k, **v} for k, v in por_tipo.items()],
        "top_donantes": top_donantes,
        "concentracion_80_20": {
            "donantes_para_80_pct": top_80_count,
            "total_donantes": len(donante_totals),
            "porcentaje_concentracion": round(top_80_count / len(donante_totals) * 100, 1) if donante_totals else 0,
            "alerta_concentracion": top_80_count <= max(1, len(donante_totals) * 0.2),
        },
        "especie": {
            "total": len(especie_list),
            "monto": round(sum(e["monto"] for e in especie_list), 2),
            "detalle": especie_list,
        },
        "extranjero": {
            "total": len(extranjero_list),
            "monto": round(sum(e["monto"] for e in extranjero_list), 2),
            "detalle": extranjero_list,
        },
        "conciliacion": {
            "donativos_total": len(donativos),
            "donativos_con_cfdi": donativos_con_cfdi,
            "donativos_sin_cfdi": donativos_sin_cfdi,
            "cfdis_emitidos": len(cfdis),
            "cfdis_timbrados": cfdis_timbrados,
            "cfdis_cancelados": cfdis_cancelados,
            "donativos_con_cfdi_cancelado": len(donativos_cfdi_cancelado),
        },
    }


@router.get("/dashboard/ficha-publica")
async def get_ficha_publica(user: User = Depends(get_current_user)):
    """Public transparency card: simplified income/expenses, destination, activities, beneficiaries"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    year = datetime.now().year

    org = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0}) or {}

    # Latest transparency report
    informe = await db.informes_transparencia.find_one(
        {"organizacion_id": org_id, "ejercicio_fiscal": year}, {"_id": 0}
    )
    if not informe:
        informe = await db.informes_transparencia.find_one(
            {"organizacion_id": org_id}, {"_id": 0}
        )

    # Get donativos summary
    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    total_donativos = sum(d.get("monto", 0) for d in donativos)
    total_especie = sum(d.get("monto", 0) for d in donativos if d.get("es_especie"))
    total_efectivo = total_donativos - total_especie

    donantes_count = await db.donantes.count_documents({"organizacion_id": org_id})

    return {
        "organizacion": {
            "nombre": org.get("nombre", ""),
            "rfc": org.get("rfc", ""),
            "rubro": org.get("rubro", ""),
            "logo_url": org.get("logo_url"),
        },
        "ejercicio_fiscal": informe.get("ejercicio_fiscal", year) if informe else year,
        "ingresos_egresos": {
            "total_donativos_recibidos": round(total_efectivo, 2),
            "total_donativos_especie": round(total_especie, 2),
            "total_gastos_admin": informe.get("total_gastos_admin", 0) if informe else 0,
            "total_donativos_otorgados": informe.get("total_donativos_otorgados", 0) if informe else 0,
            "porcentaje_gastos_admin": informe.get("porcentaje_gastos_admin", 0) if informe else 0,
        },
        "actividades": {
            "descripcion": informe.get("descripcion_actividades") if informe else None,
            "numero_beneficiarios": informe.get("numero_beneficiarios", 0) if informe else 0,
        },
        "donantes_activos": donantes_count,
        "estado_informe": informe.get("estado", "sin_informe") if informe else "sin_informe",
    }


# ==================== FICHA PUBLICA PDF ====================

@router.get("/dashboard/ficha-publica/pdf")
async def get_ficha_publica_pdf(user: User = Depends(get_current_user)):
    """Generate PDF of public transparency card for publishing on org's website"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    year = datetime.now().year

    org = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0}) or {}
    informe = await db.informes_transparencia.find_one(
        {"organizacion_id": org_id, "ejercicio_fiscal": year}, {"_id": 0}
    )
    if not informe:
        informe = await db.informes_transparencia.find_one(
            {"organizacion_id": org_id}, {"_id": 0}
        ) or {}

    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    total_donativos = sum(d.get("monto", 0) for d in donativos)
    total_especie = sum(d.get("monto", 0) for d in donativos if d.get("es_especie"))
    total_efectivo = total_donativos - total_especie
    donantes_count = await db.donantes.count_documents({"organizacion_id": org_id})
    ej = informe.get("ejercicio_fiscal", year)

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title_s = ParagraphStyle('T', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#065f46'), spaceAfter=6)
    sub_s = ParagraphStyle('S', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#374151'), spaceAfter=10)
    n_s = ParagraphStyle('N', parent=styles['Normal'], fontSize=10, spaceAfter=6)
    small_s = ParagraphStyle('Sm', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#6b7280'))

    story = []
    add_logo_to_story(story, org)

    story.append(Paragraph("FICHA PUBLICA DE TRANSPARENCIA", title_s))
    story.append(Paragraph("Donataria Autorizada - Informacion para el publico", sub_s))
    story.append(Spacer(1, 10))

    # Org info
    story.append(Paragraph("DATOS DE LA ORGANIZACION", sub_s))
    org_data = [
        ["Nombre / Razon Social:", org.get("nombre", "N/A")],
        ["RFC:", org.get("rfc", "Pendiente")],
        ["Rubro:", (org.get("rubro", "N/A") or "").capitalize()],
        ["Ejercicio Fiscal:", str(ej)],
    ]
    t = Table(org_data, colWidths=[2.5*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Financials
    story.append(Paragraph("ESTADO DE INGRESOS Y EGRESOS SIMPLIFICADO", sub_s))

    def fc(v):
        return f"${v:,.2f} MXN" if v else "$0.00 MXN"

    fin_data = [
        ["Concepto", "Monto"],
        ["Total donativos recibidos (efectivo)", fc(total_efectivo)],
        ["Total donativos en especie", fc(total_especie)],
        ["Total donativos otorgados a terceros", fc(informe.get("total_donativos_otorgados", 0))],
        ["Gastos de administracion", fc(informe.get("total_gastos_admin", 0))],
        ["% Gastos administrativos", f"{informe.get('porcentaje_gastos_admin', 0):.1f}%"],
    ]
    ft = Table(fin_data, colWidths=[4*inch, 2.5*inch])
    ft.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(ft)
    story.append(Spacer(1, 15))

    # Activities
    story.append(Paragraph("ACTIVIDADES Y BENEFICIARIOS", sub_s))
    desc = informe.get("descripcion_actividades") or "Sin descripcion de actividades registrada."
    story.append(Paragraph(desc, n_s))
    story.append(Paragraph(f"Numero de beneficiarios atendidos: {informe.get('numero_beneficiarios', 0):,}", n_s))
    story.append(Paragraph(f"Donantes activos: {donantes_count}", n_s))
    story.append(Spacer(1, 15))

    # Legal
    story.append(Paragraph("FUNDAMENTO LEGAL", sub_s))
    story.append(Paragraph(
        "Esta ficha se publica en cumplimiento del Articulo 82 de la Ley del Impuesto Sobre la Renta y la Ficha 19/ISR del Anexo 1-A de la Resolucion Miscelanea Fiscal vigente.",
        n_s
    ))
    story.append(Spacer(1, 20))

    now = datetime.now(timezone.utc)
    story.append(Paragraph(f"Documento generado el {now.strftime('%d/%m/%Y %H:%M')} UTC", small_s))
    story.append(Paragraph("Este documento es de caracter publico y puede ser consultado por cualquier persona.", small_s))

    pdf.build(story)
    buffer.seek(0)
    fn = f"ficha_publica_{org.get('nombre', 'org').replace(' ', '_')}_{ej}.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={fn}"})


# ==================== ANALYTICS AVANZADOS ====================

@router.get("/dashboard/analytics")
async def get_advanced_analytics(user: User = Depends(get_current_user)):
    """Advanced analytics with historical trends for donativos, donantes, CFDIs, compliance"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    now = datetime.now(timezone.utc)

    # --- Donativos trend (last 12 months) ---
    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(50000)
    meses_labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    monthly_trend = []
    for months_ago in range(11, -1, -1):
        ref = now - timedelta(days=months_ago * 30)
        m, y = ref.month, ref.year
        month_donativos = [d for d in donativos if _match_month(d.get("fecha_donativo"), m, y)]
        monto = sum(d.get("monto", 0) for d in month_donativos)
        count = len(month_donativos)
        monthly_trend.append({
            "label": f"{meses_labels[m - 1]} {y}",
            "mes": meses_labels[m - 1],
            "year": y,
            "monto": round(monto, 2),
            "cantidad": count,
        })

    # --- Donantes growth ---
    donantes = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    donantes_growth = []
    for months_ago in range(11, -1, -1):
        ref = now - timedelta(days=months_ago * 30)
        m, y = ref.month, ref.year
        nuevos = sum(1 for d in donantes if _match_month(d.get("created_at"), m, y))
        donantes_growth.append({
            "label": f"{meses_labels[m - 1]} {y}",
            "nuevos": nuevos,
        })

    # --- CFDIs trend ---
    cfdis = await db.cfdis.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    cfdis_trend = []
    for months_ago in range(11, -1, -1):
        ref = now - timedelta(days=months_ago * 30)
        m, y = ref.month, ref.year
        month_cfdis = [c for c in cfdis if _match_month(c.get("fecha_emision"), m, y)]
        timbrados = sum(1 for c in month_cfdis if c.get("estado") == "timbrado")
        cancelados = sum(1 for c in month_cfdis if c.get("estado") == "cancelado")
        cfdis_trend.append({
            "label": f"{meses_labels[m - 1]} {y}",
            "emitidos": len(month_cfdis),
            "timbrados": timbrados,
            "cancelados": cancelados,
        })

    # --- Alertas trend ---
    alertas = await db.alerts.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    alertas_trend = []
    for months_ago in range(11, -1, -1):
        ref = now - timedelta(days=months_ago * 30)
        m, y = ref.month, ref.year
        month_alertas = [a for a in alertas if _match_month(a.get("created_at"), m, y)]
        resueltas = sum(1 for a in month_alertas if a.get("estado") in ["resuelta", "descartada"])
        alertas_trend.append({
            "label": f"{meses_labels[m - 1]} {y}",
            "generadas": len(month_alertas),
            "resueltas": resueltas,
        })

    # --- YoY comparison ---
    current_year = now.year
    prev_year = current_year - 1
    donativos_cy = sum(d.get("monto", 0) for d in donativos if _match_year(d.get("fecha_donativo"), current_year))
    donativos_py = sum(d.get("monto", 0) for d in donativos if _match_year(d.get("fecha_donativo"), prev_year))
    yoy_pct = round(((donativos_cy - donativos_py) / donativos_py * 100) if donativos_py > 0 else 0, 1)

    donantes_cy = sum(1 for d in donantes if _match_year(d.get("created_at"), current_year))
    donantes_py = sum(1 for d in donantes if _match_year(d.get("created_at"), prev_year))

    cfdis_cy = sum(1 for c in cfdis if _match_year(c.get("fecha_emision"), current_year))

    # --- Promedio donativo ---
    avg_donativo = round(sum(d.get("monto", 0) for d in donativos) / len(donativos), 2) if donativos else 0

    return {
        "tendencias": {
            "donativos_mensual": monthly_trend,
            "donantes_crecimiento": donantes_growth,
            "cfdis_mensual": cfdis_trend,
            "alertas_mensual": alertas_trend,
        },
        "comparativa_anual": {
            "donativos_actual": round(donativos_cy, 2),
            "donativos_anterior": round(donativos_py, 2),
            "variacion_pct": yoy_pct,
            "donantes_nuevos_actual": donantes_cy,
            "donantes_nuevos_anterior": donantes_py,
            "cfdis_actual": cfdis_cy,
        },
        "metricas": {
            "promedio_donativo": avg_donativo,
            "total_donantes": len(donantes),
            "total_donativos": len(donativos),
            "total_cfdis": len(cfdis),
            "total_alertas": len(alertas),
        },
    }


def _match_month(date_str, month, year):
    if not date_str or not isinstance(date_str, str):
        return False
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.month == month and dt.year == year
    except:
        return False


def _match_year(date_str, year):
    if not date_str or not isinstance(date_str, str):
        return False
    return date_str[:4] == str(year)
