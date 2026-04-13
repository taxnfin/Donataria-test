from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from database import db
from models import User, DonativoCreate
from utils import get_current_user, log_audit, require_role
from services import check_alert_rules, trigger_workflows

router = APIRouter()

# ==================== DONATIVOS ROUTES ====================

@router.get("/donativos")
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

@router.post("/donativos")
async def create_donativo(data: DonativoCreate, background_tasks: BackgroundTasks, user: User = Depends(require_role("admin", "editor"))):
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
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "donativo", donativo_id, {"monto": data.monto, "moneda": data.moneda, "donante_id": data.donante_id})
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

@router.get("/donativos/{donativo_id}")
async def get_donativo(donativo_id: str, user: User = Depends(get_current_user)):
    donativo = await db.donativos.find_one(
        {"donativo_id": donativo_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donativo:
        raise HTTPException(status_code=404, detail="Donativo no encontrado")
    return donativo

@router.delete("/donativos/{donativo_id}")
async def delete_donativo(donativo_id: str, user: User = Depends(require_role("admin"))):
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

