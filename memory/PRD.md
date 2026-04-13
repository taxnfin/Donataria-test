# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS for "DonatariaSAT" - management system for authorized charities in Mexico for tax compliance.

## Tech Stack
React + Tailwind + Shadcn/UI + Recharts | FastAPI + MongoDB (Motor) | ReportLab (PDFs) | Resend (Emails)

## Architecture
```
/app/backend/routes/
├── auth.py, donantes.py, donativos.py, cfdis.py, fiscal.py
├── alertas.py, workflows.py, reportes.py, cumplimiento.py
├── exports.py, config.py, catalogo.py, auditoria.py
├── declaracion.py (Declaracion Anual Titulo III LISR)
├── pld.py (PLD/AML + avisos UIF export)
└── dashboard_adv.py (Semaforo + Reportes Operativos + Ficha PDF + Analytics)
```

## Implemented Features (22 total)
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
21. Semaforo + Reportes Operativos (top donantes, 80/20, especie, extranjero, conciliacion, ficha publica)
22. **PDF Ficha Publica + Exportacion masiva avisos UIF (CSV+TXT) + Analytics avanzados (12 meses tendencias, YoY)**

## MOCKED
- CFDI timbrado (PAC) | Email notifications (sin RESEND_API_KEY)

## Pending
- P2: Real PAC Integration for CFDI stamping
- P2: Webhook for PAC status updates
