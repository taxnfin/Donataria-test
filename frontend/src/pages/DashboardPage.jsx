import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  DollarSign, 
  Users, 
  FileText, 
  PieChart,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Shield,
  Fingerprint,
  Scale,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [semaforo, setSemaforo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, complianceRes, semaforoRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API}/cumplimiento`, { withCredentials: true }).catch(() => ({ data: null })),
        axios.get(`${API}/dashboard/semaforo`, { withCredentials: true }).catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setCompliance(complianceRes.data);
      setSemaforo(semaforoRes.data);
    } catch (error) {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const getUrgencyColor = (urgencia) => {
    switch (urgencia) {
      case "verde": return "bg-green-500";
      case "ambar": return "bg-amber-500";
      case "rojo": return "bg-red-500";
      case "vencida": return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  const getUrgencyBadge = (urgencia) => {
    switch (urgencia) {
      case "verde": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">&gt; 30 días</Badge>;
      case "ambar": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">8-30 días</Badge>;
      case "rojo": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">≤ 7 días</Badge>;
      case "vencida": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Vencida</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Dashboard
            </h1>
            <p className="text-gray-500">Resumen del ejercicio fiscal {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/donantes">
              <Button variant="outline" className="gap-2" data-testid="quick-add-donante">
                <Plus className="w-4 h-4" /> Nuevo Donante
              </Button>
            </Link>
            <Link to="/donativos">
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="quick-add-donativo">
                <Plus className="w-4 h-4" /> Registrar Donativo
              </Button>
            </Link>
          </div>
        </div>

        {/* Critical Alert */}
        {stats?.alerta_gastos && (
          <div 
            className={`p-4 rounded-lg border-l-4 ${
              stats.alerta_gastos.tipo === "critico" 
                ? "bg-red-50 border-red-600" 
                : "bg-amber-50 border-amber-500"
            }`}
            data-testid="alerta-gastos"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                stats.alerta_gastos.tipo === "critico" ? "text-red-600" : "text-amber-600"
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${
                  stats.alerta_gastos.tipo === "critico" ? "text-red-900" : "text-amber-900"
                }`}>
                  {stats.alerta_gastos.mensaje}
                </p>
                <Link to="/transparencia" className="text-sm text-emerald-600 hover:underline mt-1 inline-block">
                  Ver Informe de Transparencia →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200" data-testid="kpi-donativos">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Donativos</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {formatCurrency(stats?.total_donativos || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Ejercicio actual</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200" data-testid="kpi-donantes">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Donantes Registrados</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.total_donantes || 0}
                  </p>
                  <Link to="/donantes" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">
                    Ver todos →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200" data-testid="kpi-cfdis">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">CFDIs Emitidos</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.total_cfdis || 0}
                  </p>
                  <Link to="/cfdis" className="text-violet-600 text-sm hover:underline mt-2 inline-block">
                    Gestionar →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200" data-testid="kpi-gastos">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">% Gastos Admin</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.porcentaje_gastos_admin?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Límite: 5% (Art. 138 RLISR)</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-3">
                <Progress 
                  value={Math.min((stats?.porcentaje_gastos_admin || 0) * 20, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Obligations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donativos por Mes Chart */}
          <Card className="lg:col-span-2 bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" data-testid="chart-donativos">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Donativos por Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.donativos_por_mes || []}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Monto"]}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="monto" 
                      stroke="#059669" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMonto)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Obligaciones Próximas */}
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" data-testid="obligaciones-proximas">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Obligaciones Próximas
              </CardTitle>
              <Link to="/calendario">
                <Button variant="ghost" size="sm" className="text-emerald-600">
                  Ver todo
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.obligaciones_proximas?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay obligaciones próximas</p>
              ) : (
                stats?.obligaciones_proximas?.map((obl, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${getUrgencyColor(obl.urgencia)}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{obl.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(obl.fecha_limite).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {getUrgencyBadge(obl.urgencia)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Semaforo de Cumplimiento */}
        {semaforo && (
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" data-testid="semaforo-widget">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full animate-pulse ${
                  semaforo.semaforo === "verde" ? "bg-green-500" :
                  semaforo.semaforo === "ambar" ? "bg-amber-500" : "bg-red-500"
                }`} />
                <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Semaforo de Cumplimiento
                </h3>
                <span className={`ml-auto text-2xl font-bold ${
                  semaforo.score_general >= 80 ? "text-green-600" :
                  semaforo.score_general >= 60 ? "text-amber-600" : "text-red-600"
                }`}>
                  {semaforo.score_general}%
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(semaforo.indicadores).map(([key, ind]) => (
                  <Link key={key} to={key === "cumplimiento" ? "/cumplimiento" : key === "kyc" ? "/pld" : key === "control_10" ? "/declaracion-anual" : "/alertas"}>
                    <div className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                      ind.color === "verde" ? "border-green-200 bg-green-50/50" :
                      ind.color === "ambar" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {ind.color === "verde" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> :
                         ind.color === "ambar" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> :
                         <XCircle className="w-3.5 h-3.5 text-red-600" />}
                        <span className="text-xs font-medium text-gray-600">{ind.label}</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        ind.color === "verde" ? "text-green-700" :
                        ind.color === "ambar" ? "text-amber-700" : "text-red-700"
                      }`}>
                        {key === "control_10" ? `${ind.porcentaje}%` : `${ind.score}%`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{ind.detalle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/donativos">
            <Card className="bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nuevo Donativo</p>
                  <p className="text-xs text-gray-500">Registrar donación</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/cfdis">
            <Card className="bg-white border-gray-100 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Emitir CFDI</p>
                  <p className="text-xs text-gray-500">Comprobante fiscal</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/donantes">
            <Card className="bg-white border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Agregar Donante</p>
                  <p className="text-xs text-gray-500">Nuevo registro</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/transparencia">
            <Card className="bg-white border-gray-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Informe Anual</p>
                  <p className="text-xs text-gray-500">Ficha 19/ISR</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
