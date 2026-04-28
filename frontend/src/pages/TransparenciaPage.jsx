import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, ClipboardList, Info } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { InformeCard } from "../components/transparencia/InformeCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TransparenciaPage = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInforme, setEditingInforme] = useState(null);
  const [presentarDialog, setPresentarDialog] = useState(null);
  const [newYear, setNewYear] = useState(new Date().getFullYear() - 1);
  const [formData, setFormData] = useState({ total_donativos_recibidos: 0, total_donativos_especie: 0, total_donativos_otorgados: 0, total_gastos_admin: 0, descripcion_actividades: "", numero_beneficiarios: 0, influencia_legislacion: false, detalle_influencia: "" });

  useEffect(() => { fetchInformes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInformes = async () => { try { const r = await axios.get(`${API}/transparencia`, { withCredentials: true }); setInformes(r.data); } catch { toast.error("Error"); } finally { setLoading(false); } };
  const handleCreate = async () => { try { await axios.post(`${API}/transparencia`, { ejercicio_fiscal: newYear }, { withCredentials: true }); toast.success(`Informe ${newYear} creado`); setDialogOpen(false); fetchInformes(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleUpdate = async () => { if (!editingInforme) return; try { await axios.put(`${API}/transparencia/${editingInforme.informe_id}`, formData, { withCredentials: true }); toast.success("Actualizado"); setEditingInforme(null); fetchInformes(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handlePresentar = async (id) => { try { await axios.post(`${API}/transparencia/${id}/presentar`, {}, { withCredentials: true }); toast.success("Presentado"); setPresentarDialog(null); fetchInformes(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleDelete = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/transparencia/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchInformes(); } catch { toast.error("Error"); } };
  const handleEdit = (inf) => { setEditingInforme(inf); setFormData({ total_donativos_recibidos: inf.total_donativos_recibidos || 0, total_donativos_especie: inf.total_donativos_especie || 0, total_donativos_otorgados: inf.total_donativos_otorgados || 0, total_gastos_admin: inf.total_gastos_admin || 0, descripcion_actividades: inf.descripcion_actividades || "", numero_beneficiarios: inf.numero_beneficiarios || 0, influencia_legislacion: inf.influencia_legislacion || false, detalle_influencia: inf.detalle_influencia || "" }); };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="transparencia-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Transparencia (Ficha 19/ISR)</h1><p className="text-gray-500">Informes de transparencia y uso de donativos</p></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="add-informe-btn"><Plus className="w-4 h-4 mr-2" /> Nuevo Informe</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nuevo Informe</DialogTitle><DialogDescription>Crea un informe para un ejercicio fiscal</DialogDescription></DialogHeader>
              <div className="py-4 space-y-4"><div className="space-y-2"><Label>Ejercicio Fiscal</Label><Select value={String(newYear)} onValueChange={(v) => setNewYear(parseInt(v))}><SelectTrigger data-testid="informe-year"><SelectValue /></SelectTrigger><SelectContent>{[2023, 2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div></div>
              <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} data-testid="informe-submit">Crear</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"><Info className="w-5 h-5 text-emerald-600 mt-0.5" /><div><p className="font-medium text-emerald-900">Art. 82 LISR - Ficha 19/ISR</p><p className="text-sm text-emerald-700">Obligatorio para donatarias autorizadas. Se presenta anualmente.</p></div></div>

        {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
        : informes.length === 0 ? <Card className="bg-white"><CardContent className="text-center py-12"><ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay informes</p></CardContent></Card>
        : <div className="grid md:grid-cols-2 gap-4">{informes.map(inf => <InformeCard key={inf.informe_id} informe={inf} backendUrl={BACKEND_URL} onEdit={handleEdit} onDelete={handleDelete} onPresentar={(id) => setPresentarDialog(id)} />)}</div>}

        {/* Edit Dialog */}
        <Dialog open={!!editingInforme} onOpenChange={(o) => { if (!o) setEditingInforme(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Informe - Ejercicio {editingInforme?.ejercicio_fiscal}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Donativos recibidos (efectivo)</Label><Input type="number" step="0.01" value={formData.total_donativos_recibidos} onChange={(e) => setFormData({ ...formData, total_donativos_recibidos: parseFloat(e.target.value) || 0 })} data-testid="informe-donativos" /></div>
                <div className="space-y-2"><Label>Donativos en especie</Label><Input type="number" step="0.01" value={formData.total_donativos_especie} onChange={(e) => setFormData({ ...formData, total_donativos_especie: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Donativos otorgados a terceros</Label><Input type="number" step="0.01" value={formData.total_donativos_otorgados} onChange={(e) => setFormData({ ...formData, total_donativos_otorgados: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Gastos de administracion</Label><Input type="number" step="0.01" value={formData.total_gastos_admin} onChange={(e) => setFormData({ ...formData, total_gastos_admin: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="space-y-2"><Label>Numero de beneficiarios</Label><Input type="number" value={formData.numero_beneficiarios} onChange={(e) => setFormData({ ...formData, numero_beneficiarios: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Descripcion de actividades</Label><Textarea value={formData.descripcion_actividades} onChange={(e) => setFormData({ ...formData, descripcion_actividades: e.target.value })} rows={4} placeholder="Detalle las actividades realizadas..." /></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.influencia_legislacion} onCheckedChange={(c) => setFormData({ ...formData, influencia_legislacion: c })} /><Label>Actividades de influencia en legislacion</Label></div>
              {formData.influencia_legislacion && <div className="space-y-2"><Label>Detalle de influencia</Label><Textarea value={formData.detalle_influencia} onChange={(e) => setFormData({ ...formData, detalle_influencia: e.target.value })} rows={3} /></div>}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setEditingInforme(null)}>Cancelar</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpdate} data-testid="informe-update">Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!presentarDialog} onOpenChange={() => setPresentarDialog(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Presentar informe?</AlertDialogTitle><AlertDialogDescription>Una vez presentado no podra editarse.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handlePresentar(presentarDialog)} className="bg-emerald-600 hover:bg-emerald-700">Presentar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TransparenciaPage;
