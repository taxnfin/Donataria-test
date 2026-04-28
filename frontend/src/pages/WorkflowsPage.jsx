import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Workflow, Trash2, Zap, Mail } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { WorkflowCard } from "../components/workflows/WorkflowComponents";

const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", trigger: "alerta_creada", condiciones: [], acciones: [], activo: true });
  const [newCondition, setNewCondition] = useState({ campo: "severidad", operador: "equals", valor: "" });
  const [newAction, setNewAction] = useState({ tipo: "email", destinatario: "", asunto: "", mensaje: "" });

  useEffect(() => { fetchWorkflows(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWorkflows = async () => { try { const r = await axios.get(`${API}/workflows`, { withCredentials: true }); setWorkflows(r.data); } catch { toast.error("Error"); } finally { setLoading(false); } };
  const handleSubmit = async () => { try { const payload = { ...form, trigger_type: form.trigger }; if (editingWorkflow) { await axios.put(`${API}/workflows/${editingWorkflow.workflow_id}`, payload, { withCredentials: true }); toast.success("Actualizado"); } else { await axios.post(`${API}/workflows`, payload, { withCredentials: true }); toast.success("Creado"); } setDialogOpen(false); resetForm(); fetchWorkflows(); } catch { toast.error("Error"); } };
  const handleToggle = async (id) => { try { const r = await axios.put(`${API}/workflows/${id}/toggle`, {}, { withCredentials: true }); toast.success(`Workflow ${r.data.activo ? "activado" : "pausado"}`); fetchWorkflows(); } catch { toast.error("Error"); } };
  const handleDelete = async (id) => { if (!confirm("Eliminar?")) return; try { await axios.delete(`${API}/workflows/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchWorkflows(); } catch { toast.error("Error"); } };
  const handleEdit = (wf) => { setEditingWorkflow(wf); setForm({ nombre: wf.nombre, descripcion: wf.descripcion || "", trigger: wf.trigger, condiciones: wf.condiciones || [], acciones: wf.acciones || [], activo: wf.activo }); setDialogOpen(true); };
  const resetForm = () => { setEditingWorkflow(null); setForm({ nombre: "", descripcion: "", trigger: "alerta_creada", condiciones: [], acciones: [], activo: true }); };
  const addCondition = () => { if (!newCondition.valor) return; setForm({ ...form, condiciones: [...form.condiciones, { ...newCondition }] }); setNewCondition({ campo: "severidad", operador: "equals", valor: "" }); };
  const removeCondition = (i) => setForm({ ...form, condiciones: form.condiciones.filter((_, idx) => idx !== i) });
  const addAction = () => { if (newAction.tipo === "email" && !newAction.destinatario) { toast.error("Ingresa destinatario"); return; } setForm({ ...form, acciones: [...form.acciones, { ...newAction }] }); setNewAction({ tipo: "email", destinatario: "", asunto: "", mensaje: "" }); };
  const removeAction = (i) => setForm({ ...form, acciones: form.acciones.filter((_, idx) => idx !== i) });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="workflows-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Workflows Automatizados</h1><p className="text-gray-500">Automatiza acciones basadas en eventos</p></div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-violet-600 hover:bg-violet-700" data-testid="add-workflow-btn"><Plus className="w-4 h-4 mr-2" /> Nuevo Workflow</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingWorkflow ? "Editar Workflow" : "Nuevo Workflow"}</DialogTitle><DialogDescription>Configura condiciones y acciones</DialogDescription></DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Notificar alertas criticas" data-testid="workflow-nombre" /></div>
                  <div className="space-y-2"><Label>Descripcion</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} /></div>
                  <div className="space-y-2"><Label>Trigger</Label><Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}><SelectTrigger data-testid="workflow-trigger"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alerta_creada">Alerta creada</SelectItem><SelectItem value="reporte_actualizado">Reporte actualizado</SelectItem><SelectItem value="donante_actualizado">Donante actualizado</SelectItem><SelectItem value="donativo_creado">Donativo creado</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Condiciones</Label>
                  {form.condiciones.map((c, i) => <div key={`${c.campo}-${c.operador}-${i}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><span className="text-sm flex-1"><strong>{c.campo}</strong> {c.operador} <strong>{c.valor}</strong></span><Button variant="ghost" size="sm" onClick={() => removeCondition(i)} className="h-6 w-6 p-0"><Trash2 className="w-3 h-3 text-red-500" /></Button></div>)}
                  <div className="grid grid-cols-4 gap-2">
                    <Select value={newCondition.campo} onValueChange={(v) => setNewCondition({ ...newCondition, campo: v })}><SelectTrigger className="text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="severidad">Severidad</SelectItem><SelectItem value="estado">Estado</SelectItem><SelectItem value="tipo">Tipo</SelectItem><SelectItem value="monto">Monto</SelectItem></SelectContent></Select>
                    <Select value={newCondition.operador} onValueChange={(v) => setNewCondition({ ...newCondition, operador: v })}><SelectTrigger className="text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equals">Igual a</SelectItem><SelectItem value="contains">Contiene</SelectItem><SelectItem value="greater_than">Mayor que</SelectItem></SelectContent></Select>
                    <Input value={newCondition.valor} onChange={(e) => setNewCondition({ ...newCondition, valor: e.target.value })} placeholder="Valor" className="text-xs" />
                    <Button variant="outline" size="sm" onClick={addCondition}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Acciones</Label>
                  {form.acciones.map((a, i) => <div key={`${a.tipo}-${a.destinatario}-${i}`} className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg"><Mail className="w-4 h-4 text-violet-600" /><span className="text-sm flex-1">Email a <strong>{a.destinatario}</strong></span><Button variant="ghost" size="sm" onClick={() => removeAction(i)} className="h-6 w-6 p-0"><Trash2 className="w-3 h-3 text-red-500" /></Button></div>)}
                  <div className="space-y-2 p-3 border border-dashed rounded-lg">
                    <Select value={newAction.tipo} onValueChange={(v) => setNewAction({ ...newAction, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Enviar Email</SelectItem><SelectItem value="crear_alerta">Crear Alerta</SelectItem></SelectContent></Select>
                    {newAction.tipo === "email" && <><Input value={newAction.destinatario} onChange={(e) => setNewAction({ ...newAction, destinatario: e.target.value })} placeholder="Email" type="email" /><Input value={newAction.asunto} onChange={(e) => setNewAction({ ...newAction, asunto: e.target.value })} placeholder="Asunto" /><Textarea value={newAction.mensaje} onChange={(e) => setNewAction({ ...newAction, mensaje: e.target.value })} placeholder="Mensaje" rows={2} /></>}
                    <Button variant="outline" size="sm" onClick={addAction} className="w-full"><Plus className="w-4 h-4 mr-2" />Agregar</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><Label>Workflow activo</Label><Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSubmit} data-testid="workflow-submit">{editingWorkflow ? "Actualizar" : "Crear"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-lg"><Zap className="w-5 h-5 text-violet-600 mt-0.5" /><div><p className="font-medium text-violet-900">Automatizacion inteligente</p><p className="text-sm text-violet-700">Los workflows se ejecutan automaticamente cuando se detectan los eventos configurados.</p></div></div>

        {loading ? <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>
        : workflows.length === 0 ? <Card className="bg-white border-gray-100"><CardContent className="text-center py-12"><Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay workflows</p><Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Crear</Button></CardContent></Card>
        : <div className="grid gap-4">{workflows.map((wf) => <WorkflowCard key={wf.workflow_id} wf={wf} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />)}</div>}
      </div>
    </DashboardLayout>
  );
};

export default WorkflowsPage;
