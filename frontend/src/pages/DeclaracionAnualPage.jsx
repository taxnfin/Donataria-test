import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Plus, FileText, DollarSign, AlertTriangle, CheckCircle2, Download, Send, Sparkles, Trash2, PieChart
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const fmt = (v) => `$${(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const DeclaracionAnualPage = () => {
  const [declaraciones, setDeclaraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({});

  useEffect(() => { fetchDeclaraciones(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeclaraciones = async () => {
    try {
      const res = await axios.get(`${API}/declaraciones`, { withCredentials: true });
      setDeclaraciones(res.data);
    } catch { toast.error("Error al cargar declaraciones"); }
    finally { setLoading(false); }
  };

  const handleAutoFill = async () => {
    try {
      const res = await axios.get(`${API}/declaraciones/auto-fill/${year}`, { withCredentials: true });
      const data = res.data;
      setForm(prev => ({
        ...prev,
        ingresos_donativos_efectivo: data.ingresos_donativos_efectivo || "",
        ingresos_donativos_especie: data.ingresos_donativos_especie || "",
        deducciones_administracion: data.deducciones_administracion || "",
      }));
      toast.success(`Datos auto-llenados: $${(data.ingresos_donativos_efectivo || 0).toLocaleString()} en donativos`);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || "Error desconocido";
      toast.error(`Error al auto-llenar: ${msg}`);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ejercicio_fiscal: year });
    setDialogOpen(true);
  };

  const openEdit = (dec) => {
    setEditing(dec);
    setForm({ ...dec });
    setYear(dec.ejercicio_fiscal);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert empty strings to 0 for all numeric fields
      const payload = { ...form, ejercicio_fiscal: editing ? form.ejercicio_fiscal : year };
      const numericFields = [
        "ingresos_donativos_efectivo", "ingresos_donativos_especie", "ingresos_cuotas_asociados",
        "ingresos_actividades_propias", "ingresos_actividades_no_relacionadas", "ingresos_intereses",
        "ingresos_otros", "deducciones_operacion", "deducciones_administracion", "deducciones_financieros",
        "deducciones_otros", "ficto_omision_ingresos", "ficto_compras_no_realizadas",
        "ficto_prestamos_socios", "ficto_gastos_no_deducibles",
      ];
      for (const field of numericFields) {
        payload[field] = parseFloat(payload[field]) || 0;
      }

      if (editing) {
        await axios.put(`${API}/declaraciones/${editing.declaracion_id}`, payload, { withCredentials: true });
        toast.success("Declaracion actualizada");
      } else {
        await axios.post(`${API}/declaraciones`, payload, { withCredentials: true });
        toast.success("Declaracion creada");
      }
      setDialogOpen(false);
      fetchDeclaraciones();
    } catch (e) { toast.error(e.response?.data?.detail || "Error al guardar"); }
    finally { setSaving(false); }
  };

  const handlePresentar = async (dec) => {
    try {
      await axios.post(`${API}/declaraciones/${dec.declaracion_id}/presentar`, {}, { withCredentials: true });
      toast.success("Declaracion marcada como presentada");
      fetchDeclaraciones();
    } catch (e) { toast.error(e.response?.data?.detail || "Error al presentar"); }
  };

  const handleDelete = async (dec) => {
    if (!window.confirm("Eliminar esta declaracion?")) return;
    try {
      await axios.delete(`${API}/declaraciones/${dec.declaracion_id}`, { withCredentials: true });
      toast.success("Declaracion eliminada");
      fetchDeclaraciones();
    } catch { toast.error("Error al eliminar"); }
  };

  const handleDownloadPdf = (dec) => {
    window.open(`${BACKEND_URL}/api/declaraciones/${dec.declaracion_id}/pdf`, "_blank");
  };

  const f = (field) => {
    const val = form[field];
    if (val === undefined || val === null || val === "") return "";
    return val;
  };
  const setF = (field, val) => {
    const str = String(val).trim();
    setForm(prev => ({ ...prev, [field]: str === "" ? "" : parseFloat(str) || 0 }));
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="declaracion-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Declaracion Anual</h1>
            <p className="text-gray-500">Titulo III LISR - Personas Morales con Fines No Lucrativos</p>
          </div>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700" data-testid="new-declaracion-btn">
            <Plus className="w-4 h-4 mr-2" /> Nueva Declaracion
          </Button>
        </div>

        {declaraciones.length === 0 ? (
          <Card className="bg-white border-gray-100"><CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay declaraciones anuales registradas</p>
            <Button onClick={openCreate} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Crear primera declaracion</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {declaraciones.map((dec) => {
              const c = dec.calculos || {};
              const c10 = c.control_10_porciento || {};
              return (
                <Card key={dec.declaracion_id} className="bg-white border-gray-100 shadow-sm" data-testid={`dec-${dec.declaracion_id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">Ejercicio Fiscal {dec.ejercicio_fiscal}</h3>
                          <Badge className={dec.estado === "presentada" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                            {dec.estado === "presentada" ? "Presentada" : "Borrador"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(dec)} data-testid={`pdf-${dec.declaracion_id}`}><Download className="w-4 h-4" /></Button>
                        {dec.estado !== "presentada" && <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(dec)}>Editar</Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePresentar(dec)}><Send className="w-4 h-4 mr-1" />Presentar</Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(dec)}><Trash2 className="w-4 h-4" /></Button>
                        </>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xs text-emerald-600 font-medium">Total Ingresos</p>
                        <p className="text-lg font-bold text-emerald-800">{fmt(c.total_ingresos)}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 font-medium">Total Deducciones</p>
                        <p className="text-lg font-bold text-red-800">{fmt(c.total_deducciones)}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Remanente</p>
                        <p className="text-lg font-bold text-blue-800">{fmt(c.remanente_distribuible)}</p>
                        {c.remanente_ficto > 0 && <p className="text-xs text-orange-600 mt-1">+ Ficto: {fmt(c.remanente_ficto)}</p>}
                      </div>
                      <div className={`p-3 rounded-lg ${c10.excede_limite ? "bg-red-50" : "bg-gray-50"}`}>
                        <p className="text-xs font-medium flex items-center gap-1">
                          {c10.excede_limite ? <AlertTriangle className="w-3 h-3 text-red-600" /> : <CheckCircle2 className="w-3 h-3 text-green-600" />}
                          Control 10%
                        </p>
                        <p className={`text-lg font-bold ${c10.excede_limite ? "text-red-700" : "text-gray-800"}`}>{c10.porcentaje_no_relacionadas || 0}%</p>
                        {c10.excede_limite && <p className="text-xs text-red-600">Excede limite</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nueva"} Declaracion Anual</DialogTitle>
              <DialogDescription>Titulo III LISR - Personas Morales con Fines No Lucrativos</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {!editing && (
                <div className="flex items-end gap-3">
                  <div className="space-y-2 flex-1">
                    <Label>Ejercicio Fiscal</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                      <SelectTrigger data-testid="year-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={handleAutoFill} data-testid="auto-fill-btn">
                    <Sparkles className="w-4 h-4 mr-2" /> Auto-llenar desde datos
                  </Button>
                </div>
              )}

              <Separator />
              <h4 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> I. Ingresos</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["ingresos_donativos_efectivo", "Donativos en efectivo"],
                  ["ingresos_donativos_especie", "Donativos en especie"],
                  ["ingresos_cuotas_asociados", "Cuotas de asociados"],
                  ["ingresos_actividades_propias", "Actividades propias del objeto social"],
                  ["ingresos_actividades_no_relacionadas", "Actividades NO relacionadas"],
                  ["ingresos_intereses", "Intereses y rendimientos"],
                  ["ingresos_otros", "Otros ingresos"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.01" value={f(key)} onChange={e => setF(key, e.target.value)} placeholder="0.00" data-testid={`input-${key}`} />
                  </div>
                ))}
              </div>

              <Separator />
              <h4 className="font-semibold text-gray-900 flex items-center gap-2"><PieChart className="w-4 h-4 text-red-600" /> II. Deducciones</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["deducciones_operacion", "Gastos de operacion"],
                  ["deducciones_administracion", "Gastos de administracion"],
                  ["deducciones_financieros", "Gastos financieros"],
                  ["deducciones_otros", "Otras deducciones"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.01" value={f(key)} onChange={e => setF(key, e.target.value)} placeholder="0.00" data-testid={`input-${key}`} />
                  </div>
                ))}
              </div>

              <Separator />
              <h4 className="font-semibold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-600" /> III. Remanente Distribuible Ficto</h4>
              <p className="text-xs text-gray-500">Art. 79 LISR - Aplica cuando existan erogaciones no deducibles, prestamos a socios u omision de ingresos</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["ficto_omision_ingresos", "Omision de ingresos"],
                  ["ficto_compras_no_realizadas", "Compras no realizadas"],
                  ["ficto_prestamos_socios", "Prestamos a socios/integrantes"],
                  ["ficto_gastos_no_deducibles", "Gastos no deducibles"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.01" value={f(key)} onChange={e => setF(key, e.target.value)} placeholder="0.00" data-testid={`input-${key}`} />
                  </div>
                ))}
              </div>

              <Separator />
              <div className="space-y-1">
                <Label className="text-xs">Notas</Label>
                <Textarea value={form.notas || ""} onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))} placeholder="Observaciones adicionales..." rows={3} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-declaracion-btn">
                {saving ? "Guardando..." : editing ? "Actualizar" : "Crear Declaracion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DeclaracionAnualPage;
