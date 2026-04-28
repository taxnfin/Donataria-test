import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-10 py-3.5" style={{ background: '#065f46' }}>
        <div className="flex items-center gap-2 text-white text-[15px] font-bold">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,.2)' }}>T</div>
          <span className="font-normal" style={{ color: 'rgba(255,255,255,.55)' }}>TaxnFin</span>
          <span className="mx-1" style={{ color: 'rgba(255,255,255,.3)' }}>/</span>
          <span>DonatariaSAT</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login">
            <button className="px-4 py-2 text-white text-xs rounded-[7px] cursor-pointer" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }} data-testid="nav-login-btn">
              Iniciar sesion
            </button>
          </Link>
          <Link to="/register">
            <button className="px-4 py-2 text-xs rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#065f46' }} data-testid="nav-register-btn">
              Comenzar gratis
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-10 pt-[60px] pb-[52px]" style={{ background: '#065f46' }}>
        <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-[5px] rounded-full mb-4" style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.9)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }}></div>
              Parte de la suite TaxnFin
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3.5">
              Cumplimiento fiscal para{' '}
              <span style={{ color: '#34d399' }}>donatarias autorizadas</span>
            </h1>
            <p className="text-sm leading-relaxed mb-6 max-w-[420px]" style={{ color: 'rgba(255,255,255,.7)' }}>
              Gestiona donantes, emite CFDIs y cumple con el Titulo III de la LISR sin contratar un despacho externo.
            </p>
            <div className="flex gap-2.5">
              <Link to="/register">
                <button className="px-[22px] py-[11px] text-[13px] rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#065f46' }} data-testid="hero-register-btn">Comenzar gratis</button>
              </Link>
              <button className="px-[22px] py-[11px] text-[13px] rounded-[7px] text-white cursor-pointer" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)' }}>Ver demo</button>
            </div>
            <div className="flex gap-5 mt-5">
              {['Alineado con la LISR', 'Datos seguros', 'Modulo PLD incluido'].map(t => (
                <span key={t} className="text-[11px]" style={{ color: 'rgba(255,255,255,.6)' }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div className="text-[10px] tracking-wider mb-2" style={{ color: 'rgba(255,255,255,.5)' }}>DASHBOARD DONATARIA</div>
            <div className="text-[26px] font-bold text-white mb-1">$1,240,000 MXN</div>
            <div className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,.5)' }}>Donativos recibidos 2026</div>
            {[
              { dot: '#34d399', label: 'Donantes activos', badge: '47' },
              { dot: '#60a5fa', label: 'CFDIs timbrados', badge: '89' },
              { dot: '#fbbf24', label: 'Obligaciones pendientes', badge: '3' },
              { dot: '#f87171', label: 'Alertas PLD', badge: '1 nueva' },
            ].map(item => (
              <div key={item.label} className="rounded-md px-3 py-2 flex justify-between items-center text-xs mb-1.5" style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.85)' }}>
                <span><span className="inline-block w-[7px] h-[7px] rounded-full mr-2" style={{ background: item.dot }}></span>{item.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(255,255,255,.15)' }}>{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACTO */}
      <section className="px-10 py-14 text-center" style={{ background: '#042f26' }}>
        <div className="text-[11px] font-semibold tracking-wider mb-2.5" style={{ color: '#34d399' }}>IMPACTO</div>
        <h2 className="text-[26px] font-bold text-white mb-2">Lo que logran las donatarias con DonatariaSAT</h2>
        <p className="text-[13px] mb-9" style={{ color: 'rgba(255,255,255,.55)' }}>Organizaciones que dejan de gestionar su cumplimiento en hojas de calculo</p>
        <div className="grid grid-cols-2 md:grid-cols-4 max-w-[800px] mx-auto rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
          {[
            { num: '22', desc: 'Modulos de cumplimiento fiscal incluidos' },
            { num: '80%', desc: 'Menos tiempo en preparacion de informes' },
            { num: '100%', desc: 'Alineado con Titulo III LISR y LFPIORPI' },
            { num: '$0', desc: 'Para empezar — sin tarjeta de credito' },
          ].map((item, i) => (
            <div key={item.num} className="px-4 py-7" style={{ background: '#042f26', borderRight: i < 3 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
              <div className="text-[34px] font-bold text-white mb-1.5">{item.num}</div>
              <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,.5)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="px-10 py-14 bg-white">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider mb-1.5" style={{ color: '#059669' }}>FUNCIONALIDADES</div>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#065f46' }}>Todo lo que necesita tu donataria</h2>
          <p className="text-[13px] text-gray-500 mb-7">De la gestion de donantes hasta los avisos UIF — sin hojas de calculo dispersas.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: '📊', name: 'Dashboard en tiempo real', desc: 'KPIs, semaforo fiscal y alertas criticas en una sola pantalla.' },
              { icon: '👥', name: 'Gestion de donantes', desc: 'RFC, KYC, PEP, extranjeros — con validacion automatica del SAT.' },
              { icon: '🧾', name: 'CFDIs de donativos', desc: 'Genera, timbra y cancela comprobantes fiscales desde la plataforma.' },
              { icon: '📅', name: 'Calendario fiscal', desc: 'Nunca pierdas una fecha con recordatorios automaticos por email.' },
              { icon: '🛡️', name: 'Modulo PLD / AML', desc: 'Operaciones vulnerables, avisos UIF y matriz de riesgo automatica.' },
              { icon: '📄', name: 'Declaracion anual', desc: 'Auto-llenado del Titulo III LISR con control del 10% y PDF listo.' },
            ].map(f => (
              <div key={f.name} className="border border-gray-200 rounded-[10px] p-5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3" style={{ background: '#dcfce7' }}>{f.icon}</div>
                <div className="text-[13px] font-semibold mb-1.5" style={{ color: '#065f46' }}>{f.name}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDAMENTO LEGAL */}
      <section className="px-10 py-14" style={{ background: '#F8F9FB' }}>
        <div className="max-w-[960px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider mb-1.5" style={{ color: '#059669' }}>RESPALDO LEGAL</div>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#065f46' }}>Fundamento legal solido</h2>
          <p className="text-[13px] text-gray-500 mb-7">Cada modulo esta disenado con base en la legislacion fiscal mexicana vigente.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              { code: 'LISR Art. 82', desc: 'Requisitos para donatarias autorizadas' },
              { code: 'LISR Art. 86', desc: 'Obligaciones de presentacion de informacion' },
              { code: 'RLISR Art. 138', desc: 'Limite del 5% en gastos administrativos' },
              { code: 'CFF Art. 29', desc: 'Requisitos de comprobantes fiscales' },
              { code: 'Ficha 19/ISR', desc: 'Informe de transparencia ante el SAT' },
              { code: 'LFPIORPI', desc: 'Prevencion de lavado de dinero' },
            ].map(item => (
              <div key={item.code} className="bg-white border border-gray-200 rounded-lg px-4 py-3.5 flex gap-3 items-start">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#dcfce7', color: '#065f46' }}>{item.code}</span>
                <span className="text-xs text-gray-500 leading-snug">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-10 py-14 text-center" style={{ background: '#065f46' }}>
        <h2 className="text-[26px] font-bold text-white mb-2.5">Tu donataria cumplida desde hoy</h2>
        <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,.65)' }}>Sin instalaciones, sin contratos largos. Empieza en 5 minutos.</p>
        <Link to="/register">
          <button className="px-7 py-3 text-sm rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#065f46' }} data-testid="cta-register-btn">Crear cuenta gratuita</button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-10 py-5" style={{ background: '#042f26' }}>
        <span className="text-[13px] font-semibold text-white">TaxnFin / DonatariaSAT</span>
        <span className="text-[11px] text-gray-600">© 2026 TaxnFin · Suite financiera para Mexico</span>
      </footer>
    </div>
  );
};

export default LandingPage;
