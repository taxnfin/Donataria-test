import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
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
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { 
  Plus, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Info,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const CalendarioPage = () => {
  const [obligaciones, setObligaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterEstado, setFilterEstado] = useState("all");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fundamento_legal: "",
    fecha_limite: new Date(),
    notas: ""
  });

  useEffect(() => {
    fetchObligaciones();
  }, [filterEstado]);

  const fetchObligaciones = async () => {
    try {
      const params = filterEstado !== "all" ? `?estado=${filterEstado}` : "";
      const response = await axios.get(`${API}/obligaciones${params}`, {
        withCredentials: true
      });
      setObligaciones(response.data);
    } catch (error) {
      toast.error("Error al cargar obligaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/obligaciones`, {
        ...formData,
        fecha_limite: formData.fecha_limite.toISOString()
      }, {
        withCredentials: true
      });
      
      toast.success("Obligación creada");
      setDialogOpen(false);
      resetForm();
      fetchObligaciones();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear obligación";
      toast.error(message);
    }
  };

  const handleUpdateEstado = async (obligacionId, estado) => {
    try {
      await axios.put(`${API}/obligaciones/${obligacionId}/estado?estado=${estado}`, {}, {
        withCredentials: true
      });
      toast.success("Estado actualizado");
      fetchObligaciones();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      fundamento_legal: "",
      fecha_limite: new Date(),
      notas: ""
    });
  };

  const getUrgencyStyles = (urgencia) => {
    switch (urgencia) {
      case "verde":
        return { dot: "bg-green-500", bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
      case "ambar":
        return { dot: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" };
      case "rojo":
        return { dot: "bg-red-500", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" };
      case "vencida":
        return { dot: "bg-gray-400", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" };
      default:
        return { dot: "bg-gray-300", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" };
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="border-amber-200 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case "en_proceso":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><AlertTriangle className="w-3 h-3 mr-1" /> En proceso</Badge>;
      case "cumplida":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Cumplida</Badge>;
      case "omitida":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Omitida</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `Vencida hace ${Math.abs(diff)} día(s)`;
    if (diff === 0) return "Vence hoy";
    if (diff === 1) return "Vence mañana";
    return `${diff} días restantes`;
  };

  // Group obligations by urgency
  const grouped = {
    rojo: obligaciones.filter(o => o.urgencia === "rojo" && o.estado !== "cumplida"),
    ambar: obligaciones.filter(o => o.urgencia === "ambar" && o.estado !== "cumplida"),
    verde: obligaciones.filter(o => o.urgencia === "verde" && o.estado !== "cumplida"),
    cumplidas: obligaciones.filter(o => o.estado === "cumplida"),
    vencidas: obligaciones.filter(o => o.urgencia === "vencida" && o.estado !== "cumplida")
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="calendario-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Calendario Fiscal
            </h1>
            <p className="text-gray-500">Obligaciones fiscales del ejercicio {new Date().getFullYear()}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="add-obligacion-btn">
                <Plus className="w-4 h-4" /> Nueva Obligación
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Nueva Obligación Fiscal
                </DialogTitle>
                <DialogDescription>
                  Agrega una obligación fiscal personalizada
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la obligación *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Declaración informativa"
                    required
                    data-testid="obligacion-nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción de la obligación"
                    data-testid="obligacion-desc"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundamento">Fundamento legal</Label>
                  <Input
                    id="fundamento"
                    value={formData.fundamento_legal}
                    onChange={(e) => setFormData({ ...formData, fundamento_legal: e.target.value })}
                    placeholder="Ej: Art. 82 LISR"
                    data-testid="obligacion-fundamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha límite *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="obligacion-fecha"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.fecha_limite, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.fecha_limite}
                        onSelect={(date) => date && setFormData({ ...formData, fecha_limite: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas adicionales"
                    data-testid="obligacion-notas"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="obligacion-submit">
                    Crear Obligación
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Semáforo Legend */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium text-gray-700">Semáforo de urgencia:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">≤ 7 días</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">8-30 días</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">&gt; 30 días</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Vencida</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-48" data-testid="filter-estado">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_proceso">En proceso</SelectItem>
              <SelectItem value="cumplida">Cumplida</SelectItem>
              <SelectItem value="omitida">Omitida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Critical - Rojo */}
            {grouped.rojo.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Urgentes (≤ 7 días)
                </h3>
                <div className="grid gap-4">
                  {grouped.rojo.map((obl) => (
                    <ObligacionCard 
                      key={obl.obligacion_id} 
                      obligacion={obl} 
                      onUpdateEstado={handleUpdateEstado}
                      getUrgencyStyles={getUrgencyStyles}
                      getEstadoBadge={getEstadoBadge}
                      formatDate={formatDate}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Warning - Ambar */}
            {grouped.ambar.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Próximas (8-30 días)
                </h3>
                <div className="grid gap-4">
                  {grouped.ambar.map((obl) => (
                    <ObligacionCard 
                      key={obl.obligacion_id} 
                      obligacion={obl} 
                      onUpdateEstado={handleUpdateEstado}
                      getUrgencyStyles={getUrgencyStyles}
                      getEstadoBadge={getEstadoBadge}
                      formatDate={formatDate}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Safe - Verde */}
            {grouped.verde.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Con tiempo (&gt; 30 días)
                </h3>
                <div className="grid gap-4">
                  {grouped.verde.map((obl) => (
                    <ObligacionCard 
                      key={obl.obligacion_id} 
                      obligacion={obl} 
                      onUpdateEstado={handleUpdateEstado}
                      getUrgencyStyles={getUrgencyStyles}
                      getEstadoBadge={getEstadoBadge}
                      formatDate={formatDate}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Vencidas */}
            {grouped.vencidas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Vencidas
                </h3>
                <div className="grid gap-4">
                  {grouped.vencidas.map((obl) => (
                    <ObligacionCard 
                      key={obl.obligacion_id} 
                      obligacion={obl} 
                      onUpdateEstado={handleUpdateEstado}
                      getUrgencyStyles={getUrgencyStyles}
                      getEstadoBadge={getEstadoBadge}
                      formatDate={formatDate}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cumplidas */}
            {grouped.cumplidas.length > 0 && filterEstado !== "pendiente" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Cumplidas
                </h3>
                <div className="grid gap-4 opacity-75">
                  {grouped.cumplidas.map((obl) => (
                    <ObligacionCard 
                      key={obl.obligacion_id} 
                      obligacion={obl} 
                      onUpdateEstado={handleUpdateEstado}
                      getUrgencyStyles={getUrgencyStyles}
                      getEstadoBadge={getEstadoBadge}
                      formatDate={formatDate}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {obligaciones.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay obligaciones fiscales registradas</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const ObligacionCard = ({ obligacion, onUpdateEstado, getUrgencyStyles, getEstadoBadge, formatDate, getDaysRemaining }) => {
  const styles = getUrgencyStyles(obligacion.urgencia);
  
  return (
    <Card className={`${styles.bg} ${styles.border} border shadow-sm hover:shadow-md transition-shadow`} data-testid={`obligacion-${obligacion.obligacion_id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-4 h-4 rounded-full ${styles.dot} mt-1 flex-shrink-0`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">{obligacion.nombre}</h4>
                <p className="text-sm text-gray-600 mt-1">{obligacion.descripcion}</p>
              </div>
              {getEstadoBadge(obligacion.estado)}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{formatDate(obligacion.fecha_limite)}</span>
              </div>
              <span className={`text-sm font-medium ${styles.text}`}>
                {getDaysRemaining(obligacion.fecha_limite)}
              </span>
              {obligacion.fundamento_legal && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-gray-500 cursor-help">
                        <FileText className="w-4 h-4" />
                        {obligacion.fundamento_legal}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fundamento legal de esta obligación</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {obligacion.estado !== "cumplida" && obligacion.estado !== "omitida" && (
              <div className="flex gap-2 mt-4">
                <Select
                  value={obligacion.estado}
                  onValueChange={(value) => onUpdateEstado(obligacion.obligacion_id, value)}
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="cumplida">Cumplida</SelectItem>
                    <SelectItem value="omitida">Omitida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarioPage;
