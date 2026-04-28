import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { FilePlus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const reporteTypes = [
  { value: "str_sar", label: "Reporte de Transaccion Sospechosa (STR/SAR)" },
  { value: "operacion_relevante", label: "Operaciones Relevantes" },
  { value: "operacion_inusual", label: "Operaciones Inusuales" },
  { value: "donantes_pep", label: "Donantes PEP" },
  { value: "reporte_mensual", label: "Reporte Mensual" },
];

const destinatarios = ["UIF", "SAT", "Consejo Directivo", "Comite de Cumplimiento", "Otro"];

export const ReporteFormDialog = ({ open, onOpenChange, form, setForm, onSubmit, onReset }) => (
  <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onReset(); }}>
    <DialogTrigger asChild>
      <Button className="bg-violet-600 hover:bg-violet-700" data-testid="generar-reporte-btn">
        <FilePlus className="w-4 h-4 mr-2" /> Generar Reporte
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Generar Reporte</DialogTitle>
        <DialogDescription>Crea un nuevo reporte para presentar ante las autoridades</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Titulo del reporte</Label>
          <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Reporte STR Q1 2026" data-testid="reporte-titulo" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger data-testid="reporte-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>{reporteTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destinatario</Label>
            <Select value={form.destinatario} onValueChange={(v) => setForm({ ...form, destinatario: v })}>
              <SelectTrigger data-testid="reporte-destinatario"><SelectValue /></SelectTrigger>
              <SelectContent>{destinatarios.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Periodo Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.periodo_inicio ? format(form.periodo_inicio, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.periodo_inicio} onSelect={(d) => setForm({ ...form, periodo_inicio: d })} locale={es} /></PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Periodo Fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.periodo_fin ? format(form.periodo_fin, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.periodo_fin} onSelect={(d) => setForm({ ...form, periodo_fin: d })} locale={es} /></PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descripcion</Label>
          <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle del reporte" rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={onSubmit} data-testid="reporte-submit">Generar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const PlantillaFormDialog = ({ open, onOpenChange, form, setForm, onSubmit, onReset }) => (
  <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onReset(); }}>
    <DialogTrigger asChild>
      <Button variant="outline" data-testid="crear-plantilla-btn"><FilePlus className="w-4 h-4 mr-2" /> Nueva Plantilla</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Nueva Plantilla de Reporte</DialogTitle>
        <DialogDescription>Crea una plantilla reutilizable para generacion rapida</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Nombre de la plantilla</Label>
          <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Reporte Mensual UIF" data-testid="plantilla-nombre" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de reporte</Label>
            <Select value={form.tipo_reporte} onValueChange={(v) => setForm({ ...form, tipo_reporte: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{reporteTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Periodicidad</Label>
            <Select value={form.periodicidad} onValueChange={(v) => setForm({ ...form, periodicidad: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Destinatario</Label>
          <Select value={form.destinatario} onValueChange={(v) => setForm({ ...form, destinatario: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{destinatarios.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Descripcion</Label>
          <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripcion de la plantilla" rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={onSubmit} data-testid="plantilla-submit">Crear Plantilla</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
