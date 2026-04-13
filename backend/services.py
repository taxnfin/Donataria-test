"""
Shared business logic services used across multiple route modules.
Avoids circular imports between route files.
"""
import uuid
import logging
from datetime import datetime, timezone
from database import db
from utils import send_email_notification, RESEND_AVAILABLE, RESEND_API_KEY

logger = logging.getLogger(__name__)


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
        titulo = ""
        descripcion = ""
        tags = []
        condiciones = rule.get("condiciones", {})

        if rule["tipo_regla"] == "umbral_monto":
            monto_minimo = condiciones.get("monto_minimo", 100000)
            if monto >= monto_minimo:
                should_alert = True
                titulo = f"Transaccion supera umbral de ${monto_minimo:,.0f} MXN"
                descripcion = f"Donacion en efectivo que supera el umbral de reporte obligatorio de ${monto_minimo:,.0f} MXN establecido por la UIF."
                tags = ["umbral excedido"]

        elif rule["tipo_regla"] == "nivel_riesgo_donante":
            nivel_riesgo = donante.get("nivel_riesgo", "bajo")
            niveles_alerta = condiciones.get("niveles", ["alto", "critico"])
            if nivel_riesgo in niveles_alerta:
                should_alert = True
                titulo = f"Transaccion con donante de {nivel_riesgo} riesgo"
                descripcion = f"Donacion de donante clasificado como {nivel_riesgo} riesgo."
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
                    descripcion = f"Se detecto la palabra clave '{kw}' en la descripcion del donativo."
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

            await db.alert_rules.update_one(
                {"rule_id": rule["rule_id"]},
                {"$inc": {"veces_activada": 1}}
            )

            await trigger_workflows(organizacion_id, "alerta_creada", alert_doc)

    return alerts_created


async def trigger_workflows(org_id: str, trigger_type: str, data: dict):
    """Trigger matching workflows for an event"""
    workflows = await db.workflows.find(
        {"organizacion_id": org_id, "trigger": trigger_type, "activo": True},
        {"_id": 0}
    ).to_list(100)

    for wf in workflows:
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
        <h2 style="color: #7C3AED;">Notificacion de Workflow</h2>
        <p><strong>Workflow:</strong> {workflow.get('nombre', 'N/A')}</p>
        <p><strong>Trigger:</strong> {workflow.get('trigger', 'N/A')}</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p>{action.get('mensaje', 'Se ha ejecutado un workflow automatico.')}</p>
        <p style="color: #6B7280; font-size: 12px;">DonatariaSAT - Sistema de cumplimiento fiscal</p>
    </body>
    </html>
    """
