import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Gift, Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { DonativosTable } from "../components/donativos/DonativosTable";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DonativosPage = () => {
  const [donativos, setDonativos] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ donante_id: "", monto: "", moneda: "MXN", tipo_donativo: "no_oneroso", tipo_cambio: "", es_especie: false, descripcion_especie: "", valor_avaluo: "", fecha_donativo: new Date(), notas: "" });

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [d, dn] = await Promise.all([axios.get(`${API}/donativos`, { withCredentials: true }), axios.get(`${API}/donantes`, { withCredentials: true })]);
      setDonativos(d.data); setDonantes(dn.data);
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.donante_id) { toast.error("Selecciona un donante"); return; }
    try {
      const payload = { ...formData, monto: parseFloat(formData.monto), tipo_cambio: formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null, valor_avaluo: formData.valor_avaluo ? parseFloat(formData.valor_avaluo) : null, fecha_donativo: formData.fecha_donativo.toISOString() };
      await axios.post(`${API}/donativos`, payload, { withCredentials: true });
      toast.success("Donativo registrado"); setDialogOpen(false); resetForm(); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  const handleDelete = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/donativos/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchData(); } catch { toast.error("Error"); } };
  const resetForm = () => setFormData({ donante_id: "", monto: "", moneda: "MXN", tipo_donativo: "no_oneroso", tipo_cambio: "", es_especie: false, descripcion_especie: "", valor_avaluo: "", fecha_donativo: new Date(), notas: "" });

  const enrichedDonativos = donativos.map(d => ({ ...d, donante_nombre: donantes.find(dn => dn.donante_id === d.donante_id)?.nombre || "Desconocido" }));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="donativos-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Donativos</h1><p className="text-gray-500">Registro de donativos recibidos</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`${BACKEND_URL}/api/exportar/donativos`, '_blank')} data-testid="export-donativos-btn"><Download className="w-4 h-4 mr-2" />CSV</Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="add-donativo-btn"><Plus className="w-4 h-4" /> Nuevo Donativo</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registrar Donativo</DialogTitle><DialogDescription>Registra un nuevo donativo recibido</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Donante *</Label><Select value={formData.donante_id} onValueChange={(v) => setFormData({ ...formData, donante_id: v })}><SelectTrigger data-testid="donativo-donante-select"><SelectValue placeholder="Seleccionar donante" /></SelectTrigger><SelectContent>{donantes.map(d => <SelectItem key={d.donante_id} value={d.donante_id}>{d.nombre} ({d.rfc})</SelectItem>)}</SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Monto *</Label><Input type="number" step="0.01" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} required data-testid="donativo-monto-input" /></div>
                    <div className="space-y-2"><Label>Moneda</Label><Select value={formData.moneda} onValueChange={(v) => setFormData({ ...formData, moneda: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MXN">MXN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></div>
                  </div>
                  {formData.moneda !== "MXN" && <div className="space-y-2"><Label>Tipo de cambio</Label><Input type="number" step="0.01" value={formData.tipo_cambio} onChange={(e) => setFormData({ ...formData, tipo_cambio: e.target.value })} /></div>}
                  <div className="space-y-2"><Label>Tipo de donativo</Label><Select value={formData.tipo_donativo} onValueChange={(v) => setFormData({ ...formData, tipo_donativo: v })}><SelectTrigger data-testid="donativo-tipo-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no_oneroso">No oneroso (sin contraprestacion)</SelectItem><SelectItem value="oneroso">Oneroso (con contraprestacion parcial)</SelectItem></SelectContent></Select></div>
                  <div className="flex items-center space-x-2"><Checkbox checked={formData.es_especie} onCheckedChange={(c) => setFormData({ ...formData, es_especie: c })} /><Label className="text-sm">Es donativo en especie</Label></div>
                  {formData.es_especie && <><div className="space-y-2"><Label>Descripcion especie</Label><Textarea value={formData.descripcion_especie} onChange={(e) => setFormData({ ...formData, descripcion_especie: e.target.value })} /></div><div className="space-y-2"><Label>Valor de avaluo</Label><Input type="number" step="0.01" value={formData.valor_avaluo} onChange={(e) => setFormData({ ...formData, valor_avaluo: e.target.value })} /></div></>}
                  <div className="space-y-2"><Label>Fecha del donativo</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{format(formData.fecha_donativo, "PPP", { locale: es })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.fecha_donativo} onSelect={(d) => d && setFormData({ ...formData, fecha_donativo: d })} /></PopoverContent></Popover></div>
                  <div className="space-y-2"><Label>Notas</Label><Textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows={2} /></div>
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="donativo-submit-btn">Registrar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"><CardContent className="p-0">
          <DonativosTable donativos={enrichedDonativos} loading={loading} onEdit={() => {}} onDelete={handleDelete} />
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
};

export default DonativosPage;
