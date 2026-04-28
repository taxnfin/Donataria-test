import { Link } from "react-router-dom";

const TaxnFinPage = () => {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-10 py-3.5" style={{ background: '#0F2D5E' }}>
        <div className="flex items-center gap-2 text-white text-[15px] font-bold">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,.15)' }}>T</div>
          <span>TaxnFin</span>
          <span className="font-normal text-xs ml-2" style={{ color: 'rgba(255,255,255,.5)' }}>Suite financiera para Mexico</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login">
            <button className="px-4 py-2 text-white text-xs rounded-[7px] cursor-pointer" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
              Iniciar sesion
            </button>
          </Link>
          <Link to="/register">
            <button className="px-4 py-2 text-xs rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#0F2D5E' }}>
              Solicitar acceso
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-10 pt-16 pb-14" style={{ background: '#0F2D5E' }}>
        <div className="max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-[5px] rounded-full mb-4" style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }}></div>
              Plataforma financiera integral
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3.5">
              Inteligencia financiera para{' '}
              <span style={{ color: '#60a5fa' }}>CFOs de Mexico</span>
            </h1>
            <p className="text-sm leading-relaxed mb-6 max-w-[420px]" style={{ color: 'rgba(255,255,255,.65)' }}>
              Cashflow forecasting, cumplimiento fiscal y CRM financiero en una sola plataforma. Decisiones informadas, no reactivas.
            </p>
            <div className="flex gap-2.5">
              <Link to="/register">
                <button className="px-[22px] py-[11px] text-[13px] rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#0F2D5E' }}>Solicitar demo</button>
              </Link>
              <Link to="/">
                <button className="px-[22px] py-[11px] text-[13px] rounded-[7px] text-white cursor-pointer" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>DonatariaSAT</button>
              </Link>
            </div>
            <div className="flex gap-5 mt-5">
              {['Cashflow en tiempo real', 'Cumplimiento automatizado', 'Multi-empresa'].map(t => (
                <span key={t} className="text-[11px]" style={{ color: 'rgba(255,255,255,.5)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Dashboard Mock - Cashflow */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <div className="text-[10px] tracking-wider mb-2" style={{ color: 'rgba(255,255,255,.45)' }}>CASHFLOW 13 SEMANAS</div>
            <div className="flex items-end gap-3 mb-1">
              <div className="text-[26px] font-bold text-white">$4.2M MXN</div>
              <span className="text-xs px-2 py-0.5 rounded-full mb-1" style={{ background: 'rgba(34,197,94,.15)', color: '#4ade80' }}>+12.3%</span>
            </div>
            <div className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,.4)' }}>Posicion de caja proyectada — Semana 13</div>

            {/* Mini chart mock */}
            <div className="flex items-end gap-1 h-16 mb-4 px-1">
              {[40, 55, 45, 60, 50, 72, 65, 80, 70, 85, 78, 90, 88].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i >= 10 ? 'rgba(96,165,250,.4)' : 'rgba(96,165,250,.7)', transition: 'height .3s' }} />
              ))}
            </div>

            {[
              { dot: '#4ade80', label: 'Ingresos proyectados', value: '$6.8M' },
              { dot: '#f87171', label: 'Egresos comprometidos', value: '$2.6M' },
              { dot: '#60a5fa', label: 'Cuentas por cobrar', value: '$1.4M' },
              { dot: '#fbbf24', label: 'Alertas de liquidez', value: '0' },
            ].map(item => (
              <div key={item.label} className="rounded-md px-3 py-2 flex justify-between items-center text-xs mb-1.5" style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.8)' }}>
                <span><span className="inline-block w-[7px] h-[7px] rounded-full mr-2" style={{ background: item.dot }}></span>{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACTO CFO */}
      <section className="px-10 py-14 text-center" style={{ background: '#091d3e' }}>
        <div className="text-[11px] font-semibold tracking-wider mb-2.5" style={{ color: '#60a5fa' }}>IMPACTO CFO</div>
        <h2 className="text-[26px] font-bold text-white mb-2">Resultados que mueven la aguja</h2>
        <p className="text-[13px] mb-9" style={{ color: 'rgba(255,255,255,.5)' }}>Metricas reales de equipos financieros que usan TaxnFin</p>
        <div className="grid grid-cols-2 md:grid-cols-4 max-w-[800px] mx-auto rounded-[10px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
          {[
            { num: '40%', desc: 'Reduccion en tiempo de cierre mensual' },
            { num: '3x', desc: 'Mas rapido en proyecciones de cashflow' },
            { num: '85%', desc: 'Precision en forecast a 13 semanas' },
            { num: '500+', desc: 'Empresas gestionando su tesoreria' },
          ].map((item, i) => (
            <div key={item.num} className="px-4 py-7" style={{ background: '#091d3e', borderRight: i < 3 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
              <div className="text-[34px] font-bold text-white mb-1.5">{item.num}</div>
              <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,.45)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUCIONES */}
      <section className="px-10 py-14 bg-white">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider mb-1.5" style={{ color: '#2563eb' }}>SOLUCIONES</div>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#0F2D5E' }}>La suite completa para tu operacion financiera</h2>
          <p className="text-[13px] text-gray-500 mb-7">Modulos que se integran entre si para darte visibilidad total.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: '📈',
                name: 'Cashflow 13 Semanas',
                desc: 'Proyeccion de flujo de efectivo con escenarios, alertas de liquidez y conciliacion bancaria automatica.',
                badge: 'Core',
                color: '#2563eb'
              },
              {
                icon: '🤝',
                name: 'CRM & Cotizador Pro',
                desc: 'Pipeline comercial con cotizaciones inteligentes, seguimiento de deals y conversion a factura.',
                badge: 'Ventas',
                color: '#7c3aed'
              },
              {
                icon: '🛡️',
                name: 'Materialidad AML',
                desc: 'Analisis de riesgo PLD, monitoreo de operaciones y generacion de avisos regulatorios.',
                badge: 'Compliance',
                color: '#059669'
              },
            ].map(s => (
              <div key={s.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl" style={{ background: `${s.color}10` }}>{s.icon}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${s.color}15`, color: s.color }}>{s.badge}</span>
                </div>
                <div className="text-[14px] font-semibold mb-2" style={{ color: '#0F2D5E' }}>{s.name}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Sub-product: DonatariaSAT */}
          <div className="mt-6 border border-emerald-200 rounded-xl p-6 flex items-center gap-6" style={{ background: '#f0fdf4' }}>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl" style={{ background: '#dcfce7' }}>🏛️</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[14px] font-semibold" style={{ color: '#065f46' }}>DonatariaSAT</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#065f46' }}>Donatarias</span>
              </div>
              <p className="text-xs text-gray-500">Cumplimiento fiscal integral para donatarias autorizadas — Titulo III LISR, CFDIs, PLD y transparencia.</p>
            </div>
            <Link to="/">
              <button className="px-4 py-2 text-xs rounded-[7px] font-semibold cursor-pointer" style={{ background: '#065f46', color: 'white', border: 'none' }}>Ir a DonatariaSAT</button>
            </Link>
          </div>
        </div>
      </section>

      {/* CAPACIDADES */}
      <section className="px-10 py-14" style={{ background: '#F8FAFC' }}>
        <div className="max-w-[960px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider mb-1.5" style={{ color: '#2563eb' }}>CAPACIDADES</div>
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: '#0F2D5E' }}>Construido para equipos financieros exigentes</h2>
          <p className="text-[13px] text-gray-500 mb-7">Tecnologia que se adapta a como trabajas, no al reves.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '🔗', name: 'Integracion bancaria', desc: 'Conexion directa con bancos mexicanos para conciliacion en tiempo real.' },
              { icon: '🤖', name: 'IA financiera', desc: 'Modelos predictivos entrenados con datos del mercado mexicano.' },
              { icon: '📊', name: 'Reportes ejecutivos', desc: 'Dashboards para junta directiva listos en 1 click.' },
              { icon: '🔐', name: 'Seguridad enterprise', desc: 'Encriptacion end-to-end, SOC2 y cumplimiento CNBV.' },
              { icon: '👥', name: 'Multi-empresa', desc: 'Consolida grupos corporativos en una sola vista.' },
              { icon: '⚡', name: 'API abierta', desc: 'Integra con tu ERP, CRM o cualquier sistema via REST.' },
            ].map(c => (
              <div key={c.name} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-lg mb-2">{c.icon}</div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: '#0F2D5E' }}>{c.name}</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-10 py-14 text-center" style={{ background: '#0F2D5E' }}>
        <h2 className="text-[26px] font-bold text-white mb-2.5">Tu operacion financiera, bajo control</h2>
        <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,.6)' }}>Agenda una demo personalizada con nuestro equipo.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/register">
            <button className="px-7 py-3 text-sm rounded-[7px] border-none cursor-pointer font-semibold" style={{ background: 'white', color: '#0F2D5E' }}>Solicitar demo</button>
          </Link>
          <Link to="/">
            <button className="px-7 py-3 text-sm rounded-[7px] cursor-pointer font-semibold text-white" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>Ver DonatariaSAT</button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between px-10 py-5" style={{ background: '#091d3e' }}>
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-semibold text-white">TaxnFin</span>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.3)' }}>|</span>
          <Link to="/" className="text-[11px] hover:underline" style={{ color: 'rgba(255,255,255,.5)' }}>DonatariaSAT</Link>
        </div>
        <span className="text-[11px] text-gray-600">© 2026 TaxnFin · Suite financiera para Mexico</span>
      </footer>
    </div>
  );
};

export default TaxnFinPage;
