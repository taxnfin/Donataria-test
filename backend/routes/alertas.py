from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid
from database import db
from models import User, AlertRuleCreate, AlertCreate
from utils import get_current_user, log_audit
from services import check_alert_rules, trigger_workflows

router = APIRouter()

# ==================== AML ALERT RULES ====================

@router.get("/alertas/reglas")
async def get_alert_rules(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    reglas = await db.alert_rules.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return reglas

@router.post("/alertas/reglas")
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

@router.put("/alertas/reglas/{rule_id}")
async def update_alert_rule(rule_id: str, data: AlertRuleCreate, user: User = Depends(get_current_user)):
    result = await db.alert_rules.update_one(
        {"rule_id": rule_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    
    rule = await db.alert_rules.find_one({"rule_id": rule_id}, {"_id": 0})
    return rule

@router.delete("/alertas/reglas/{rule_id}")
async def delete_alert_rule(rule_id: str, user: User = Depends(get_current_user)):
    result = await db.alert_rules.delete_one(
        {"rule_id": rule_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    return {"message": "Regla eliminada"}

@router.put("/alertas/reglas/{rule_id}/toggle")
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

@router.get("/alertas")
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

@router.post("/alertas")
async def create_alert_manual(data: AlertCreate, user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    alert_id = f"alert_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
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

@router.put("/alertas/{alert_id}/estado")
async def update_alert_estado(alert_id: str, estado: str, user: User = Depends(get_current_user)):
    valid_estados = ["nueva", "en_revision", "resuelta", "descartada"]
    if estado not in valid_estados:
        raise HTTPException(status_code=400, detail=f"Estado invalido. Opciones: {valid_estados}")
    
    result = await db.alerts.update_one(
        {"alert_id": alert_id, "organizacion_id": user.organizacion_id},
        {"$set": {"estado": estado, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    
    return {"message": "Estado actualizado"}

@router.get("/alertas/stats")
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
