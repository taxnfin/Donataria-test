import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoTaxnFin = ({ size = 32, variant = 'light' }) => {
  const text = variant === 'light' ? '#0F2D5E' : 'white';
  const accent = '#10B981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="TaxnFin">
        <defs>
          <linearGradient id="tf-bar1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#1E3A8A" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="tf-bar2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0F2D5E" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="tf-arrow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <rect x="3" y="32" width="34" height="2.2" rx="1.1" fill={text} opacity=".15" />
        <rect x="6"  y="22" width="6" height="10" rx="1.5" fill="url(#tf-bar1)" />
        <rect x="14" y="16" width="6" height="16" rx="1.5" fill="url(#tf-bar2)" />
        <rect x="22" y="10" width="6" height="22" rx="1.5" fill="url(#tf-bar1)" />
        <path d="M5 26 L14 18 L22 22 L34 8" stroke="url(#tf-arrow)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="34" cy="8" r="2.6" fill={accent} />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 18, color: text, letterSpacing: '-.02em' }}>
        Tax<span style={{ color: accent }}>n</span>Fin
      </span>
    </div>
  );
};

const LogoDonataria = ({ variant = 'light' }) => {
  const text = variant === 'light' ? '#064E3B' : 'white';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-label="DonatariaSAT">
        <defs>
          <linearGradient id="ds-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
        <path d="M20 4 L34 9 V20 C34 27 28 33 20 36 C12 33 6 27 6 20 V9 Z" fill="url(#ds-shield)" />
        <path d="M14 20 L18 24 L27 15" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: 17, color: text, letterSpacing: '-.02em' }}>
        Donataria<span style={{ color: '#10B981' }}>SAT</span>
      </span>
    </div>
  );
};

const PriceCard = ({ name, price, period, features, cta, onClick, highlight, accent, testid }) => (
  <div
    style={{
      background: highlight ? `linear-gradient(180deg, ${accent}14 0%, white 60%)` : 'white',
      border: highlight ? `2px solid ${accent}` : '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      position: 'relative',
      boxShadow: highlight ? `0 20px 40px -20px ${accent}66` : '0 4px 12px -8px rgba(15,45,94,.1)',
    }}
    data-testid={testid}
  >
    {highlight && (
      <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: accent, color: 'white', fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: 99, letterSpacing: '.05em' }}>
        MÁS POPULAR
      </span>
    )}
    <div style={{ fontSize: 13, fontWeight: 600, color: accent, letterSpacing: '.04em', textTransform: 'uppercase' }}>{name}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', letterSpacing: '-.02em' }}>{price}</span>
      {period && <span style={{ fontSize: 13, color: '#6b7280' }}>{period}</span>}
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      {features.map((f, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="8" cy="8" r="8" fill={accent} opacity=".15" />
            <path d="M5 8 L7 10 L11 6" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <button
      onClick={onClick}
      style={{
        marginTop: 8,
        padding: '12px 18px',
        background: highlight ? accent : 'transparent',
        color: highlight ? 'white' : accent,
        border: highlight ? 'none' : `1.5px solid ${accent}`,
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'transform .2s, box-shadow .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {cta}
    </button>
  </div>
);

function LandingTaxnFin({ onSwitch }) {
  const navigate = useNavigate();

  const capacidades = [
    { name: 'Previsión de Flujo de Caja', desc: 'Proyecciones precisas hasta 90 días con machine learning que aprende de tus patrones financieros.', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)', icon: 'M3 17 L8 12 L13 15 L21 7' },
    { name: 'Análisis Inteligente', desc: 'Insights generados por IA que identifican oportunidades de optimización y alertas tempranas.', grad: 'linear-gradient(135deg,#06B6D4,#10B981)', icon: 'M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19' },
    { name: 'Alertas Automatizadas', desc: 'Notificaciones proactivas sobre posibles faltantes de efectivo antes de que ocurran.', grad: 'linear-gradient(135deg,#84CC16,#FACC15)', icon: 'M12 3 L20 19 L12 16 L4 19 Z' },
    { name: 'Reportes Personalizados', desc: 'Dashboards y reportes a tu medida para presentar a tu equipo, inversionistas o consejo.', grad: 'linear-gradient(135deg,#F472B6,#F97316)', icon: 'M5 3 L19 3 L19 21 L5 21 Z M9 8 L15 8 M9 12 L15 12 M9 16 L13 16' },
    { name: 'Integraciones', desc: 'Conecta con tu software contable, bancos y ERPs favoritos en minutos.', grad: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', icon: 'M9 4 L9 11 M15 4 L15 11 M5 11 L19 11 L19 16 C19 19 17 21 14 21 L10 21 C7 21 5 19 5 16 Z' },
    { name: 'Seguridad Bancaria', desc: 'Encriptación de nivel bancario y cumplimiento con regulaciones de protección de datos.', grad: 'linear-gradient(135deg,#0EA5E9,#10B981)', icon: 'M12 2 L20 6 V13 C20 18 16 21 12 22 C8 21 4 18 4 13 V6 Z M9 12 L11 14 L15 10' },
  ];

  const proceso = [
    { name: 'Conecta tus cuentas', desc: 'Integra tu banco, software contable o ERP en pocos clics. No necesitas conocimientos técnicos.', grad: 'linear-gradient(135deg,#6366F1,#3B82F6)', icon: 'M9 4 L9 11 M15 4 L15 11 M5 11 L19 11 L19 16 C19 19 17 21 14 21 L10 21 C7 21 5 19 5 16 Z' },
    { name: 'IA analiza tus datos', desc: 'Nuestra inteligencia artificial procesa tu información y aprende tus patrones financieros únicos.', grad: 'linear-gradient(135deg,#06B6D4,#10B981)', icon: 'M5 12 L9 8 L13 14 L17 6 L19 10 M3 19 L21 19' },
    { name: 'Toma el control', desc: 'Accede a dashboards inteligentes, predicciones precisas y alertas que te ayudan a decidir mejor.', grad: 'linear-gradient(135deg,#F59E0B,#F97316)', icon: 'M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0F172A' }}>
      <nav style={{ background: 'white', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <LogoTaxnFin />
        <div style={{ display: 'flex', gap: 32, fontSize: 14, color: '#475569' }}>
          {[
            { l: 'Funcionalidades', h: '#capacidades' },
            { l: 'Precios', h: '#precios' },
            { l: 'Casos de Éxito', h: '#impacto' },
            { l: 'Recursos', h: '#proceso' },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ cursor: 'pointer', color: '#475569', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#0F2D5E', color: 'white', border: 'none' }} data-testid="taxnfin-demo-btn">
          Ver Demo en Vivo
        </button>
      </nav>

      {/* TABS */}
      <div style={{ background: '#f8fafc', display: 'flex', padding: '0 48px', borderBottom: '1px solid #e2e8f0' }}>
        <button style={{ padding: '10px 18px', fontSize: 12, fontWeight: 600, color: '#0F2D5E', background: 'none', border: 'none', borderBottom: '2px solid #0F2D5E', cursor: 'pointer' }}>taxnfin.com</button>
        <button onClick={() => window.location.href='https://donatariasat.taxnfin.com'} style={{ padding: '10px 18px', fontSize: 12, color: '#64748b', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer' }} data-testid="switch-donataria-tab">donatariasat.taxnfin.com →</button>
      </div>

      <section style={{ background: 'linear-gradient(135deg,#0F2D5E 0%,#1E3A8A 100%)', padding: '80px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .07, backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 99, background: 'rgba(16,185,129,.15)', color: '#34d399', marginBottom: 22, border: '1px solid rgba(16,185,129,.3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }}></span>
            CFO Digital para Empresas
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: 22, letterSpacing: '-.03em' }}>
            Anticipa tus decisiones financieras con{' '}
            <span style={{ background: 'linear-gradient(90deg,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>inteligencia</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.75)', lineHeight: 1.65, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            TaxnFin es tu CFO digital. Anticipa, decide y optimiza el flujo de efectivo de tu empresa con análisis inteligente en tiempo real.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '14px 26px', background: 'white', color: '#0F2D5E', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 25px -10px rgba(0,0,0,.5)' }} data-testid="taxnfin-solicitar-btn">Solicitar Demo →</button>
            <button onClick={() => document.querySelector('#capacidades')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 26px', background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6.5" stroke="white" fill="none" /><path d="M5.5 4 L10 7 L5.5 10 Z" fill="white" /></svg>
              Ver Funcionalidades
            </button>
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '🛡', t: 'Datos 100% seguros' },
              { icon: '⚡', t: 'Setup en minutos' },
              { icon: '📈', t: '+500 empresas' },
            ].map(t => <span key={t.t} style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14 }}>{t.icon}</span>{t.t}</span>)}
          </div>
        </div>
      </section>

      <section id="capacidades" style={{ padding: '88px 48px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#3B82F6', marginBottom: 14 }}>CAPACIDADES</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-.02em' }}>Todo lo que necesita un CFO moderno</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 56, maxWidth: 640, margin: '0 auto 56px' }}>
            Funciones diseñadas para ayudarte a tomar decisiones financieras inteligentes y oportunas
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22, textAlign: 'left' }}>
            {capacidades.map(c => (
              <div key={c.name} style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 4px 24px -12px rgba(15,45,94,.15)', border: '1px solid #f1f5f9', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px -16px rgba(15,45,94,.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px -12px rgba(15,45,94,.15)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 8px 20px -8px rgba(0,0,0,.25)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{c.name}</div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" style={{ padding: '88px 48px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#3B82F6', marginBottom: 14 }}>PROCESO</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-.02em' }}>Empieza en minutos, no en meses</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 64, maxWidth: 640, margin: '0 auto 64px' }}>
            Configurar TaxnFin es simple y rápido. Sin implementaciones complejas ni largas esperas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 36, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 44, left: '15%', right: '15%', height: 2, background: 'linear-gradient(90deg,#6366F1,#10B981,#F59E0B)', opacity: .4, zIndex: 0 }}></div>
            {proceso.map((p, i) => (
              <div key={p.name} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: p.grad, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px -10px rgba(0,0,0,.3)', position: 'relative' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon} /></svg>
                  <span style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: '50%', background: 'white', color: '#0F172A', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -4px rgba(0,0,0,.2)' }}>{i + 1}</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>{p.name}</div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/register')} style={{ marginTop: 56, padding: '14px 30px', background: '#0F2D5E', color: 'white', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Agenda tu demo personalizada →
          </button>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>Sin compromiso. Configuración gratuita.</div>
        </div>
      </section>

      <section id="impacto" style={{ background: '#0F2D5E', padding: '72px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#34d399', marginBottom: 14 }}>RESULTADOS</div>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-.02em' }}>El impacto de tener un CFO digital</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 48, maxWidth: 560, margin: '0 auto 48px' }}>Empresas que utilizan TaxnFin reportan mejoras significativas en su gestión financiera</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 900, margin: '0 auto', gap: 1, background: 'rgba(255,255,255,.08)', padding: 1, borderRadius: 14, overflow: 'hidden' }}>
          {[{ num: '40%', desc: 'Reducción en faltantes de efectivo' }, { num: '3x', desc: 'Más velocidad en decisiones' }, { num: '85%', desc: 'Tiempo ahorrado en reportes' }, { num: '500+', desc: 'Empresas confían en TaxnFin' }].map(item => (
            <div key={item.num} style={{ background: '#0F2D5E', padding: '36px 18px' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: 'white', marginBottom: 8, background: 'linear-gradient(135deg,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{item.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" style={{ padding: '88px 48px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#3B82F6', marginBottom: 14 }}>PRECIOS</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-.02em' }}>Planes que crecen contigo</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 56, maxWidth: 640, margin: '0 auto 56px' }}>
            Elige el plan ideal para tu empresa. Sin contratos forzosos, cancela cuando quieras.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, textAlign: 'left', alignItems: 'stretch' }}>
            <PriceCard testid="taxnfin-plan-starter" accent="#3B82F6" name="Starter" price="$299" period="/ mes MXN" features={['1 entidad jurídica','Cashflow 13 semanas básico','Dashboard financiero','Reportes operativos','Soporte por correo']} cta="Empezar Starter" onClick={() => navigate('/register')} />
            <PriceCard testid="taxnfin-plan-growth" accent="#0F2D5E" highlight name="Growth" price="$499" period="/ mes MXN" features={['Hasta 3 entidades jurídicas','Cashflow 13 sem. con IA y forecast','Materialidad fiscal AML','Integraciones bancarias y ERP','Soporte prioritario']} cta="Elegir Growth" onClick={() => navigate('/register')} />
            <PriceCard testid="taxnfin-plan-enterprise" accent="#10B981" name="Enterprise" price="A medida" period="" features={['Entidades ilimitadas','Onboarding e implementación dedicada','API privada y SSO','SLA 99.9% y CSM dedicado','Capacitación in-company','DonatariaSAT incluido sin costo']} cta="Hablar con ventas" onClick={() => navigate('/register')} />
          </div>
          <div style={{ marginTop: 28, fontSize: 13, color: '#64748b' }}>
            Precios en pesos mexicanos. IVA no incluido. ¿Eres OSC autorizada? <button onClick={() => window.location.href='https://donatariasat.taxnfin.com'} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: 700, padding: 0 }}>Ver planes DonatariaSAT →</button>
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg,#0F2D5E,#1E3A8A)', padding: '72px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>Tu empresa merece herramientas de CFO</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', marginBottom: 30 }}>Sin instalaciones, sin Excel manual. Empieza hoy.</p>
        <button onClick={() => navigate('/register')} style={{ padding: '14px 30px', background: 'white', color: '#0F2D5E', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }}>Solicitar Demo →</button>
      </section>

      <footer style={{ background: '#0a1f40', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LogoTaxnFin variant="dark" size={26} />
        <span style={{ fontSize: 12, color: '#64748b' }}>© 2026 TaxnFin · Suite financiera para empresas mexicanas</span>
      </footer>
    </div>
  );
}

function LandingDonataria({ onSwitch }) {
  const navigate = useNavigate();

  const funcionalidades = [
    { icon: 'M3 13 L9 7 L13 11 L21 3 M15 3 L21 3 L21 9', name: 'Dashboard en tiempo real', desc: 'KPIs, semáforo fiscal y alertas críticas en una sola pantalla.', grad: 'linear-gradient(135deg,#10B981,#059669)' },
    { icon: 'M16 14 C18.2 14 20 12.2 20 10 C20 7.8 18.2 6 16 6 M8 14 C5.8 14 4 12.2 4 10 C4 7.8 5.8 6 8 6 M12 14 C9.8 14 8 12.2 8 10 C8 7.8 9.8 6 12 6 C14.2 6 16 7.8 16 10 C16 12.2 14.2 14 12 14 Z M3 21 C3 17.7 6.7 15 12 15 C17.3 15 21 17.7 21 21', name: 'Gestión de donantes', desc: 'RFC, KYC, PEP, extranjeros — validación automática del SAT.', grad: 'linear-gradient(135deg,#0EA5E9,#3B82F6)' },
    { icon: 'M5 3 L19 3 L19 21 L5 21 Z M9 8 L15 8 M9 12 L15 12 M9 16 L13 16', name: 'CFDIs de donativos', desc: 'Genera, timbra y cancela comprobantes fiscales desde la plataforma.', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
    { icon: 'M5 4 L19 4 L19 20 L5 20 Z M9 2 L9 6 M15 2 L15 6 M5 10 L19 10', name: 'Calendario fiscal', desc: 'Nunca pierdas una fecha con recordatorios automáticos por email.', grad: 'linear-gradient(135deg,#F59E0B,#F97316)' },
    { icon: 'M12 2 L20 6 V13 C20 18 16 21 12 22 C8 21 4 18 4 13 V6 Z M9 12 L11 14 L15 10', name: 'Módulo PLD / AML', desc: 'Operaciones vulnerables, avisos UIF y matriz de riesgo automática.', grad: 'linear-gradient(135deg,#EF4444,#F472B6)' },
    { icon: 'M5 3 L19 3 L19 21 L5 21 Z M9 7 L15 7 M9 11 L15 11 M9 15 L15 15 M9 19 L13 19', name: 'Declaración anual', desc: 'Auto-llenado del Título III LISR con control del 10% y PDF listo.', grad: 'linear-gradient(135deg,#06B6D4,#10B981)' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0F172A' }}>
      <nav style={{ background: 'white', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LogoDonataria />
          <span style={{ fontSize: 11, color: '#94a3b8', padding: '3px 8px', background: '#f1f5f9', borderRadius: 99, fontWeight: 600 }}>by TaxnFin</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 14, color: '#475569' }}>
          {[
            { l: 'Funcionalidades', h: '#funcionalidades' },
            { l: 'Precios', h: '#precios' },
            { l: 'Legal', h: '#legal' },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ cursor: 'pointer', color: '#475569', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 18px', background: 'white', color: '#065f46', fontSize: 13, borderRadius: 10, border: '1.5px solid #d1fae5', cursor: 'pointer', fontWeight: 600 }} data-testid="nav-login-btn">Iniciar sesión</button>
          <button onClick={() => navigate('/register')} style={{ padding: '10px 18px', background: '#065f46', color: 'white', fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }} data-testid="nav-register-btn">Comenzar gratis</button>
        </div>
      </nav>

      {/* TABS */}
      <div style={{ background: '#f8fafc', display: 'flex', padding: '0 48px', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => window.location.href='https://taxnfin.com'} style={{ padding: '10px 18px', fontSize: 12, color: '#64748b', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer' }} data-testid="switch-taxnfin-tab">← Cashflow TaxnFin</button>
        <button style={{ padding: '10px 18px', fontSize: 12, fontWeight: 600, color: '#065f46', background: 'none', border: 'none', borderBottom: '2px solid #10B981', cursor: 'pointer' }}>donatariasat.taxnfin.com</button>
      </div>

      <section style={{ background: 'linear-gradient(135deg,#064E3B 0%,#065f46 100%)', padding: '80px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .07, backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 99, background: 'rgba(52,211,153,.15)', color: '#34d399', marginBottom: 22, border: '1px solid rgba(52,211,153,.3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }}></span>
            Parte de la suite TaxnFin
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: 22, letterSpacing: '-.03em' }}>
            Cumplimiento fiscal para{' '}
            <span style={{ background: 'linear-gradient(90deg,#34d399,#a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>donatarias autorizadas</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.75)', lineHeight: 1.65, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Gestiona donantes, emite CFDIs y cumple con el Título III de la LISR sin contratar un despacho externo.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '14px 26px', background: 'white', color: '#065f46', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 25px -10px rgba(0,0,0,.5)' }} data-testid="hero-register-btn">Comenzar gratis</button>
            <button onClick={() => document.querySelector('#funcionalidades')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 26px', background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontWeight: 600 }}>Ver funcionalidades</button>
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Alineado con la LISR', 'Datos seguros', 'Módulo PLD incluido'].map(t => <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>✓ {t}</span>)}
          </div>
        </div>
      </section>

      <section id="funcionalidades" style={{ padding: '88px 48px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#10B981', marginBottom: 14 }}>FUNCIONALIDADES</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-.02em' }}>Todo lo que necesita tu donataria</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 56, maxWidth: 640, margin: '0 auto 56px' }}>
            Una plataforma integral diseñada para el cumplimiento fiscal de organizaciones autorizadas en México
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22, textAlign: 'left' }}>
            {funcionalidades.map(f => (
              <div key={f.name} style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 4px 24px -12px rgba(6,95,70,.15)', border: '1px solid #f1f5f9', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px -16px rgba(6,95,70,.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px -12px rgba(6,95,70,.15)'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: f.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 8px 20px -8px rgba(0,0,0,.25)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{f.name}</div>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#064E3B', padding: '72px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#34d399', marginBottom: 14 }}>IMPACTO</div>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-.02em' }}>Lo que logran las donatarias con DonatariaSAT</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 48, maxWidth: 640, margin: '0 auto 48px' }}>Organizaciones que dejan de gestionar su cumplimiento en hojas de cálculo</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 900, margin: '0 auto', gap: 1, background: 'rgba(255,255,255,.08)', padding: 1, borderRadius: 14, overflow: 'hidden' }}>
          {[{ num: '22', desc: 'Módulos de cumplimiento' }, { num: '80%', desc: 'Menos tiempo en informes' }, { num: '100%', desc: 'Alineado LISR y LFPIORPI' }, { num: '$0', desc: 'Para empezar, sin tarjeta' }].map(item => (
            <div key={item.num} style={{ background: '#064E3B', padding: '36px 18px' }}>
              <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg,#34d399,#a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{item.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" style={{ padding: '88px 48px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#10B981', marginBottom: 14 }}>PRECIOS</div>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0F172A', marginBottom: 14, letterSpacing: '-.02em' }}>Precios diseñados para OSC</h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 56, maxWidth: 640, margin: '0 auto 56px' }}>
            Empieza gratis. Sin contratos forzosos, sin tarjeta de crédito.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, textAlign: 'left', alignItems: 'stretch' }}>
            <PriceCard testid="donataria-plan-free" accent="#0EA5E9" name="Esencial" price="$0" period="/ mes — para siempre" features={['Hasta 25 donantes activos','Hasta 50 CFDIs al mes','Calendario fiscal básico','Dashboard y reportes operativos','Comunidad y centro de ayuda']} cta="Empezar gratis" onClick={() => navigate('/register')} />
            <PriceCard testid="donataria-plan-pro" accent="#065f46" highlight name="Profesional" price="$399" period="/ mes MXN" features={['Donantes ilimitados','Hasta 500 CFDIs al mes','Módulo PLD / AML completo','Avisos UIF y matriz de riesgo','Declaración anual (Título III LISR)','Ficha de transparencia pública en PDF','Soporte por correo y chat']} cta="Elegir Profesional" onClick={() => navigate('/register')} />
            <PriceCard testid="donataria-plan-enterprise" accent="#10B981" name="Multi-Donataria" price="A medida" period="" features={['Múltiples donatarias en una cuenta','Roles y permisos granulares (RBAC)','Onboarding e implementación','Capacitación PLD y LISR para equipo','API de integración','CSM dedicado']} cta="Hablar con ventas" onClick={() => navigate('/register')} />
          </div>
          <div style={{ marginTop: 28, fontSize: 13, color: '#64748b' }}>
            Precios en pesos mexicanos. IVA no incluido. Timbrado de CFDI con costo adicional según PAC.
          </div>
        </div>
      </section>

      <section id="legal" style={{ background: '#F8FAFC', padding: '72px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#10B981', marginBottom: 14 }}>RESPALDO LEGAL</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-.02em' }}>Fundamento legal sólido</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
            {[
              { code: 'LISR Art. 82', desc: 'Requisitos para donatarias autorizadas' },
              { code: 'LISR Art. 86', desc: 'Obligaciones de presentación de información' },
              { code: 'RLISR Art. 138', desc: 'Límite del 5% en gastos administrativos' },
              { code: 'CFF Art. 29', desc: 'Requisitos de comprobantes fiscales' },
              { code: 'Ficha 19/ISR', desc: 'Informe de transparencia ante el SAT' },
              { code: 'LFPIORPI', desc: 'Prevención de lavado de dinero' },
            ].map(item => (
              <div key={item.code} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#065f46', padding: '4px 9px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.code}</span>
                <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg,#064E3B,#065f46)', padding: '72px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>Tu donataria cumplida desde hoy</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', marginBottom: 30 }}>Sin instalaciones, sin contratos largos. Empieza en 5 minutos.</p>
        <button onClick={() => navigate('/register')} style={{ padding: '14px 30px', background: 'white', color: '#065f46', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }} data-testid="cta-register-btn">Crear cuenta gratuita</button>
      </section>

      <footer style={{ background: '#042f26', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LogoDonataria variant="dark" />
        <span style={{ fontSize: 12, color: '#64748b' }}>© 2026 TaxnFin · Suite financiera para México</span>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  const [vista, setVista] = useState('donataria');
  return vista === 'taxnfin'
    ? <LandingTaxnFin onSwitch={setVista} />
    : <LandingDonataria onSwitch={setVista} />;
}
