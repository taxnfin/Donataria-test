# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "DonatariaSAT" - management system for authorized charities (donatarias autorizadas) in Mexico for tax compliance. Handles Donors, Donations, CFDIs, Fiscal Calendar, Transparency Reports, Dashboard, AML Alerts, Workflows, CSV/Excel export, Compliance Score, Audit Logs, Organization Logo, Multi-donataria, SAT catalog, Roles & Permissions, Declaracion Anual Titulo III LISR, PLD/AML compliance.

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
├── utils.py           (Auth, PDF, email, RBAC helpers)
├── services.py        (Shared business logic)
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
    ├── auditoria.py   (Audit logs)
    ├── declaracion.py (Declaracion Anual Titulo III LISR)
    └── pld.py         (PLD/AML full module)
```

## Implemented Features
1. JWT Auth + Google OAuth
2. Multi-donataria (one user, multiple orgs)
3. Donors CRUD + RFC validation
4. Donations CRUD + donante stats
5. CFDIs CRUD + folio + timbrado (MOCKED) + cancel + PDF
6. Fiscal Obligations + urgency indicators
7. Transparency Reports (Ficha 19/ISR) + PDF
8. Dashboard + stats + charts
9. AML Alert Rules + engine
10. Workflows automation
11. CSV/Excel exports
12. Compliance Score + PDF
13. Audit Log
14. Organization Logo Upload
15. SAT Catalog (134 entries)
16. Email Notifications + Daily Cron
17. Backend modular refactoring
18. Roles & Permissions (RBAC) - admin/editor/viewer
19. **Declaracion Anual Titulo III LISR** (NEW)
    - CRUD + auto-fill from existing data
    - Control 10% actividades no relacionadas (auto-calculated, validated on present)
    - Remanente distribuible ficto (4 components)
    - PDF export with all sections
20. **PLD/AML Compliance Module** (NEW)
    - Operaciones vulnerables (Art. 17 Ley Antilavado, >= 1,605 UMAs / $181,589.70)
    - Avisos UIF/SAT with folios and acuses
    - Matriz de riesgo automatica (PEP +40, jurisdiccion +30, monto +20, efectivo +15, extranjero +10, KYC incompleto +15)
    - KYC de donantes (identificacion, beneficiario controlador, constancia fiscal)
    - Dashboard AML (alertas generadas vs resueltas, tasa resolucion)
    - Bitacora Due Diligence (revisiones con hallazgos y resultados)

## MOCKED
- CFDI timbrado (PAC) - simulated UUID
- Email notifications - RESEND_API_KEY not configured

## Pending Tasks
### P2 - Real PAC Integration
- Replace CFDI simulation with real PAC provider
- Requires integration_playbook_expert_v2 + PAC credentials

### P2 - Webhook for PAC status updates

## DB Collections
users, organizaciones, donantes, donativos, cfdis, obligaciones, informes_transparencia, alert_rules, alerts, workflows, reports, report_templates, audit_log, catalogo_donatarias, donante_catalogo_links, user_sessions, declaraciones_anuales, avisos_uif, due_diligence
