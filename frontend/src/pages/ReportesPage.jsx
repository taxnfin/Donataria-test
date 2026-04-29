import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { FileText, FilePlus, Calendar as CalendarIcon, LayoutTemplate, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { ReportesTable, PlantillasGrid } from "../components/reportes/ReporteComponents";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ReportesPage = () => {
  const [activeTab, setActiveTab] = useState("reportes");
  const [reportes, setReportes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [plantillaDialogOpen, setPlantillaDialogOpen] = useState(false);
  const [reporteForm, setReporteForm] = useState({ titulo: "", tipo: "str_sar", descripcion: "", destinatario: "UIF", periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)), periodo_fin: new Date() });
  const [plantillaForm, setPlantillaForm] = useState({ nombre: "", tipo_reporte: "str_sar", descripcion: "", criterios: {}, formato: "PDF", destinatario: "UIF", periodicidad: "manual" });

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [r, p] = await Promise.all([
        axios.get(`${API}/reportes`, { withCredentials: true }),
        axios.get(`${API}/reportes/plantillas`, { withCredentials: true })
      ]);
      setReportes(r.data); setPlantillas(p.data);
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const handleCreateReporte = async () => {
    try {
      const payload = { ...reporteForm, periodo_inicio: reporteForm.periodo_inicio.toISOString(), periodo_fin: reporteForm.periodo_fin.toISOString() };
      if (reporteForm.template_id) payload.template_id = reporteForm.template_id;
      await axios.post(`${API}/reportes`, payload, { withCredentials: true });
      toast.success("Reporte generado"); setReporteDialogOpen(false); resetReporteForm(); fetchData();
    } catch { toast.error("Error al generar reporte"); }
  };

  const handleCreatePlantilla = async () => {
    try {
      await axios.post(`${API}/reportes/plantillas`, plantillaForm, { withCredentials: true });
      toast.success("Plantilla creada"); setPlantillaDialogOpen(false); resetPlantillaForm(); fetchData();
    } catch { toast.error("Error al crear plantilla"); }
  };

  const handleUpdateReporteEstado = async (id, estado) => {
    try { await axios.put(`${API}/reportes/${id}/estado?estado=${estado}`, {}, { withCredentials: true }); toast.success("Estado actualizado"); fetchData(); }
    catch { toast.error("Error al actualizar estado"); }
  };

  const handleDeleteReporte = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/reportes/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchData(); } catch { toast.error("Error"); } };
  const handleDeletePlantilla = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/reportes/plantillas/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchData(); } catch { toast.error("Error"); } };
  const handleUseTemplate = (p) => { setReporteForm({ titulo: `${p.nombre} - ${new Date().toLocaleDateString('es-MX')}`, tipo: p.tipo_reporte, descripcion: p.descripcion || "", destinatario: p.destinatario, periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)), periodo_fin: new Date(), template_id: p.template_id }); setReporteDialogOpen(true); setActiveTab("reportes"); };
  const resetReporteForm = () => setReporteForm({ titulo: "", tipo: "str_sar", descripcion: "", destinatario: "UIF", periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)), periodo_fin: new Date() });
  const resetPlantillaForm = () => setPlantillaForm({ nombre: "", tipo_reporte: "str_sar", descripcion: "", criterios: {}, formato: "PDF", destinatario: "UIF", periodicidad: "manual" });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="reportes-page">
        <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Modulo de Reportes</h1><p className="text-gray-500">Generacion de reportes para UIF/SAT</p></div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reportes" data-testid="tab-reportes"><FileText className="w-4 h-4 mr-2" /> Reportes ({reportes.length})</TabsTrigger>
            <TabsTrigger value="plantillas" data-testid="tab-plantillas"><LayoutTemplate className="w-4 h-4 mr-2" /> Plantillas ({plantillas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reportes" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={reporteDialogOpen} onOpenChange={(o) => { setReporteDialogOpen(o); if (!o) resetReporteForm(); }}>
                <DialogTrigger asChild><Button className="bg-violet-600 hover:bg-violet-700" data-testid="generar-reporte-btn"><FilePlus className="w-4 h-4 mr-2" /> Generar Reporte</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader><DialogTitle>Generar Nuevo Reporte</DialogTitle><DialogDescription>Configura los parametros del reporte</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Titulo</Label><Input value={reporteForm.titulo} onChange={(e) => setReporteForm({ ...reporteForm, titulo: e.target.value })} placeholder="Reporte STR - Marzo 2026" data-testid="reporte-titulo" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Tipo</Label><Select value={reporteForm.tipo} onValueChange={(v) => setReporteForm({ ...reporteForm, tipo: v })}><SelectTrigger data-testid="reporte-tipo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="str_sar">STR/SAR</SelectItem><SelectItem value="operacion_relevante">Ops. Relevantes</SelectItem><SelectItem value="operacion_inusual">Ops. Inusuales</SelectItem><SelectItem value="donantes_pep">Donantes PEP</SelectItem><SelectItem value="reporte_mensual">Mensual</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Destinatario</Label><Select value={reporteForm.destinatario} onValueChange={(v) => setReporteForm({ ...reporteForm, destinatario: v })}><SelectTrigger data-testid="reporte-destinatario"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UIF">UIF</SelectItem><SelectItem value="SAT">SAT</SelectItem><SelectItem value="interno">Interno</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Periodo inicio</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(reporteForm.periodo_inicio, "PPP", { locale: es })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reporteForm.periodo_inicio} onSelect={(d) => d && setReporteForm({ ...reporteForm, periodo_inicio: d })} /></PopoverContent></Popover></div>
                      <div className="space-y-2"><Label>Periodo fin</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(reporteForm.periodo_fin, "PPP", { locale: es })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={reporteForm.periodo_fin} onSelect={(d) => d && setReporteForm({ ...reporteForm, periodo_fin: d })} /></PopoverContent></Popover></div>
                    </div>
                    <div className="space-y-2"><Label>Descripcion</Label><Textarea value={reporteForm.descripcion} onChange={(e) => setReporteForm({ ...reporteForm, descripcion: e.target.value })} placeholder="Notas adicionales..." /></div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setReporteDialogOpen(false)}>Cancelar</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreateReporte} data-testid="reporte-submit">Generar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <ReportesTable reportes={reportes} loading={loading} onDownloadPDF={(id) => window.open(`${BACKEND_URL}/api/reportes/${id}/pdf`, '_blank')} onUpdateEstado={handleUpdateReporteEstado} onDelete={handleDeleteReporte} />
          </TabsContent>

          <TabsContent value="plantillas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={plantillaDialogOpen} onOpenChange={(o) => { setPlantillaDialogOpen(o); if (!o) resetPlantillaForm(); }}>
                <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="crear-plantilla-btn"><Plus className="w-4 h-4 mr-2" /> Nueva Plantilla</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader><DialogTitle>Nueva Plantilla de Reporte</DialogTitle><DialogDescription>Crea una plantilla reutilizable</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={plantillaForm.nombre} onChange={(e) => setPlantillaForm({ ...plantillaForm, nombre: e.target.value })} placeholder="Reporte mensual UIF" data-testid="plantilla-nombre" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Tipo</Label><Select value={plantillaForm.tipo_reporte} onValueChange={(v) => setPlantillaForm({ ...plantillaForm, tipo_reporte: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="str_sar">STR/SAR</SelectItem><SelectItem value="operacion_relevante">Op. Relevantes</SelectItem><SelectItem value="donantes_pep">Donantes PEP</SelectItem><SelectItem value="reporte_mensual">Mensual</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Periodicidad</Label><Select value={plantillaForm.periodicidad} onValueChange={(v) => setPlantillaForm({ ...plantillaForm, periodicidad: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="diario">Diario</SelectItem><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="mensual">Mensual</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Destinatario</Label><Select value={plantillaForm.destinatario} onValueChange={(v) => setPlantillaForm({ ...plantillaForm, destinatario: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UIF">UIF</SelectItem><SelectItem value="SAT">SAT</SelectItem><SelectItem value="interno">Interno</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Formato</Label><Select value={plantillaForm.formato} onValueChange={(v) => setPlantillaForm({ ...plantillaForm, formato: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PDF">PDF</SelectItem><SelectItem value="CSV">CSV</SelectItem><SelectItem value="Excel">Excel</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="space-y-2"><Label>Descripcion</Label><Textarea value={plantillaForm.descripcion} onChange={(e) => setPlantillaForm({ ...plantillaForm, descripcion: e.target.value })} placeholder="Descripcion..." /></div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setPlantillaDialogOpen(false)}>Cancelar</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreatePlantilla} data-testid="plantilla-submit">Crear</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"><PlantillasGrid plantillas={plantillas} onUseTemplate={handleUseTemplate} onDelete={handleDeletePlantilla} /></div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportesPage;
