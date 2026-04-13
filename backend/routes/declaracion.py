from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
import uuid
import io
import base64
from database import db
from models import User, DeclaracionAnualCreate, DeclaracionAnualUpdate
from utils import get_current_user, log_audit, require_role, add_logo_to_story
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()

LIMITE_ACTIVIDADES_NO_RELACIONADAS = 10.0  # 10% max


def _compute_declaracion(d: dict) -> dict:
    """Compute totals, 10% control and remanente ficto from raw fields."""
    ing_donativos = d.get("ingresos_donativos_efectivo", 0) + d.get("ingresos_donativos_especie", 0)
    ing_propias = d.get("ingresos_actividades_propias", 0) + d.get("ingresos_cuotas_asociados", 0)
    ing_no_rel = d.get("ingresos_actividades_no_relacionadas", 0)
    ing_financieros = d.get("ingresos_intereses", 0)
    ing_otros = d.get("ingresos_otros", 0)
    total_ingresos = ing_donativos + ing_propias + ing_no_rel + ing_financieros + ing_otros

    ded_op = d.get("deducciones_operacion", 0)
    ded_admin = d.get("deducciones_administracion", 0)
    ded_fin = d.get("deducciones_financieros", 0)
    ded_otros = d.get("deducciones_otros", 0)
    total_deducciones = ded_op + ded_admin + ded_fin + ded_otros

    remanente = total_ingresos - total_deducciones

    ficto_total = (
        d.get("ficto_omision_ingresos", 0)
        + d.get("ficto_compras_no_realizadas", 0)
        + d.get("ficto_prestamos_socios", 0)
        + d.get("ficto_gastos_no_deducibles", 0)
    )

    pct_no_relacionadas = round((ing_no_rel / total_ingresos * 100) if total_ingresos > 0 else 0, 2)
    excede_10 = pct_no_relacionadas > LIMITE_ACTIVIDADES_NO_RELACIONADAS

    return {
        "total_ingresos": round(total_ingresos, 2),
        "desglose_ingresos": {
            "donativos": round(ing_donativos, 2),
            "actividades_propias": round(ing_propias, 2),
            "actividades_no_relacionadas": round(ing_no_rel, 2),
            "financieros": round(ing_financieros, 2),
            "otros": round(ing_otros, 2),
        },
        "total_deducciones": round(total_deducciones, 2),
        "remanente_distribuible": round(remanente, 2),
        "remanente_ficto": round(ficto_total, 2),
        "remanente_total": round(remanente + ficto_total, 2),
        "control_10_porciento": {
            "porcentaje_no_relacionadas": pct_no_relacionadas,
            "limite": LIMITE_ACTIVIDADES_NO_RELACIONADAS,
            "excede_limite": excede_10,
            "monto_no_relacionadas": round(ing_no_rel, 2),
        },
    }


@router.get("/declaraciones")
async def list_declaraciones(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")
    docs = await db.declaraciones_anuales.find(
        {"organizacion_id": user.organizacion_id}, {"_id": 0}
    ).sort("ejercicio_fiscal", -1).to_list(50)
    for d in docs:
        d["calculos"] = _compute_declaracion(d)
    return docs


@router.post("/declaraciones")
async def create_declaracion(data: DeclaracionAnualCreate, user: User = Depends(require_role("admin", "editor"))):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    existing = await db.declaraciones_anuales.find_one(
        {"organizacion_id": user.organizacion_id, "ejercicio_fiscal": data.ejercicio_fiscal}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe una declaracion para el ejercicio {data.ejercicio_fiscal}")

    dec_id = f"dec_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "declaracion_id": dec_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "estado": "borrador",
        "created_at": now,
        "updated_at": now,
    }
    await db.declaraciones_anuales.insert_one(doc)
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "declaracion_anual", dec_id, {"ejercicio": data.ejercicio_fiscal})

    result = {k: v for k, v in doc.items() if k != "_id"}
    result["calculos"] = _compute_declaracion(result)
    return result


@router.get("/declaraciones/{dec_id}")
async def get_declaracion(dec_id: str, user: User = Depends(get_current_user)):
    doc = await db.declaraciones_anuales.find_one(
        {"declaracion_id": dec_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Declaracion no encontrada")
    doc["calculos"] = _compute_declaracion(doc)
    return doc


@router.put("/declaraciones/{dec_id}")
async def update_declaracion(dec_id: str, data: DeclaracionAnualUpdate, user: User = Depends(require_role("admin", "editor"))):
    existing = await db.declaraciones_anuales.find_one(
        {"declaracion_id": dec_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Declaracion no encontrada")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.declaraciones_anuales.update_one({"declaracion_id": dec_id}, {"$set": update_fields})
    updated = await db.declaraciones_anuales.find_one({"declaracion_id": dec_id}, {"_id": 0})
    updated["calculos"] = _compute_declaracion(updated)

    await log_audit(user.organizacion_id, user.user_id, user.name, "actualizar", "declaracion_anual", dec_id, {})
    return updated


@router.post("/declaraciones/{dec_id}/presentar")
async def presentar_declaracion(dec_id: str, user: User = Depends(require_role("admin"))):
    doc = await db.declaraciones_anuales.find_one(
        {"declaracion_id": dec_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Declaracion no encontrada")

    calc = _compute_declaracion(doc)
    if calc["control_10_porciento"]["excede_limite"]:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede presentar: las actividades no relacionadas ({calc['control_10_porciento']['porcentaje_no_relacionadas']}%) exceden el limite del 10%"
        )

    await db.declaraciones_anuales.update_one(
        {"declaracion_id": dec_id},
        {"$set": {"estado": "presentada", "fecha_presentacion": datetime.now(timezone.utc).isoformat()}}
    )
    await log_audit(user.organizacion_id, user.user_id, user.name, "presentar", "declaracion_anual", dec_id, {})
    return {"message": "Declaracion marcada como presentada"}


@router.delete("/declaraciones/{dec_id}")
async def delete_declaracion(dec_id: str, user: User = Depends(require_role("admin"))):
    result = await db.declaraciones_anuales.delete_one(
        {"declaracion_id": dec_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Declaracion no encontrada")
    return {"message": "Declaracion eliminada"}


@router.get("/declaraciones/{dec_id}/pdf")
async def declaracion_pdf(dec_id: str, user: User = Depends(get_current_user)):
    doc = await db.declaraciones_anuales.find_one(
        {"declaracion_id": dec_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Declaracion no encontrada")

    org = await db.organizaciones.find_one({"organizacion_id": user.organizacion_id}, {"_id": 0}) or {}
    calc = _compute_declaracion(doc)

    buffer = io.BytesIO()
    pdf_doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title_s = ParagraphStyle('T', parent=styles['Title'], fontSize=18, textColor=colors.HexColor('#065f46'), spaceAfter=6)
    sub_s = ParagraphStyle('S', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#374151'), spaceAfter=10)
    n_s = ParagraphStyle('N', parent=styles['Normal'], fontSize=10, spaceAfter=6)

    story = []
    add_logo_to_story(story, org)
    story.append(Paragraph("DECLARACION ANUAL - TITULO III LISR", title_s))
    story.append(Paragraph(f"Personas Morales con Fines No Lucrativos", sub_s))
    story.append(Paragraph(f"{org.get('nombre', '')} - RFC: {org.get('rfc', 'N/A')}", n_s))
    story.append(Paragraph(f"Ejercicio Fiscal: {doc.get('ejercicio_fiscal', '')}", n_s))
    story.append(Paragraph(f"Estado: {doc.get('estado', 'borrador').upper()}", n_s))
    story.append(Spacer(1, 15))

    # Ingresos
    story.append(Paragraph("I. INGRESOS", sub_s))
    ing = calc["desglose_ingresos"]
    ing_data = [
        ["Concepto", "Monto"],
        ["Donativos recibidos", f"${ing['donativos']:,.2f}"],
        ["Actividades propias del objeto social", f"${ing['actividades_propias']:,.2f}"],
        ["Actividades NO relacionadas con objeto social", f"${ing['actividades_no_relacionadas']:,.2f}"],
        ["Intereses y rendimientos financieros", f"${ing['financieros']:,.2f}"],
        ["Otros ingresos", f"${ing['otros']:,.2f}"],
        ["TOTAL INGRESOS", f"${calc['total_ingresos']:,.2f}"],
    ]
    t = Table(ing_data, colWidths=[4*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9fafb')]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ecfdf5')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Deducciones
    story.append(Paragraph("II. DEDUCCIONES", sub_s))
    story.append(Paragraph(f"Total deducciones: ${calc['total_deducciones']:,.2f}", n_s))
    story.append(Spacer(1, 12))

    # Remanente
    story.append(Paragraph("III. REMANENTE DISTRIBUIBLE", sub_s))
    rem_data = [
        ["Concepto", "Monto"],
        ["Remanente del ejercicio", f"${calc['remanente_distribuible']:,.2f}"],
        ["Remanente distribuible ficto", f"${calc['remanente_ficto']:,.2f}"],
        ["REMANENTE TOTAL", f"${calc['remanente_total']:,.2f}"],
    ]
    t2 = Table(rem_data, colWidths=[4*inch, 2.5*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c2d12')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t2)
    story.append(Spacer(1, 12))

    # Control 10%
    c10 = calc["control_10_porciento"]
    story.append(Paragraph("IV. CONTROL DEL 10% - ACTIVIDADES NO RELACIONADAS", sub_s))
    color_10 = colors.HexColor('#b91c1c') if c10["excede_limite"] else colors.HexColor('#065f46')
    story.append(Paragraph(f"Porcentaje de actividades no relacionadas: {c10['porcentaje_no_relacionadas']}%", n_s))
    status_10 = "EXCEDE EL LIMITE" if c10["excede_limite"] else "DENTRO DEL LIMITE"
    p10 = ParagraphStyle('P10', parent=n_s, textColor=color_10, fontSize=11)
    story.append(Paragraph(f"Estado: {status_10} (maximo permitido: {c10['limite']}%)", p10))
    story.append(Spacer(1, 20))

    story.append(Paragraph("Fundamento legal: Titulo III, Art. 79-89 LISR", ParagraphStyle('F', parent=n_s, fontSize=8, textColor=colors.gray)))

    pdf_doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=declaracion_anual_{doc['ejercicio_fiscal']}.pdf"})


@router.get("/declaraciones/auto-fill/{ejercicio}")
async def auto_fill_declaracion(ejercicio: int, user: User = Depends(get_current_user)):
    """Auto-fill declaration fields from existing data (donativos, gastos admin, etc.)"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id

    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    total_efectivo = 0
    total_especie = 0
    for d in donativos:
        fecha = d.get("fecha_donativo", "")
        if isinstance(fecha, str) and fecha[:4] == str(ejercicio):
            monto = d.get("monto", 0)
            if d.get("es_especie"):
                total_especie += monto
            else:
                total_efectivo += monto

    informe = await db.informes_transparencia.find_one(
        {"organizacion_id": org_id, "ejercicio_fiscal": ejercicio}, {"_id": 0}
    )
    gastos_admin = informe.get("total_gastos_admin", 0) if informe else 0

    return {
        "ejercicio_fiscal": ejercicio,
        "ingresos_donativos_efectivo": round(total_efectivo, 2),
        "ingresos_donativos_especie": round(total_especie, 2),
        "deducciones_administracion": round(gastos_admin, 2),
    }
