from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
import io
from database import db
from models import User
from utils import get_current_user

router = APIRouter()

@router.get("/auditoria")
async def get_audit_log(
    entidad: Optional[str] = None,
    accion: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if entidad:
        query["entidad"] = entidad
    if accion:
        query["accion"] = accion
    
    total = await db.audit_log.count_documents(query)
    logs = await db.audit_log.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "logs": logs}

@router.get("/auditoria/export")
async def export_audit_log(
    entidad: Optional[str] = None,
    accion: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organización asignada")
    
    query = {"organizacion_id": user.organizacion_id}
    if entidad:
        query["entidad"] = entidad
    if accion:
        query["accion"] = accion
    
    logs = await db.audit_log.find(query, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    csv_lines = ["Fecha,Usuario,Acción,Entidad,ID Entidad,Detalles"]
    for log in logs:
        detalles = str(log.get("detalles", "")).replace(",", ";")
        csv_lines.append(f"{log.get('timestamp','')},{log.get('user_name','')},{log.get('accion','')},{log.get('entidad','')},{log.get('entidad_id','')},{detalles}")
    
    csv_content = "\n".join(csv_lines)
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=auditoria.csv"}
    )

