import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus } from "lucide-react";

export const AlertRuleDialog = ({ open, onOpenChange, form, setForm, editing, onSubmit, onReset }) => (
  <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onReset(); }}>
    <DialogTrigger asChild>
      <Button className="bg-red-600 hover:bg-red-700" data-testid="add-regla-btn">
        <Plus className="w-4 h-4 mr-2" /> Nueva Regla
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar Regla" : "Nueva Regla de Alerta"}</DialogTitle>
        <DialogDescription>Configura las condiciones para generar alertas automaticas</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Nombre de la regla</Label>
          <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Umbral de transaccion" data-testid="regla-nombre" />
        </div>
        <div className="space-y-2">
          <Label>Descripcion</Label>
          <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion de la regla" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de regla</Label>
            <Select value={form.tipo_regla} onValueChange={(v) => setForm({ ...form, tipo_regla: v, condiciones: {} })}>
              <SelectTrigger data-testid="regla-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="umbral_monto">Umbral de Monto</SelectItem>
                <SelectItem value="nivel_riesgo_donante">Nivel Riesgo Donante</SelectItem>
                <SelectItem value="keywords_descripcion">Keywords Sospechosos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severidad</Label>
            <Select value={form.severidad} onValueChange={(v) => setForm({ ...form, severidad: v })}>
              <SelectTrigger data-testid="regla-severidad"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Critica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.tipo_regla === "umbral_monto" && (
          <div className="space-y-2">
            <Label>Monto minimo (MXN)</Label>
            <Input type="number" value={form.condiciones.monto_minimo || ""} onChange={(e) => setForm({ ...form, condiciones: { ...form.condiciones, monto_minimo: e.target.value } })} placeholder="100000" data-testid="regla-monto" />
          </div>
        )}
        {form.tipo_regla === "keywords_descripcion" && (
          <div className="space-y-2">
            <Label>Keywords (separados por coma)</Label>
            <Textarea value={form.condiciones.keywords || ""} onChange={(e) => setForm({ ...form, condiciones: { ...form.condiciones, keywords: e.target.value } })} placeholder="efectivo, urgente, anonimo" data-testid="regla-keywords" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Label>Regla activa</Label>
          <Switch checked={form.activa} onCheckedChange={(v) => setForm({ ...form, activa: v })} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button className="bg-red-600 hover:bg-red-700" onClick={onSubmit} data-testid="regla-submit">{editing ? "Actualizar" : "Crear Regla"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
