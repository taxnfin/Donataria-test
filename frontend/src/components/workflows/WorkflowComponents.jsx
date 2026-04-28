import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Play, Pause, MoreHorizontal, Trash2, Mail, Bell, ArrowRight, Zap, Settings, Workflow as WorkflowIcon } from "lucide-react";

const triggerLabels = { alerta_creada: "Alerta creada", reporte_actualizado: "Reporte actualizado", donante_actualizado: "Donante actualizado", donativo_creado: "Donativo creado" };
const triggerIcons = { alerta_creada: Bell, reporte_actualizado: Mail, donante_actualizado: Settings, donativo_creado: Zap };

export const WorkflowCard = ({ wf, onToggle, onEdit, onDelete }) => {
  const TIcon = triggerIcons[wf.trigger] || Zap;
  return (
    <Card className={`bg-white border-gray-100 ${!wf.activo && "opacity-60"}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${wf.activo ? "bg-violet-100" : "bg-gray-100"}`}>
            <TIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{wf.nombre}</h3>
              <Badge variant={wf.activo ? "default" : "outline"} className={wf.activo ? "bg-green-100 text-green-700" : ""}>
                {wf.activo ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                {wf.activo ? "Activo" : "Pausado"}
              </Badge>
            </div>
            {wf.descripcion && <p className="text-sm text-gray-500 mb-3">{wf.descripcion}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{triggerLabels[wf.trigger] || wf.trigger}</Badge>
              {wf.condiciones?.length > 0 && <><ArrowRight className="w-4 h-4 text-gray-400" /><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{wf.condiciones.length} condicion(es)</Badge></>}
              <ArrowRight className="w-4 h-4 text-gray-400" />
              {wf.acciones?.map((action, i) => (
                <Badge key={`${action.tipo}-${i}`} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                  {action.tipo === "email" ? <Mail className="w-3 h-3 mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
                  {action.tipo === "email" ? "Enviar email" : "Crear alerta"}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Ejecutado {wf.ejecuciones} vez(es)</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={wf.activo} onCheckedChange={() => onToggle(wf.workflow_id)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(wf)}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(wf.workflow_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const WorkflowFormDialog = ({ form, setForm, newCondition, setNewCondition, newAction, setNewAction, addCondition, removeCondition, addAction, removeAction, editing, onSubmit, open, onOpenChange }) => (
  <div className="space-y-6 py-4">
    <div className="space-y-4">
      <div className="space-y-2"><label className="text-sm font-medium">Nombre del workflow</label><input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Notificar alertas criticas" data-testid="workflow-nombre" /></div>
      <div className="space-y-2"><label className="text-sm font-medium">Descripcion</label><textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion del workflow" rows={2} /></div>
    </div>
    <div className="space-y-3">
      <label className="text-base font-semibold">Condiciones</label>
      {form.condiciones.length > 0 && form.condiciones.map((cond, i) => (
        <div key={`${cond.campo}-${cond.operador}-${i}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <span className="text-sm flex-1"><strong>{cond.campo}</strong> {cond.operador} <strong>{cond.valor}</strong></span>
          <button onClick={() => removeCondition(i)} className="h-6 w-6 p-0 text-red-500">&times;</button>
        </div>
      ))}
    </div>
    <div className="space-y-3">
      <label className="text-base font-semibold">Acciones</label>
      {form.acciones.length > 0 && form.acciones.map((action, i) => (
        <div key={`${action.tipo}-${action.destinatario}-${i}`} className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg">
          <Mail className="w-4 h-4 text-violet-600" />
          <span className="text-sm flex-1">Enviar email a <strong>{action.destinatario}</strong></span>
          <button onClick={() => removeAction(i)} className="h-6 w-6 p-0 text-red-500">&times;</button>
        </div>
      ))}
    </div>
  </div>
);
