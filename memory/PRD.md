# DonatariaSAT - Product Requirements Document

## Original Problem Statement
Crear un SaaS MVP para donatarias autorizadas en México que ayude en el cumplimiento de obligaciones fiscales bajo el Título III de la LISR.

## User Personas
1. **Administrador de Donataria** - Gestiona la organización, donantes y operaciones diarias
2. **Contador de AC/IAP** - Responsable del cumplimiento fiscal, emisión de CFDIs, informes de transparencia
3. **Director Ejecutivo** - Supervisa KPIs, alertas críticas y cumplimiento general

## Core Requirements
- Dashboard con KPIs y alertas críticas de gastos administrativos (límite 5%)
- Gestión de donantes (personas físicas/morales, nacionales/extranjeros)
- Registro de donativos (efectivo, especie, múltiples monedas)
- Emisión de CFDIs de donativos (simulado para MVP)
- Calendario fiscal con semáforos de urgencia
- Informe de transparencia (Ficha 19/ISR)
- Autenticación JWT + Google OAuth

## What's Been Implemented (March 24, 2026)

### Backend (FastAPI + MongoDB)
- ✅ Authentication: JWT + Google OAuth (Emergent)
- ✅ Users & Organizations models
- ✅ Donantes CRUD with RFC validation
- ✅ Donativos CRUD with multi-currency support
- ✅ CFDIs creation, timbrado (simulated), cancelación
- ✅ Obligaciones fiscales with auto-generated calendar
- ✅ Informes de transparencia with % gastos calculation
- ✅ Dashboard stats endpoint

### Frontend (React + Tailwind + Shadcn/UI)
- ✅ Landing page corporativa
- ✅ Login/Register pages
- ✅ Dashboard with KPIs, chart (Recharts), alerts
- ✅ Donantes module (table, CRUD dialogs)
- ✅ Donativos module (create with calendar picker)
- ✅ CFDIs module (violet accent, timbrar/cancelar)
- ✅ Calendario fiscal (semáforo system)
- ✅ Transparencia (progress bar, edit dialog)
- ✅ Configuración de organización

### Design
- Typography: Chivo (headings), IBM Plex Sans (body)
- Primary: Emerald-600 (#059669)
- CFDI accent: Violet-600 (#7C3AED)
- Sidebar: Gray-900
- Background: #F7F6F3

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Real PAC integration for CFDI timbrado
- [ ] PDF generation for CFDI and transparency reports
- [ ] Email notifications for fiscal deadlines

### P1 (High Priority)
- [ ] Multi-user support per organization
- [ ] Role-based permissions
- [ ] Audit logs
- [ ] Data export (CSV/Excel)

### P2 (Nice to Have)
- [ ] Dashboard customization
- [ ] Recurring donations
- [ ] Donor portal
- [ ] SAT portal integration
- [ ] Contabilidad electrónica (XML)

## Next Action Items
1. Configure PDF generation library for elaborate reports
2. Set up email service for deadline reminders
3. Implement PAC integration when ready for production
