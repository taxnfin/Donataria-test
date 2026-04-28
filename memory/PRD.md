# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS for "DonatariaSAT" - authorized charities in Mexico tax compliance.

## Tech Stack
React + Tailwind + Shadcn/UI + Recharts | FastAPI + MongoDB (Motor) | ReportLab | Resend

## Architecture
```
/app/frontend/src/
├── components/
│   ├── ui/            (Shadcn)
│   ├── config/        (LogoUpload, Notifications, Cron, Members) ← NEW
│   ├── alertas/       (AlertRuleDialog, AlertasTable, ReglaCard) ← NEW
│   ├── reportes/      (ReporteComponents, ReporteDialogs) ← NEW
│   ├── dashboard/     (SemaforoWidget, AnalyticsSection) ← NEW
│   ├── pld/           (PLDTabs: 6 tab components) ← NEW
│   └── shared/        (CommonComponents, DataTable) ← NEW
├── pages/             (16 page components, 5 refactored)

/app/backend/routes/   (16 route modules)
```

## Component Refactoring Status
| Page | Before | After | Components Extracted |
|------|--------|-------|---------------------|
| ConfiguracionPage | 958 | 296 | 4 (Logo, Notifications, Cron, Members) |
| AlertasPage | 612 | 138 | 3 (RuleDialog, Table, ReglaCard) |
| ReportesPage | 663 | 138 | 2 (Table, PlantillasGrid) |
| DashboardPage | 507 | 397 | 2 (Semaforo, Analytics) |
| PLDPage | 493 | 145 | 6 (AML, OpsVuln, Avisos, Matriz, KYC, DD) |
| **Total extracted** | | | **17 sub-components** |

### Remaining (400-550 lines, functional but not split):
TransparenciaPage, WorkflowsPage, CalendarioPage, CFDIsPage, CatalogoPage, DonantesPage, DonativosPage, CumplimientoPage

## Implemented Features (22)
1-22: Auth, Multi-org, RBAC, Donors, Donations, CFDIs, Obligations, Transparency, Dashboard, Alerts, Workflows, Exports, Compliance, Audit, Logo, SAT Catalog, Notifications, Declaracion Anual, PLD/AML, Semaforo, Reportes Operativos, Analytics+PDFs+Exports

## MOCKED: CFDI timbrado (PAC) | Email (sin RESEND_API_KEY)
## Pending: P2 Real PAC Integration | P2 PAC Webhooks
