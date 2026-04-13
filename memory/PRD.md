# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "DonatariaSAT" - management system for authorized charities in Mexico for tax compliance.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (Python) with modular routers
- **Database**: MongoDB (Motor async driver)
- **Emails**: Resend (optional) | **PDFs**: ReportLab

## Architecture
```
/app/backend/routes/
├── auth.py          (Auth + Org + Roles)
├── donantes.py      (Donors CRUD)
├── donativos.py     (Donations CRUD)
├── cfdis.py         (CFDIs + PDF)
├── fiscal.py        (Obligations + Transparency + Dashboard)
├── alertas.py       (AML Alerts + Rules)
├── workflows.py     (Workflow CRUD)
├── reportes.py      (Reports + PDF)
├── cumplimiento.py  (Compliance metrics + PDF)
├── exports.py       (CSV exports)
├── config.py        (Notifications + Cron)
├── catalogo.py      (SAT Catalog)
├── auditoria.py     (Audit logs)
├── declaracion.py   (Declaracion Anual Titulo III LISR)
├── pld.py           (PLD/AML full module)
└── dashboard_adv.py (Semaforo + Reportes Operativos + Ficha Publica)
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
19. Declaracion Anual Titulo III LISR (auto-fill, 10% control, remanente ficto, PDF)
20. PLD/AML Module (ops vulnerables, avisos UIF, matriz riesgo, KYC, due diligence)
21. **Semaforo de Cumplimiento** - Dashboard widget combining 4 weighted indicators
22. **Reportes Operativos** - Donativos por tipo, top donantes, 80/20 concentracion, especie, extranjero, conciliacion CFDI, ficha publica transparencia

## MOCKED
- CFDI timbrado (PAC) - simulated UUID
- Email notifications - RESEND_API_KEY not configured

## Pending Tasks
### P2 - Real PAC Integration
### P2 - Webhook for PAC status updates
