# DonatariaSAT - Product Requirements Document

## Problem Statement
Build a SaaS platform MVP for "DonatariaSAT" - a management system for authorized charities (donatarias autorizadas) in Mexico for tax compliance. The system handles Donors, Donations, CFDIs (tax receipts), Fiscal Calendar (Obligations), Transparency Reports, Dashboard, AML Alerts, Workflows, CSV/Excel export, Compliance Score, Audit Logs, Organization Logo, Multi-donataria capability, SAT catalog, Roles & Permissions.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python) with modular routers
- **Database**: MongoDB (Motor async driver)
- **Emails**: Resend (optional)
- **PDFs**: ReportLab

## Architecture
```
/app/backend/
├── server.py          (App init, router registration, scheduler)
├── database.py        (MongoDB connection)
├── models.py          (Pydantic schemas)
├── utils.py           (Auth helpers, PDF helpers, email helpers, RBAC)
├── services.py        (Shared business logic: alert rules, workflows)
├── catalogo_donatarias.py (Seed data)
└── routes/
    ├── auth.py        (Auth + Org + Role management)
    ├── donantes.py    (Donors CRUD)
    ├── donativos.py   (Donations CRUD)
    ├── cfdis.py       (CFDIs + PDF)
    ├── fiscal.py      (Obligations + Transparency + Dashboard)
    ├── alertas.py     (AML Alerts + Rules)
    ├── workflows.py   (Workflow CRUD)
    ├── reportes.py    (Reports + PDF)
    ├── cumplimiento.py (Compliance metrics + PDF)
    ├── exports.py     (CSV exports)
    ├── config.py      (Notifications + Cron)
    ├── catalogo.py    (SAT Catalog)
    └── auditoria.py   (Audit logs)
```

## Implemented Features (Completed)
1. JWT Authentication + Google OAuth (Emergent)
2. Multi-donataria (one user, multiple organizations)
3. Donors CRUD with RFC validation
4. Donations CRUD with donante stats update
5. CFDIs CRUD with folio generation, timbrado (MOCKED), cancel, PDF
6. Fiscal Obligations calendar with urgency indicators
7. Transparency Reports (Informe Ficha 19/ISR) with PDF
8. Dashboard with stats, charts, obligations
9. AML Alert Rules + Alerts engine
10. Workflows automation engine
11. CSV/Excel exports (donantes, donativos, alertas)
12. Compliance Score Dashboard with PDF report
13. Audit Log system
14. Organization Logo Upload (base64)
15. SAT Catalog of Authorized Donatarias (134 entries)
16. Email Notifications + Daily Cron scheduler
17. Backend modular refactoring (server.py -> routes/)
18. **Roles & Permissions (RBAC)** - admin/editor/viewer per org
    - Role management UI in Configuracion
    - Member invite/update/remove
    - Role badge in sidebar
    - Endpoint-level access control

## MOCKED Integrations
- CFDI timbrado (PAC) - generates simulated UUID instead of real fiscal stamp
- Email notifications - RESEND_API_KEY not configured in environment

## Pending Tasks (Prioritized)
### P2 - Real PAC Integration
- Replace CFDI simulation with real PAC provider (Finkok, SW SmarterWeb)
- Requires integration_playbook_expert_v2
- Requires PAC credentials from user

### P2 - Webhook for PAC status updates
- Receive async status updates from PAC

## DB Schema
- `users`: `{user_id, email, name, password_hash, organizacion_id, organizaciones_ids[], roles[{organizacion_id, role}]}`
- `organizaciones`: `{organizacion_id, nombre, rfc, rubro, logo_url, ...}`
- `donantes`: `{donante_id, organizacion_id, nombre, rfc, tipo_persona, ...}`
- `donativos`: `{donativo_id, organizacion_id, donante_id, monto, moneda, ...}`
- `cfdis`: `{cfdi_id, organizacion_id, folio, uuid_fiscal, estado, ...}`
- `obligaciones`: `{obligacion_id, organizacion_id, nombre, fecha_limite, estado, ...}`
- `informes_transparencia`: `{informe_id, organizacion_id, ejercicio_fiscal, ...}`
- `alert_rules`: `{rule_id, organizacion_id, tipo_regla, condiciones, ...}`
- `alerts`: `{alert_id, organizacion_id, tipo, severidad, titulo, ...}`
- `workflows`: `{workflow_id, organizacion_id, trigger, condiciones, acciones, ...}`
- `reports`: `{report_id, organizacion_id, titulo, tipo, datos, ...}`
- `audit_log`: `{audit_id, organizacion_id, user_id, accion, entidad, ...}`
- `catalogo_donatarias`: `{catalogo_id, nombre, rfc, giro, estatus_sat, ...}`
