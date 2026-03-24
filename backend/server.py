from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from fastapi.security import HTTPBearer
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import io

# PDF Generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

# Email notifications
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'donatariasat-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Resend Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_AVAILABLE and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI(title="DonatariaSAT API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    organizacion_nombre: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    organizacion_id: Optional[str] = None
    created_at: datetime

class Organizacion(BaseModel):
    organizacion_id: str
    nombre: str
    rfc: str
    rubro: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    fecha_autorizacion: Optional[datetime] = None
    vigencia_autorizacion: Optional[datetime] = None
    created_at: datetime

class OrganizacionCreate(BaseModel):
    nombre: str
    rfc: str
    rubro: str = "asistencial"
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class DonanteBase(BaseModel):
    nombre: str
    tipo_persona: str  # fisica, moral
    rfc: Optional[str] = None
    es_extranjero: bool = False
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    pais: str = "México"

class DonanteCreate(DonanteBase):
    pass

class Donante(DonanteBase):
    donante_id: str
    organizacion_id: str
    total_donativos: float = 0
    numero_donativos: int = 0
    created_at: datetime
    updated_at: datetime

class DonativoBase(BaseModel):
    donante_id: str
    monto: float
    moneda: str = "MXN"
    tipo_donativo: str = "no_oneroso"  # no_oneroso, oneroso, remunerativo
    tipo_cambio: Optional[float] = None
    es_especie: bool = False
    descripcion_especie: Optional[str] = None
    valor_avaluo: Optional[float] = None
    fecha_donativo: datetime
    notas: Optional[str] = None

class DonativoCreate(DonativoBase):
    pass

class Donativo(DonativoBase):
    donativo_id: str
    organizacion_id: str
    cfdi_id: Optional[str] = None
    created_at: datetime

class CFDIBase(BaseModel):
    donativo_id: str
    donante_id: str
    monto: float
    moneda: str = "MXN"
    tipo_donativo: str
    leyenda: str = "El donante no recibe bienes o servicios a cambio del donativo otorgado."

class CFDICreate(CFDIBase):
    pass

class CFDI(CFDIBase):
    cfdi_id: str
    organizacion_id: str
    folio: str
    estado: str = "borrador"  # borrador, timbrado, cancelado
    fecha_emision: datetime
    fecha_timbrado: Optional[datetime] = None
    uuid_fiscal: Optional[str] = None
    created_at: datetime

class ObligacionFiscal(BaseModel):
    obligacion_id: str
    organizacion_id: str
    nombre: str
    descripcion: str
    fundamento_legal: str
    fecha_limite: datetime
    estado: str = "pendiente"  # pendiente, en_proceso, cumplida, omitida
    notas: Optional[str] = None
    created_at: datetime

class ObligacionCreate(BaseModel):
    nombre: str
    descripcion: str
    fundamento_legal: str
    fecha_limite: datetime
    notas: Optional[str] = None

class InformeTransparencia(BaseModel):
    informe_id: str
    organizacion_id: str
    ejercicio_fiscal: int
    total_donativos_recibidos: float = 0
    total_donativos_especie: float = 0
    total_donativos_otorgados: float = 0
    total_gastos_admin: float = 0
    porcentaje_gastos_admin: float = 0
    descripcion_actividades: Optional[str] = None
    numero_beneficiarios: int = 0
    influencia_legislacion: bool = False
    detalle_influencia: Optional[str] = None
    estado: str = "borrador"  # borrador, presentado, corregido
    progreso_completitud: int = 0
    created_at: datetime
    updated_at: datetime

class InformeCreate(BaseModel):
    ejercicio_fiscal: int

class InformeUpdate(BaseModel):
    total_donativos_recibidos: Optional[float] = None
    total_donativos_especie: Optional[float] = None
    total_donativos_otorgados: Optional[float] = None
    total_gastos_admin: Optional[float] = None
    descripcion_actividades: Optional[str] = None
    numero_beneficiarios: Optional[int] = None
    influencia_legislacion: Optional[bool] = None
    detalle_influencia: Optional[str] = None

class DashboardStats(BaseModel):
    total_donativos: float
    total_donantes: int
    total_cfdis: int
    porcentaje_gastos_admin: float
    donativos_por_mes: List[dict]
    obligaciones_proximas: List[dict]
    alerta_gastos: Optional[dict] = None

# ==================== AML ALERTS MODELS ====================

class AlertRule(BaseModel):
    rule_id: str
    organizacion_id: str
    nombre: str
    descripcion: Optional[str] = None
    tipo_regla: str  # umbral_monto, nivel_riesgo_donante, keywords_descripcion, patron_fraccionamiento
    severidad: str = "media"  # baja, media, alta, critica
    condiciones: dict  # {monto_minimo: 100000, keywords: [...], etc}
    activa: bool = True
    veces_activada: int = 0
    created_at: datetime
    updated_at: datetime

class AlertRuleCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo_regla: str
    severidad: str = "media"
    condiciones: dict
    activa: bool = True

class Alert(BaseModel):
    alert_id: str
    organizacion_id: str
    rule_id: Optional[str] = None
    tipo: str  # umbral_excedido, pep_detectado, screening_positivo, fraccionamiento, keywords_sospechosos
    severidad: str  # baja, media, alta, critica
    titulo: str
    descripcion: str
    donante_id: Optional[str] = None
    donante_nombre: Optional[str] = None
    donativo_id: Optional[str] = None
    monto: Optional[float] = None
    estado: str = "nueva"  # nueva, en_revision, resuelta, descartada
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

class AlertCreate(BaseModel):
    tipo: str
    severidad: str
    titulo: str
    descripcion: str
    donante_id: Optional[str] = None
    donativo_id: Optional[str] = None
    monto: Optional[float] = None
    tags: List[str] = []

# ==================== REPORTS MODELS ====================

class ReportTemplate(BaseModel):
    template_id: str
    organizacion_id: str
    nombre: str
    tipo_reporte: str  # str_sar, operacion_relevante, operacion_inusual, donantes_pep, reporte_mensual
    descripcion: Optional[str] = None
    criterios: dict  # {severidades: [...], nivel_riesgo: [...], monto_minimo: 50000, solo_pep: false}
    formato: str = "PDF"  # PDF, CSV, Excel
    destinatario: str = "interno"  # UIF, SAT, interno
    periodicidad: str = "manual"  # manual, diario, semanal, mensual
    activa: bool = True
    created_at: datetime
    updated_at: datetime

class ReportTemplateCreate(BaseModel):
    nombre: str
    tipo_reporte: str
    descripcion: Optional[str] = None
    criterios: dict = {}
    formato: str = "PDF"
    destinatario: str = "interno"
    periodicidad: str = "manual"

class Report(BaseModel):
    report_id: str
    organizacion_id: str
    template_id: Optional[str] = None
    titulo: str
    tipo: str
    descripcion: Optional[str] = None
    destinatario: str
    periodo_inicio: datetime
    periodo_fin: datetime
    estado: str = "borrador"  # borrador, enviado, acuse_recibido
    datos: dict = {}
    archivo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ReportCreate(BaseModel):
    template_id: Optional[str] = None
    titulo: str
    tipo: str
    descripcion: Optional[str] = None
    destinatario: str = "interno"
    periodo_inicio: datetime
    periodo_fin: datetime

# ==================== WORKFLOW MODELS ====================

class Workflow(BaseModel):
    workflow_id: str
    organizacion_id: str
    nombre: str
    descripcion: Optional[str] = None
    trigger: str  # alerta_creada, reporte_actualizado, donante_actualizado, donativo_creado
    condiciones: List[dict] = []  # [{campo: "severidad", operador: "equals", valor: "critica"}]
    acciones: List[dict] = []  # [{tipo: "email", destinatario: "gerencia@org.com", asunto: "..."}]
    activo: bool = True
    ejecuciones: int = 0
    created_at: datetime
    updated_at: datetime

class WorkflowCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    trigger: str
    condiciones: List[dict] = []
    acciones: List[dict] = []
    activo: bool = True

# ==================== HELPERS ====================

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
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    # Check if it's a session token (Google Auth)
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
    
    # Try JWT token
    try:
        payload = decode_jwt_token(session_token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return User(**user)
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

def validate_rfc(rfc: str, tipo_persona: str) -> bool:
    if not rfc:
        return True  # RFC optional for foreigners
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

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    organizacion_id = None
    
    # Create organization if name provided
    if user_data.organizacion_nombre:
        organizacion_id = f"org_{uuid.uuid4().hex[:12]}"
        org_doc = {
            "organizacion_id": organizacion_id,
            "nombre": user_data.organizacion_nombre,
            "rfc": "",
            "rubro": "asistencial",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.organizaciones.insert_one(org_doc)
        
        # Create default fiscal obligations
        await create_default_obligations(organizacion_id)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "organizacion_id": organizacion_id,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_HOURS * 3600
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "organizacion_id": organizacion_id,
        "token": token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_jwt_token(user["user_id"], user["email"])
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_HOURS * 3600
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "organizacion_id": user.get("organizacion_id"),
        "picture": user.get("picture"),
        "token": token
    }

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")
    
    async with httpx.AsyncClient() as http_client:
        try:
            res = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Sesión inválida")
            
            data = res.json()
        except Exception as e:
            logger.error(f"Error exchanging session: {e}")
            raise HTTPException(status_code=500, detail="Error al verificar sesión")
    
    email = data.get("email")
    name = data.get("name")
    picture = data.get("picture")
    session_token = data.get("session_token")
    
    # Find or create user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        user_id = user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        organizacion_id = f"org_{uuid.uuid4().hex[:12]}"
        
        # Create default organization
        org_doc = {
            "organizacion_id": organizacion_id,
            "nombre": f"Organización de {name}",
            "rfc": "",
            "rubro": "asistencial",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.organizaciones.insert_one(org_doc)
        await create_default_obligations(organizacion_id)
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "organizacion_id": organizacion_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 3600
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "organizacion_id": user.get("organizacion_id")
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "organizacion_id": user.organizacion_id
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Sesión cerrada"}

# ==================== ORGANIZACION ROUTES ====================

@api_router.get("/organizacion")
async def get_organizacion(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=404, detail="No tiene organización asignada")
    
    org = await db.organizaciones.find_one({"organizacion_id": user.organizacion_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    return org

@api_router.put("/organizacion")
async def update_organizacion(data: OrganizacionCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=404, detail="No tiene organización asignada")
    
    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.organizaciones.update_one(
        {"organizacion_id": user.organizacion_id},
        {"$set": update_data}
    )
    
    org = await db.organizaciones.find_one({"organizacion_id": user.organizacion_id}, {"_id": 0})
    return org

# ==================== DONANTES ROUTES ====================

@api_router.get("/donantes")
async def get_donantes(
    tipo_persona: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    
    if tipo_persona:
        query["tipo_persona"] = tipo_persona
    
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"rfc": {"$regex": search, "$options": "i"}}
        ]
    
    donantes = await db.donantes.find(query, {"_id": 0}).to_list(1000)
    return donantes

@api_router.post("/donantes")
async def create_donante(data: DonanteCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    if not data.es_extranjero and data.rfc:
        if not validate_rfc(data.rfc, data.tipo_persona):
            raise HTTPException(status_code=400, detail="RFC inválido")
    
    donante_id = f"don_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    donante_doc = {
        "donante_id": donante_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "total_donativos": 0,
        "numero_donativos": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.donantes.insert_one(donante_doc)
    return {k: v for k, v in donante_doc.items() if k != "_id"}

@api_router.get("/donantes/{donante_id}")
async def get_donante(donante_id: str, user: User = Depends(get_current_user)):
    donante = await db.donantes.find_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donante:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    
    # Get donation history
    donativos = await db.donativos.find(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("fecha_donativo", -1).to_list(100)
    
    donante["historial_donativos"] = donativos
    return donante

@api_router.put("/donantes/{donante_id}")
async def update_donante(donante_id: str, data: DonanteCreate, user: User = Depends(get_current_user)):
    if not data.es_extranjero and data.rfc:
        if not validate_rfc(data.rfc, data.tipo_persona):
            raise HTTPException(status_code=400, detail="RFC inválido")
    
    update_data = data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.donantes.update_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    
    donante = await db.donantes.find_one({"donante_id": donante_id}, {"_id": 0})
    return donante

@api_router.delete("/donantes/{donante_id}")
async def delete_donante(donante_id: str, user: User = Depends(get_current_user)):
    result = await db.donantes.delete_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    return {"message": "Donante eliminado"}

# ==================== DONATIVOS ROUTES ====================

@api_router.get("/donativos")
async def get_donativos(
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    
    donativos = await db.donativos.find(query, {"_id": 0}).sort("fecha_donativo", -1).to_list(1000)
    
    # Filter by year/month if provided
    if year or month:
        filtered = []
        for d in donativos:
            fecha = d.get("fecha_donativo")
            if isinstance(fecha, str):
                fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
            if year and fecha.year != year:
                continue
            if month and fecha.month != month:
                continue
            filtered.append(d)
        donativos = filtered
    
    return donativos

@api_router.post("/donativos")
async def create_donativo(data: DonativoCreate, background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    # Verify donante exists
    donante = await db.donantes.find_one(
        {"donante_id": data.donante_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donante:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    
    donativo_id = f"dtvo_{uuid.uuid4().hex[:12]}"
    
    donativo_doc = {
        "donativo_id": donativo_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "fecha_donativo": data.fecha_donativo.isoformat() if isinstance(data.fecha_donativo, datetime) else data.fecha_donativo,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.donativos.insert_one(donativo_doc)
    
    # Update donante stats
    monto = data.monto
    if data.moneda != "MXN" and data.tipo_cambio:
        monto = data.monto * data.tipo_cambio
    
    await db.donantes.update_one(
        {"donante_id": data.donante_id},
        {
            "$inc": {"total_donativos": monto, "numero_donativos": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Check AML alert rules in background
    background_tasks.add_task(check_alert_rules, user.organizacion_id, donativo_doc, donante)
    
    # Trigger workflows for donativo_creado
    background_tasks.add_task(trigger_workflows, user.organizacion_id, "donativo_creado", donativo_doc)
    
    return {k: v for k, v in donativo_doc.items() if k != "_id"}

@api_router.get("/donativos/{donativo_id}")
async def get_donativo(donativo_id: str, user: User = Depends(get_current_user)):
    donativo = await db.donativos.find_one(
        {"donativo_id": donativo_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donativo:
        raise HTTPException(status_code=404, detail="Donativo no encontrado")
    return donativo

@api_router.delete("/donativos/{donativo_id}")
async def delete_donativo(donativo_id: str, user: User = Depends(get_current_user)):
    donativo = await db.donativos.find_one(
        {"donativo_id": donativo_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donativo:
        raise HTTPException(status_code=404, detail="Donativo no encontrado")
    
    # Update donante stats
    monto = donativo.get("monto", 0)
    if donativo.get("moneda") != "MXN" and donativo.get("tipo_cambio"):
        monto = monto * donativo["tipo_cambio"]
    
    await db.donantes.update_one(
        {"donante_id": donativo["donante_id"]},
        {
            "$inc": {"total_donativos": -monto, "numero_donativos": -1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    await db.donativos.delete_one({"donativo_id": donativo_id})
    return {"message": "Donativo eliminado"}

# ==================== CFDI ROUTES ====================

@api_router.get("/cfdis")
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

@api_router.post("/cfdis")
async def create_cfdi(data: CFDICreate, user: User = Depends(get_current_user)):
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
    
    # Link CFDI to donativo
    await db.donativos.update_one(
        {"donativo_id": data.donativo_id},
        {"$set": {"cfdi_id": cfdi_id}}
    )
    
    return {k: v for k, v in cfdi_doc.items() if k != "_id"}

@api_router.post("/cfdis/{cfdi_id}/timbrar")
async def timbrar_cfdi(cfdi_id: str, user: User = Depends(get_current_user)):
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
    
    return {
        "message": "CFDI timbrado exitosamente (simulación)",
        "uuid_fiscal": uuid_fiscal,
        "fecha_timbrado": now.isoformat()
    }

@api_router.post("/cfdis/{cfdi_id}/cancelar")
async def cancelar_cfdi(cfdi_id: str, user: User = Depends(get_current_user)):
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

# ==================== OBLIGACIONES FISCALES ====================

async def create_default_obligations(organizacion_id: str):
    """Create default fiscal obligations for current year"""
    year = datetime.now().year
    obligations = [
        {
            "nombre": "Declaración Anual ISR",
            "descripcion": "Presentar declaración anual del ISR del ejercicio anterior",
            "fundamento_legal": "Art. 86 Fracc. III LISR",
            "fecha_limite": datetime(year, 2, 15, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Informe de Transparencia SAT",
            "descripcion": "Presentar informe de transparencia y uso de donativos (Ficha 19/ISR)",
            "fundamento_legal": "Art. 82 LISR / Ficha 19/ISR",
            "fecha_limite": datetime(year, 5, 31, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Enero",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 1, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Febrero",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 2, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Marzo",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 3, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Abril",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 4, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Mayo",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 5, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Junio",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 6, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Julio",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 7, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Agosto",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 8, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Septiembre",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 9, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Octubre",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 10, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Noviembre",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 11, 17, 23, 59, tzinfo=timezone.utc)
        },
        {
            "nombre": "Aviso LFPIORPI - Diciembre",
            "descripcion": "Presentar aviso mensual conforme a LFPIORPI",
            "fundamento_legal": "LFPIORPI",
            "fecha_limite": datetime(year, 12, 17, 23, 59, tzinfo=timezone.utc)
        }
    ]
    
    for obl in obligations:
        obligacion_id = f"obl_{uuid.uuid4().hex[:12]}"
        doc = {
            "obligacion_id": obligacion_id,
            "organizacion_id": organizacion_id,
            "estado": "pendiente",
            "notas": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **obl,
            "fecha_limite": obl["fecha_limite"].isoformat()
        }
        await db.obligaciones.insert_one(doc)

@api_router.get("/obligaciones")
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

@api_router.post("/obligaciones")
async def create_obligacion(data: ObligacionCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    obligacion_id = f"obl_{uuid.uuid4().hex[:12]}"
    
    doc = {
        "obligacion_id": obligacion_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "fecha_limite": data.fecha_limite.isoformat(),
        "estado": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.obligaciones.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/obligaciones/{obligacion_id}/estado")
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

@api_router.get("/transparencia")
async def get_informes(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    informes = await db.informes_transparencia.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("ejercicio_fiscal", -1).to_list(50)
    
    return informes

@api_router.post("/transparencia")
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

@api_router.get("/transparencia/{informe_id}")
async def get_informe(informe_id: str, user: User = Depends(get_current_user)):
    informe = await db.informes_transparencia.find_one(
        {"informe_id": informe_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    return informe

@api_router.put("/transparencia/{informe_id}")
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

@api_router.post("/transparencia/{informe_id}/presentar")
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

@api_router.get("/dashboard/stats")
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

# ==================== PDF GENERATION ====================

def generate_informe_pdf(informe: dict, organizacion: dict) -> io.BytesIO:
    """Generate PDF for transparency report"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, spaceAfter=20, textColor=colors.HexColor('#059669'))
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.HexColor('#111827'))
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontSize=11, spaceAfter=8)
    
    elements = []
    
    # Header
    elements.append(Paragraph("INFORME DE TRANSPARENCIA", title_style))
    elements.append(Paragraph(f"Ficha 19/ISR - Ejercicio Fiscal {informe.get('ejercicio_fiscal', '')}", heading_style))
    elements.append(Spacer(1, 20))
    
    # Organization info
    elements.append(Paragraph("DATOS DE LA ORGANIZACIÓN", heading_style))
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
    
    # Financial data
    elements.append(Paragraph("INFORMACIÓN FINANCIERA", heading_style))
    
    def format_currency(value):
        return f"${value:,.2f} MXN" if value else "$0.00 MXN"
    
    financial_data = [
        ["Concepto", "Monto"],
        ["Total donativos recibidos (efectivo)", format_currency(informe.get('total_donativos_recibidos', 0))],
        ["Total donativos en especie", format_currency(informe.get('total_donativos_especie', 0))],
        ["Total donativos otorgados a terceros", format_currency(informe.get('total_donativos_otorgados', 0))],
        ["Total gastos de administración", format_currency(informe.get('total_gastos_admin', 0))],
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
    
    # Beneficiaries
    elements.append(Paragraph("BENEFICIARIOS", heading_style))
    elements.append(Paragraph(f"Número de beneficiarios atendidos: {informe.get('numero_beneficiarios', 0):,}", normal_style))
    elements.append(Spacer(1, 15))
    
    # Activities description
    if informe.get('descripcion_actividades'):
        elements.append(Paragraph("DESCRIPCIÓN DE ACTIVIDADES", heading_style))
        elements.append(Paragraph(informe.get('descripcion_actividades', ''), normal_style))
        elements.append(Spacer(1, 15))
    
    # Legislative influence
    elements.append(Paragraph("ACTIVIDADES DE INFLUENCIA EN LEGISLACIÓN", heading_style))
    influencia = "Sí" if informe.get('influencia_legislacion') else "No"
    elements.append(Paragraph(f"¿Realizó actividades que influyen en legislación? {influencia}", normal_style))
    if informe.get('influencia_legislacion') and informe.get('detalle_influencia'):
        elements.append(Paragraph(f"Detalle: {informe.get('detalle_influencia', '')}", normal_style))
    elements.append(Spacer(1, 20))
    
    # Legal footer
    elements.append(Paragraph("FUNDAMENTO LEGAL", heading_style))
    elements.append(Paragraph("Este informe se presenta conforme a lo establecido en el Artículo 82 de la Ley del Impuesto Sobre la Renta (LISR) y la Ficha 19/ISR del Anexo 1-A de la Resolución Miscelánea Fiscal.", normal_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_cfdi_pdf(cfdi: dict, donante: dict, organizacion: dict) -> io.BytesIO:
    """Generate PDF for CFDI"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=16, spaceAfter=15, textColor=colors.HexColor('#7C3AED'))
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=12, spaceAfter=8, textColor=colors.HexColor('#111827'))
    normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontSize=10, spaceAfter=6)
    
    elements = []
    
    # Header
    elements.append(Paragraph("COMPROBANTE FISCAL DIGITAL POR INTERNET", title_style))
    elements.append(Paragraph("CFDI de Donativo", heading_style))
    elements.append(Spacer(1, 15))
    
    # CFDI Info
    cfdi_data = [
        ["Folio:", cfdi.get('folio', 'N/A')],
        ["Estado:", cfdi.get('estado', 'N/A').upper()],
        ["Fecha de emisión:", cfdi.get('fecha_emision', 'N/A')[:10] if cfdi.get('fecha_emision') else 'N/A'],
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
    
    # Emisor
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
    
    # Receptor
    elements.append(Paragraph("RECEPTOR (Donante)", heading_style))
    receptor_data = [
        ["Nombre:", donante.get('nombre', 'N/A')],
        ["RFC:", donante.get('rfc', 'N/A') or 'XEXX010101000' if donante.get('es_extranjero') else donante.get('rfc', 'N/A')],
        ["Tipo:", "Persona Moral" if donante.get('tipo_persona') == 'moral' else "Persona Física"],
    ]
    receptor_table = Table(receptor_data, colWidths=[1.5*inch, 4.5*inch])
    receptor_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(receptor_table)
    elements.append(Spacer(1, 15))
    
    # Donativo details
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
    
    # Leyenda obligatoria
    elements.append(Paragraph("LEYENDA OBLIGATORIA", heading_style))
    leyenda_style = ParagraphStyle('Leyenda', parent=styles['Normal'], fontSize=10, 
                                    backColor=colors.HexColor('#FEF3C7'), 
                                    borderPadding=10)
    elements.append(Paragraph(cfdi.get('leyenda', 'El donante no recibe bienes o servicios a cambio del donativo otorgado.'), leyenda_style))
    elements.append(Spacer(1, 15))
    
    # Legal footer
    elements.append(Paragraph("Fundamento legal: Art. 29 y 29-A del CFF, Art. 86 Fracc. II LISR", 
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

@api_router.get("/transparencia/{informe_id}/pdf")
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

@api_router.get("/cfdis/{cfdi_id}/pdf")
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

# ==================== EMAIL NOTIFICATIONS ====================

class EmailNotification(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    days_before_alert: int = 7

async def send_email_notification(to_email: str, subject: str, html_content: str) -> dict:
    """Send email notification using Resend"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend not configured, skipping email notification")
        return {"status": "skipped", "message": "Email service not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "error", "message": str(e)}

def generate_obligation_reminder_html(obligacion: dict, organizacion: dict, days_remaining: int) -> str:
    """Generate HTML email for fiscal obligation reminder"""
    urgency_color = "#DC2626" if days_remaining <= 7 else "#F59E0B" if days_remaining <= 15 else "#059669"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #111827; padding: 20px; text-align: center; }}
            .header h1 {{ color: #059669; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; background-color: #F7F6F3; }}
            .alert-box {{ background-color: white; border-left: 4px solid {urgency_color}; padding: 20px; margin: 20px 0; border-radius: 4px; }}
            .urgency {{ display: inline-block; background-color: {urgency_color}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }}
            .details {{ margin: 20px 0; }}
            .details p {{ margin: 8px 0; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }}
            .btn {{ display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>DonatariaSAT</h1>
            </div>
            <div class="content">
                <h2>Recordatorio de Obligación Fiscal</h2>
                <p>Hola, {organizacion.get('nombre', 'Estimado usuario')}</p>
                
                <div class="alert-box">
                    <span class="urgency">{"URGENTE" if days_remaining <= 7 else "PRÓXIMO" if days_remaining <= 15 else "PENDIENTE"}</span>
                    <h3 style="margin: 15px 0 10px 0;">{obligacion.get('nombre', 'Obligación fiscal')}</h3>
                    <p style="margin: 0; color: #6B7280;">{obligacion.get('descripcion', '')}</p>
                </div>
                
                <div class="details">
                    <p><strong>Fecha límite:</strong> {obligacion.get('fecha_limite', 'N/A')[:10] if obligacion.get('fecha_limite') else 'N/A'}</p>
                    <p><strong>Días restantes:</strong> {days_remaining} día(s)</p>
                    <p><strong>Fundamento legal:</strong> {obligacion.get('fundamento_legal', 'N/A')}</p>
                </div>
                
                <p>Te recomendamos tomar acción pronto para evitar sanciones o recargos.</p>
                
            </div>
            <div class="footer">
                <p>Este es un correo automático de DonatariaSAT.</p>
                <p>Plataforma de cumplimiento fiscal para donatarias autorizadas.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

@api_router.post("/notifications/send-test")
async def send_test_notification(user: User = Depends(get_current_user)):
    """Send a test notification email"""
    if not user.email:
        raise HTTPException(status_code=400, detail="Usuario sin email configurado")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #059669;">¡Notificaciones activadas!</h2>
        <p>Hola {user.name},</p>
        <p>Este es un correo de prueba de DonatariaSAT. Si recibes este mensaje, las notificaciones están funcionando correctamente.</p>
        <p>Recibirás alertas automáticas cuando tus obligaciones fiscales estén próximas a vencer.</p>
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

@api_router.post("/notifications/check-and-send")
async def check_and_send_notifications(background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    """Check upcoming obligations and send notifications"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    # Get organization
    organizacion = await db.organizaciones.find_one(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    
    # Get user for email
    user_doc = await db.users.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not user_doc or not user_doc.get("email"):
        raise HTTPException(status_code=400, detail="Usuario sin email configurado")
    
    # Get upcoming obligations (next 15 days)
    now = datetime.now(timezone.utc)
    upcoming_limit = now + timedelta(days=15)
    
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
        
        # Send notification for obligations within 15 days
        if 0 <= days_remaining <= 15:
            html_content = generate_obligation_reminder_html(obl, organizacion or {}, days_remaining)
            
            background_tasks.add_task(
                send_email_notification,
                to_email=user_doc["email"],
                subject=f"[DonatariaSAT] Recordatorio: {obl.get('nombre', 'Obligación fiscal')} - {days_remaining} días",
                html_content=html_content
            )
            notifications_sent += 1
    
    return {
        "message": f"Se enviarán {notifications_sent} notificación(es)",
        "notifications_queued": notifications_sent
    }

@api_router.get("/notifications/status")
async def get_notification_status():
    """Check if email notifications are configured"""
    return {
        "email_configured": RESEND_AVAILABLE and bool(RESEND_API_KEY),
        "sender_email": SENDER_EMAIL if RESEND_API_KEY else None
    }

# ==================== AML ALERT RULES ====================

@api_router.get("/alertas/reglas")
async def get_alert_rules(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    reglas = await db.alert_rules.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return reglas

@api_router.post("/alertas/reglas")
async def create_alert_rule(data: AlertRuleCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    rule_id = f"rule_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "rule_id": rule_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "veces_activada": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.alert_rules.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/alertas/reglas/{rule_id}")
async def update_alert_rule(rule_id: str, data: AlertRuleCreate, user: User = Depends(get_current_user)):
    result = await db.alert_rules.update_one(
        {"rule_id": rule_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    
    rule = await db.alert_rules.find_one({"rule_id": rule_id}, {"_id": 0})
    return rule

@api_router.delete("/alertas/reglas/{rule_id}")
async def delete_alert_rule(rule_id: str, user: User = Depends(get_current_user)):
    result = await db.alert_rules.delete_one(
        {"rule_id": rule_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    return {"message": "Regla eliminada"}

@api_router.put("/alertas/reglas/{rule_id}/toggle")
async def toggle_alert_rule(rule_id: str, user: User = Depends(get_current_user)):
    rule = await db.alert_rules.find_one(
        {"rule_id": rule_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    
    new_state = not rule.get("activa", True)
    await db.alert_rules.update_one(
        {"rule_id": rule_id},
        {"$set": {"activa": new_state, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"activa": new_state}

# ==================== AML ALERTS ====================

async def check_alert_rules(organizacion_id: str, donativo: dict, donante: dict):
    """Check all active rules and generate alerts if conditions are met"""
    rules = await db.alert_rules.find(
        {"organizacion_id": organizacion_id, "activa": True},
        {"_id": 0}
    ).to_list(100)
    
    alerts_created = []
    monto = donativo.get("monto", 0)
    if donativo.get("moneda") != "MXN" and donativo.get("tipo_cambio"):
        monto = monto * donativo["tipo_cambio"]
    
    for rule in rules:
        should_alert = False
        condiciones = rule.get("condiciones", {})
        
        if rule["tipo_regla"] == "umbral_monto":
            monto_minimo = condiciones.get("monto_minimo", 100000)
            if monto >= monto_minimo:
                should_alert = True
                titulo = f"Transacción supera umbral de ${monto_minimo:,.0f} MXN"
                descripcion = f"Donación en efectivo que supera el umbral de reporte obligatorio de ${monto_minimo:,.0f} MXN establecido por la UIF."
                tags = ["umbral excedido"]
        
        elif rule["tipo_regla"] == "nivel_riesgo_donante":
            nivel_riesgo = donante.get("nivel_riesgo", "bajo")
            niveles_alerta = condiciones.get("niveles", ["alto", "critico"])
            if nivel_riesgo in niveles_alerta:
                should_alert = True
                titulo = f"Transacción con donante de {nivel_riesgo} riesgo"
                descripcion = f"Donación de donante clasificado como {nivel_riesgo} riesgo."
                tags = ["riesgo donante"]
        
        elif rule["tipo_regla"] == "keywords_descripcion":
            keywords = condiciones.get("keywords", [])
            notas = (donativo.get("notas") or "").lower()
            descripcion_especie = (donativo.get("descripcion_especie") or "").lower()
            texto = f"{notas} {descripcion_especie}"
            for kw in keywords:
                if kw.lower() in texto:
                    should_alert = True
                    titulo = f"Keyword sospechoso detectado: '{kw}'"
                    descripcion = f"Se detectó la palabra clave '{kw}' en la descripción del donativo."
                    tags = ["keywords sospechosos"]
                    break
        
        if should_alert:
            alert_id = f"alert_{uuid.uuid4().hex[:12]}"
            now = datetime.now(timezone.utc).isoformat()
            
            alert_doc = {
                "alert_id": alert_id,
                "organizacion_id": organizacion_id,
                "rule_id": rule["rule_id"],
                "tipo": rule["tipo_regla"],
                "severidad": rule["severidad"],
                "titulo": titulo,
                "descripcion": descripcion,
                "donante_id": donante.get("donante_id"),
                "donante_nombre": donante.get("nombre"),
                "donativo_id": donativo.get("donativo_id"),
                "monto": monto,
                "estado": "nueva",
                "tags": tags,
                "created_at": now,
                "updated_at": now
            }
            
            await db.alerts.insert_one(alert_doc)
            alerts_created.append(alert_id)
            
            # Update rule activation count
            await db.alert_rules.update_one(
                {"rule_id": rule["rule_id"]},
                {"$inc": {"veces_activada": 1}}
            )
            
            # Trigger workflows
            await trigger_workflows(organizacion_id, "alerta_creada", alert_doc)
    
    return alerts_created

@api_router.get("/alertas")
async def get_alerts(
    severidad: Optional[str] = None,
    estado: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if severidad and severidad != "todas":
        query["severidad"] = severidad
    if estado and estado != "todos":
        query["estado"] = estado
    if search:
        query["$or"] = [
            {"titulo": {"$regex": search, "$options": "i"}},
            {"descripcion": {"$regex": search, "$options": "i"}},
            {"donante_nombre": {"$regex": search, "$options": "i"}}
        ]
    
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return alerts

@api_router.post("/alertas")
async def create_alert_manual(data: AlertCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    alert_id = f"alert_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Get donante name if provided
    donante_nombre = None
    if data.donante_id:
        donante = await db.donantes.find_one({"donante_id": data.donante_id}, {"_id": 0})
        donante_nombre = donante.get("nombre") if donante else None
    
    doc = {
        "alert_id": alert_id,
        "organizacion_id": user.organizacion_id,
        "rule_id": None,
        **data.model_dump(),
        "donante_nombre": donante_nombre,
        "estado": "nueva",
        "created_at": now,
        "updated_at": now
    }
    
    await db.alerts.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/alertas/{alert_id}/estado")
async def update_alert_estado(alert_id: str, estado: str, user: User = Depends(get_current_user)):
    valid_estados = ["nueva", "en_revision", "resuelta", "descartada"]
    if estado not in valid_estados:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {valid_estados}")
    
    result = await db.alerts.update_one(
        {"alert_id": alert_id, "organizacion_id": user.organizacion_id},
        {"$set": {"estado": estado, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    return {"message": "Estado actualizado"}

@api_router.get("/alertas/stats")
async def get_alerts_stats(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    org_id = user.organizacion_id
    
    total = await db.alerts.count_documents({"organizacion_id": org_id})
    nuevas = await db.alerts.count_documents({"organizacion_id": org_id, "estado": "nueva"})
    criticas = await db.alerts.count_documents({"organizacion_id": org_id, "severidad": "critica", "estado": "nueva"})
    altas = await db.alerts.count_documents({"organizacion_id": org_id, "severidad": "alta", "estado": "nueva"})
    
    return {
        "total": total,
        "nuevas": nuevas,
        "criticas": criticas,
        "altas": altas
    }

# ==================== REPORT TEMPLATES ====================

@api_router.get("/reportes/plantillas")
async def get_report_templates(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    templates = await db.report_templates.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return templates

@api_router.post("/reportes/plantillas")
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

@api_router.put("/reportes/plantillas/{template_id}")
async def update_report_template(template_id: str, data: ReportTemplateCreate, user: User = Depends(get_current_user)):
    result = await db.report_templates.update_one(
        {"template_id": template_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    template = await db.report_templates.find_one({"template_id": template_id}, {"_id": 0})
    return template

@api_router.delete("/reportes/plantillas/{template_id}")
async def delete_report_template(template_id: str, user: User = Depends(get_current_user)):
    result = await db.report_templates.delete_one(
        {"template_id": template_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"message": "Plantilla eliminada"}

# ==================== REPORTS ====================

@api_router.get("/reportes")
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

@api_router.post("/reportes")
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
    
    doc = {
        "report_id": report_id,
        "organizacion_id": user.organizacion_id,
        "template_id": data.template_id,
        "titulo": data.titulo,
        "tipo": data.tipo,
        "descripcion": data.descripcion,
        "destinatario": data.destinatario,
        "periodo_inicio": data.periodo_inicio.isoformat(),
        "periodo_fin": data.periodo_fin.isoformat(),
        "estado": "borrador",
        "datos": report_data,
        "archivo_url": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.reports.insert_one(doc)
    
    # Trigger workflows
    await trigger_workflows(user.organizacion_id, "reporte_actualizado", doc)
    
    return {k: v for k, v in doc.items() if k != "_id"}

async def generate_report_data(org_id: str, tipo: str, inicio: datetime, fin: datetime, criterios: dict) -> dict:
    """Generate report data based on type and criteria"""
    
    # Get donativos in date range
    donativos = await db.donativos.find(
        {
            "organizacion_id": org_id,
            "fecha_donativo": {
                "$gte": inicio.isoformat(),
                "$lte": fin.isoformat()
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
    
    return {
        "total_transacciones": len(donativos_filtrados),
        "total_monto": total_monto,
        "transacciones": donativos_filtrados[:100],  # Limit for response
        "alertas": alertas[:50],
        "periodo": f"{inicio.strftime('%d/%m/%Y')} - {fin.strftime('%d/%m/%Y')}"
    }

@api_router.put("/reportes/{report_id}/estado")
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

@api_router.delete("/reportes/{report_id}")
async def delete_report(report_id: str, user: User = Depends(get_current_user)):
    result = await db.reports.delete_one(
        {"report_id": report_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return {"message": "Reporte eliminado"}

# ==================== WORKFLOWS ====================

async def trigger_workflows(org_id: str, trigger_type: str, data: dict):
    """Trigger matching workflows for an event"""
    workflows = await db.workflows.find(
        {"organizacion_id": org_id, "trigger": trigger_type, "activo": True},
        {"_id": 0}
    ).to_list(100)
    
    for wf in workflows:
        # Check conditions
        conditions_met = True
        for cond in wf.get("condiciones", []):
            campo = cond.get("campo")
            operador = cond.get("operador")
            valor = cond.get("valor")
            
            data_valor = data.get(campo)
            
            if operador == "equals" and data_valor != valor:
                conditions_met = False
                break
            elif operador == "contains" and valor not in str(data_valor):
                conditions_met = False
                break
            elif operador == "greater_than" and (not data_valor or data_valor <= valor):
                conditions_met = False
                break
        
        if conditions_met:
            # Execute actions
            for action in wf.get("acciones", []):
                if action.get("tipo") == "email" and RESEND_AVAILABLE and RESEND_API_KEY:
                    try:
                        await send_email_notification(
                            to_email=action.get("destinatario"),
                            subject=action.get("asunto", f"[DonatariaSAT] {trigger_type}"),
                            html_content=generate_workflow_email_html(wf, data, action)
                        )
                    except Exception as e:
                        logger.error(f"Workflow email error: {e}")
                
                elif action.get("tipo") == "crear_alerta":
                    alert_id = f"alert_{uuid.uuid4().hex[:12]}"
                    now = datetime.now(timezone.utc).isoformat()
                    await db.alerts.insert_one({
                        "alert_id": alert_id,
                        "organizacion_id": org_id,
                        "rule_id": None,
                        "tipo": "workflow",
                        "severidad": action.get("severidad", "media"),
                        "titulo": action.get("titulo", f"Alerta de workflow: {wf['nombre']}"),
                        "descripcion": action.get("descripcion", ""),
                        "estado": "nueva",
                        "tags": ["workflow"],
                        "created_at": now,
                        "updated_at": now
                    })
            
            # Update execution count
            await db.workflows.update_one(
                {"workflow_id": wf["workflow_id"]},
                {"$inc": {"ejecuciones": 1}}
            )

def generate_workflow_email_html(workflow: dict, data: dict, action: dict) -> str:
    """Generate HTML email for workflow notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #7C3AED;">Notificación de Workflow</h2>
        <p><strong>Workflow:</strong> {workflow.get('nombre', 'N/A')}</p>
        <p><strong>Trigger:</strong> {workflow.get('trigger', 'N/A')}</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p>{action.get('mensaje', 'Se ha ejecutado un workflow automático.')}</p>
        <p style="color: #6B7280; font-size: 12px;">DonatariaSAT - Sistema de cumplimiento fiscal</p>
    </body>
    </html>
    """

@api_router.get("/workflows")
async def get_workflows(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    workflows = await db.workflows.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return workflows

@api_router.post("/workflows")
async def create_workflow(data: WorkflowCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    workflow_id = f"wf_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "workflow_id": workflow_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "ejecuciones": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.workflows.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, data: WorkflowCreate, user: User = Depends(get_current_user)):
    result = await db.workflows.update_one(
        {"workflow_id": workflow_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")
    
    wf = await db.workflows.find_one({"workflow_id": workflow_id}, {"_id": 0})
    return wf

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, user: User = Depends(get_current_user)):
    result = await db.workflows.delete_one(
        {"workflow_id": workflow_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")
    return {"message": "Workflow eliminado"}

@api_router.put("/workflows/{workflow_id}/toggle")
async def toggle_workflow(workflow_id: str, user: User = Depends(get_current_user)):
    wf = await db.workflows.find_one(
        {"workflow_id": workflow_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")
    
    new_state = not wf.get("activo", True)
    await db.workflows.update_one(
        {"workflow_id": workflow_id},
        {"$set": {"activo": new_state, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"activo": new_state}

# ==================== EXPORTS (CSV/Excel) ====================

@api_router.get("/exportar/donantes")
async def export_donantes_csv(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    donantes = await db.donantes.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).to_list(10000)
    
    # Generate CSV
    output = io.StringIO()
    output.write("Nombre,Tipo,RFC,Email,Telefono,Pais,Total Donativos,Num Donativos\n")
    
    for d in donantes:
        row = [
            d.get("nombre", ""),
            d.get("tipo_persona", ""),
            d.get("rfc", ""),
            d.get("email", ""),
            d.get("telefono", ""),
            d.get("pais", ""),
            str(d.get("total_donativos", 0)),
            str(d.get("numero_donativos", 0))
        ]
        output.write(",".join([f'"{v}"' for v in row]) + "\n")
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=donantes.csv"}
    )

@api_router.get("/exportar/donativos")
async def export_donativos_csv(
    year: Optional[int] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    
    donativos = await db.donativos.find(query, {"_id": 0}).to_list(10000)
    donantes = await db.donantes.find({"organizacion_id": user.organizacion_id}, {"_id": 0}).to_list(10000)
    donantes_map = {d["donante_id"]: d for d in donantes}
    
    # Filter by year if specified
    if year:
        donativos = [d for d in donativos if d.get("fecha_donativo", "")[:4] == str(year)]
    
    output = io.StringIO()
    output.write("Fecha,Donante,RFC,Monto,Moneda,Tipo,En Especie,CFDI\n")
    
    for d in donativos:
        donante = donantes_map.get(d.get("donante_id"), {})
        row = [
            d.get("fecha_donativo", "")[:10],
            donante.get("nombre", ""),
            donante.get("rfc", ""),
            str(d.get("monto", 0)),
            d.get("moneda", "MXN"),
            d.get("tipo_donativo", ""),
            "Sí" if d.get("es_especie") else "No",
            "Sí" if d.get("cfdi_id") else "No"
        ]
        output.write(",".join([f'"{v}"' for v in row]) + "\n")
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=donativos_{year or 'todos'}.csv"}
    )

@api_router.get("/exportar/alertas")
async def export_alertas_csv(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    alertas = await db.alerts.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).to_list(10000)
    
    output = io.StringIO()
    output.write("Fecha,Titulo,Tipo,Severidad,Estado,Donante,Monto\n")
    
    for a in alertas:
        row = [
            a.get("created_at", "")[:10],
            a.get("titulo", ""),
            a.get("tipo", ""),
            a.get("severidad", ""),
            a.get("estado", ""),
            a.get("donante_nombre", ""),
            str(a.get("monto", ""))
        ]
        output.write(",".join([f'"{v}"' for v in row]) + "\n")
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alertas.csv"}
    )

# ==================== CRON / SCHEDULED TASKS ====================

@api_router.post("/cron/notificaciones-diarias")
async def run_daily_notifications(background_tasks: BackgroundTasks):
    """Run daily notification check for all organizations (to be called by cron or manually)"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        return {"message": "Email service not configured", "notifications_sent": 0}
    
    # Get all organizations
    organizaciones = await db.organizaciones.find({}, {"_id": 0, "organizacion_id": 1}).to_list(1000)
    
    total_notifications = 0
    
    for org in organizaciones:
        org_id = org["organizacion_id"]
        
        # Get users in this organization
        users = await db.users.find({"organizacion_id": org_id}, {"_id": 0}).to_list(100)
        
        # Get organization details
        organizacion = await db.organizaciones.find_one({"organizacion_id": org_id}, {"_id": 0})
        
        # Get upcoming obligations
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
            
            # Send notification for 7, 3 and 1 day remaining
            if days_remaining in [7, 3, 1]:
                for user in users:
                    if user.get("email"):
                        html_content = generate_obligation_reminder_html(obl, organizacion or {}, days_remaining)
                        background_tasks.add_task(
                            send_email_notification,
                            to_email=user["email"],
                            subject=f"[DonatariaSAT] {'URGENTE: ' if days_remaining == 1 else ''}Recordatorio: {obl.get('nombre', 'Obligación fiscal')} - {days_remaining} día(s)",
                            html_content=html_content
                        )
                        total_notifications += 1
    
    return {"message": f"Cron ejecutado", "notifications_queued": total_notifications}

@api_router.get("/cron/status")
async def get_scheduler_status():
    """Check the status of the background scheduler"""
    return {
        "scheduler_active": _scheduler_task is not None and not _scheduler_task.done(),
        "email_configured": RESEND_AVAILABLE and bool(RESEND_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "DonatariaSAT API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== BACKGROUND SCHEDULER ====================

async def daily_notification_scheduler():
    """Background task that runs daily notifications at 8:00 AM Mexico City time"""
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Mexico City is UTC-6, so 8:00 AM = 14:00 UTC
            target_hour_utc = 14
            next_run = now.replace(hour=target_hour_utc, minute=0, second=0, microsecond=0)
            if now >= next_run:
                next_run += timedelta(days=1)
            
            wait_seconds = (next_run - now).total_seconds()
            logging.info(f"[Scheduler] Next daily notification run in {wait_seconds/3600:.1f} hours at {next_run.isoformat()}")
            await asyncio.sleep(wait_seconds)
            
            # Run the daily notifications
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
            await asyncio.sleep(3600)  # Wait 1 hour before retrying on error

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
