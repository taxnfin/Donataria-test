from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid
from database import db
from models import User, DonanteKYCUpdate, AvisoUIFCreate, DueDiligenceCreate
from utils import get_current_user, log_audit, require_role

router = APIRouter()

VALOR_UMA_DIARIO = 113.14  # UMA 2026 aprox
UMBRAL_UMAS = 1605
UMBRAL_OPERACION_VULNERABLE = round(VALOR_UMA_DIARIO * UMBRAL_UMAS, 2)


# ==================== OPERACIONES VULNERABLES ====================

@router.get("/pld/operaciones-vulnerables")
async def get_operaciones_vulnerables(user: User = Depends(get_current_user)):
    """Detect donations >= 1,605 UMAs (Art. 17 Ley Antilavado)"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id

    donativos = await db.donativos.find({"organizacion_id": org_id}, {"_id": 0}).sort("fecha_donativo", -1).to_list(10000)
    donantes_map = {}
    donantes_list = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    for d in donantes_list:
        donantes_map[d["donante_id"]] = d

    vulnerables = []
    for dtvo in donativos:
        monto = dtvo.get("monto", 0)
        if monto >= UMBRAL_OPERACION_VULNERABLE:
            donante = donantes_map.get(dtvo.get("donante_id"), {})
            vulnerables.append({
                "donativo_id": dtvo.get("donativo_id"),
                "donante_id": dtvo.get("donante_id"),
                "donante_nombre": donante.get("nombre", "Desconocido"),
                "donante_rfc": donante.get("rfc", ""),
                "monto": monto,
                "moneda": dtvo.get("moneda", "MXN"),
                "fecha_donativo": dtvo.get("fecha_donativo"),
                "metodo_pago": dtvo.get("metodo_pago", ""),
                "umbral_umas": UMBRAL_UMAS,
                "umbral_mxn": UMBRAL_OPERACION_VULNERABLE,
                "aviso_presentado": False,
            })

    avisos = await db.avisos_uif.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    avisos_by_donativo = {a.get("donativo_id"): a for a in avisos if a.get("donativo_id")}
    for v in vulnerables:
        aviso = avisos_by_donativo.get(v["donativo_id"])
        if aviso:
            v["aviso_presentado"] = True
            v["aviso_folio"] = aviso.get("numero_folio")
            v["aviso_estatus"] = aviso.get("estatus")

    return {
        "umbral_umas": UMBRAL_UMAS,
        "umbral_mxn": UMBRAL_OPERACION_VULNERABLE,
        "valor_uma_diario": VALOR_UMA_DIARIO,
        "total_operaciones": len(vulnerables),
        "operaciones": vulnerables,
    }


# ==================== AVISOS UIF/SAT ====================

@router.get("/pld/avisos")
async def get_avisos(user: User = Depends(get_current_user)):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")
    avisos = await db.avisos_uif.find(
        {"organizacion_id": user.organizacion_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return avisos


@router.post("/pld/avisos")
async def create_aviso(data: AvisoUIFCreate, user: User = Depends(require_role("admin", "editor"))):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    aviso_id = f"aviso_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "aviso_id": aviso_id,
        "organizacion_id": user.organizacion_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.avisos_uif.insert_one(doc)
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "aviso_uif", aviso_id, {"tipo": data.tipo_aviso})
    return {k: v for k, v in doc.items() if k != "_id"}


@router.put("/pld/avisos/{aviso_id}")
async def update_aviso(aviso_id: str, data: AvisoUIFCreate, user: User = Depends(require_role("admin", "editor"))):
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.avisos_uif.update_one(
        {"aviso_id": aviso_id, "organizacion_id": user.organizacion_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aviso no encontrado")
    updated = await db.avisos_uif.find_one({"aviso_id": aviso_id}, {"_id": 0})
    return updated


# ==================== MATRIZ DE RIESGO ====================

@router.get("/pld/matriz-riesgo")
async def get_matriz_riesgo(user: User = Depends(get_current_user)):
    """Calculate risk matrix for all donors"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id
    donantes = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)

    matriz = []
    for d in donantes:
        score = 0
        factores = []

        # PEP
        if d.get("es_pep"):
            score += 40
            factores.append("PEP")

        # Jurisdiccion
        jr = d.get("jurisdiccion_riesgo", "bajo")
        if jr == "alto":
            score += 30
            factores.append("Jurisdiccion alto riesgo")
        elif jr == "medio":
            score += 15
            factores.append("Jurisdiccion riesgo medio")

        # Monto total
        total = d.get("total_donativos", 0)
        if total >= UMBRAL_OPERACION_VULNERABLE:
            score += 20
            factores.append(f"Monto alto (${total:,.0f})")
        elif total >= UMBRAL_OPERACION_VULNERABLE * 0.5:
            score += 10
            factores.append("Monto medio-alto")

        # Metodo pago (check most recent donation)
        ultimo_donativo = await db.donativos.find_one(
            {"donante_id": d["donante_id"], "organizacion_id": org_id},
            {"_id": 0}
        )
        if ultimo_donativo and ultimo_donativo.get("metodo_pago") == "efectivo":
            score += 15
            factores.append("Pago en efectivo")

        # Extranjero
        if d.get("es_extranjero"):
            score += 10
            factores.append("Donante extranjero")

        # KYC incompleto
        kyc_fields = ["tiene_constancia_fiscal", "tiene_identificacion", "beneficiario_controlador"]
        kyc_missing = sum(1 for f in kyc_fields if not d.get(f))
        if kyc_missing >= 2:
            score += 15
            factores.append("KYC incompleto")

        nivel = "critico" if score >= 60 else "alto" if score >= 40 else "medio" if score >= 20 else "bajo"

        matriz.append({
            "donante_id": d["donante_id"],
            "nombre": d.get("nombre"),
            "rfc": d.get("rfc"),
            "total_donativos": total,
            "score_riesgo": min(score, 100),
            "nivel_riesgo": nivel,
            "factores": factores,
            "es_pep": d.get("es_pep", False),
            "jurisdiccion_riesgo": d.get("jurisdiccion_riesgo", "bajo"),
            "kyc_completo": kyc_missing == 0,
        })

    matriz.sort(key=lambda x: x["score_riesgo"], reverse=True)

    stats = {
        "total_donantes": len(matriz),
        "criticos": sum(1 for m in matriz if m["nivel_riesgo"] == "critico"),
        "altos": sum(1 for m in matriz if m["nivel_riesgo"] == "alto"),
        "medios": sum(1 for m in matriz if m["nivel_riesgo"] == "medio"),
        "bajos": sum(1 for m in matriz if m["nivel_riesgo"] == "bajo"),
    }

    return {"stats": stats, "matriz": matriz}


# ==================== KYC DONANTES ====================

@router.put("/pld/kyc/{donante_id}")
async def update_donante_kyc(donante_id: str, data: DonanteKYCUpdate, user: User = Depends(require_role("admin", "editor"))):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    donante = await db.donantes.find_one(
        {"donante_id": donante_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not donante:
        raise HTTPException(status_code=404, detail="Donante no encontrado")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["kyc_updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.donantes.update_one({"donante_id": donante_id}, {"$set": update_fields})
    await log_audit(user.organizacion_id, user.user_id, user.name, "kyc_update", "donante", donante_id, update_fields)

    updated = await db.donantes.find_one({"donante_id": donante_id}, {"_id": 0})
    return updated


@router.get("/pld/kyc-status")
async def get_kyc_status(user: User = Depends(get_current_user)):
    """Get KYC completion status for all donors"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    donantes = await db.donantes.find({"organizacion_id": user.organizacion_id}, {"_id": 0}).to_list(10000)
    result = []
    for d in donantes:
        kyc_fields = {
            "identificacion": d.get("tiene_identificacion", False),
            "constancia_fiscal": d.get("tiene_constancia_fiscal", False),
            "beneficiario_controlador": bool(d.get("beneficiario_controlador")),
            "nivel_riesgo_asignado": bool(d.get("nivel_riesgo")),
        }
        completados = sum(1 for v in kyc_fields.values() if v)
        result.append({
            "donante_id": d["donante_id"],
            "nombre": d.get("nombre"),
            "rfc": d.get("rfc"),
            "total_donativos": d.get("total_donativos", 0),
            "kyc_fields": kyc_fields,
            "kyc_completado": completados,
            "kyc_total": len(kyc_fields),
            "kyc_porcentaje": round(completados / len(kyc_fields) * 100),
            "es_pep": d.get("es_pep", False),
        })
    result.sort(key=lambda x: x["kyc_porcentaje"])
    return result


# ==================== DASHBOARD AML ====================

@router.get("/pld/dashboard")
async def get_pld_dashboard(user: User = Depends(get_current_user)):
    """Comprehensive AML/PLD dashboard"""
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    org_id = user.organizacion_id

    # Alerts stats
    total_alertas = await db.alerts.count_documents({"organizacion_id": org_id})
    alertas_nuevas = await db.alerts.count_documents({"organizacion_id": org_id, "estado": "nueva"})
    alertas_revision = await db.alerts.count_documents({"organizacion_id": org_id, "estado": "en_revision"})
    alertas_resueltas = await db.alerts.count_documents({"organizacion_id": org_id, "estado": {"$in": ["resuelta", "descartada"]}})

    # Avisos stats
    total_avisos = await db.avisos_uif.count_documents({"organizacion_id": org_id})
    avisos_pendientes = await db.avisos_uif.count_documents({"organizacion_id": org_id, "estatus": "pendiente"})
    avisos_presentados = await db.avisos_uif.count_documents({"organizacion_id": org_id, "estatus": {"$in": ["presentado", "acusado"]}})

    # Operaciones vulnerables count
    donativos = await db.donativos.find({"organizacion_id": org_id, "monto": {"$gte": UMBRAL_OPERACION_VULNERABLE}}, {"_id": 0}).to_list(10000)
    ops_vulnerables = len(donativos)

    # Due diligence stats
    total_dd = await db.due_diligence.count_documents({"organizacion_id": org_id})
    dd_pendientes = await db.due_diligence.count_documents({"organizacion_id": org_id, "resultado": "pendiente"})

    # KYC completion
    donantes = await db.donantes.find({"organizacion_id": org_id}, {"_id": 0}).to_list(10000)
    kyc_completo = 0
    for d in donantes:
        if d.get("tiene_identificacion") and d.get("tiene_constancia_fiscal") and d.get("beneficiario_controlador"):
            kyc_completo += 1
    kyc_pct = round(kyc_completo / len(donantes) * 100) if donantes else 0

    return {
        "alertas": {
            "total": total_alertas,
            "nuevas": alertas_nuevas,
            "en_revision": alertas_revision,
            "resueltas": alertas_resueltas,
            "tasa_resolucion": round(alertas_resueltas / total_alertas * 100) if total_alertas else 0,
        },
        "avisos_uif": {
            "total": total_avisos,
            "pendientes": avisos_pendientes,
            "presentados": avisos_presentados,
        },
        "operaciones_vulnerables": ops_vulnerables,
        "due_diligence": {
            "total": total_dd,
            "pendientes": dd_pendientes,
        },
        "kyc": {
            "total_donantes": len(donantes),
            "kyc_completo": kyc_completo,
            "kyc_porcentaje": kyc_pct,
        },
        "umbral_operacion_vulnerable_mxn": UMBRAL_OPERACION_VULNERABLE,
    }


# ==================== BITACORA DUE DILIGENCE ====================

@router.get("/pld/due-diligence")
async def get_due_diligence(
    donante_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    query = {"organizacion_id": user.organizacion_id}
    if donante_id:
        query["donante_id"] = donante_id

    logs = await db.due_diligence.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

    donante_ids = list(set(l.get("donante_id") for l in logs if l.get("donante_id")))
    if donante_ids:
        donantes = await db.donantes.find({"donante_id": {"$in": donante_ids}}, {"_id": 0, "donante_id": 1, "nombre": 1}).to_list(1000)
        dn_map = {d["donante_id"]: d.get("nombre", "") for d in donantes}
        for l in logs:
            l["donante_nombre"] = dn_map.get(l.get("donante_id"), "")

    return logs


@router.post("/pld/due-diligence")
async def create_due_diligence(data: DueDiligenceCreate, user: User = Depends(require_role("admin", "editor"))):
    if not user.organizacion_id:
        raise HTTPException(status_code=400, detail="No tiene organizacion asignada")

    donante = await db.donantes.find_one(
        {"donante_id": data.donante_id, "organizacion_id": user.organizacion_id}, {"_id": 0}
    )
    if not donante:
        raise HTTPException(status_code=404, detail="Donante no encontrado")

    dd_id = f"dd_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "dd_id": dd_id,
        "organizacion_id": user.organizacion_id,
        "reviewer_id": user.user_id,
        "reviewer_name": user.name,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.due_diligence.insert_one(doc)
    await log_audit(user.organizacion_id, user.user_id, user.name, "crear", "due_diligence", dd_id, {"donante_id": data.donante_id})
    return {k: v for k, v in doc.items() if k != "_id"}


@router.put("/pld/due-diligence/{dd_id}")
async def update_due_diligence(dd_id: str, data: DueDiligenceCreate, user: User = Depends(require_role("admin", "editor"))):
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.due_diligence.update_one(
        {"dd_id": dd_id, "organizacion_id": user.organizacion_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    updated = await db.due_diligence.find_one({"dd_id": dd_id}, {"_id": 0})
    return updated
