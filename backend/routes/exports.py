from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone
import io
from database import db
from models import User
from utils import get_current_user

router = APIRouter()

# ==================== EXPORTS (CSV/Excel) ====================

@router.get("/exportar/donantes")
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

@router.get("/exportar/donativos")
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

@router.get("/exportar/alertas")
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

