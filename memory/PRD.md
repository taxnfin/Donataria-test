# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "Donatarias Autorizadas" (Authorized charities in Mexico) to manage tax compliance. Multi-tenant platform supporting multiple organizations per user, with Donors, Donations, CFDIs, Fiscal Calendar, Transparency Reports, AML Alerts, Reports/Workflows, Compliance Metrics, Audit Log, and automated notifications.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI + Motor (MongoDB async driver)
- **Database**: MongoDB
- **PDFs**: ReportLab
- **Emails**: Resend (requires RESEND_API_KEY)
- **Auth**: JWT cookies + Emergent Google OAuth

## Core Features (All Implemented)

### Multi-Donataria (Multi-Tenant)
- Users can belong to multiple organizations
- Organization selector in sidebar with switch capability
- Create new organizations from Configuracion page
- Complete data isolation between organizations
- Dashboard data refreshes on org switch

### Authentication
- Email/password registration and login
- Google OAuth via Emergent
- JWT cookie-based sessions

### Dashboard
- KPIs: total donors, donations, CFDIs, obligations
- Donation chart (Recharts)
- Upcoming fiscal obligations
- Compliance score mini-widget

### Donors (Donantes)
- CRUD for physical/moral persons
- RFC validation, foreign donor support
- CSV export

### Donations (Donativos)
- CRUD with donor linking
- Currency support (MXN/USD/EUR), in-kind donations
- CSV export

### CFDIs (Tax Receipts)
- Generation with MOCKED PAC timbrado (simulated UUID)
- PDF generation via ReportLab (with org logo)
- Status tracking (borrador/timbrado/cancelado)

### Fiscal Calendar (Calendario)
- Auto-generated fiscal obligations
- Traffic light indicators
- Status management

### Transparency Reports
- Fiscal year reports with progress tracking
- PDF generation

### AML Alerts (Motor de Alertas)
- Configurable alert rules
- Alert management
- Stats dashboard, CSV export

### Reports (Reportes UIF/SAT)
- Report generation from templates
- PDF generation and download
- Status workflow (borrador/enviado/acuse_recibido)
- Template management with "Generar Reporte" action

### Workflows (Automatización)
- Event-based triggers
- Configurable conditions and actions

### Compliance Metrics (Cumplimiento)
- Score (0-100%) with visual indicator
- Monthly chart, type breakdown, trend
- PDF export for auditors
- Dashboard mini-widget

### Audit Log (Bitácora)
- Automatic tracking: create/update/delete donantes, donativos, CFDIs, reportes, timbrado, org creation
- Page with filterable table (entity, action)
- Pagination
- CSV export

### Organization Logo
- Upload PNG/JPG/WebP (max 2MB)
- Appears in all generated PDFs
- Managed from Configuracion page

### Automated Notifications (Cron)
- Daily scheduler at 8:00 AM Mexico City time
- Reminders at 7, 3, 1 days before deadline
- Manual trigger from Configuracion

### Configuration
- Organization data management
- Logo upload/delete
- Email notification settings
- Cron scheduler status
- Multi-donataria management

## MOCKED Integrations
- **CFDI PAC Timbrado**: Returns simulated UUID
- **Email Notifications**: Requires RESEND_API_KEY

## Key API Endpoints
- Auth: POST /api/auth/register, /login, GET /api/auth/me
- Organizations: GET/POST /api/organizaciones, PUT /api/organizaciones/switch/{id}
- Organization: GET/PUT /api/organizacion, POST /api/organizacion/logo
- Donantes: GET/POST /api/donantes, PUT/DELETE /api/donantes/{id}
- Donativos: GET/POST /api/donativos
- CFDIs: GET/POST /api/cfdis, GET /api/cfdis/{id}/pdf
- Obligaciones: GET/POST /api/obligaciones
- Transparencia: GET/POST /api/transparencia, GET /api/transparencia/{id}/pdf
- Alertas: GET /api/alertas, POST /api/alertas/reglas
- Reportes: GET/POST /api/reportes, GET /api/reportes/{id}/pdf
- Plantillas: GET/POST /api/reportes/plantillas
- Workflows: GET/POST /api/workflows
- Cumplimiento: GET /api/cumplimiento, GET /api/cumplimiento/pdf
- Auditoria: GET /api/auditoria, GET /api/auditoria/export
- Export: GET /api/exportar/donantes, /donativos, /alertas
- Cron: POST /api/cron/notificaciones-diarias, GET /api/cron/status
- Dashboard: GET /api/dashboard/stats

## Test Credentials
- Email: test@donataria.org
- Password: Test1234!

## Completed Tasks (All Tested - 6 iterations, 100%)
- [x] MVP Setup (FastAPI + React + MongoDB)
- [x] Auth (JWT + Google OAuth)
- [x] CRUD: Donors, Donations, CFDIs, Fiscal Obligations
- [x] PDF Generation (Tax Receipts, Transparency, Reports, Compliance)
- [x] Email notifications (Resend integration)
- [x] AML Alerts backend + frontend
- [x] Reports/Workflows backend + frontend
- [x] Report PDF download
- [x] Report templates with "Generar Reporte" action
- [x] CSV/Excel export (Donantes, Donativos, Alertas)
- [x] Daily cron scheduler for fiscal reminders
- [x] Compliance Metrics Panel
- [x] Organization logo upload (shown in all PDFs)
- [x] Multi-donataria (multi-tenant)
- [x] Audit log module (Bitácora)

## Pending / Future Tasks
- [ ] Real PAC integration for CFDI timbrado
- [ ] Webhook endpoints for PAC status updates
- [ ] Refactor server.py into separate route modules (3400+ lines)
- [ ] User roles and permissions per organization
- [ ] Advanced analytics dashboard
