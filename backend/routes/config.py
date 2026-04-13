from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import io
from database import db
from models import User
from pydantic import BaseModel, EmailStr
from utils import (
    get_current_user, send_email_notification,
    generate_obligation_reminder_html, RESEND_AVAILABLE, RESEND_API_KEY,
    SENDER_EMAIL
)

router = APIRouter()

# ==================== EMAIL NOTIFICATIONS ====================

class EmailNotification(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    days_before_alert: int = 7

@router.post("/notifications/send-test")
async def send_test_notification(user: User = Depends(get_current_user)):
    """Send a test notification email"""
    if not user.email:
        raise HTTPException(status_code=400, detail="Usuario sin email configurado")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #059669;">Notificaciones activadas!</h2>
        <p>Hola {user.name},</p>
        <p>Este es un correo de prueba de DonatariaSAT. Si recibes este mensaje, las notificaciones estan funcionando correctamente.</p>
        <p>Recibiras alertas automaticas cuando tus obligaciones fiscales esten proximas a vencer.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #6B7280; font-size: 12px;">DonatariaSAT - Cumplimiento fiscal para donatarias</p>
    </body>
    </html>
    """
    
    result = await send_email_notification(
        to_email=user.email,
        subject="[DonatariaSAT] Notificaciones activadas",
        html_content=html_content
    )
    
    return result

@router.post("/notifications/check-and-send")
async def check_and_send_notifications(background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    """Check upcoming obligations and send notifications"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    organizacion = await db.organizaciones.find_one(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    
    user_doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not user_doc or not user_doc.get("email"):
        raise HTTPException(status_code=400, detail="Usuario sin email configurado")
    
    now = datetime.now(timezone.utc)
    
    obligaciones = await db.obligaciones.find(
        {
            "organizacion_id": user.organizacion_id,
            "estado": {"$in": ["pendiente", "en_proceso"]}
        },
        {"_id": 0}
    ).to_list(100)
    
    notifications_sent = 0
    
    for obl in obligaciones:
        fecha_limite = obl.get("fecha_limite")
        if isinstance(fecha_limite, str):
            fecha_limite = datetime.fromisoformat(fecha_limite.replace("Z", "+00:00"))
        if fecha_limite.tzinfo is None:
            fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
        
        days_remaining = (fecha_limite - now).days
        
        if 0 <= days_remaining <= 15:
            html_content = generate_obligation_reminder_html(obl, organizacion or {}, days_remaining)
            
            background_tasks.add_task(
                send_email_notification,
                to_email=user_doc["email"],
                subject=f"[DonatariaSAT] Recordatorio: {obl.get('nombre', 'Obligacion fiscal')} - {days_remaining} dias",
                html_content=html_content
            )
            notifications_sent += 1
    
    return {
        "message": f"Se enviaran {notifications_sent} notificacion(es)",
        "notifications_queued": notifications_sent
    }

@router.get("/notifications/status")
async def get_notification_status():
    """Check if email notifications are configured"""
    return {
        "email_configured": RESEND_AVAILABLE and bool(RESEND_API_KEY),
        "sender_email": SENDER_EMAIL if RESEND_API_KEY else None
    }


# ==================== CRON / SCHEDULED TASKS ====================

@router.post("/cron/notificaciones-diarias")
async def run_daily_notifications(background_tasks: BackgroundTasks):
    """Run daily notification check for all organizations"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        return {"message": "Email service not configured", "notifications_sent": 0}
    
    organizaciones = await db.organizaciones.find({}, {"_id": 0, "organizacion_id": 1}).to_list(1000)
    
    total_notifications = 0
    
    for org in organizaciones:
        org_id = org["organizacion_id"]
        
        users = await db.users.find({"organizacion_id": org_id}, {"_id": 0}).to_list(100)
        organizacion = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0})
        
        now = datetime.now(timezone.utc)
        obligaciones = await db.obligaciones.find(
            {"organizacion_id": org_id, "estado": {"$in": ["pendiente", "en_proceso"]}},
            {"_id": 0}
        ).to_list(100)
        
        for obl in obligaciones:
            fecha_limite = obl.get("fecha_limite")
            if isinstance(fecha_limite, str):
                fecha_limite = datetime.fromisoformat(fecha_limite.replace("Z", "+00:00"))
            if fecha_limite.tzinfo is None:
                fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
            
            days_remaining = (fecha_limite - now).days
            
            if days_remaining in [7, 3, 1]:
                for user in users:
                    if user.get("email"):
                        html_content = generate_obligation_reminder_html(obl, organizacion or {}, days_remaining)
                        background_tasks.add_task(
                            send_email_notification,
                            to_email=user["email"],
                            subject=f"[DonatariaSAT] {'URGENTE: ' if days_remaining == 1 else ''}Recordatorio: {obl.get('nombre', 'Obligacion fiscal')} - {days_remaining} dia(s)",
                            html_content=html_content
                        )
                        total_notifications += 1
    
    return {"message": f"Cron ejecutado", "notifications_queued": total_notifications}

@router.get("/cron/status")
async def get_scheduler_status():
    """Check the status of the background scheduler"""
    return {
        "scheduler_active": True,
        "email_configured": RESEND_AVAILABLE and bool(RESEND_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
