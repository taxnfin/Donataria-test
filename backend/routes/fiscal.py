from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
import uuid
import io
import base64
from database import db
from models import User, ObligacionCreate, InformeCreate, InformeUpdate, DashboardStats
from utils import get_current_user, calculate_urgency, add_logo_to_story
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()

# ==================== OBLIGACIONES FISCALES ====================

@router.get("/obligaciones")
async def get_obligaciones(
    estado: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if estado:
        query["estado"] = estado
    
    obligaciones = await db.obligaciones.find(query, {"_id": 0}).sort("fecha_limite", 1).to_list(100)
    
    # Add urgency indicator
    for obl in obligaciones:
        fecha = obl.get("fecha_limite")
        if isinstance(fecha, str):
            fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
        obl["urgencia"] = calculate_urgency(fecha)
    
    return obligaciones

@router.post("/obligaciones")
async def create_obligacion(data: ObligacionCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    obligacion_id = f"obl_{uuid.uuid4().hex[:12]}"
    
    # Handle fecha_limite - could be string or datetime
    fecha_limite = data.fecha_limite
    if hasattr(fecha_limite, 'isoformat'):
        fecha_limite = fecha_limite.isoformat()
    
    doc = {
        "obligacion_id": obligacion_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "fecha_limite": fecha_limite,
        "estado": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.obligaciones.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@router.put("/obligaciones/{obligacion_id}/estado")
async def update_obligacion_estado(
    obligacion_id: str,
    estado: str,
    user: User = Depends(get_current_user)
):
    valid_estados = ["pendiente", "en_proceso", "cumplida", "omitida"]
    if estado not in valid_estados:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {valid_estados}")
    
    result = await db.obligaciones.update_one(
        {"obligacion_id": obligacion_id, "organizacion_id": user.organizacion_id},
        {"$set": {"estado": estado}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Obligación no encontrada")
    
    return {"message": "Estado actualizado"}


# ==================== INFORME DE TRANSPARENCIA ====================

@router.get("/transparencia")
async def get_informes(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    informes = await db.informes_transparencia.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("ejercicio_fiscal", -1).to_list(50)
    
    return informes

@router.post("/transparencia")
async def create_informe(data: InformeCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    # Check if informe exists for this year
    existing = await db.informes_transparencia.find_one(
        {"organizacion_id": user.organizacion_id, "ejercicio_fiscal": data.ejercicio_fiscal},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe un informe para el ejercicio {data.ejercicio_fiscal}")
    
    informe_id = f"inf_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "informe_id": informe_id,
        "organizacion_id": user.organizacion_id,
        "ejercicio_fiscal": data.ejercicio_fiscal,
        "total_donativos_recibidos": 0,
        "total_donativos_especie": 0,
        "total_donativos_otorgados": 0,
        "total_gastos_admin": 0,
        "porcentaje_gastos_admin": 0,
        "descripcion_actividades": None,
        "numero_beneficiarios": 0,
        "influencia_legislacion": False,
        "detalle_influencia": None,
        "estado": "borrador",
        "progreso_completitud": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.informes_transparencia.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@router.get("/transparencia/{informe_id}")
async def get_informe(informe_id: str, user: User = Depends(get_current_user)):
    informe = await db.informes_transparencia.find_one(
        {"informe_id": informe_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    return informe

@router.put("/transparencia/{informe_id}")
async def update_informe(informe_id: str, data: InformeUpdate, user: User = Depends(get_current_user)):
    informe = await db.informes_transparencia.find_one(
        {"informe_id": informe_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Calculate porcentaje_gastos_admin
    total_donativos = update_data.get("total_donativos_recibidos", informe.get("total_donativos_recibidos", 0))
    gastos_admin = update_data.get("total_gastos_admin", informe.get("total_gastos_admin", 0))
    
    if total_donativos > 0:
        porcentaje = (gastos_admin / total_donativos) * 100
        update_data["porcentaje_gastos_admin"] = round(porcentaje, 2)
    
    # Calculate progress
    fields_required = ["total_donativos_recibidos", "total_gastos_admin", "descripcion_actividades", "numero_beneficiarios"]
    completed = 0
    merged = {**informe, **update_data}
    for field in fields_required:
        if merged.get(field):
            completed += 1
    update_data["progreso_completitud"] = int((completed / len(fields_required)) * 100)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.informes_transparencia.update_one(
        {"informe_id": informe_id},
        {"$set": update_data}
    )
    
    updated = await db.informes_transparencia.find_one({"informe_id": informe_id}, {"_id": 0})
    return updated

@router.post("/transparencia/{informe_id}/presentar")
async def presentar_informe(informe_id: str, user: User = Depends(get_current_user)):
    informe = await db.informes_transparencia.find_one(
        {"informe_id": informe_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    
    # Validate porcentaje_gastos_admin <= 5%
    if informe.get("porcentaje_gastos_admin", 0) > 5:
        raise HTTPException(
            status_code=400,
            detail="No se puede presentar el informe: el porcentaje de gastos administrativos excede el 5% permitido (Art. 138 RLISR)"
        )
    
    await db.informes_transparencia.update_one(
        {"informe_id": informe_id},
        {"$set": {"estado": "presentado", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Informe marcado como presentado"}


# ==================== DASHBOARD ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    org_id = user.organizacion_id
    current_year = datetime.now().year
    
    # Total donativos del ejercicio actual
    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    total_donativos = 0
    donativos_por_mes = {i: 0 for i in range(1, 13)}
    
    for d in donativos:
        fecha = d.get("fecha_donativo")
        if isinstance(fecha, str):
            try:
                fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
            except:
                continue
        
        if fecha.year == current_year:
            monto = d.get("monto", 0)
            if d.get("moneda") != "MXN" and d.get("tipo_cambio"):
                monto = monto * d["tipo_cambio"]
            total_donativos += monto
            donativos_por_mes[fecha.month] += monto
    
    # Total donantes
    total_donantes = await db.donantes.count_documents({"organizacion_id": org_id})
    
    # Total CFDIs
    total_cfdis = await db.cfdis.count_documents({"organizacion_id": org_id})
    
    # Get latest informe for gastos admin %
    informe = await db.informes_transparencia.find_one(
        {"organizacion_id": org_id, "ejercicio_fiscal": current_year},
        {"_id": 0}
    )
    
    porcentaje_gastos = informe.get("porcentaje_gastos_admin", 0) if informe else 0
    
    # Alerta de gastos
    alerta_gastos = None
    if porcentaje_gastos > 5:
        alerta_gastos = {
            "tipo": "critico",
            "mensaje": f"ALERTA CRÍTICA: Los gastos administrativos ({porcentaje_gastos:.1f}%) exceden el límite del 5% (Art. 138 RLISR)",
            "porcentaje": porcentaje_gastos
        }
    elif porcentaje_gastos > 3.5:
        alerta_gastos = {
            "tipo": "advertencia",
            "mensaje": f"Advertencia: Los gastos administrativos ({porcentaje_gastos:.1f}%) se acercan al límite del 5%",
            "porcentaje": porcentaje_gastos
        }
    
    # Obligaciones próximas
    obligaciones = await db.obligaciones.find(
        {"organizacion_id": org_id, "estado": {"$in": ["pendiente", "en_proceso"]}},
        {"_id": 0}
    ).sort("fecha_limite", 1).to_list(5)
    
    for obl in obligaciones:
        fecha = obl.get("fecha_limite")
        if isinstance(fecha, str):
            fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
        obl["urgencia"] = calculate_urgency(fecha)
    
    # Format donativos por mes for chart
    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    donativos_chart = [
        {"mes": meses[i-1], "monto": donativos_por_mes[i]}
        for i in range(1, 13)
    ]
    
    return {
        "total_donativos": round(total_donativos, 2),
        "total_donantes": total_donantes,
        "total_cfdis": total_cfdis,
        "porcentaje_gastos_admin": porcentaje_gastos,
        "donativos_por_mes": donativos_chart,
        "obligaciones_proximas": obligaciones,
        "alerta_gastos": alerta_gastos
    }



def generate_informe_pdf(informe: dict, organizacion: dict) -> io.BytesIO:
    """Generate PDF for transparency report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=20, textColor=colors.HexColor('#059669'))
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.HexColor('#111827'))
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontSize=11, spaceAfter=8)

    elements = []

    add_logo_to_story(elements, organizacion)

    elements.append(Paragraph("INFORME DE TRANSPARENCIA", title_style))
    elements.append(Paragraph(f"Ficha 19/ISR - Ejercicio Fiscal {informe.get('ejercicio_fiscal', '')}", heading_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("DATOS DE LA ORGANIZACION", heading_style))
    org_data = [
        ["Nombre:", organizacion.get('nombre', 'N/A')],
        ["RFC:", organizacion.get('rfc', 'N/A')],
        ["Rubro:", organizacion.get('rubro', 'N/A').capitalize()],
    ]
    org_table = Table(org_data, colWidths=[2*inch, 4*inch])
    org_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(org_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("INFORMACION FINANCIERA", heading_style))

    def format_currency(value):
        return f"${value:,.2f} MXN" if value else "$0.00 MXN"

    financial_data = [
        ["Concepto", "Monto"],
        ["Total donativos recibidos (efectivo)", format_currency(informe.get('total_donativos_recibidos', 0))],
        ["Total donativos en especie", format_currency(informe.get('total_donativos_especie', 0))],
        ["Total donativos otorgados a terceros", format_currency(informe.get('total_donativos_otorgados', 0))],
        ["Total gastos de administracion", format_currency(informe.get('total_gastos_admin', 0))],
        ["Porcentaje gastos admin", f"{informe.get('porcentaje_gastos_admin', 0):.2f}%"],
    ]

    financial_table = Table(financial_data, colWidths=[3.5*inch, 2.5*inch])
    financial_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(financial_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("BENEFICIARIOS", heading_style))
    elements.append(Paragraph(f"Numero de beneficiarios atendidos: {informe.get('numero_beneficiarios', 0):,}", normal_style))
    elements.append(Spacer(1, 15))

    if informe.get('descripcion_actividades'):
        elements.append(Paragraph("DESCRIPCION DE ACTIVIDADES", heading_style))
        elements.append(Paragraph(informe.get('descripcion_actividades', ''), normal_style))
        elements.append(Spacer(1, 15))

    elements.append(Paragraph("ACTIVIDADES DE INFLUENCIA EN LEGISLACION", heading_style))
    influencia = "Si" if informe.get('influencia_legislacion') else "No"
    elements.append(Paragraph(f"Realizo actividades que influyen en legislacion? {influencia}", normal_style))
    if informe.get('influencia_legislacion') and informe.get('detalle_influencia'):
        elements.append(Paragraph(f"Detalle: {informe.get('detalle_influencia', '')}", normal_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("FUNDAMENTO LEGAL", heading_style))
    elements.append(Paragraph("Este informe se presenta conforme a lo establecido en el Articulo 82 de la Ley del Impuesto Sobre la Renta (LISR) y la Ficha 19/ISR del Anexo 1-A de la Resolucion Miscelanea Fiscal.", normal_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Fecha de generacion: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray)))

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/transparencia/{informe_id}/pdf")
async def download_informe_pdf(informe_id: str, user: User = Depends(get_current_user)):
    """Download transparency report as PDF"""
    informe = await db.informes_transparencia.find_one(
        {"informe_id": informe_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    
    organizacion = await db.organizaciones.find_one(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    
    pdf_buffer = generate_informe_pdf(informe, organizacion or {})
    
    filename = f"informe_transparencia_{informe['ejercicio_fiscal']}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

