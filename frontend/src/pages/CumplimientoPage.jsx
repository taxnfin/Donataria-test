import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  ShieldCheck,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  ArrowRight,
  Target
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CumplimientoPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API}/cumplimiento`, { withCredentials: true });
      setData(response.data);
    } catch (error) {
      toast.error("Error al cargar métricas de cumplimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${BACKEND_URL}/api/cumplimiento/pdf`, '_blank');
  };

  const getNivelConfig = (nivel) => {
    const config = {
      excelente: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", ring: "stroke-emerald-500", label: "Excelente" },
      bueno: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", ring: "stroke-blue-500", label: "Bueno" },
      regular: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", ring: "stroke-amber-500", label: "Regular" },
      critico: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", ring: "stroke-red-500", label: "Critico" }
    };
    return config[nivel] || config.regular;
  };

  const getUrgenciaBadge = (urgencia) => {
    const config = {
      verde: { className: "bg-green-100 text-green-700", label: "> 30 días" },
      ambar: { className: "bg-amber-100 text-amber-700", label: "8-30 días" },
      rojo: { className: "bg-red-100 text-red-700", label: "Urgente" },
      vencida: { className: "bg-gray-100 text-gray-600", label: "Vencida" }
    };
    const c = config[urgencia] || config.verde;
    return <Badge className={`${c.className} hover:${c.className}`}>{c.label}</Badge>;
  };

  const getBarColor = (porcentaje) => {
    if (porcentaje >= 80) return "#059669";
    if (porcentaje >= 60) return "#0284c7";
    if (porcentaje >= 40) return "#d97706";
    return "#dc2626";
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

  const nivelConfig = data ? getNivelConfig(data.nivel) : getNivelConfig("regular");
  const circumference = 2 * Math.PI * 54;
  const scoreOffset = circumference - (circumference * (data?.score || 0)) / 100;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="cumplimiento-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Métricas de Cumplimiento
            </h1>
            <p className="text-gray-500">Ejercicio fiscal {data?.ejercicio_fiscal || new Date().getFullYear()}</p>
          </div>
          <Button
            onClick={handleDownloadPDF}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="download-compliance-pdf"
          >
            <Download className="w-4 h-4 mr-2" /> Descargar Reporte PDF
          </Button>
        </div>

        {/* Score + Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <Card className={`${nivelConfig.bg} ${nivelConfig.border} border`} data-testid="compliance-score-card">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative w-36 h-36 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    className={nivelConfig.ring}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={scoreOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${nivelConfig.color}`} data-testid="score-value">
                    {data?.score || 0}%
                  </span>
                </div>
              </div>
              <Badge className={`${nivelConfig.bg} ${nivelConfig.color} text-sm px-3 py-1 hover:${nivelConfig.bg}`} data-testid="score-nivel">
                <ShieldCheck className="w-4 h-4 mr-1" /> {nivelConfig.label}
              </Badge>
              <p className="text-sm text-gray-500 mt-3 text-center">Score de Cumplimiento</p>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="total-obligations">{data?.resumen?.total || 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600" data-testid="cumplidas-count">{data?.resumen?.cumplidas || 0}</p>
                    <p className="text-xs text-gray-500">Cumplidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600" data-testid="pendientes-count">{data?.resumen?.pendientes || 0}</p>
                    <p className="text-xs text-gray-500">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600" data-testid="en-proceso-count">{data?.resumen?.en_proceso || 0}</p>
                    <p className="text-xs text-gray-500">En Proceso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600" data-testid="vencidas-count">{data?.resumen?.vencidas || 0}</p>
                    <p className="text-xs text-gray-500">Vencidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600" data-testid="omitidas-count">{data?.resumen?.omitidas || 0}</p>
                    <p className="text-xs text-gray-500">Omitidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Compliance Chart */}
          <Card className="bg-white border-gray-100" data-testid="chart-mensual">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Cumplimiento por Mes
              </CardTitle>
              <CardDescription>Porcentaje de obligaciones cumplidas por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chart_mensual || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "porcentaje") return [`${value}%`, "Cumplimiento"];
                        return [value, name];
                      }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="porcentaje" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {(data?.chart_mensual || []).map((entry, index) => (
                        <Cell key={entry.nombre || index} fill={getBarColor(entry.porcentaje)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card className="bg-white border-gray-100" data-testid="chart-tendencia">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Tendencia del Score
              </CardTitle>
              <CardDescription>Evolución del cumplimiento en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.tendencia || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ fill: "#059669", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Type Breakdown + Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Type Breakdown */}
          <Card className="bg-white border-gray-100" data-testid="desglose-tipo">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Desglose por Tipo
              </CardTitle>
              <CardDescription>Cumplimiento por categoría de obligación</CardDescription>
            </CardHeader>
            <CardContent>
              {(data?.desglose_tipo || []).length === 0 ? (
                <p className="text-center text-gray-400 py-8">Sin datos</p>
              ) : (
                <div className="space-y-4">
                  {(data?.desglose_tipo || []).map((item, index) => (
                    <div key={item.tipo || index} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 truncate mr-3">{item.tipo}</span>
                        <span className={`text-sm font-bold ${
                          item.porcentaje >= 80 ? "text-emerald-600" :
                          item.porcentaje >= 60 ? "text-blue-600" :
                          item.porcentaje >= 40 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {item.cumplidas}/{item.total} ({item.porcentaje}%)
                        </span>
                      </div>
                      <Progress
                        value={item.porcentaje}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="bg-white border-gray-100" data-testid="proximas-vencer">
            <CardHeader>
              <CardTitle className="text-base" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Próximas a Vencer
              </CardTitle>
              <CardDescription>Obligaciones pendientes en los próximos 30 días</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.proximas_vencer || []).length === 0 ? (
                <div className="text-center py-8 px-6">
                  <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                  <p className="text-gray-400">Sin obligaciones próximas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="text-xs uppercase">Obligación</TableHead>
                      <TableHead className="text-xs uppercase">Días</TableHead>
                      <TableHead className="text-xs uppercase">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.proximas_vencer || []).map((item, index) => (
                      <TableRow key={item.obligacion_id || index} className="hover:bg-gray-50/50">
                        <TableCell>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(item.fecha_limite).toLocaleDateString('es-MX')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-bold ${
                            item.dias_restantes <= 3 ? "text-red-600" :
                            item.dias_restantes <= 7 ? "text-amber-600" : "text-gray-600"
                          }`}>
                            {item.dias_restantes}d
                          </span>
                        </TableCell>
                        <TableCell>
                          {getUrgenciaBadge(item.urgencia)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900">Reporte para Auditores</p>
                <p className="text-sm text-emerald-700">
                  Descarga el reporte en PDF para compartir con auditores del SAT.
                  Incluye score de cumplimiento, desglose de obligaciones y detalle completo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CumplimientoPage;
