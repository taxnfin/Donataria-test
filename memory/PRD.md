# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "Donatarias Autorizadas" (Authorized charities in Mexico) to manage tax compliance. Multi-tenant platform supporting multiple organizations per user, with Donors, Donations, CFDIs, Fiscal Calendar, Transparency Reports, AML Alerts, Reports/Workflows, Compliance Metrics, Audit Log, Catalog of Authorized Charities, and automated notifications.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI + Motor (MongoDB async driver)
- **Database**: MongoDB
- **PDFs**: ReportLab
- **Emails**: Resend (requires RESEND_API_KEY)
- **Auth**: JWT cookies + Emergent Google OAuth

## Core Features (All Implemented & Tested)

### Catálogo de Donatarias SAT (NEW)
- 134 donatarias autorizadas en México como seed data
- 9 giros: asistencial, becas, cultural, derechos humanos, desarrollo social, ecológica, educativa, investigación, salud
- 3 estatus: autorizada, revocada, en_proceso
- 18 estados de México representados
- Búsqueda por nombre, RFC, descripción
- Filtros por giro, estatus SAT, estado
- Detalle con datos completos y donantes vinculados
- Vincular/desvincular donantes de la org con donatarias del catálogo
- Importar/actualizar desde CSV
- Auto-seed en primera consulta

### Multi-Donataria (Multi-Tenant)
- Users can belong to multiple organizations
- Organization selector in sidebar
- Create new organizations, data isolation

### Authentication
- Email/password + Google OAuth + JWT cookies

### Dashboard
- KPIs, charts, upcoming obligations, compliance widget

### Donors, Donations, CFDIs
- Full CRUD with CSV export, PDF generation with org logo
- CFDI timbrado MOCKED (simulated UUID)

### Fiscal Calendar, Transparency Reports
- Obligations management, PDF generation

### AML Alerts, Reports, Workflows
- Configurable rules, PDF download, templates

### Compliance Metrics
- Score 0-100%, monthly chart, type breakdown, trend, PDF for auditors

### Audit Log
- Auto-tracking all CRUD actions, filterable page, CSV export

### Organization Logo & Config
- Logo upload (shown in all PDFs), cron scheduler, email settings

## Key API Endpoints
- Auth: /api/auth/register, /login, /me
- Orgs: /api/organizaciones, /api/organizaciones/switch/{id}
- Org: /api/organizacion, /api/organizacion/logo
- Donantes: /api/donantes (CRUD), /api/donantes/{id}/catalogo
- Donativos: /api/donativos (CRUD)
- CFDIs: /api/cfdis (CRUD), /api/cfdis/{id}/pdf
- Obligaciones: /api/obligaciones
- Transparencia: /api/transparencia, /api/transparencia/{id}/pdf
- Alertas: /api/alertas, /api/alertas/reglas
- Reportes: /api/reportes, /api/reportes/{id}/pdf, /api/reportes/plantillas
- Workflows: /api/workflows
- Cumplimiento: /api/cumplimiento, /api/cumplimiento/pdf
- Auditoria: /api/auditoria, /api/auditoria/export
- Catálogo: /api/catalogo/donatarias, /api/catalogo/donatarias/{id}, /api/catalogo/donatarias/{id}/vincular, /api/catalogo/donatarias/import
- Export: /api/exportar/donantes, /donativos, /alertas
- Cron: /api/cron/notificaciones-diarias, /api/cron/status
- Dashboard: /api/dashboard/stats

## Test Credentials
- Email: test@donataria.org / Password: Test1234!

## Testing History
- 7 iterations, 100% pass rate on all (backend + frontend)

## MOCKED Integrations
- CFDI PAC Timbrado (simulated UUID)
- Email Notifications (requires RESEND_API_KEY)

## Pending / Future Tasks
- [ ] Real PAC integration for CFDI timbrado
- [ ] Webhook endpoints for PAC status updates
- [ ] Refactor server.py into route modules (3500+ lines)
- [ ] User roles and permissions per organization
- [ ] Advanced analytics dashboard
