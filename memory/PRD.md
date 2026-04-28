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
├── declaracion.py, pld.py, dashboard_adv.py

/app/frontend/src/
├── components/
│   ├── ui/          (Shadcn components)
│   ├── config/      (LogoUpload, Notifications, Cron, Members)
│   ├── alertas/     (AlertRuleDialog, AlertasTable, ReglaCard)
│   ├── reportes/    (ReporteDialogs)
│   └── shared/      (CommonComponents, DataTable)
├── pages/           (13 page components)
```

## Implemented Features (22 total)
1-22: [See previous PRD for full list]

## Code Quality Applied
- Test credentials centralized in conftest.py with env vars
- Array index as key → stable IDs (12 instances fixed)
- Empty catch blocks → console.error (2 instances)
- eslint-disable-line for mount-only useEffects (14+ pages)
- ConfiguracionPage split: 958 → 296 lines (4 sub-components)
- AlertasPage split: 612 → 138 lines (3 sub-components)
- Shared components created: CommonComponents, DataTable

## Remaining Refactoring (Fase 2 partial)
The following pages still need dialog/form extraction (400-662 lines):
ReportesPage (662), TransparenciaPage (551), WorkflowsPage (535),
CalendarioPage (530), CFDIsPage (522), CatalogoPage (520),
DashboardPage (506), PLDPage (492), DonantesPage (490),
DonativosPage (476), CumplimientoPage (414)
ReporteDialogs.jsx already created, needs to be wired into ReportesPage.

## MOCKED
- CFDI timbrado (PAC) | Email notifications (sin RESEND_API_KEY)

## Pending
- P2: Real PAC Integration for CFDI stamping
- P2: Webhook for PAC status updates
- Remaining component splitting (11 pages)
