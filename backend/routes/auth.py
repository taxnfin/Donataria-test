from fastapi import APIRouter, HTTPException, Depends, Response, Request, UploadFile, File
from datetime import datetime, timezone, timedelta
import uuid
import base64
import httpx
import os
import logging
from database import db
from models import User, UserCreate, UserLogin, OrganizacionCreate
from utils import (
    hash_password, verify_password, create_jwt_token, decode_jwt_token,
    get_current_user, log_audit, create_default_obligations,
    JWT_EXPIRATION_HOURS
)

logger = logging.getLogger(__name__)

router = APIRouter()

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
EMERGENT_AUTH_URL = os.environ.get('EMERGENT_AUTH_URL')

# ==================== AUTH ROUTES ====================

@router.post("/auth/register")
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
        "organizaciones_ids": [organizacion_id] if organizacion_id else [],
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

@router.post("/auth/login")
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
        "organizaciones_ids": user.get("organizaciones_ids", []),
        "picture": user.get("picture"),
        "token": token
    }

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@router.post("/auth/session")
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

@router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "organizacion_id": user.organizacion_id,
        "organizaciones_ids": user.organizaciones_ids
    }

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Sesión cerrada"}

# ==================== ORGANIZACION ROUTES ====================

@router.get("/organizaciones")
async def get_user_organizaciones(user: User = Depends(get_current_user)):
    """Get all organizations the user belongs to"""
    org_ids = user.organizaciones_ids or ([user.organizacion_id] if user.organizacion_id else [])
    if not org_ids:
        return []
    
    orgs = await db.organizaciones.find(
        {"organizacion_id": {"$in": org_ids}},
        {"_id": 0, "organizacion_id": 1, "nombre": 1, "rfc": 1, "logo_url": 1}
    ).to_list(100)
    
    # Mark active org
    for org in orgs:
        org["activa"] = org["organizacion_id"] == user.organizacion_id
    
    return orgs

@router.post("/organizaciones")
async def create_new_organizacion(data: OrganizacionCreate, user: User = Depends(get_current_user)):
    """Create a new organization and add the user to it"""
    organizacion_id = f"org_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    org_doc = {
        "organizacion_id": organizacion_id,
        "nombre": data.nombre,
        "rfc": data.rfc,
        "rubro": data.rubro,
        "direccion": data.direccion,
        "telefono": data.telefono,
        "email": data.email,
        "created_at": now
    }
    await db.organizaciones.insert_one(org_doc)
    await create_default_obligations(organizacion_id)
    
    # Add org to user's list and switch to it
    await db.users.update_one(
        {"user_id": user.user_id},
        {
            "$addToSet": {"organizaciones_ids": organizacion_id},
            "$set": {"organizacion_id": organizacion_id}
        }
    )
    
    await log_audit(organizacion_id, user.user_id, user.name, "crear", "organizacion", organizacion_id, {"nombre": data.nombre})
    return {k: v for k, v in org_doc.items() if k != "_id"}

@router.put("/organizaciones/switch/{organizacion_id}")
async def switch_organizacion(organizacion_id: str, user: User = Depends(get_current_user)):
    """Switch the active organization for the current user"""
    org_ids = user.organizaciones_ids or ([user.organizacion_id] if user.organizacion_id else [])
    
    if organizacion_id not in org_ids:
        raise HTTPException(status_code=403, detail="No tiene acceso a esta organización")
    
    org = await db.organizaciones.find_one({"organizacion_id": organizacion_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"organizacion_id": organizacion_id}}
    )
    
    return {"message": "Organización cambiada", "organizacion_id": organizacion_id, "nombre": org.get("nombre")}

@router.get("/organizacion")
async def get_organizacion(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=404, detail="No tiene organización asignada")
    
    org = await db.organizaciones.find_one({"organizacion_id": user.organizacion_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    return org

@router.put("/organizacion")
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

@router.post("/organizacion/logo")
async def upload_logo(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload organization logo (stored as base64 in DB)"""
    if not user.organizacion_id:
        raise HTTPException(status_code=404, detail="No tiene organización asignada")
    
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes PNG, JPG o WebP")
    
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 2MB")
    
    logo_b64 = base64.b64encode(contents).decode("utf-8")
    logo_data_uri = f"data:{file.content_type};base64,{logo_b64}"
    
    await db.organizaciones.update_one(
        {"organizacion_id": user.organizacion_id},
        {"$set": {"logo_url": logo_data_uri, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Logo actualizado", "logo_url": logo_data_uri}

@router.delete("/organizacion/logo")
async def delete_logo(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=404, detail="No tiene organización asignada")
    
    await db.organizaciones.update_one(
        {"organizacion_id": user.organizacion_id},
        {"$set": {"logo_url": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Logo eliminado"}

