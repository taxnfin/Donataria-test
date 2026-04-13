from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from database import db
from models import User, WorkflowCreate
from utils import get_current_user

router = APIRouter()

# ==================== WORKFLOWS ====================

@router.get("/workflows")
async def get_workflows(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    workflows = await db.workflows.find(
        {"organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return workflows

@router.post("/workflows")
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

@router.put("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, data: WorkflowCreate, user: User = Depends(get_current_user)):
    result = await db.workflows.update_one(
        {"workflow_id": workflow_id, "organizacion_id": user.organizacion_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")
    
    wf = await db.workflows.find_one({"workflow_id": workflow_id}, {"_id": 0})
    return wf

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, user: User = Depends(get_current_user)):
    result = await db.workflows.delete_one(
        {"workflow_id": workflow_id, "organizacion_id": user.organizacion_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workflow no encontrado")
    return {"message": "Workflow eliminado"}

@router.put("/workflows/{workflow_id}/toggle")
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
