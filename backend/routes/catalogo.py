from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
from datetime import datetime, timezone
import uuid
import csv as csv_module
from database import db
from models import User
from utils import get_current_user, log_audit
from catalogo_donatarias import CATALOGO_DONATARIAS

router = APIRouter()

# ==================== CATÁLOGO DE DONATARIAS ====================

@router.post("/catalogo/seed")
async def seed_catalogo():
    """Seed the catalog with initial data (run once)"""
    existing = await db.catalogo_donatarias.count_documents({})
    if existing > 0:
        return {"message": f"Catálogo ya tiene {existing} registros", "seeded": False}
    
    docs = []
    for i, entry in enumerate(CATALOGO_DONATARIAS):
        doc = {
            "catalogo_id": f"cat_{uuid.uuid4().hex[:12]}",
            **entry,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        docs.append(doc)
    
    await db.catalogo_donatarias.insert_many(docs)
    return {"message": f"Catálogo cargado con {len(docs)} donatarias", "seeded": True}

@router.get("/catalogo/donatarias")
async def get_catalogo_donatarias(
    search: Optional[str] = None,
    giro: Optional[str] = None,
    estado: Optional[str] = None,
    estatus_sat: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """List catalog entries with filters (public endpoint)"""
    # Auto-seed if empty
    existing = await db.catalogo_donatarias.count_documents({})
    if existing == 0:
        docs = []
        for entry in CATALOGO_DONATARIAS:
            doc = {
                "catalogo_id": f"cat_{uuid.uuid4().hex[:12]}",
                **entry,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            docs.append(doc)
        await db.catalogo_donatarias.insert_many(docs)
    
    query = {}
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"rfc": {"$regex": search, "$options": "i"}},
            {"descripcion": {"$regex": search, "$options": "i"}}
        ]
    if giro:
        query["giro"] = giro
    if estado:
        query["estado"] = estado
    if estatus_sat:
        query["estatus_sat"] = estatus_sat
    
    total = await db.catalogo_donatarias.count_documents(query)
    items = await db.catalogo_donatarias.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {"total": total, "items": items}

@router.get("/catalogo/donatarias/giros")
async def get_catalogo_giros():
    """Get distinct giros and estados for filter dropdowns"""
    giros = await db.catalogo_donatarias.distinct("giro")
    estados = await db.catalogo_donatarias.distinct("estado")
    estatus_list = await db.catalogo_donatarias.distinct("estatus_sat")
    return {"giros": sorted(giros), "estados": sorted(estados), "estatus": sorted(estatus_list)}

@router.get("/catalogo/donatarias/{catalogo_id}")
async def get_catalogo_donataria(catalogo_id: str):
    """Get details of a specific catalog entry"""
    item = await db.catalogo_donatarias.find_one({"catalogo_id": catalogo_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Donataria no encontrada en catálogo")
    
    # Get linked donors count
    vinculados = await db.donante_catalogo_links.count_documents({"catalogo_id": catalogo_id})
    item["vinculados_count"] = vinculados
    
    return item

@router.post("/catalogo/donatarias/import")
async def import_catalogo_csv(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Import catalog entries from CSV"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV")
    
    contents = await file.read()
    decoded = contents.decode("utf-8-sig")
    reader = csv_module.DictReader(decoded.splitlines())
    
    imported = 0
    skipped = 0
    required_fields = {"nombre"}
    
    for row in reader:
        if not required_fields.issubset(set(row.keys())):
            continue
        
        nombre = row.get("nombre", "").strip()
        if not nombre:
            skipped += 1
            continue
        
        rfc = row.get("rfc", "").strip().upper()
        
        # Check if already exists by RFC or name
        exists = None
        if rfc:
            exists = await db.catalogo_donatarias.find_one({"rfc": rfc})
        if not exists:
            exists = await db.catalogo_donatarias.find_one({"nombre": nombre})
        
        if exists:
            # Update existing
            update_data = {}
            for field in ["giro", "descripcion", "estatus_sat", "estado"]:
                if row.get(field):
                    update_data[field] = row[field].strip()
            if update_data:
                await db.catalogo_donatarias.update_one(
                    {"catalogo_id": exists["catalogo_id"]},
                    {"$set": update_data}
                )
            skipped += 1
        else:
            doc = {
                "catalogo_id": f"cat_{uuid.uuid4().hex[:12]}",
                "nombre": nombre,
                "rfc": rfc,
                "giro": row.get("giro", "otro").strip().lower(),
                "descripcion": row.get("descripcion", "").strip(),
                "estatus_sat": row.get("estatus_sat", "autorizada").strip().lower(),
                "estado": row.get("estado", "").strip(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.catalogo_donatarias.insert_one(doc)
            imported += 1
    
    await log_audit(user.organizacion_id, user.user_id, user.name, "importar", "catalogo", "", {"imported": imported, "skipped": skipped})
    return {"message": f"Importación completada", "imported": imported, "updated_or_skipped": skipped}

@router.post("/catalogo/donatarias/{catalogo_id}/vincular")
async def vincular_donante_catalogo(catalogo_id: str, donante_id: str, user: User = Depends(get_current_user)):
    """Link a donor from user's org to a catalog entry"""
    cat = await db.catalogo_donatarias.find_one({"catalogo_id": catalogo_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Donataria no encontrada en catálogo")
    
    donante = await db.donantes.find_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    )
    if not donante:
        raise HTTPException(status_code=404, detail="Donante no encontrado")
    
    existing_link = await db.donante_catalogo_links.find_one({
        "donante_id": donante_id, "catalogo_id": catalogo_id
    })
    if existing_link:
        raise HTTPException(status_code=400, detail="El donante ya está vinculado a esta donataria")
    
    link_doc = {
        "link_id": f"link_{uuid.uuid4().hex[:12]}",
        "donante_id": donante_id,
        "catalogo_id": catalogo_id,
        "organizacion_id": user.organizacion_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.donante_catalogo_links.insert_one(link_doc)
    
    await log_audit(user.organizacion_id, user.user_id, user.name, "vincular", "catalogo", catalogo_id, {"donante_id": donante_id, "donataria": cat.get("nombre")})
    return {"message": "Donante vinculado", "link_id": link_doc["link_id"]}

@router.delete("/catalogo/donatarias/{catalogo_id}/vincular/{donante_id}")
async def desvincular_donante_catalogo(catalogo_id: str, donante_id: str, user: User = Depends(get_current_user)):
    """Unlink a donor from a catalog entry"""
    result = await db.donante_catalogo_links.delete_one({
        "donante_id": donante_id, "catalogo_id": catalogo_id, "organizacion_id": user.organizacion_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo no encontrado")
    return {"message": "Vínculo eliminado"}

@router.get("/catalogo/donatarias/{catalogo_id}/vinculados")
async def get_vinculados(catalogo_id: str, user: User = Depends(get_current_user)):
    """Get donors linked to a catalog entry"""
    links = await db.donante_catalogo_links.find(
        {"catalogo_id": catalogo_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).to_list(1000)
    
    donante_ids = [l["donante_id"] for l in links]
    donantes = await db.donantes.find(
        {"donante_id": {"$in": donante_ids}},
        {"_id": 0, "donante_id": 1, "nombre": 1, "rfc": 1}
    ).to_list(1000)
    
    return donantes

@router.get("/donantes/{donante_id}/catalogo")
async def get_donante_catalogo_links(donante_id: str, user: User = Depends(get_current_user)):
    """Get catalog entries linked to a specific donor"""
    links = await db.donante_catalogo_links.find(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id},
        {"_id": 0}
    ).to_list(100)
    
    catalogo_ids = [l["catalogo_id"] for l in links]
    if not catalogo_ids:
        return []
    
    entries = await db.catalogo_donatarias.find(
        {"catalogo_id": {"$in": catalogo_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return entries


