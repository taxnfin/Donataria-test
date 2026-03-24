# DonatariaSAT - Product Requirements Document

## Problem Statement
SaaS platform for "Donatarias Autorizadas" (Authorized charities in Mexico) to manage tax compliance, including Donors, Donations, CFDIs (tax receipts), Fiscal Calendar, Transparency Reports, AML Alerts, Reports, Workflows, and automated notifications.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
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
- Stats dashboard
- CSV export

### Reports (Reportes UIF/SAT)
- Report generation (STR/SAR, operations, PEP, monthly)
- Report templates with periodicity
- Status workflow (borrador/enviado/acuse_recibido)

### Workflows (Automatización)
- Event-based triggers (alerts, reports, donors, donations)
- Configurable conditions and actions
- Email actions support

### Automated Notifications (Cron)
- Background scheduler runs daily at 8:00 AM Mexico City time
- Sends reminders for obligations at 7, 3, and 1 days before deadline
- Manual trigger available from Configuracion page
- Status endpoint: GET /api/cron/status

### Configuration
- Organization data management
- Email notification settings
- Cron scheduler status and manual trigger

## MOCKED Integrations
- **CFDI PAC Timbrado**: Returns simulated UUID (real PAC integration pending)
- **Email Notifications**: Requires RESEND_API_KEY to activate (currently not configured)

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

## Pending / Future Tasks
- [ ] Real PAC integration for CFDI timbrado
- [ ] Webhook endpoints for PAC status updates
- [ ] Refactor server.py into separate route modules (2600+ lines)
