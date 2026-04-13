"""
DonatariaSAT API - Main Server
Modular FastAPI application for Mexican authorized charities tax compliance.
"""
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database
from database import db, client

# Utils (needed for scheduler)
from utils import (
    RESEND_AVAILABLE, RESEND_API_KEY,
    send_email_notification, generate_obligation_reminder_html
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# App
app = FastAPI(title="DonatariaSAT API")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== REGISTER ROUTE MODULES ====================

from routes.auth import router as auth_router
from routes.auditoria import router as auditoria_router
from routes.donantes import router as donantes_router
from routes.catalogo import router as catalogo_router
from routes.donativos import router as donativos_router
from routes.cfdis import router as cfdis_router
from routes.fiscal import router as fiscal_router
from routes.cumplimiento import router as cumplimiento_router
from routes.alertas import router as alertas_router
from routes.reportes import router as reportes_router
from routes.workflows import router as workflows_router
from routes.exports import router as exports_router
from routes.config import router as config_router

api_router.include_router(auth_router)
api_router.include_router(auditoria_router)
api_router.include_router(donantes_router)
api_router.include_router(catalogo_router)
api_router.include_router(donativos_router)
api_router.include_router(cfdis_router)
api_router.include_router(fiscal_router)
api_router.include_router(cumplimiento_router)
api_router.include_router(alertas_router)
api_router.include_router(reportes_router)
api_router.include_router(workflows_router)
api_router.include_router(exports_router)
api_router.include_router(config_router)

# ==================== ROOT ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "DonatariaSAT API", "version": "2.0", "status": "running"}

@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email_configured": RESEND_AVAILABLE and bool(RESEND_API_KEY)
    }

app.include_router(api_router)

# ==================== BACKGROUND SCHEDULER ====================

async def daily_notification_scheduler():
    """Background task that runs daily notifications at 8:00 AM Mexico City time"""
    while True:
        try:
            now = datetime.now(timezone.utc)
            target_hour_utc = 14  # 8:00 AM Mexico City = 14:00 UTC
            next_run = now.replace(hour=target_hour_utc, minute=0, second=0, microsecond=0)
            if now >= next_run:
                next_run += timedelta(days=1)
            
            wait_seconds = (next_run - now).total_seconds()
            logging.info(f"[Scheduler] Next daily notification run in {wait_seconds/3600:.1f} hours at {next_run.isoformat()}")
            await asyncio.sleep(wait_seconds)
            
            if RESEND_AVAILABLE and RESEND_API_KEY:
                logging.info("[Scheduler] Running daily obligation notifications...")
                organizaciones = await db.organizaciones.find({}, {"_id": 0, "organizacion_id": 1}).to_list(1000)
                total = 0
                now_check = datetime.now(timezone.utc)
                for org in organizaciones:
                    org_id = org["organizacion_id"]
                    users = await db.users.find({"organizacion_id": org_id}, {"_id": 0}).to_list(100)
                    organizacion = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0})
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
                        days_remaining = (fecha_limite - now_check).days
                        if days_remaining in [7, 3, 1]:
                            for user in users:
                                if user.get("email"):
                                    html_content = generate_obligation_reminder_html(obl, organizacion or {}, days_remaining)
                                    await send_email_notification(
                                        to_email=user["email"],
                                        subject=f"[DonatariaSAT] {'URGENTE: ' if days_remaining == 1 else ''}Recordatorio: {obl.get('nombre', 'Obligación fiscal')} - {days_remaining} día(s)",
                                        html_content=html_content
                                    )
                                    total += 1
                logging.info(f"[Scheduler] Daily run complete. Notifications sent: {total}")
            else:
                logging.info("[Scheduler] Email service not configured, skipping notifications")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"[Scheduler] Error in daily scheduler: {e}")
            await asyncio.sleep(3600)

_scheduler_task = None

@app.on_event("startup")
async def startup_scheduler():
    global _scheduler_task
    _scheduler_task = asyncio.create_task(daily_notification_scheduler())
    logging.info("[Scheduler] Daily notification scheduler started")

@app.on_event("shutdown")
async def shutdown_db_client():
    global _scheduler_task
    if _scheduler_task:
        _scheduler_task.cancel()
    client.close()
