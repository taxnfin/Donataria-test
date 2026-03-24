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

## What's Been Implemented

### March 24, 2026 - MVP v1.0
- ✅ Authentication: JWT + Google OAuth (Emergent)
- ✅ Users & Organizations models
- ✅ Donantes CRUD with RFC validation
- ✅ Donativos CRUD with multi-currency support
- ✅ CFDIs creation, timbrado (simulated), cancelación
- ✅ Obligaciones fiscales with auto-generated calendar
- ✅ Informes de transparencia with % gastos calculation
- ✅ Dashboard stats endpoint
- ✅ Landing page, Login/Register, Dashboard, all modules

### March 24, 2026 - v1.1 Features
- ✅ **PDF Generation** - Informes de Transparencia y CFDIs en PDF profesional
- ✅ **Email Notifications** - Sistema de alertas por email con Resend
  - Recordatorios de obligaciones próximas a vencer (15 días)
  - Templates HTML profesionales
  - Envío de prueba y notificaciones masivas
- ✅ **Botones de descarga PDF** en UI de Transparencia y CFDIs

### Design
- Typography: Chivo (headings), IBM Plex Sans (body)
- Primary: Emerald-600 (#059669)
- CFDI accent: Violet-600 (#7C3AED)
- Sidebar: Gray-900
- Background: #F7F6F3

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Real PAC integration for CFDI timbrado
- [ ] Scheduled notifications (cron job for daily reminders)

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

## Configuration for Email Notifications
To enable email notifications:
1. Create account at resend.com
2. Get API key from dashboard
3. Add to backend/.env:
   - RESEND_API_KEY=re_your_api_key
   - SENDER_EMAIL=notificaciones@tudominio.com
4. Restart backend

## Next Action Items
1. Configure Resend API key for production email sending
2. Set up cron job for scheduled daily notification checks
3. Implement PAC integration when ready for production
