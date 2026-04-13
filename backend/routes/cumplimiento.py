from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import io
import base64
from database import db
from models import User
from utils import get_current_user, calculate_urgency, add_logo_to_story
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

router = APIRouter()

# ==================== CUMPLIMIENTO (COMPLIANCE METRICS) ====================

@router.get("/cumplimiento")
async def get_compliance_metrics(user: User = Depends(get_current_user)):
    """Get compliance score and metrics for the organization"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    org_id = user.organizacion_id
    now = datetime.now(timezone.utc)
    current_year = now.year
    
    # Get ALL obligations for this org
    all_obligations = await db.obligaciones.find(
        {"organizacion_id": org_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Classify obligations
    total = len(all_obligations)
    cumplidas = 0
    pendientes = 0
    en_proceso = 0
    vencidas = 0
    omitidas = 0
    
    # Per-month breakdown for current year
    meses_labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    por_mes = {i: {"total": 0, "cumplidas": 0, "pendientes": 0, "vencidas": 0} for i in range(1, 13)}
    
    # Per-type breakdown
    por_tipo = {}
    
    for obl in all_obligations:
        estado = obl.get("estado", "pendiente")
        nombre = obl.get("nombre", "Otro")
        
        # Parse date
        fecha_limite = obl.get("fecha_limite")
        if isinstance(fecha_limite, str):
            try:
                fecha_limite = datetime.fromisoformat(fecha_limite.replace("Z", "+00:00"))
            except:
                continue
        if fecha_limite.tzinfo is None:
            fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
        
        # Count by status
        if estado == "cumplida":
            cumplidas += 1
        elif estado == "omitida":
            omitidas += 1
        elif estado in ["pendiente", "en_proceso"]:
            if fecha_limite < now:
                vencidas += 1
            else:
                if estado == "en_proceso":
                    en_proceso += 1
                else:
                    pendientes += 1
        
        # Per month (current year only)
        if fecha_limite.year == current_year:
            month = fecha_limite.month
            por_mes[month]["total"] += 1
            if estado == "cumplida":
                por_mes[month]["cumplidas"] += 1
            elif estado in ["pendiente", "en_proceso"] and fecha_limite < now:
                por_mes[month]["vencidas"] += 1
            else:
                por_mes[month]["pendientes"] += 1
        
        # Per type
        tipo_key = nombre.split(" - ")[0] if " - " in nombre else nombre
        if tipo_key not in por_tipo:
            por_tipo[tipo_key] = {"total": 0, "cumplidas": 0}
        por_tipo[tipo_key]["total"] += 1
        if estado == "cumplida":
            por_tipo[tipo_key]["cumplidas"] += 1
    
    # Calculate overall score
    scorable = cumplidas + vencidas + omitidas  # obligations that have passed their deadline
    if total > 0:
        # Score based on completed vs total that should be done
        past_obligations = cumplidas + vencidas + omitidas
        score = round((cumplidas / past_obligations * 100) if past_obligations > 0 else 100, 1)
    else:
        score = 100.0
    
    # Determine level
    if score >= 80:
        nivel = "excelente"
    elif score >= 60:
        nivel = "bueno"
    elif score >= 40:
        nivel = "regular"
    else:
        nivel = "critico"
    
    # Build monthly chart data
    chart_mensual = []
    for i in range(1, 13):
        m = por_mes[i]
        pct = round((m["cumplidas"] / m["total"] * 100) if m["total"] > 0 else 0, 1)
        chart_mensual.append({
            "mes": meses_labels[i - 1],
            "total": m["total"],
            "cumplidas": m["cumplidas"],
            "pendientes": m["pendientes"],
            "vencidas": m["vencidas"],
            "porcentaje": pct
        })
    
    # Build type breakdown
    desglose_tipo = []
    for tipo, data in por_tipo.items():
        pct = round((data["cumplidas"] / data["total"] * 100) if data["total"] > 0 else 0, 1)
        desglose_tipo.append({
            "tipo": tipo,
            "total": data["total"],
            "cumplidas": data["cumplidas"],
            "porcentaje": pct
        })
    desglose_tipo.sort(key=lambda x: x["porcentaje"])
    
    # Historical trend (simplified: last 6 months)
    tendencia = []
    for months_ago in range(5, -1, -1):
        ref_date = now - timedelta(days=months_ago * 30)
        ref_month = ref_date.month
        ref_year = ref_date.year
        month_data = {"total": 0, "cumplidas": 0}
        for obl in all_obligations:
            fl = obl.get("fecha_limite")
            if isinstance(fl, str):
                try:
                    fl = datetime.fromisoformat(fl.replace("Z", "+00:00"))
                except:
                    continue
            if fl.month == ref_month and fl.year == ref_year:
                month_data["total"] += 1
                if obl.get("estado") == "cumplida":
                    month_data["cumplidas"] += 1
        pct = round((month_data["cumplidas"] / month_data["total"] * 100) if month_data["total"] > 0 else 0, 1)
        tendencia.append({
            "mes": meses_labels[ref_month - 1],
            "score": pct
        })
    
    # Upcoming deadlines (next 30 days)
    proximas = []
    for obl in all_obligations:
        fl = obl.get("fecha_limite")
        if isinstance(fl, str):
            try:
                fl = datetime.fromisoformat(fl.replace("Z", "+00:00"))
            except:
                continue
        if fl.tzinfo is None:
            fl = fl.replace(tzinfo=timezone.utc)
        days_rem = (fl - now).days
        if 0 <= days_rem <= 30 and obl.get("estado") in ["pendiente", "en_proceso"]:
            proximas.append({
                "nombre": obl.get("nombre"),
                "fecha_limite": fl.isoformat(),
                "dias_restantes": days_rem,
                "estado": obl.get("estado"),
                "urgencia": calculate_urgency(fl)
            })
    proximas.sort(key=lambda x: x["dias_restantes"])
    
    return {
        "score": score,
        "nivel": nivel,
        "resumen": {
            "total": total,
            "cumplidas": cumplidas,
            "pendientes": pendientes,
            "en_proceso": en_proceso,
            "vencidas": vencidas,
            "omitidas": omitidas
        },
        "chart_mensual": chart_mensual,
        "desglose_tipo": desglose_tipo,
        "tendencia": tendencia,
        "proximas_vencer": proximas,
        "ejercicio_fiscal": current_year
    }

@router.get("/cumplimiento/pdf")
async def get_compliance_pdf(user: User = Depends(get_current_user)):
    """Generate PDF compliance report for auditors"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    org_id = user.organizacion_id
    organizacion = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0}) or {}
    
    # Reuse the metrics logic
    # Inline call to get metrics
    from starlette.requests import Request as StarletteRequest
    
    now = datetime.now(timezone.utc)
    current_year = now.year
    all_obligations = await db.obligaciones.find({"organizacion_id": org_id}, {"_id": 0}).to_list(1000)
    
    total = len(all_obligations)
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
    
    past_obligations = cumplidas + vencidas + omitidas
    score = round((cumplidas / past_obligations * 100) if past_obligations > 0 else 100, 1)
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#065f46'), spaceAfter=20)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#374151'), spaceAfter=12)
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontSize=11, spaceAfter=8)
    
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
    
    # Title
    story.append(Paragraph("Reporte de Cumplimiento Fiscal", title_style))
    story.append(Paragraph(f"{organizacion.get('nombre', 'Organización')} - RFC: {organizacion.get('rfc', 'N/A')}", normal_style))
    story.append(Paragraph(f"Ejercicio Fiscal: {current_year}", normal_style))
    story.append(Paragraph(f"Fecha de generación: {now.strftime('%d/%m/%Y %H:%M')}", normal_style))
    story.append(Spacer(1, 20))
    
    # Score
    if score >= 80:
        score_color = colors.HexColor('#065f46')
        nivel_text = "EXCELENTE"
    elif score >= 60:
        score_color = colors.HexColor('#0369a1')
        nivel_text = "BUENO"
    elif score >= 40:
        score_color = colors.HexColor('#b45309')
        nivel_text = "REGULAR"
    else:
        score_color = colors.HexColor('#b91c1c')
        nivel_text = "CRITICO"
    
    score_style = ParagraphStyle('Score', parent=styles['Title'], fontSize=36, textColor=score_color, alignment=1, spaceAfter=6)
    nivel_style = ParagraphStyle('Nivel', parent=styles['Normal'], fontSize=14, textColor=score_color, alignment=1, spaceAfter=20)
    
    story.append(Paragraph(f"{score}%", score_style))
    story.append(Paragraph(f"Nivel de Cumplimiento: {nivel_text}", nivel_style))
    story.append(Spacer(1, 12))
    
    # Summary table
    story.append(Paragraph("Resumen de Obligaciones", subtitle_style))
    
    summary_data = [
        ["Concepto", "Cantidad"],
        ["Total de obligaciones", str(total)],
        ["Cumplidas", str(cumplidas)],
        ["Pendientes", str(total - cumplidas - vencidas - omitidas)],
        ["Vencidas (no cumplidas)", str(vencidas)],
        ["Omitidas", str(omitidas)],
    ]
    
    summary_table = Table(summary_data, colWidths=[4*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Obligations detail
    story.append(Paragraph("Detalle de Obligaciones", subtitle_style))
    
    detail_data = [["Obligación", "Fecha Límite", "Estado"]]
    for obl in sorted(all_obligations, key=lambda x: x.get("fecha_limite", "")):
        fl = obl.get("fecha_limite")
        if isinstance(fl, str):
            try:
                fl = datetime.fromisoformat(fl.replace("Z", "+00:00"))
            except:
                fl = None
        fecha_str = fl.strftime("%d/%m/%Y") if fl else "N/A"
        estado = obl.get("estado", "pendiente").capitalize()
        detail_data.append([obl.get("nombre", "")[:50], fecha_str, estado])
    
    if len(detail_data) > 1:
        detail_table = Table(detail_data, colWidths=[3.5*inch, 1.5*inch, 1.5*inch])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(detail_table)
    
    story.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#6b7280'), alignment=1)
    story.append(Paragraph("Este documento fue generado automáticamente por DonatariaSAT", footer_style))
    story.append(Paragraph(f"Generado el {now.strftime('%d de %B de %Y a las %H:%M UTC')}", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"cumplimiento_{organizacion.get('nombre', 'org').replace(' ', '_')}_{current_year}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


