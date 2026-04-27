import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Plus, 
  FileText,
  FilePlus,
  Send,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Download,
  MoreHorizontal,
  Trash2,
  LayoutTemplate
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const ReportesPage = () => {
  const [activeTab, setActiveTab] = useState("reportes");
  const [reportes, setReportes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [plantillaDialogOpen, setPlantillaDialogOpen] = useState(false);
  
  const [reporteForm, setReporteForm] = useState({
    titulo: "",
    tipo: "str_sar",
    descripcion: "",
    destinatario: "UIF",
    periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    periodo_fin: new Date()
  });
  
  const [plantillaForm, setPlantillaForm] = useState({
    nombre: "",
    tipo_reporte: "str_sar",
    descripcion: "",
    criterios: {},
    formato: "PDF",
    destinatario: "UIF",
    periodicidad: "manual"
  });

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [reportesRes, plantillasRes] = await Promise.all([
        axios.get(`${API}/reportes`, { withCredentials: true }),
        axios.get(`${API}/reportes/plantillas`, { withCredentials: true })
      ]);
      setReportes(reportesRes.data);
      setPlantillas(plantillasRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleDownloadPDF = (reportId) => {
    window.open(`${BACKEND_URL}/api/reportes/${reportId}/pdf`, '_blank');
  };

  const handleCreateReporte = async () => {
    try {
      const payload = {
        ...reporteForm,
        periodo_inicio: reporteForm.periodo_inicio.toISOString(),
        periodo_fin: reporteForm.periodo_fin.toISOString()
      };
      if (reporteForm.template_id) payload.template_id = reporteForm.template_id;
      await axios.post(`${API}/reportes`, payload, { withCredentials: true });
      
      toast.success("Reporte generado");
      setReporteDialogOpen(false);
      resetReporteForm();
      fetchData();
    } catch (error) {
      toast.error("Error al generar reporte");
    }
  };

  const handleCreatePlantilla = async () => {
    try {
      await axios.post(`${API}/reportes/plantillas`, plantillaForm, { withCredentials: true });
      toast.success("Plantilla creada");
      setPlantillaDialogOpen(false);
      resetPlantillaForm();
      fetchData();
    } catch (error) {
      toast.error("Error al crear plantilla");
    }
  };

  const handleUpdateReporteEstado = async (reportId, estado) => {
    try {
      await axios.put(`${API}/reportes/${reportId}/estado?estado=${estado}`, {}, { withCredentials: true });
      toast.success("Estado actualizado");
      fetchData();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDeleteReporte = async (reportId) => {
    if (!confirm("¿Eliminar este reporte?")) return;
    try {
      await axios.delete(`${API}/reportes/${reportId}`, { withCredentials: true });
      toast.success("Reporte eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar reporte");
    }
  };

  const handleDeletePlantilla = async (templateId) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      await axios.delete(`${API}/reportes/plantillas/${templateId}`, { withCredentials: true });
      toast.success("Plantilla eliminada");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar plantilla");
    }
  };

  const handleUseTemplate = (plantilla) => {
    setReporteForm({
      titulo: `${plantilla.nombre} - ${new Date().toLocaleDateString('es-MX')}`,
      tipo: plantilla.tipo_reporte,
      descripcion: plantilla.descripcion || "",
      destinatario: plantilla.destinatario,
      periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      periodo_fin: new Date(),
      template_id: plantilla.template_id
    });
    setReporteDialogOpen(true);
    setActiveTab("reportes");
  };

  const resetReporteForm = () => {
    setReporteForm({
      titulo: "",
      tipo: "str_sar",
      descripcion: "",
      destinatario: "UIF",
      periodo_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      periodo_fin: new Date()
    });
  };

  const resetPlantillaForm = () => {
    setPlantillaForm({
      nombre: "",
      tipo_reporte: "str_sar",
      descripcion: "",
      criterios: {},
      formato: "PDF",
      destinatario: "UIF",
      periodicidad: "manual"
    });
  };

  const getEstadoBadge = (estado) => {
    const config = {
      borrador: { icon: Clock, color: "bg-gray-100 text-gray-700" },
      enviado: { icon: Send, color: "bg-blue-100 text-blue-700" },
      acuse_recibido: { icon: CheckCircle, color: "bg-green-100 text-green-700" }
    };
    const { icon: Icon, color } = config[estado] || config.borrador;
    return (
      <Badge className={`${color} hover:${color}`}>
        <Icon className="w-3 h-3 mr-1" /> {estado.replace('_', ' ')}
      </Badge>
    );
  };

  const getTipoBadge = (tipo) => {
    const colors = {
      str_sar: "bg-red-100 text-red-700",
      operacion_relevante: "bg-amber-100 text-amber-700",
      operacion_inusual: "bg-orange-100 text-orange-700",
      donantes_pep: "bg-purple-100 text-purple-700",
      reporte_mensual: "bg-blue-100 text-blue-700"
    };
    const labels = {
      str_sar: "STR/SAR",
      operacion_relevante: "Op. Relevante",
      operacion_inusual: "Op. Inusual",
      donantes_pep: "Donantes PEP",
      reporte_mensual: "Mensual"
    };
    return <Badge className={`${colors[tipo]} hover:${colors[tipo]}`}>{labels[tipo] || tipo}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="reportes-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Módulo de Reportes
            </h1>
            <p className="text-gray-500">Generación de reportes para UIF/SAT</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reportes" data-testid="tab-reportes">
              <FileText className="w-4 h-4 mr-2" /> Reportes ({reportes.length})
            </TabsTrigger>
            <TabsTrigger value="plantillas" data-testid="tab-plantillas">
              <LayoutTemplate className="w-4 h-4 mr-2" /> Plantillas ({plantillas.length})
            </TabsTrigger>
          </TabsList>

          {/* Reportes Tab */}
          <TabsContent value="reportes" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={reporteDialogOpen} onOpenChange={(open) => {
                setReporteDialogOpen(open);
                if (!open) resetReporteForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700" data-testid="generar-reporte-btn">
                    <FilePlus className="w-4 h-4 mr-2" /> Generar Reporte
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Generar Nuevo Reporte</DialogTitle>
                    <DialogDescription>
                      Configura los parámetros del reporte
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Título del reporte</Label>
                      <Input
                        value={reporteForm.titulo}
                        onChange={(e) => setReporteForm({ ...reporteForm, titulo: e.target.value })}
                        placeholder="Reporte STR - Marzo 2026"
                        data-testid="reporte-titulo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de reporte</Label>
                        <Select
                          value={reporteForm.tipo}
                          onValueChange={(v) => setReporteForm({ ...reporteForm, tipo: v })}
                        >
                          <SelectTrigger data-testid="reporte-tipo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="str_sar">STR/SAR (Suspicious Activity)</SelectItem>
                            <SelectItem value="operacion_relevante">Operaciones Relevantes</SelectItem>
                            <SelectItem value="operacion_inusual">Operaciones Inusuales</SelectItem>
                            <SelectItem value="donantes_pep">Donantes PEP</SelectItem>
                            <SelectItem value="reporte_mensual">Reporte Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Destinatario</Label>
                        <Select
                          value={reporteForm.destinatario}
                          onValueChange={(v) => setReporteForm({ ...reporteForm, destinatario: v })}
                        >
                          <SelectTrigger data-testid="reporte-destinatario">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UIF">UIF</SelectItem>
                            <SelectItem value="SAT">SAT</SelectItem>
                            <SelectItem value="interno">Interno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Período inicio</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(reporteForm.periodo_inicio, "PPP", { locale: es })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={reporteForm.periodo_inicio}
                              onSelect={(date) => date && setReporteForm({ ...reporteForm, periodo_inicio: date })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Período fin</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(reporteForm.periodo_fin, "PPP", { locale: es })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={reporteForm.periodo_fin}
                              onSelect={(date) => date && setReporteForm({ ...reporteForm, periodo_fin: date })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Textarea
                        value={reporteForm.descripcion}
                        onChange={(e) => setReporteForm({ ...reporteForm, descripcion: e.target.value })}
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReporteDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleCreateReporte} data-testid="reporte-submit">
                      Generar Reporte
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Reportes Table */}
            <Card className="bg-white border-gray-100">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  </div>
                ) : reportes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay reportes generados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="text-xs uppercase">Fecha</TableHead>
                        <TableHead className="text-xs uppercase">Reporte</TableHead>
                        <TableHead className="text-xs uppercase">Tipo</TableHead>
                        <TableHead className="text-xs uppercase">Destinatario</TableHead>
                        <TableHead className="text-xs uppercase">Período</TableHead>
                        <TableHead className="text-xs uppercase">Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportes.map((reporte) => (
                        <TableRow key={reporte.report_id} className="hover:bg-gray-50/50">
                          <TableCell className="text-sm">
                            {new Date(reporte.created_at).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{reporte.titulo}</p>
                              {reporte.descripcion && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{reporte.descripcion}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTipoBadge(reporte.tipo)}</TableCell>
                          <TableCell className="text-sm">{reporte.destinatario}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {reporte.datos?.periodo || "N/A"}
                          </TableCell>
                          <TableCell>{getEstadoBadge(reporte.estado)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownloadPDF(reporte.report_id)} data-testid={`download-pdf-${reporte.report_id}`}>
                                  <Download className="w-4 h-4 mr-2" /> Descargar PDF
                                </DropdownMenuItem>
                                {reporte.estado === "borrador" && (
                                  <DropdownMenuItem onClick={() => handleUpdateReporteEstado(reporte.report_id, "enviado")}>
                                    <Send className="w-4 h-4 mr-2" /> Marcar enviado
                                  </DropdownMenuItem>
                                )}
                                {reporte.estado === "enviado" && (
                                  <DropdownMenuItem onClick={() => handleUpdateReporteEstado(reporte.report_id, "acuse_recibido")}>
                                    <CheckCircle className="w-4 h-4 mr-2" /> Acuse recibido
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReporte(reporte.report_id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plantillas Tab */}
          <TabsContent value="plantillas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={plantillaDialogOpen} onOpenChange={(open) => {
                setPlantillaDialogOpen(open);
                if (!open) resetPlantillaForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="crear-plantilla-btn">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Nueva Plantilla de Reporte</DialogTitle>
                    <DialogDescription>
                      Crea una plantilla reutilizable para reportes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre de la plantilla</Label>
                      <Input
                        value={plantillaForm.nombre}
                        onChange={(e) => setPlantillaForm({ ...plantillaForm, nombre: e.target.value })}
                        placeholder="Reporte mensual UIF"
                        data-testid="plantilla-nombre"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de reporte</Label>
                        <Select
                          value={plantillaForm.tipo_reporte}
                          onValueChange={(v) => setPlantillaForm({ ...plantillaForm, tipo_reporte: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="str_sar">STR/SAR</SelectItem>
                            <SelectItem value="operacion_relevante">Op. Relevantes</SelectItem>
                            <SelectItem value="donantes_pep">Donantes PEP</SelectItem>
                            <SelectItem value="reporte_mensual">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Destinatario</Label>
                        <Select
                          value={plantillaForm.destinatario}
                          onValueChange={(v) => setPlantillaForm({ ...plantillaForm, destinatario: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UIF">UIF</SelectItem>
                            <SelectItem value="SAT">SAT</SelectItem>
                            <SelectItem value="interno">Interno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <Select
                          value={plantillaForm.formato}
                          onValueChange={(v) => setPlantillaForm({ ...plantillaForm, formato: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="CSV">CSV</SelectItem>
                            <SelectItem value="Excel">Excel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Periodicidad</Label>
                        <Select
                          value={plantillaForm.periodicidad}
                          onValueChange={(v) => setPlantillaForm({ ...plantillaForm, periodicidad: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="diario">Diario</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="mensual">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={plantillaForm.descripcion}
                        onChange={(e) => setPlantillaForm({ ...plantillaForm, descripcion: e.target.value })}
                        placeholder="Descripción de la plantilla..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPlantillaDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreatePlantilla} data-testid="plantilla-submit">
                      Crear Plantilla
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Plantillas Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantillas.length === 0 ? (
                <Card className="col-span-full bg-white border-gray-100">
                  <CardContent className="text-center py-12">
                    <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay plantillas configuradas</p>
                  </CardContent>
                </Card>
              ) : (
                plantillas.map((plantilla) => (
                  <Card key={plantilla.template_id} className="bg-white border-gray-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{plantilla.nombre}</CardTitle>
                          <CardDescription className="text-xs">{plantilla.descripcion}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUseTemplate(plantilla)} data-testid={`use-template-${plantilla.template_id}`}>
                              <FilePlus className="w-4 h-4 mr-2" /> Generar Reporte
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePlantilla(plantilla.template_id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {getTipoBadge(plantilla.tipo_reporte)}
                        <Badge variant="outline">{plantilla.destinatario}</Badge>
                        <Badge variant="outline">{plantilla.formato}</Badge>
                        <Badge variant="outline" className="capitalize">{plantilla.periodicidad}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportesPage;
