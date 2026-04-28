import { Card, CardContent } from "../ui/card";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export const AnalyticsSection = ({ analytics }) => {
  if (!analytics) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Donativos {new Date().getFullYear()}</p>
            <p className="text-xl font-bold text-gray-900">${(analytics.comparativa_anual?.donativos_actual || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${analytics.comparativa_anual?.variacion_pct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              <TrendingUp className="w-3 h-3" />
              <span>{analytics.comparativa_anual?.variacion_pct > 0 ? "+" : ""}{analytics.comparativa_anual?.variacion_pct}% vs anio anterior</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Promedio por Donativo</p>
            <p className="text-xl font-bold text-blue-600">${(analytics.metricas?.promedio_donativo || 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-gray-400 mt-1">{analytics.metricas?.total_donativos || 0} donativos totales</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Donantes Nuevos (este anio)</p>
            <p className="text-xl font-bold text-violet-600">{analytics.comparativa_anual?.donantes_nuevos_actual || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{analytics.comparativa_anual?.donantes_nuevos_anterior || 0} el anio anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Tendencia de Donativos (12 meses)</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.tendencias?.donativos_mensual || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Monto"]} />
                  <Area type="monotone" dataKey="monto" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Alertas AML Generadas vs Resueltas</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.tendencias?.alertas_mensual || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="generadas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Generadas" />
                  <Bar dataKey="resueltas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Resueltas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
