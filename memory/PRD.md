# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS for "DonatariaSAT" - authorized charities in Mexico tax compliance.

## Tech Stack
React + Tailwind + Shadcn/UI + Recharts | FastAPI + MongoDB (Motor) | ReportLab | Resend

## Architecture (Post-Refactoring)
```
/app/frontend/src/
├── components/
│   ├── ui/              (Shadcn base components)
│   ├── config/          (LogoUpload, Notifications, Cron, Members)
│   ├── alertas/         (AlertRuleDialog, AlertComponents)
│   ├── reportes/        (ReporteComponents, ReporteDialogs)
│   ├── dashboard/       (SemaforoWidget, AnalyticsSection)
│   ├── pld/             (PLDTabs - 6 tab components)
│   ├── workflows/       (WorkflowComponents)
│   ├── donantes/        (DonantesTable)
│   ├── donativos/       (DonativosTable)
│   ├── cfdis/           (CFDIsTable)
│   ├── calendario/      (ObligacionCard)
│   ├── transparencia/   (InformeCard)
│   ├── catalogo/        (CatalogoTable)
│   ├── cumplimiento/    (ComplianceComponents)
│   └── shared/          (CommonComponents, DataTable)
├── pages/               (16 pages, all <400 lines)

/app/backend/routes/     (16 route modules)
```

## Refactoring Results
| Metric | Before | After |
|--------|--------|-------|
| Total page lines | 8,420 | 3,999 (-52%) |
| Largest page | 958 (Config) | 414 (Cumplimiento) |
| Avg page size | 648 | 250 |
| Extracted components | 0 | 21 |
| Pages >500 lines | 8 | 0 |
| Pages <150 lines | 0 | 11 |

## Implemented Features (22 total)
Auth, Multi-org, RBAC, Donors, Donations, CFDIs, Obligations, Transparency, Dashboard, Alerts, Workflows, Exports, Compliance, Audit, Logo, SAT Catalog, Notifications, Declaracion Anual, PLD/AML, Semaforo, Reportes Operativos, Analytics+PDFs+Exports

## MOCKED: CFDI timbrado (PAC) | Email (sin RESEND_API_KEY)
## Pending: P2 Real PAC | P2 PAC Webhooks
