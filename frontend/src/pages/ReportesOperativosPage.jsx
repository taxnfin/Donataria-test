import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  BarChart as BarChartIcon, Users, DollarSign, Globe, Package, FileText, AlertTriangle, CheckCircle2, XCircle, Building, ArrowRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const fmt = (v) => `$${(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ReportesOperativosPage = () => {
  const [data, setData] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("resumen");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [opRes, fichaRes] = await Promise.all([
        axios.get(`${API}/dashboard/reportes-operativos`, { withCredentials: true }),
        axios.get(`${API}/dashboard/ficha-publica`, { withCredentials: true }),
      ]);
      setData(opRes.data);
      setFicha(fichaRes.data);
    } catch { toast.error("Error al cargar reportes"); }
    finally { setLoading(false); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div></DashboardLayout>;

  const d = data || {};
  const conc = d.conciliacion || {};
  const c80 = d.concentracion_80_20 || {};

  const tipoColors = { efectivo: "#059669", transferencia: "#3b82f6", especie: "#8b5cf6", cheque: "#f59e0b", otro: "#6b7280" };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="reportes-operativos-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Reportes Operativos</h1>
          <p className="text-gray-500">Analisis de donativos, concentracion, conciliacion y transparencia publica</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Donativos</p>
            <p className="text-xl font-bold text-gray-900">{d.resumen?.total_donativos || 0}</p>
            <p className="text-xs text-emerald-600">{fmt(d.resumen?.total_monto)}</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Donantes Activos</p>
            <p className="text-xl font-bold text-blue-600">{d.resumen?.total_donantes_activos || 0}</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">En Especie</p>
            <p className="text-xl font-bold text-violet-600">{d.especie?.total || 0}</p>
            <p className="text-xs text-gray-400">{fmt(d.especie?.monto)}</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Del Extranjero</p>
            <p className="text-xl font-bold text-orange-600">{d.extranjero?.total || 0}</p>
            <p className="text-xs text-gray-400">{fmt(d.extranjero?.monto)}</p>
          </CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="resumen">Resumen por Tipo</TabsTrigger>
            <TabsTrigger value="top">Top Donantes</TabsTrigger>
            <TabsTrigger value="especie">En Especie</TabsTrigger>
            <TabsTrigger value="extranjero">Extranjero</TabsTrigger>
            <TabsTrigger value="conciliacion">Conciliacion CFDI</TabsTrigger>
            <TabsTrigger value="ficha">Ficha Publica</TabsTrigger>
          </TabsList>

          {/* Por Tipo */}
          <TabsContent value="resumen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-white"><CardHeader><CardTitle className="text-base">Donativos por Tipo</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.por_tipo || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="tipo" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => [fmt(v), "Monto"]} />
                        <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                          {(d.por_tipo || []).map((entry, i) => <Cell key={i} fill={tipoColors[entry.tipo] || "#6b7280"} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent></Card>
              <Card className="bg-white"><CardHeader><CardTitle className="text-base">Concentracion 80/20</CardTitle>
                <CardDescription>Analisis de concentracion de riesgo</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg border-l-4 ${c80.alerta_concentracion ? "bg-amber-50 border-amber-500" : "bg-green-50 border-green-500"}`}>
                    {c80.alerta_concentracion ? (
                      <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" /><div><p className="text-sm font-medium text-amber-800">Alta concentracion</p><p className="text-xs text-amber-700">Solo {c80.donantes_para_80_pct} donante(s) representan el 80% de los ingresos</p></div></div>
                    ) : (
                      <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" /><div><p className="text-sm font-medium text-green-800">Concentracion saludable</p><p className="text-xs text-green-700">{c80.donantes_para_80_pct} donantes representan el 80% ({c80.porcentaje_concentracion}% del total)</p></div></div>
                    )}
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Donantes para 80%</span><span className="font-medium">{c80.donantes_para_80_pct}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total donantes activos</span><span className="font-medium">{c80.total_donantes}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">% Concentracion</span><span className="font-medium">{c80.porcentaje_concentracion}%</span></div>
                  </div>
                </CardContent></Card>
            </div>
          </TabsContent>

          {/* Top Donantes */}
          <TabsContent value="top">
            <Card className="bg-white"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Top Donantes y Concentracion de Riesgo</CardTitle></CardHeader>
              <CardContent>
                <Table><TableHeader><TableRow>
                  <TableHead>#</TableHead><TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-right">%</TableHead><TableHead className="text-right">Acumulado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(d.top_donantes || []).map((t, i) => (
                    <TableRow key={t.donante_id}>
                      <TableCell className="font-medium text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium">{t.nombre}</TableCell>
                      <TableCell className="font-mono text-xs">{t.rfc}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(t.monto)}</TableCell>
                      <TableCell className="text-right">{t.porcentaje}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={t.acumulado_pct} className="h-1.5 w-16" />
                          <span className="text-xs">{t.acumulado_pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              </CardContent></Card>
          </TabsContent>

          {/* Especie */}
          <TabsContent value="especie">
            <Card className="bg-white"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-violet-600" /> Donativos en Especie</CardTitle>
              <CardDescription>Con avaluo y soporte documental</CardDescription></CardHeader>
              <CardContent>
                {(d.especie?.detalle || []).length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay donativos en especie registrados</p> : (
                  <Table><TableHeader><TableRow>
                    <TableHead>Donante</TableHead><TableHead className="text-right">Monto/Valor</TableHead><TableHead>Descripcion</TableHead><TableHead>Fecha</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(d.especie?.detalle || []).map(e => (
                      <TableRow key={e.donativo_id}>
                        <TableCell className="font-medium">{e.donante}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(e.monto)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{e.descripcion || "-"}</TableCell>
                        <TableCell className="text-sm">{(e.fecha || "").substring(0, 10)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table>
                )}
              </CardContent></Card>
          </TabsContent>

          {/* Extranjero */}
          <TabsContent value="extranjero">
            <Card className="bg-white"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-orange-600" /> Donativos del Extranjero</CardTitle>
              <CardDescription>Con tratamiento fiscal especifico</CardDescription></CardHeader>
              <CardContent>
                {(d.extranjero?.detalle || []).length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay donativos del extranjero</p> : (
                  <Table><TableHeader><TableRow>
                    <TableHead>Donante</TableHead><TableHead>Pais</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Moneda</TableHead><TableHead>Fecha</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(d.extranjero?.detalle || []).map(e => (
                      <TableRow key={e.donativo_id}>
                        <TableCell className="font-medium">{e.donante}</TableCell>
                        <TableCell>{e.pais || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(e.monto)}</TableCell>
                        <TableCell><Badge variant="outline">{e.moneda}</Badge></TableCell>
                        <TableCell className="text-sm">{(e.fecha || "").substring(0, 10)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table>
                )}
              </CardContent></Card>
          </TabsContent>

          {/* Conciliacion */}
          <TabsContent value="conciliacion">
            <Card className="bg-white"><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Conciliacion CFDI vs Donativos</CardTitle>
              <CardDescription>CFDIs emitidos vs donativos registrados</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500 mb-1">Donativos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">{conc.donativos_total}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-green-600 mb-1">Con CFDI</p>
                    <p className="text-2xl font-bold text-green-700">{conc.donativos_con_cfdi}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <p className="text-xs text-amber-600 mb-1">Sin CFDI</p>
                    <p className="text-2xl font-bold text-amber-700">{conc.donativos_sin_cfdi}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600 mb-1">CFDIs Emitidos</p>
                    <p className="text-2xl font-bold text-blue-700">{conc.cfdis_emitidos}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600 mb-1">CFDIs Timbrados</p>
                    <p className="text-2xl font-bold text-emerald-700">{conc.cfdis_timbrados}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-red-600 mb-1">CFDIs Cancelados</p>
                    <p className="text-2xl font-bold text-red-700">{conc.cfdis_cancelados}</p>
                  </div>
                </div>
                {conc.donativos_sin_cfdi > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800">Hay {conc.donativos_sin_cfdi} donativo(s) sin CFDI emitido. <Link to="/cfdis" className="underline font-medium">Gestionar CFDIs</Link></p>
                  </div>
                )}
              </CardContent></Card>
          </TabsContent>

          {/* Ficha Publica */}
          <TabsContent value="ficha">
            {ficha && (
              <Card className="bg-white"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Building className="w-4 h-4 text-emerald-600" /> Ficha Publica de Transparencia</CardTitle>
                <CardDescription>Informacion que debe estar disponible en el portal de la donataria</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <p className="font-semibold text-gray-900">{ficha.organizacion?.nombre}</p>
                    <p className="text-sm text-gray-600">RFC: {ficha.organizacion?.rfc || "Pendiente"}</p>
                    <p className="text-sm text-gray-600">Rubro: {ficha.organizacion?.rubro}</p>
                    <p className="text-sm text-gray-600">Ejercicio: {ficha.ejercicio_fiscal}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Estado de Ingresos y Egresos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50 rounded-lg"><p className="text-xs text-emerald-600">Donativos Recibidos</p><p className="font-bold text-emerald-800">{fmt(ficha.ingresos_egresos?.total_donativos_recibidos)}</p></div>
                      <div className="p-3 bg-violet-50 rounded-lg"><p className="text-xs text-violet-600">Donativos en Especie</p><p className="font-bold text-violet-800">{fmt(ficha.ingresos_egresos?.total_donativos_especie)}</p></div>
                      <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-amber-600">Gastos Administrativos</p><p className="font-bold text-amber-800">{fmt(ficha.ingresos_egresos?.total_gastos_admin)} ({ficha.ingresos_egresos?.porcentaje_gastos_admin}%)</p></div>
                      <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-blue-600">Donativos Otorgados</p><p className="font-bold text-blue-800">{fmt(ficha.ingresos_egresos?.total_donativos_otorgados)}</p></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Actividades y Beneficiarios</h4>
                    <p className="text-sm text-gray-700">{ficha.actividades?.descripcion || "Sin descripcion de actividades"}</p>
                    <p className="text-sm text-gray-600 mt-2">Beneficiarios atendidos: <span className="font-semibold">{(ficha.actividades?.numero_beneficiarios || 0).toLocaleString()}</span></p>
                    <p className="text-sm text-gray-600">Donantes activos: <span className="font-semibold">{ficha.donantes_activos}</span></p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Estado del informe:</span>
                    <Badge className={ficha.estado_informe === "presentado" ? "bg-green-100 text-green-700" : ficha.estado_informe === "borrador" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}>
                      {ficha.estado_informe === "sin_informe" ? "Sin informe" : ficha.estado_informe}
                    </Badge>
                  </div>
                </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportesOperativosPage;
