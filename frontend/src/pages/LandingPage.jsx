import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  FileText, 
  Users, 
  Calendar, 
  Shield, 
  ArrowRight,
  CheckCircle,
  BarChart3
} from "lucide-react";

const LandingPage = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8 text-emerald-600" />,
      title: "Dashboard Inteligente",
      description: "Visualiza KPIs clave, alertas críticas y el estado de tus obligaciones fiscales en tiempo real."
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-600" />,
      title: "Gestión de Donantes",
      description: "Administra tu base de donantes, personas físicas y morales, nacionales y extranjeros."
    },
    {
      icon: <FileText className="w-8 h-8 text-violet-600" />,
      title: "Emisión de CFDI",
      description: "Genera y administra los comprobantes fiscales de tus donativos de forma sencilla."
    },
    {
      icon: <Calendar className="w-8 h-8 text-emerald-600" />,
      title: "Calendario Fiscal",
      description: "Nunca pierdas una fecha límite con nuestro sistema de semáforos de urgencia."
    },
    {
      icon: <Shield className="w-8 h-8 text-emerald-600" />,
      title: "Informe de Transparencia",
      description: "Cumple con la Ficha 19/ISR y genera tu informe anual fácilmente."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
      title: "Alertas de Cumplimiento",
      description: "Monitoreo del límite de 5% en gastos administrativos según Art. 138 RLISR."
    }
  ];

  const benefits = [
    "Cumplimiento automático con Título III de la LISR",
    "Control del límite de gastos administrativos",
    "Gestión centralizada de donantes y donativos",
    "Calendario fiscal con recordatorios",
    "Generación de informes de transparencia"
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              DonatariaSAT
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900" data-testid="nav-login-btn">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="nav-register-btn">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Cumplimiento fiscal
              <span className="text-emerald-600"> simplificado</span> para donatarias
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              La plataforma integral para organizaciones autorizadas en México. 
              Gestiona donantes, emite CFDIs y cumple con tus obligaciones del Título III de la LISR.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12" data-testid="hero-cta-btn">
                  Comenzar Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
                onClick={handleGoogleLogin}
                data-testid="hero-google-btn"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>
            </div>
          </div>
          <div className="md:col-span-5 hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-600/10 rounded-2xl transform rotate-3"></div>
              <img 
                src="https://images.pexels.com/photos/8297051/pexels-photo-8297051.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Gestión fiscal profesional"
                className="relative rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Banner */}
      <section className="bg-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Todo lo que necesitas para cumplir
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diseñado específicamente para A.C., I.A.P. y S.C. autorizadas por el SAT
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg border border-gray-100 p-8 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Foundation Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.pexels.com/photos/273671/pexels-photo-273671.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Oficina corporativa"
              className="rounded-2xl shadow-lg w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Fundamento legal sólido
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              DonatariaSAT está diseñado con base en las regulaciones fiscales mexicanas vigentes:
            </p>
            <div className="space-y-4">
              {[
                { code: "LISR Art. 82", desc: "Requisitos para donatarias autorizadas" },
                { code: "LISR Art. 86", desc: "Obligaciones de presentación de información" },
                { code: "RLISR Art. 138", desc: "Límite del 5% en gastos administrativos" },
                { code: "CFF Art. 29", desc: "Requisitos de comprobantes fiscales" },
                { code: "Ficha 19/ISR", desc: "Informe de transparencia" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                    {item.code}
                  </span>
                  <span className="text-gray-700">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Comienza a cumplir hoy
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Únete a las organizaciones que ya simplifican su cumplimiento fiscal con DonatariaSAT
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8 h-12" data-testid="cta-register-btn">
              Crear cuenta gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white" style={{ fontFamily: 'Chivo, sans-serif' }}>
                DonatariaSAT
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DonatariaSAT. Plataforma de cumplimiento fiscal para donatarias.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
