from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import io
import base64
from database import db
from models import User, CFDICreate
from utils import get_current_user, log_audit, add_logo_to_story, require_role
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()

# ==================== CFDI ROUTES ====================

@router.get("/cfdis")
async def get_cfdis(
    estado: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if estado:
        query["estado"] = estado
    
    cfdis = await db.cfdis.find(query, {"_id": 0}).sort("fecha_emision", -1).to_list(1000)
    
    # Enrich with donante info
    for cfdi in cfdis:
        donante = await db.donantes.find_one({"donante_id": cfdi.get("donante_id")}, {"_id": 0, "nombre": 1, "rfc": 1})
        cfdi["donante_nombre"] = donante.get("nombre") if donante else "Desconocido"
        cfdi["donante_rfc"] = donante.get("rfc") if donante else ""
    
    return cfdis

@router.post("/cfdis")
async def create_cfdi(data: CFDICreate, user: User = Depends(require_role("admin", "editor"))):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    # Verify donativo exists
    donativo = await db.donativos.find_one(
        {"donativo_id": data.donativo_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donativo:
        raise HTTPException(status_code=404, detail="Donativo no encontrado")
    
    # Check if CFDI already exists for this donativo
    existing = await db.cfdis.find_one({"donativo_id": data.donativo_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un CFDI para este donativo")
    
    # Generate folio
    count = await db.cfdis.count_documents({"organizacion_id": user.organizacion_id})
    folio = f"CFDI-{datetime.now().year}-{str(count + 1).zfill(5)}"
    
    cfdi_id = f"cfdi_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    cfdi_doc = {
        "cfdi_id": cfdi_id,
        "organizacion_id": user.organizacion_id,
        "folio": folio,
        **data.model_dump(),
        "estado": "borrador",
        "fecha_emision": now.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.cfdis.insert_one(cfdi_doc)
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "cfdi", cfdi_id, {"folio": folio, "monto": data.monto})
    # Link CFDI to donativo
    await db.donativos.update_one(
        {"donativo_id": data.donativo_id},
        {"$set": {"cfdi_id": cfdi_id}}
    )
    
    return {k: v for k, v in cfdi_doc.items() if k != "_id"}

@router.post("/cfdis/{cfdi_id}/timbrar")
async def timbrar_cfdi(cfdi_id: str, user: User = Depends(require_role("admin", "editor"))):
    """Simulate CFDI timbrado (real PAC integration deferred to v1.5)"""
    cfdi = await db.cfdis.find_one(
        {"cfdi_id": cfdi_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not cfdi:
        raise HTTPException(status_code=404, detail="CFDI no encontrado")
    
    if cfdi["estado"] != "borrador":
        raise HTTPException(status_code=400, detail="Solo se pueden timbrar CFDIs en estado borrador")
    
    # Simulate timbrado
    uuid_fiscal = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    await db.cfdis.update_one(
        {"cfdi_id": cfdi_id},
        {"$set": {
            "estado": "timbrado",
            "uuid_fiscal": uuid_fiscal,
            "fecha_timbrado": now.isoformat()
        }}
    )
    
    result_data = {
        "message": "CFDI timbrado exitosamente (simulación)",
        "uuid_fiscal": uuid_fiscal,
        "fecha_timbrado": now.isoformat()
    }
    await log_audit(user.organizacion_id, user.user_id, user.name, "timbrar", "cfdi", cfdi_id, {"uuid_fiscal": uuid_fiscal})
    return result_data

@router.post("/cfdis/{cfdi_id}/cancelar")
async def cancelar_cfdi(cfdi_id: str, user: User = Depends(require_role("admin"))):
    cfdi = await db.cfdis.find_one(
        {"cfdi_id": cfdi_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not cfdi:
        raise HTTPException(status_code=404, detail="CFDI no encontrado")
    
    if cfdi["estado"] == "cancelado":
        raise HTTPException(status_code=400, detail="El CFDI ya está cancelado")
    
    await db.cfdis.update_one(
        {"cfdi_id": cfdi_id},
        {"$set": {"estado": "cancelado"}}
    )
    
    return {"message": "CFDI cancelado exitosamente"}


def generate_cfdi_pdf(cfdi: dict, donante: dict, organizacion: dict) -> io.BytesIO:
    """Generate PDF for CFDI"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=16, spaceAfter=15, textColor=colors.HexColor('#7C3AED'))
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=12, spaceAfter=8, textColor=colors.HexColor('#111827'))
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontSize=10, spaceAfter=6)
    elements = []

    # Logo
    add_logo_to_story(elements, organizacion)

    elements.append(Paragraph("COMPROBANTE FISCAL DIGITAL POR INTERNET", title_style))
    elements.append(Paragraph("CFDI de Donativo", heading_style))
    elements.append(Spacer(1, 15))

    cfdi_data = [
        ["Folio:", cfdi.get('folio', 'N/A')],
        ["Estado:", cfdi.get('estado', 'N/A').upper()],
        ["Fecha de emision:", cfdi.get('fecha_emision', 'N/A')[:10] if cfdi.get('fecha_emision') else 'N/A'],
    ]
    if cfdi.get('uuid_fiscal'):
        cfdi_data.append(["UUID Fiscal:", cfdi.get('uuid_fiscal')])
    if cfdi.get('fecha_timbrado'):
        cfdi_data.append(["Fecha timbrado:", cfdi.get('fecha_timbrado')[:10]])

    cfdi_table = Table(cfdi_data, colWidths=[1.5*inch, 4.5*inch])
    cfdi_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(cfdi_table)
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("EMISOR (Donataria)", heading_style))
    emisor_data = [
        ["Nombre:", organizacion.get('nombre', 'N/A')],
        ["RFC:", organizacion.get('rfc', 'N/A')],
    ]
    emisor_table = Table(emisor_data, colWidths=[1.5*inch, 4.5*inch])
    emisor_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(emisor_table)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("RECEPTOR (Donante)", heading_style))
    rfc_val = donante.get('rfc', 'N/A')
    if donante.get('es_extranjero'):
        rfc_val = 'XEXX010101000'
    receptor_data = [
        ["Nombre:", donante.get('nombre', 'N/A')],
        ["RFC:", rfc_val],
        ["Tipo:", "Persona Moral" if donante.get('tipo_persona') == 'moral' else "Persona Fisica"],
    ]
    receptor_table = Table(receptor_data, colWidths=[1.5*inch, 4.5*inch])
    receptor_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(receptor_table)
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("DETALLE DEL DONATIVO", heading_style))

    def format_currency(value, currency="MXN"):
        return f"${value:,.2f} {currency}" if value else "$0.00 MXN"

    donativo_data = [
        ["Concepto", "Valor"],
        ["Monto", format_currency(cfdi.get('monto', 0), cfdi.get('moneda', 'MXN'))],
        ["Moneda", cfdi.get('moneda', 'MXN')],
        ["Tipo de donativo", cfdi.get('tipo_donativo', 'no_oneroso').replace('_', ' ').capitalize()],
    ]

    donativo_table = Table(donativo_data, colWidths=[2*inch, 4*inch])
    donativo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C3AED')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(donativo_table)
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("LEYENDA OBLIGATORIA", heading_style))
    leyenda_style = ParagraphStyle('Leyenda', parent=styles['Normal'], fontSize=10,
                                    backColor=colors.HexColor('#FEF3C7'),
                                    borderPadding=10)
    elements.append(Paragraph(cfdi.get('leyenda', 'El donante no recibe bienes o servicios a cambio del donativo otorgado.'), leyenda_style))
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("Fundamento legal: Art. 29 y 29-A del CFF, Art. 86 Fracc. II LISR",
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray)))

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/cfdis/{cfdi_id}/pdf")
async def download_cfdi_pdf(cfdi_id: str, user: User = Depends(get_current_user)):
    """Download CFDI as PDF"""
    cfdi = await db.cfdis.find_one(
        {"cfdi_id": cfdi_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not cfdi:
        raise HTTPException(status_code=404, detail="CFDI no encontrado")
    
    donante = await db.donantes.find_one(
        {"donante_id": cfdi.get("donante_id")},
        {"_id": 0}
    )
    
    organizacion = await db.organizaciones.find_one(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    
    pdf_buffer = generate_cfdi_pdf(cfdi, donante or {}, organizacion or {})
    
    filename = f"cfdi_{cfdi['folio']}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

