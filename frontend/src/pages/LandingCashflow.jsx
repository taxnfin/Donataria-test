import { useNavigate } from 'react-router-dom';

const LandingCashflow = () => {
  const navigate = useNavigate();

  const funcionalidades = [
    { icon: 'M3 17 L8 12 L13 15 L21 7', name: 'Flujo de Efectivo 13 Semanas', desc: 'Proyecciones rolling automáticas. Anticipa problemas de liquidez antes de que ocurran con visibilidad a 90 días.', grad: 'linear-gradient(135deg,#0EA5E9,#00c4ff)' },
    { icon: 'M12 2 L12 22 M2 12 L22 12', name: 'Multimoneda y Multi-empresa', desc: 'Consolida MXN y USD en un solo dashboard. Gestiona varias empresas desde una sola cuenta.', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
    { icon: 'M12 3 L20 19 L12 16 L4 19 Z', name: 'Alertas de Liquidez', desc: 'Notificaciones automáticas cuando el saldo proyectado baja del umbral crítico. Nunca te tome por sorpresa.', grad: 'linear-gradient(135deg,#F59E0B,#F97316)' },
    { icon: 'M5 3 L19 3 L19 21 L5 21 Z M9 8 L15 8 M9 12 L15 12 M9 16 L13 16', name: 'CFDI / SAT Integrado', desc: 'Importa tus facturas del SAT automáticamente. Tus ingresos y egresos siempre actualizados sin captura manual.', grad: 'linear-gradient(135deg,#10B981,#059669)' },
    { icon: 'M9 4 L9 11 M15 4 L15 11 M5 11 L19 11 L19 16 C19 19 17 21 14 21 L10 21 C7 21 5 19 5 16 Z', name: 'Conciliación Bancaria', desc: 'Concilia movimientos bancarios con tus CFDIs en segundos. Detecta diferencias y errores automáticamente.', grad: 'linear-gradient(135deg,#EC4899,#F43F5E)' },
    { icon: 'M12 2 L20 6 V13 C20 18 16 21 12 22 C8 21 4 18 4 13 V6 Z', name: 'Dashboard Ejecutivo', desc: 'KPIs financieros en tiempo real. Reportes para el board, inversionistas o consejo en un clic.', grad: 'linear-gradient(135deg,#0F2D5E,#1E3A8A)' },
  ];

  const planes = [
    {
      name: 'Starter',
      price: '$299',
      period: '/ mes MXN',
      accent: '#0EA5E9',
      features: ['1 empresa', 'Cashflow 13 semanas', 'Dashboard financiero', 'Importar CFDI SAT', 'Soporte por correo'],
      cta: 'Empezar',
      highlight: false,
    },
    {
      name: 'Growth',
      price: '$499',
      period: '/ mes MXN',
      accent: '#00c4ff',
      features: ['Hasta 3 empresas', 'Cashflow con IA y forecast', 'Conciliación bancaria', 'Alertas automáticas', 'Tipos de cambio', 'Soporte prioritario'],
      cta: 'Elegir Growth',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'A medida',
      period: '',
      accent: '#00e5b0',
      features: ['Empresas ilimitadas', 'API privada y SSO', 'Onboarding dedicado', 'SLA 99.9%', 'CSM dedicado', 'Capacitación in-company'],
      cta: 'Hablar con ventas',
      highlight: false,
    },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0F172A', background: '#080f1e' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(8,15,30,0.95)', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="#0f2040"/>
              <rect x="6" y="20" width="3.5" height="6" rx="1" fill="white" opacity="0.8"/>
              <rect x="11.5" y="15" width="3.5" height="11" rx="1" fill="white" opacity="0.8"/>
              <rect x="17" y="10" width="3.5" height="16" rx="1" fill="white" opacity="0.8"/>
              <rect x="22.5" y="13" width="3.5" height="13" rx="1" fill="white" opacity="0.8"/>
              <polyline points="7.75,18 13.25,13 18.75,8 24.25,11" stroke="#00e5b0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="24.25" cy="11" r="1.8" fill="#00e5b0"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '-.02em' }}>
              TaxnFin <span style={{ color: '#00c4ff', fontWeight: 400, fontSize: 13 }}>Cashflow</span>
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 99, fontWeight: 600 }}>by TaxnFin</span>
        </div>

        <div style={{ display: 'flex', gap: 28, fontSize: 13, alignItems: 'center' }}>
          <a href="https://taxnfin.com" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 20 }}>← taxnfin.com</a>
          {[
            { l: 'Funcionalidades', h: '#funcionalidades' },
            { l: 'Precios', h: '#precios' },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/login')} style={{ padding: '9px 18px', background: 'transparent', color: '#00c4ff', fontSize: 13, borderRadius: 8, border: '1px solid rgba(0,196,255,0.3)', cursor: 'pointer', fontWeight: 600 }}>Iniciar sesión</button>
          <button onClick={() => navigate('/login')} style={{ padding: '9px 18px', background: '#00c4ff', color: '#080f1e', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>Registrar →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg,#080f1e 0%,#0c1829 60%,#0f2040 100%)', padding: '90px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'radial-gradient(circle at 20% 30%, #00c4ff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #00e5b0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,196,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 99, background: 'rgba(0,196,255,0.1)', color: '#00c4ff', marginBottom: 24, border: '1px solid rgba(0,196,255,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c4ff', animation: 'pulse 2s infinite' }}></span>
            Suite CFO Digital · México
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.6rem)', fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: 22, letterSpacing: '-.03em' }}>
            Flujo de efectivo empresarial{' '}
            <span style={{ background: 'linear-gradient(90deg,#00c4ff,#00e5b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>con inteligencia</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            Proyecciones a 13 semanas rolling, alertas automáticas de liquidez y conciliación bancaria en tiempo real. Para CFOs que necesitan control real.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', background: '#00c4ff', color: '#080f1e', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 30px -10px rgba(0,196,255,0.5)' }}>Comenzar gratis →</button>
            <button onClick={() => document.querySelector('#funcionalidades')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 28px', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.8)', fontSize: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', fontWeight: 600 }}>Ver funcionalidades</button>
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['✓ SAT compliance', '✓ Multimoneda MXN/USD', '✓ Sin instalaciones'].map(t => (
              <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 48px', display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
        {[{ n: '13S', l: 'Rolling cashflow' }, { n: '100%', l: 'SAT compliance' }, { n: 'MXN+USD', l: 'Multimoneda' }, { n: '$0', l: 'Para empezar' }].map(s => (
          <div key={s.n} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg,#00c4ff,#00e5b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ padding: '88px 48px', background: '#080f1e' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#00c4ff', marginBottom: 14, textTransform: 'uppercase' }}>Funcionalidades</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>Todo lo que necesita tu CFO</h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 56, maxWidth: 560, margin: '0 auto 56px' }}>
            Herramientas diseñadas para el control financiero real de empresas mexicanas
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, textAlign: 'left' }}>
            {funcionalidades.map(f => (
              <div key={f.name} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 28, border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color .25s, transform .25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,196,255,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 20px -8px rgba(0,0,0,.4)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{f.name}</div>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '88px 48px', background: '#0c1829' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#00c4ff', marginBottom: 14, textTransform: 'uppercase' }}>Precios</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>Planes que crecen contigo</h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 56, maxWidth: 500, margin: '0 auto 56px' }}>Sin contratos forzosos. Cancela cuando quieras.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 20, textAlign: 'left' }}>
            {planes.map(p => (
              <div key={p.name} style={{
                background: p.highlight ? 'rgba(0,196,255,0.06)' : 'rgba(255,255,255,0.03)',
                border: p.highlight ? '1.5px solid rgba(0,196,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '32px 28px', position: 'relative',
                boxShadow: p.highlight ? '0 20px 40px -20px rgba(0,196,255,0.2)' : 'none'
              }}>
                {p.highlight && (
                  <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#00c4ff', color: '#080f1e', fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 99, letterSpacing: '.05em', whiteSpace: 'nowrap' }}>MÁS POPULAR</span>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 13, color: '#64748b' }}>{p.period}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="8" cy="8" r="8" fill={p.accent} opacity=".15" />
                        <path d="M5 8 L7 10 L11 6" stroke={p.accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: p.highlight ? '#00c4ff' : 'transparent', color: p.highlight ? '#080f1e' : p.accent, border: p.highlight ? 'none' : `1.5px solid ${p.accent}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>
            Precios en pesos mexicanos. IVA no incluido.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg,#080f1e,#0c1829)', padding: '72px 48px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>Tu empresa merece visibilidad financiera real</h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 30 }}>Sin Excel manual. Sin sorpresas de liquidez. Empieza hoy.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', background: '#00c4ff', color: '#080f1e', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }}>Comenzar gratis →</button>
          <a href="mailto:kvillafuerte@taxnfin.com" style={{ padding: '14px 28px', background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Agendar demo</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#050a14', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>TaxnFin <span style={{ color: '#00c4ff' }}>Cashflow</span></span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="https://taxnfin.com" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>taxnfin.com</a>
          <a href="https://donatariasat.taxnfin.com" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>DonatariaSAT</a>
          <a href="mailto:kvillafuerte@taxnfin.com" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>Contacto</a>
        </div>
        <span style={{ fontSize: 12, color: '#334155' }}>© 2026 TaxnFin · México</span>
      </footer>
    </div>
  );
};

export default LandingCashflow;
