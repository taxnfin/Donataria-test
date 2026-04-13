from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid
from database import db
from models import User, DonanteCreate
from utils import get_current_user, validate_rfc, log_audit

router = APIRouter()

@router.get("/donantes")
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

@router.post("/donantes")
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
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "donante", donante_id, {"nombre": data.nombre, "rfc": data.rfc})
    return {k: v for k, v in donante_doc.items() if k != "_id"}

@router.get("/donantes/{donante_id}")
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

@router.put("/donantes/{donante_id}")
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
    await log_audit(user.organizacion_id, user.user_id, user.name, "actualizar", "donante", donante_id, {"nombre": data.nombre})
    return donante

@router.delete("/donantes/{donante_id}")
async def delete_donante(donante_id: str, user: User = Depends(get_current_user)):
    result = await db.donantes.delete_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    await log_audit(user.organizacion_id, user.user_id, user.name, "eliminar", "donante", donante_id, {})
    return {"message": "Donante eliminado"}


