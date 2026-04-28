import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Plus, Calendar as CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { ObligacionCard } from "../components/calendario/ObligacionCard";

const CalendarioPage = () => {
  const [obligaciones, setObligaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState("all");
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", fundamento_legal: "", fecha_limite: new Date(), notas: "" });

  useEffect(() => { fetchObligaciones(); }, [filterEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchObligaciones = async () => { try { const params = filterEstado !== "all" ? `?estado=${filterEstado}` : ""; const r = await axios.get(`${API}/obligaciones${params}`, { withCredentials: true }); setObligaciones(r.data); } catch { toast.error("Error"); } finally { setLoading(false); } };
  const handleSubmit = async (e) => { e.preventDefault(); try { await axios.post(`${API}/obligaciones`, { ...formData, fecha_limite: formData.fecha_limite.toISOString() }, { withCredentials: true }); toast.success("Obligacion creada"); setDialogOpen(false); resetForm(); fetchObligaciones(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleUpdateEstado = async (id, estado) => { try { await axios.put(`${API}/obligaciones/${id}`, { estado }, { withCredentials: true }); toast.success("Estado actualizado"); fetchObligaciones(); } catch { toast.error("Error"); } };
  const handleDelete = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/obligaciones/${id}`, { withCredentials: true }); toast.success("Eliminada"); fetchObligaciones(); } catch { toast.error("Error"); } };
  const resetForm = () => setFormData({ nombre: "", descripcion: "", fundamento_legal: "", fecha_limite: new Date(), notas: "" });

  const stats = { total: obligaciones.length, cumplidas: obligaciones.filter(o => o.estado === "cumplida").length, pendientes: obligaciones.filter(o => o.estado === "pendiente").length, vencidas: obligaciones.filter(o => o.estado === "pendiente" && o.dias_restantes < 0).length };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="calendario-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Calendario Fiscal</h1><p className="text-gray-500">Obligaciones fiscales y plazos</p></div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-obligacion-btn"><Plus className="w-4 h-4 mr-2" /> Nueva Obligacion</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nueva Obligacion Fiscal</DialogTitle><DialogDescription>Registra una nueva obligacion</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required data-testid="obligacion-nombre" /></div>
                <div className="space-y-2"><Label>Descripcion</Label><Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>Fundamento legal</Label><Input value={formData.fundamento_legal} onChange={(e) => setFormData({ ...formData, fundamento_legal: e.target.value })} placeholder="Ej: Art. 86 LISR" /></div>
                <div className="space-y-2"><Label>Fecha limite</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(formData.fecha_limite, "PPP", { locale: es })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fecha_limite} onSelect={(d) => d && setFormData({ ...formData, fecha_limite: d })} /></PopoverContent></Popover></div>
                <div className="space-y-2"><Label>Notas</Label><Textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows={2} /></div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="obligacion-submit">Crear</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-sm text-gray-500">Cumplidas</p><p className="text-2xl font-bold text-green-600">{stats.cumplidas}</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-sm text-gray-500">Pendientes</p><p className="text-2xl font-bold text-amber-600">{stats.pendientes}</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-sm text-gray-500">Vencidas</p><p className="text-2xl font-bold text-red-600">{stats.vencidas}</p></CardContent></Card>
        </div>

        <Card className="bg-white border-gray-100"><CardContent className="p-4"><Select value={filterEstado} onValueChange={setFilterEstado}><SelectTrigger className="w-48" data-testid="filter-estado-calendario"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="pendiente">Pendientes</SelectItem><SelectItem value="en_proceso">En proceso</SelectItem><SelectItem value="cumplida">Cumplidas</SelectItem><SelectItem value="omitida">Omitidas</SelectItem></SelectContent></Select></CardContent></Card>

        {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
        : obligaciones.length === 0 ? <Card className="bg-white"><CardContent className="text-center py-12"><CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay obligaciones</p></CardContent></Card>
        : <div className="grid gap-3">{obligaciones.map(obl => <ObligacionCard key={obl.obligacion_id} obl={obl} onUpdateEstado={handleUpdateEstado} onDelete={handleDelete} />)}</div>}
      </div>
    </DashboardLayout>
  );
};

export default CalendarioPage;
