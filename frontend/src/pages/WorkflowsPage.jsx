import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Plus, 
  Workflow,
  Play,
  Pause,
  MoreHorizontal,
  Trash2,
  Zap,
  Mail,
  Bell,
  ArrowRight,
  Settings
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    trigger: "alerta_creada",
    condiciones: [],
    acciones: [],
    activo: true
  });

  // Temp state for building conditions and actions
  const [newCondition, setNewCondition] = useState({ campo: "severidad", operador: "equals", valor: "" });
  const [newAction, setNewAction] = useState({ tipo: "email", destinatario: "", asunto: "", mensaje: "" });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get(`${API}/workflows`, { withCredentials: true });
      setWorkflows(response.data);
    } catch (error) {
      toast.error("Error al cargar workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresa un nombre para el workflow");
      return;
    }

    try {
      if (editingWorkflow) {
        await axios.put(`${API}/workflows/${editingWorkflow.workflow_id}`, form, { withCredentials: true });
        toast.success("Workflow actualizado");
      } else {
        await axios.post(`${API}/workflows`, form, { withCredentials: true });
        toast.success("Workflow creado");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      toast.error("Error al guardar workflow");
    }
  };

  const handleToggle = async (workflowId) => {
    try {
      const res = await axios.put(`${API}/workflows/${workflowId}/toggle`, {}, { withCredentials: true });
      toast.success(`Workflow ${res.data.activo ? "activado" : "pausado"}`);
      fetchWorkflows();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (workflowId) => {
    if (!confirm("¿Eliminar este workflow?")) return;
    try {
      await axios.delete(`${API}/workflows/${workflowId}`, { withCredentials: true });
      toast.success("Workflow eliminado");
      fetchWorkflows();
    } catch (error) {
      toast.error("Error al eliminar workflow");
    }
  };

  const handleEdit = (wf) => {
    setEditingWorkflow(wf);
    setForm({
      nombre: wf.nombre,
      descripcion: wf.descripcion || "",
      trigger: wf.trigger,
      condiciones: wf.condiciones || [],
      acciones: wf.acciones || [],
      activo: wf.activo
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingWorkflow(null);
    setForm({
      nombre: "",
      descripcion: "",
      trigger: "alerta_creada",
      condiciones: [],
      acciones: [],
      activo: true
    });
    setNewCondition({ campo: "severidad", operador: "equals", valor: "" });
    setNewAction({ tipo: "email", destinatario: "", asunto: "", mensaje: "" });
  };

  const addCondition = () => {
    if (!newCondition.valor) return;
    setForm({
      ...form,
      condiciones: [...form.condiciones, { ...newCondition }]
    });
    setNewCondition({ campo: "severidad", operador: "equals", valor: "" });
  };

  const removeCondition = (index) => {
    setForm({
      ...form,
      condiciones: form.condiciones.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    if (newAction.tipo === "email" && !newAction.destinatario) return;
    setForm({
      ...form,
      acciones: [...form.acciones, { ...newAction }]
    });
    setNewAction({ tipo: "email", destinatario: "", asunto: "", mensaje: "" });
  };

  const removeAction = (index) => {
    setForm({
      ...form,
      acciones: form.acciones.filter((_, i) => i !== index)
    });
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      alerta_creada: "Cuando se crea una alerta",
      reporte_actualizado: "Cuando se actualiza un reporte",
      donante_actualizado: "Cuando se actualiza un donante",
      donativo_creado: "Cuando se registra un donativo"
    };
    return labels[trigger] || trigger;
  };

  const getTriggerIcon = (trigger) => {
    const icons = {
      alerta_creada: Bell,
      reporte_actualizado: Workflow,
      donante_actualizado: Settings,
      donativo_creado: Zap
    };
    const Icon = icons[trigger] || Zap;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="workflows-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Workflows Automatizados
            </h1>
            <p className="text-gray-500">Automatiza acciones basadas en eventos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700" data-testid="add-workflow-btn">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingWorkflow ? "Editar Workflow" : "Nuevo Workflow"}</DialogTitle>
                <DialogDescription>
                  Configura las condiciones y acciones del workflow
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del workflow</Label>
                    <Input
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej: Notificar alertas críticas"
                      data-testid="workflow-nombre"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      placeholder="Descripción del workflow"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger (Evento que activa el workflow)</Label>
                    <Select
                      value={form.trigger}
                      onValueChange={(v) => setForm({ ...form, trigger: v })}
                    >
                      <SelectTrigger data-testid="workflow-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alerta_creada">Cuando se crea una alerta</SelectItem>
                        <SelectItem value="reporte_actualizado">Cuando se actualiza un reporte</SelectItem>
                        <SelectItem value="donante_actualizado">Cuando se actualiza un donante</SelectItem>
                        <SelectItem value="donativo_creado">Cuando se registra un donativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Condiciones (opcional)</Label>
                  <p className="text-xs text-gray-500">El workflow solo se ejecutará si se cumplen estas condiciones</p>
                  
                  {form.condiciones.length > 0 && (
                    <div className="space-y-2">
                      {form.condiciones.map((cond, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm flex-1">
                            <strong>{cond.campo}</strong> {cond.operador} <strong>{cond.valor}</strong>
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeCondition(index)} className="h-6 w-6 p-0">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <Select
                      value={newCondition.campo}
                      onValueChange={(v) => setNewCondition({ ...newCondition, campo: v })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severidad">Severidad</SelectItem>
                        <SelectItem value="estado">Estado</SelectItem>
                        <SelectItem value="tipo">Tipo</SelectItem>
                        <SelectItem value="monto">Monto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newCondition.operador}
                      onValueChange={(v) => setNewCondition({ ...newCondition, operador: v })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Igual a</SelectItem>
                        <SelectItem value="contains">Contiene</SelectItem>
                        <SelectItem value="greater_than">Mayor que</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newCondition.valor}
                      onChange={(e) => setNewCondition({ ...newCondition, valor: e.target.value })}
                      placeholder="Valor"
                      className="text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Acciones</Label>
                  <p className="text-xs text-gray-500">Acciones a ejecutar cuando se active el workflow</p>
                  
                  {form.acciones.length > 0 && (
                    <div className="space-y-2">
                      {form.acciones.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg">
                          <Mail className="w-4 h-4 text-violet-600" />
                          <span className="text-sm flex-1">
                            Enviar email a <strong>{action.destinatario}</strong>
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeAction(index)} className="h-6 w-6 p-0">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 p-3 border border-dashed rounded-lg">
                    <Select
                      value={newAction.tipo}
                      onValueChange={(v) => setNewAction({ ...newAction, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Enviar Email</SelectItem>
                        <SelectItem value="crear_alerta">Crear Alerta</SelectItem>
                      </SelectContent>
                    </Select>

                    {newAction.tipo === "email" && (
                      <>
                        <Input
                          value={newAction.destinatario}
                          onChange={(e) => setNewAction({ ...newAction, destinatario: e.target.value })}
                          placeholder="Email destinatario"
                          type="email"
                        />
                        <Input
                          value={newAction.asunto}
                          onChange={(e) => setNewAction({ ...newAction, asunto: e.target.value })}
                          placeholder="Asunto del email"
                        />
                        <Textarea
                          value={newAction.mensaje}
                          onChange={(e) => setNewAction({ ...newAction, mensaje: e.target.value })}
                          placeholder="Mensaje"
                          rows={2}
                        />
                      </>
                    )}

                    <Button variant="outline" size="sm" onClick={addAction} className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Agregar Acción
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label>Workflow activo</Label>
                  <Switch
                    checked={form.activo}
                    onCheckedChange={(v) => setForm({ ...form, activo: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleSubmit} data-testid="workflow-submit">
                  {editingWorkflow ? "Actualizar" : "Crear Workflow"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <Zap className="w-5 h-5 text-violet-600 mt-0.5" />
          <div>
            <p className="font-medium text-violet-900">Automatización inteligente</p>
            <p className="text-sm text-violet-700">
              Los workflows se ejecutan automáticamente cuando se detectan los eventos configurados.
              Configura condiciones para filtrar cuándo deben activarse.
            </p>
          </div>
        </div>

        {/* Workflows List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : workflows.length === 0 ? (
          <Card className="bg-white border-gray-100">
            <CardContent className="text-center py-12">
              <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay workflows configurados</p>
              <Button 
                className="mt-4 bg-violet-600 hover:bg-violet-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Crear primer workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workflows.map((wf) => (
              <Card key={wf.workflow_id} className={`bg-white border-gray-100 ${!wf.activo && "opacity-60"}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${wf.activo ? "bg-violet-100" : "bg-gray-100"}`}>
                      {getTriggerIcon(wf.trigger)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{wf.nombre}</h3>
                        <Badge variant={wf.activo ? "default" : "outline"} className={wf.activo ? "bg-green-100 text-green-700" : ""}>
                          {wf.activo ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                          {wf.activo ? "Activo" : "Pausado"}
                        </Badge>
                      </div>
                      
                      {wf.descripcion && (
                        <p className="text-sm text-gray-500 mb-3">{wf.descripcion}</p>
                      )}
                      
                      {/* Workflow Visual */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getTriggerLabel(wf.trigger)}
                        </Badge>
                        
                        {wf.condiciones?.length > 0 && (
                          <>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {wf.condiciones.length} condición(es)
                            </Badge>
                          </>
                        )}
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        
                        {wf.acciones?.map((action, i) => (
                          <Badge key={i} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                            {action.tipo === "email" ? <Mail className="w-3 h-3 mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
                            {action.tipo === "email" ? "Enviar email" : "Crear alerta"}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-3">
                        Ejecutado {wf.ejecuciones} vez(es)
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={wf.activo}
                        onCheckedChange={() => handleToggle(wf.workflow_id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(wf)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(wf.workflow_id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkflowsPage;
