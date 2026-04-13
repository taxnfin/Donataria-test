import bcrypt
import jwt
import io
import base64
import uuid
import logging
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from database import db
from models import User

# PDF
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

# Email
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

import os

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'donatariasat-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

# Resend
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_AVAILABLE and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Sesión expirada")
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return User(**user)
    
    try:
        payload = decode_jwt_token(session_token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return User(**user)
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==================== COMMON HELPERS ====================

def validate_rfc(rfc: str, tipo_persona: str) -> bool:
    if not rfc:
        return True
    rfc = rfc.upper().strip()
    if tipo_persona == "fisica":
        return len(rfc) == 13
    elif tipo_persona == "moral":
        return len(rfc) == 12
    return False

def calculate_urgency(fecha_limite: datetime) -> str:
    now = datetime.now(timezone.utc)
    if fecha_limite.tzinfo is None:
        fecha_limite = fecha_limite.replace(tzinfo=timezone.utc)
    days_remaining = (fecha_limite - now).days
    if days_remaining < 0:
        return "vencida"
    elif days_remaining <= 7:
        return "rojo"
    elif days_remaining <= 30:
        return "ambar"
    else:
        return "verde"

# ==================== AUDIT LOG ====================

async def log_audit(org_id: str, user_id: str, user_name: str, accion: str, entidad: str, entidad_id: str, detalles: dict = None):
    doc = {
        "audit_id": f"aud_{uuid.uuid4().hex[:12]}",
        "organizacion_id": org_id,
        "user_id": user_id,
        "user_name": user_name,
        "accion": accion,
        "entidad": entidad,
        "entidad_id": entidad_id,
        "detalles": detalles or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_log.insert_one(doc)

# ==================== EMAIL HELPERS ====================

async def send_email_notification(to_email: str, subject: str, html_content: str):
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.info(f"[Email] Would send to {to_email}: {subject}")
        return False
    try:
        params = {
            "from": f"DonatariaSAT <{SENDER_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        logger.info(f"[Email] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"[Email] Error sending to {to_email}: {e}")
        return False

def generate_obligation_reminder_html(obligation: dict, organizacion: dict, days_remaining: int) -> str:
    urgency_color = "#dc2626" if days_remaining <= 1 else "#f59e0b" if days_remaining <= 3 else "#3b82f6"
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">DonatariaSAT</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">{organizacion.get('nombre', 'Tu organización')}</p>
        </div>
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: {urgency_color}15; border-left: 4px solid {urgency_color}; padding: 12px 16px; margin-bottom: 16px; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: {urgency_color}; font-weight: bold;">
                    {'URGENTE' if days_remaining <= 1 else 'RECORDATORIO'}: {days_remaining} día(s) restante(s)
                </p>
            </div>
            <h3 style="margin: 0 0 8px;">{obligation.get('nombre', 'Obligación fiscal')}</h3>
            <p style="color: #6b7280; margin: 0 0 4px;">{obligation.get('descripcion', '')}</p>
            <p style="color: #6b7280; margin: 0;"><strong>Fecha límite:</strong> {str(obligation.get('fecha_limite', ''))[:10]}</p>
        </div>
        <div style="background: #f9fafb; padding: 12px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">DonatariaSAT - Gestión fiscal para donatarias autorizadas</p>
        </div>
    </div>
    """

# ==================== PDF HELPERS ====================

def add_logo_to_story(story, organizacion):
    """Add org logo to a ReportLab story if available"""
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

# ==================== OBLIGATION DEFAULTS ====================

async def create_default_obligations(organizacion_id: str):
    """Create default fiscal obligations for a new organization"""
    now = datetime.now(timezone.utc)
    year = now.year
    
    obligations = [
        {"nombre": "Declaración Anual ISR - Personas Morales", "tipo": "declaracion", "frecuencia": "anual", "fecha_limite": datetime(year, 3, 31, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Declaración Informativa de Donativos", "tipo": "declaracion", "frecuencia": "anual", "fecha_limite": datetime(year, 2, 15, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Informe de Transparencia Art. 82 LISR", "tipo": "informe", "frecuencia": "anual", "fecha_limite": datetime(year, 5, 15, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (Ene)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 2, 28, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (Feb)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 3, 31, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (Mar)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 4, 30, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (Abr)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 5, 31, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (May)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 6, 30, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "DIOT - Declaración de Operaciones con Terceros (Jun)", "tipo": "declaracion", "frecuencia": "mensual", "fecha_limite": datetime(year, 7, 31, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Contabilidad Electrónica - Catálogo y Balanza", "tipo": "informe", "frecuencia": "mensual", "fecha_limite": datetime(year, 4, 3, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Dictamen Fiscal (si aplica)", "tipo": "dictamen", "frecuencia": "anual", "fecha_limite": datetime(year, 7, 15, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Aviso de Actividades - Prevención Lavado de Dinero", "tipo": "aviso", "frecuencia": "semestral", "fecha_limite": datetime(year, 1, 17, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Aviso de Actividades PLD - Segundo Semestre", "tipo": "aviso", "frecuencia": "semestral", "fecha_limite": datetime(year, 7, 17, 23, 59, tzinfo=timezone.utc)},
        {"nombre": "Declaración Informativa de Operaciones Relevantes", "tipo": "declaracion", "frecuencia": "trimestral", "fecha_limite": datetime(year, 4, 30, 23, 59, tzinfo=timezone.utc)},
    ]
    
    for obl in obligations:
        doc = {
            "obligacion_id": f"obl_{uuid.uuid4().hex[:12]}",
            "organizacion_id": organizacion_id,
            **obl,
            "estado": "pendiente",
            "notas": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        doc["fecha_limite"] = doc["fecha_limite"].isoformat()
        await db.obligaciones.insert_one(doc)
