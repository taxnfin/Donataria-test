import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, FileText, AlertTriangle, Info } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { CFDIsTable } from "../components/cfdis/CFDIsTable";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CFDIsPage = () => {
  const [cfdis, setCfdis] = useState([]);
  const [donativos, setDonativos] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timbrarDialog, setTimbrarDialog] = useState(null);
  const [cancelarDialog, setCancelarDialog] = useState(null);
  const [filterEstado, setFilterEstado] = useState("all");
  const [formData, setFormData] = useState({ donativo_id: "", donante_id: "", monto: 0, moneda: "MXN", tipo_donativo: "no_oneroso", leyenda: "El donante no recibe bienes o servicios a cambio del donativo otorgado." });

  useEffect(() => { fetchData(); }, [filterEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const params = filterEstado !== "all" ? `?estado=${filterEstado}` : "";
      const [c, d, dn] = await Promise.all([axios.get(`${API}/cfdis${params}`, { withCredentials: true }), axios.get(`${API}/donativos`, { withCredentials: true }), axios.get(`${API}/donantes`, { withCredentials: true })]);
      setCfdis(c.data); setDonativos(d.data.filter(d => !d.cfdi_id)); setDonantes(dn.data);
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  };

  const handleDonativoSelect = (id) => { const d = donativos.find(d => d.donativo_id === id); if (d) setFormData({ ...formData, donativo_id: id, donante_id: d.donante_id, monto: d.monto, moneda: d.moneda, tipo_donativo: d.tipo_donativo }); };
  const handleSubmit = async (e) => { e.preventDefault(); if (!formData.donativo_id) { toast.error("Selecciona un donativo"); return; } try { await axios.post(`${API}/cfdis`, formData, { withCredentials: true }); toast.success("CFDI creado"); setDialogOpen(false); resetForm(); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleTimbrar = async (id) => { try { await axios.post(`${API}/cfdis/${id}/timbrar`, {}, { withCredentials: true }); toast.success("CFDI timbrado (simulacion)"); setTimbrarDialog(null); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleCancelar = async (id) => { try { await axios.post(`${API}/cfdis/${id}/cancelar`, {}, { withCredentials: true }); toast.success("CFDI cancelado"); setCancelarDialog(null); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const resetForm = () => setFormData({ donativo_id: "", donante_id: "", monto: 0, moneda: "MXN", tipo_donativo: "no_oneroso", leyenda: "El donante no recibe bienes o servicios a cambio del donativo otorgado." });

  const getDonanteName = (id) => donantes.find(d => d.donante_id === id)?.nombre || "";
  const enrichedCfdis = cfdis.map(c => ({ ...c, donante_nombre: getDonanteName(c.donante_id) }));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="cfdis-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>CFDIs de Donativos</h1><p className="text-gray-500">Comprobantes Fiscales Digitales por Internet</p></div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-violet-600 hover:bg-violet-700" data-testid="add-cfdi-btn"><Plus className="w-4 h-4 mr-2" /> Nuevo CFDI</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Emitir CFDI de Donativo</DialogTitle><DialogDescription>Selecciona un donativo para generar su comprobante fiscal</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Donativo *</Label><Select value={formData.donativo_id} onValueChange={handleDonativoSelect}><SelectTrigger data-testid="cfdi-donativo-select"><SelectValue placeholder="Seleccionar donativo" /></SelectTrigger><SelectContent>{donativos.map(d => <SelectItem key={d.donativo_id} value={d.donativo_id}>{getDonanteName(d.donante_id)} - ${d.monto?.toLocaleString()} {d.moneda}</SelectItem>)}</SelectContent></Select></div>
                {formData.donativo_id && <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm"><p><strong>Donante:</strong> {getDonanteName(formData.donante_id)}</p><p><strong>Monto:</strong> ${formData.monto?.toLocaleString()} {formData.moneda}</p><p><strong>Tipo:</strong> {formData.tipo_donativo}</p></div>}
                <div className="space-y-2"><Label>Leyenda fiscal</Label><Textarea value={formData.leyenda} onChange={(e) => setFormData({ ...formData, leyenda: e.target.value })} rows={2} /></div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" /><p className="text-xs text-amber-700">El CFDI se generara en estado "emitido". El timbrado se realiza por separado.</p></div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-violet-600 hover:bg-violet-700" data-testid="cfdi-submit-btn">Emitir CFDI</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"><Info className="w-5 h-5 text-blue-600 mt-0.5" /><div><p className="font-medium text-blue-900">Timbrado simulado</p><p className="text-sm text-blue-700">El timbrado genera un UUID de prueba. Para timbrado real, se requiere integracion con un PAC.</p></div></div>

        <Card className="bg-white border-gray-100"><CardContent className="p-4"><Select value={filterEstado} onValueChange={setFilterEstado}><SelectTrigger className="w-48" data-testid="filter-estado-cfdi"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="emitido">Emitido</SelectItem><SelectItem value="timbrado">Timbrado</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></CardContent></Card>

        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"><CardContent className="p-0">
          <CFDIsTable cfdis={enrichedCfdis} loading={loading} backendUrl={BACKEND_URL} onTimbrar={(id) => setTimbrarDialog(id)} onCancelar={(id) => setCancelarDialog(id)} />
        </CardContent></Card>

        <AlertDialog open={!!timbrarDialog} onOpenChange={() => setTimbrarDialog(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Timbrar CFDI?</AlertDialogTitle><AlertDialogDescription>Se generara un UUID fiscal simulado.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleTimbrar(timbrarDialog)} className="bg-emerald-600 hover:bg-emerald-700">Timbrar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!cancelarDialog} onOpenChange={() => setCancelarDialog(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancelar CFDI?</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>No cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleCancelar(cancelarDialog)} className="bg-red-600 hover:bg-red-700">Si, cancelar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CFDIsPage;
