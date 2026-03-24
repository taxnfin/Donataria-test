# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "Donatarias Autorizadas" (Authorized charities in Mexico) to manage tax compliance, including Donors, Donations, CFDIs (tax receipts), Fiscal Calendar, Transparency Reports, AML Alerts, Reports, Workflows, automated notifications, and compliance metrics.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI + Motor (MongoDB async driver)
- **Database**: MongoDB
- **PDFs**: ReportLab
- **Emails**: Resend (requires RESEND_API_KEY)
- **Auth**: JWT cookies + Emergent Google OAuth

## Core Features (All Implemented)

### Authentication
- Email/password registration and login
- Google OAuth via Emergent
- JWT cookie-based sessions

### Dashboard
- KPIs: total donors, donations, CFDIs, obligations
- Donation chart (Recharts)
- Upcoming fiscal obligations
- Compliance score mini-widget (links to /cumplimiento)

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
- PDF generation via ReportLab
- Status tracking (borrador/timbrado/cancelado)

### Fiscal Calendar (Calendario)
- Auto-generated fiscal obligations
- Traffic light indicators (verde/amarillo/rojo)
- Status management

### Transparency Reports
- Fiscal year reports with progress tracking
- PDF generation

### AML Alerts (Motor de Alertas)
- Configurable alert rules (threshold, keywords, risk level)
- Alert management (nueva/en_revision/resuelta/descartada)
- Stats dashboard, CSV export

### Reports (Reportes UIF/SAT)
- Report generation (STR/SAR, operations, PEP, monthly)
- Report templates with periodicity
- Status workflow (borrador/enviado/acuse_recibido)

### Workflows (Automatización)
- Event-based triggers (alerts, reports, donors, donations)
- Configurable conditions and actions (email, create alert)

### Compliance Metrics (Cumplimiento) - NEW
- Score de cumplimiento (0-100%) con indicador circular visual
- Gráfica de barras: % de obligaciones cumplidas por mes
- Semáforo: excelente (>80%), bueno (60-80%), regular (40-60%), critico (<40%)
- Desglose por tipo de obligación con barras de progreso
- Tendencia histórica del score (últimos 6 meses)
- Tabla de obligaciones próximas a vencer (30 días)
- PDF profesional para auditores del SAT
- Mini-widget en Dashboard principal

### Automated Notifications (Cron)
- Background scheduler runs daily at 8:00 AM Mexico City time
- Sends reminders for obligations at 7, 3, and 1 days before deadline
- Manual trigger from Configuracion page
- Status endpoint: GET /api/cron/status

### Configuration
- Organization data management
- Email notification settings
- Cron scheduler status and manual trigger

## MOCKED Integrations
- **CFDI PAC Timbrado**: Returns simulated UUID (real PAC integration pending)
- **Email Notifications**: Requires RESEND_API_KEY to activate

## Key API Endpoints
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Donantes: GET/POST /api/donantes, PUT/DELETE /api/donantes/{id}
- Donativos: GET/POST /api/donativos
- CFDIs: GET/POST /api/cfdis, GET /api/cfdis/{id}/pdf
- Obligaciones: GET/POST /api/obligaciones
- Transparencia: GET/POST /api/transparencia, GET /api/transparencia/{id}/pdf
- Alertas: GET /api/alertas, POST /api/alertas/reglas, GET /api/alertas/stats
- Reportes: GET/POST /api/reportes, GET/POST /api/reportes/plantillas
- Workflows: GET/POST /api/workflows
- Cumplimiento: GET /api/cumplimiento, GET /api/cumplimiento/pdf
- Export: GET /api/exportar/donantes, /api/exportar/donativos, /api/exportar/alertas
- Cron: POST /api/cron/notificaciones-diarias, GET /api/cron/status
- Dashboard: GET /api/dashboard/stats

## Database Collections
users, organizaciones, donantes, donativos, cfdis, obligaciones, informes_transparencia, alert_rules, alertas, reportes, report_templates, workflows

## Test Credentials
- Email: test@donataria.org
- Password: Test1234!

## Completed Tasks
- [x] MVP Setup (FastAPI + React + MongoDB)
- [x] Auth (JWT + Google OAuth)
- [x] CRUD: Donors, Donations, CFDIs, Fiscal Obligations
- [x] PDF Generation (Tax Receipts, Transparency Reports)
- [x] Email notifications (Resend integration)
- [x] AML Alerts backend + frontend
- [x] Reports/Workflows backend + frontend
- [x] CSV/Excel export (Donantes, Donativos, Alertas)
- [x] Daily cron scheduler for fiscal reminders
- [x] Cron status UI in Configuracion page
- [x] Fix frontend crash (DonantesPage.jsx syntax error)
- [x] Compliance Metrics Panel (score, charts, PDF, dashboard widget)

## Pending / Future Tasks
- [ ] Real PAC integration for CFDI timbrado
- [ ] Webhook endpoints for PAC status updates
- [ ] Refactor server.py into separate route modules (2800+ lines)
- [ ] User roles and permissions
- [ ] Advanced dashboard analytics
