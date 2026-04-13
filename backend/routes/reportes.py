from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import io
import base64
from database import db
from models import User, ReportTemplateCreate, ReportCreate
from utils import get_current_user, log_audit, add_logo_to_story
from services import trigger_workflows
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()

# ==================== REPORT TEMPLATES ====================

@router.get("/reportes/plantillas")
async def get_report_templates(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    templates = await db.report_templates.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return templates

@router.post("/reportes/plantillas")
async def create_report_template(data: ReportTemplateCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    template_id = f"tpl_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "template_id": template_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "activa": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.report_templates.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@router.put("/reportes/plantillas/{template_id}")
async def update_report_template(template_id: str, data: ReportTemplateCreate, user: User = Depends(get_current_user)):
    result = await db.report_templates.update_one(
        {"template_id": template_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    template = await db.report_templates.find_one({"template_id": template_id}, {"_id": 0})
    return template

@router.delete("/reportes/plantillas/{template_id}")
async def delete_report_template(template_id: str, user: User = Depends(get_current_user)):
    result = await db.report_templates.delete_one(
        {"template_id": template_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"message": "Plantilla eliminada"}


# ==================== REPORTS ====================

@router.get("/reportes")
async def get_reports(
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if tipo:
        query["tipo"] = tipo
    if estado:
        query["estado"] = estado
    
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return reports

@router.post("/reportes")
async def create_report(data: ReportCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    report_id = f"rep_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # If template_id provided, get template criterios
    template = None
    if data.template_id:
        template = await db.report_templates.find_one(
            {"template_id": data.template_id, "organizacion_id": user.organizacion_id},
            {"_id": 0}
        )
    
    # Collect report data based on type and date range
    report_data = await generate_report_data(
        user.organizacion_id,
        data.tipo,
        data.periodo_inicio,
        data.periodo_fin,
        template.get("criterios", {}) if template else {}
    )
    
    # Handle periodo dates - could be string or datetime
    periodo_inicio = data.periodo_inicio
    periodo_fin = data.periodo_fin
    if hasattr(periodo_inicio, 'isoformat'):
        periodo_inicio = periodo_inicio.isoformat()
    if hasattr(periodo_fin, 'isoformat'):
        periodo_fin = periodo_fin.isoformat()
    
    doc = {
        "report_id": report_id,
        "organizacion_id": user.organizacion_id,
        "template_id": data.template_id,
        "titulo": data.titulo,
        "tipo": data.tipo,
        "descripcion": data.descripcion,
        "destinatario": data.destinatario,
        "periodo_inicio": periodo_inicio,
        "periodo_fin": periodo_fin,
        "estado": "borrador",
        "datos": report_data,
        "archivo_url": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.reports.insert_one(doc)
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "reporte", report_id, {"titulo": data.titulo, "tipo": data.tipo})
    # Trigger workflows
    await trigger_workflows(user.organizacion_id, "reporte_actualizado", doc)
    
    return {k: v for k, v in doc.items() if k != "_id"}

async def generate_report_data(org_id: str, tipo: str, inicio, fin, criterios: dict) -> dict:
    """Generate report data based on type and criteria"""
    
    # Handle inicio/fin - could be string or datetime
    inicio_str = inicio.isoformat() if hasattr(inicio, 'isoformat') else str(inicio)
    fin_str = fin.isoformat() if hasattr(fin, 'isoformat') else str(fin)
    
    # Get donativos in date range
    donativos = await db.donativos.find(
        {
            "organizacion_id": org_id,
            "fecha_donativo": {
                "$gte": inicio_str,
                "$lte": fin_str
            }
        },
        {"_id": 0}
    ).to_list(10000)
    
    # Get donantes
    donantes = await db.donantes.find(
        {"organizacion_id": org_id},
        {"_id": 0}
    ).to_list(10000)
    donantes_map = {d["donante_id"]: d for d in donantes}
    
    # Get alerts if STR/SAR report
    alertas = []
    if tipo in ["str_sar", "operacion_inusual"]:
        severidades = criterios.get("severidades", ["alta", "critica"])
        alertas = await db.alerts.find(
            {
                "organizacion_id": org_id,
                "severidad": {"$in": severidades}
            },
            {"_id": 0}
        ).to_list(1000)
    
    # Filter by monto_minimo
    monto_minimo = criterios.get("monto_minimo", 0)
    donativos_filtrados = []
    for d in donativos:
        monto = d.get("monto", 0)
        if d.get("moneda") != "MXN" and d.get("tipo_cambio"):
            monto = monto * d["tipo_cambio"]
        if monto >= monto_minimo:
            d["donante"] = donantes_map.get(d.get("donante_id"), {})
            donativos_filtrados.append(d)
    
    # Calculate totals
    total_monto = sum(d.get("monto", 0) for d in donativos_filtrados)
    
    # Format periodo string
    if hasattr(inicio, 'strftime'):
        periodo_str = f"{inicio.strftime('%d/%m/%Y')} - {fin.strftime('%d/%m/%Y')}"
    else:
        # inicio/fin are strings
        periodo_str = f"{inicio_str[:10]} - {fin_str[:10]}"
    
    return {
        "total_transacciones": len(donativos_filtrados),
        "total_monto": total_monto,
        "transacciones": donativos_filtrados[:100],  # Limit for response
        "alertas": alertas[:50],
        "periodo": periodo_str
    }

@router.put("/reportes/{report_id}/estado")
async def update_report_estado(report_id: str, estado: str, user: User = Depends(get_current_user)):
    valid_estados = ["borrador", "enviado", "acuse_recibido"]
    if estado not in valid_estados:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {valid_estados}")
    
    result = await db.reports.update_one(
        {"report_id": report_id, "organizacion_id": user.organizacion_id},
        {"$set": {"estado": estado, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    # Trigger workflows
    report = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    await trigger_workflows(user.organizacion_id, "reporte_actualizado", report)
    
    return {"message": "Estado actualizado"}

@router.delete("/reportes/{report_id}")
async def delete_report(report_id: str, user: User = Depends(get_current_user)):
    result = await db.reports.delete_one(
        {"report_id": report_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {"message": "Reporte eliminado"}

@router.get("/reportes/{report_id}/pdf")
async def get_report_pdf(report_id: str, user: User = Depends(get_current_user)):
    """Generate PDF for a specific report"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    report = await db.reports.find_one(
        {"report_id": report_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    
    organizacion = await db.organizaciones.find_one(
        {"organizacion_id": user.organizacion_id}, {"_id": 0}
    ) or {}
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('RTitle', parent=styles['Title'], fontSize=18, textColor=colors.HexColor('#1e293b'), spaceAfter=6)
    subtitle_style = ParagraphStyle('RSub', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#374151'), spaceAfter=10)
    normal_style = ParagraphStyle('RNormal', parent=styles['Normal'], fontSize=10, spaceAfter=6)
    small_style = ParagraphStyle('RSmall', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#6b7280'))
    
    story = []
    
    # Logo
    logo_url = organizacion.get("logo_url")
    if logo_url and logo_url.startswith("data:"):
        try:
            header_data = logo_url.split(",", 1)
            img_bytes = base64.b64decode(header_data[1])
            img_buffer = io.BytesIO(img_bytes)
            logo_img = Image(img_buffer, width=1.2*inch, height=1.2*inch)
            logo_img.hAlign = 'LEFT'
            story.append(logo_img)
            story.append(Spacer(1, 10))
        except Exception:
            pass
    
    # Header
    story.append(Paragraph(report.get("titulo", "Reporte"), title_style))
    story.append(Paragraph(f"{organizacion.get('nombre', '')} - RFC: {organizacion.get('rfc', 'N/A')}", normal_style))
    
    tipo_labels = {
        "str_sar": "Reporte de Transacciones Sospechosas (STR/SAR)",
        "operacion_relevante": "Reporte de Operaciones Relevantes",
        "operacion_inusual": "Reporte de Operaciones Inusuales",
        "donantes_pep": "Reporte de Donantes Políticamente Expuestos (PEP)",
        "reporte_mensual": "Reporte Mensual"
    }
    story.append(Paragraph(f"Tipo: {tipo_labels.get(report.get('tipo'), report.get('tipo', ''))}", normal_style))
    story.append(Paragraph(f"Destinatario: {report.get('destinatario', 'N/A')}", normal_style))
    story.append(Paragraph(f"Período: {report.get('datos', {}).get('periodo', 'N/A')}", normal_style))
    story.append(Paragraph(f"Estado: {report.get('estado', 'borrador').upper()}", normal_style))
    
    now = datetime.now(timezone.utc)
    story.append(Paragraph(f"Generado: {now.strftime('%d/%m/%Y %H:%M UTC')}", small_style))
    story.append(Spacer(1, 20))
    
    # Summary section
    datos = report.get("datos", {})
    story.append(Paragraph("Resumen", subtitle_style))
    
    summary_data = [
        ["Concepto", "Valor"],
        ["Total de transacciones", str(datos.get("total_transacciones", 0))],
        ["Monto total", f"${datos.get('total_monto', 0):,.2f} MXN"],
        ["Período analizado", datos.get("periodo", "N/A")],
    ]
    
    if datos.get("alertas"):
        summary_data.append(["Alertas AML asociadas", str(len(datos["alertas"]))])
    
    summary_table = Table(summary_data, colWidths=[3.5*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Transactions detail
    transacciones = datos.get("transacciones", [])
    if transacciones:
        story.append(Paragraph("Detalle de Transacciones", subtitle_style))
        
        tx_data = [["Donante", "Monto", "Moneda", "Fecha", "Tipo"]]
        for tx in transacciones[:50]:
            donante = tx.get("donante", {})
            tx_data.append([
                donante.get("nombre", "N/A")[:30],
                f"${tx.get('monto', 0):,.2f}",
                tx.get("moneda", "MXN"),
                str(tx.get("fecha_donativo", ""))[:10],
                tx.get("tipo_donativo", "N/A")
            ])
        
        tx_table = Table(tx_data, colWidths=[2*inch, 1.2*inch, 0.8*inch, 1.2*inch, 1.3*inch])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(tx_table)
        
        if len(transacciones) > 50:
            story.append(Spacer(1, 8))
            story.append(Paragraph(f"Mostrando 50 de {len(transacciones)} transacciones", small_style))
    
    story.append(Spacer(1, 15))
    
    # Alerts section (for STR/SAR reports)
    alertas_data = datos.get("alertas", [])
    if alertas_data:
        story.append(Paragraph("Alertas AML Asociadas", subtitle_style))
        alert_rows = [["Tipo", "Severidad", "Estado", "Donante"]]
        for alerta in alertas_data[:30]:
            alert_rows.append([
                alerta.get("tipo", "N/A"),
                alerta.get("severidad", "N/A"),
                alerta.get("estado", "N/A"),
                alerta.get("donante_nombre", "N/A")[:25]
            ])
        alert_table = Table(alert_rows, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c2d12')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff7ed')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(alert_table)
    
    # Description
    if report.get("descripcion"):
        story.append(Spacer(1, 15))
        story.append(Paragraph("Notas", subtitle_style))
        story.append(Paragraph(report["descripcion"], normal_style))
    
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle('RFooter', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#6b7280'), alignment=1)
    story.append(Paragraph("Documento generado automáticamente por DonatariaSAT", footer_style))
    story.append(Paragraph("Este documento es confidencial y para uso exclusivo del destinatario indicado.", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"reporte_{report.get('tipo', 'general')}_{report_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

