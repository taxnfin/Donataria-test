import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Plus, 
  AlertTriangle,
  Shield,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  Download
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AlertasPage = () => {
  const [activeTab, setActiveTab] = useState("alertas");
  const [alertas, setAlertas] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [stats, setStats] = useState({ total: 0, nuevas: 0, criticas: 0, altas: 0 });
  const [loading, setLoading] = useState(true);
  const [filterSeveridad, setFilterSeveridad] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [search, setSearch] = useState("");
  
  // Dialog states
  const [reglaDialogOpen, setReglaDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState(null);
  const [reglaForm, setReglaForm] = useState({
    nombre: "",
    descripcion: "",
    tipo_regla: "umbral_monto",
    severidad: "media",
    condiciones: {},
    activa: true
  });

  useEffect(() => {
    fetchData();
  }, [filterSeveridad, filterEstado, search]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSeveridad !== "todas") params.append("severidad", filterSeveridad);
      if (filterEstado !== "todos") params.append("estado", filterEstado);
      if (search) params.append("search", search);

      const [alertasRes, reglasRes, statsRes] = await Promise.all([
        axios.get(`${API}/alertas?${params}`, { withCredentials: true }),
        axios.get(`${API}/alertas/reglas`, { withCredentials: true }),
        axios.get(`${API}/alertas/stats`, { withCredentials: true })
      ]);
      
      setAlertas(alertasRes.data);
      setReglas(reglasRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegla = async () => {
    try {
      const payload = {
        ...reglaForm,
        condiciones: parseCondiciones(reglaForm.tipo_regla, reglaForm.condiciones)
      };

      if (editingRegla) {
        await axios.put(`${API}/alertas/reglas/${editingRegla.rule_id}`, payload, { withCredentials: true });
        toast.success("Regla actualizada");
      } else {
        await axios.post(`${API}/alertas/reglas`, payload, { withCredentials: true });
        toast.success("Regla creada");
      }
      
      setReglaDialogOpen(false);
      resetReglaForm();
      fetchData();
    } catch (error) {
      toast.error("Error al guardar regla");
    }
  };

  const parseCondiciones = (tipo, cond) => {
    if (tipo === "umbral_monto") {
      return { monto_minimo: parseFloat(cond.monto_minimo) || 100000 };
    }
    if (tipo === "keywords_descripcion") {
      return { keywords: (cond.keywords || "").split(",").map(k => k.trim()).filter(k => k) };
    }
    if (tipo === "nivel_riesgo_donante") {
      return { niveles: cond.niveles || ["alto", "critico"] };
    }
    return cond;
  };

  const handleToggleRegla = async (ruleId) => {
    try {
      const res = await axios.put(`${API}/alertas/reglas/${ruleId}/toggle`, {}, { withCredentials: true });
      toast.success(`Regla ${res.data.activa ? "activada" : "desactivada"}`);
      fetchData();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDeleteRegla = async (ruleId) => {
    if (!confirm("¿Eliminar esta regla?")) return;
    try {
      await axios.delete(`${API}/alertas/reglas/${ruleId}`, { withCredentials: true });
      toast.success("Regla eliminada");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar regla");
    }
  };

  const handleUpdateAlertaEstado = async (alertId, estado) => {
    try {
      await axios.put(`${API}/alertas/${alertId}/estado?estado=${estado}`, {}, { withCredentials: true });
      toast.success("Estado actualizado");
      fetchData();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleExportAlertas = () => {
    window.open(`${BACKEND_URL}/api/exportar/alertas`, '_blank');
  };

  const resetReglaForm = () => {
    setEditingRegla(null);
    setReglaForm({
      nombre: "",
      descripcion: "",
      tipo_regla: "umbral_monto",
      severidad: "media",
      condiciones: {},
      activa: true
    });
  };

  const handleEditRegla = (regla) => {
    setEditingRegla(regla);
    setReglaForm({
      nombre: regla.nombre,
      descripcion: regla.descripcion || "",
      tipo_regla: regla.tipo_regla,
      severidad: regla.severidad,
      condiciones: regla.condiciones || {},
      activa: regla.activa
    });
    setReglaDialogOpen(true);
  };

  const getSeveridadBadge = (severidad) => {
    const styles = {
      baja: "bg-gray-100 text-gray-700",
      media: "bg-blue-100 text-blue-700",
      alta: "bg-amber-100 text-amber-700",
      critica: "bg-red-100 text-red-700"
    };
    return <Badge className={`${styles[severidad]} hover:${styles[severidad]}`}>{severidad}</Badge>;
  };

  const getEstadoBadge = (estado) => {
    const config = {
      nueva: { icon: AlertCircle, color: "bg-red-100 text-red-700" },
      en_revision: { icon: Clock, color: "bg-amber-100 text-amber-700" },
      resuelta: { icon: CheckCircle, color: "bg-green-100 text-green-700" },
      descartada: { icon: XCircle, color: "bg-gray-100 text-gray-600" }
    };
    const { icon: Icon, color } = config[estado] || config.nueva;
    return (
      <Badge className={`${color} hover:${color}`}>
        <Icon className="w-3 h-3 mr-1" /> {estado}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="alertas-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Motor de Alertas AML
            </h1>
            <p className="text-gray-500">Sistema de monitoreo y detección de riesgos</p>
          </div>
          <Button variant="outline" onClick={handleExportAlertas} data-testid="export-alertas-btn">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Alertas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-gray-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Nuevas</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.nuevas}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Críticas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.criticas}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Altas</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.altas}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="alertas" data-testid="tab-alertas">
              <AlertTriangle className="w-4 h-4 mr-2" /> Alertas ({alertas.length})
            </TabsTrigger>
            <TabsTrigger value="reglas" data-testid="tab-reglas">
              <Settings className="w-4 h-4 mr-2" /> Reglas ({reglas.length})
            </TabsTrigger>
          </TabsList>

          {/* Alertas Tab */}
          <TabsContent value="alertas" className="space-y-4">
            {/* Filters */}
            <Card className="bg-white border-gray-100">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar alertas..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                      data-testid="search-alertas"
                    />
                  </div>
                  <Select value={filterSeveridad} onValueChange={setFilterSeveridad}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="nueva">Nueva</SelectItem>
                      <SelectItem value="en_revision">En revisión</SelectItem>
                      <SelectItem value="resuelta">Resuelta</SelectItem>
                      <SelectItem value="descartada">Descartada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Alertas Table */}
            <Card className="bg-white border-gray-100">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : alertas.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay alertas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="text-xs uppercase">Fecha</TableHead>
                        <TableHead className="text-xs uppercase">Alerta</TableHead>
                        <TableHead className="text-xs uppercase">Severidad</TableHead>
                        <TableHead className="text-xs uppercase">Donante</TableHead>
                        <TableHead className="text-xs uppercase text-right">Monto</TableHead>
                        <TableHead className="text-xs uppercase">Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertas.map((alerta) => (
                        <TableRow key={alerta.alert_id} className="hover:bg-gray-50/50">
                          <TableCell className="text-sm">
                            {new Date(alerta.created_at).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{alerta.titulo}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{alerta.descripcion}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getSeveridadBadge(alerta.severidad)}</TableCell>
                          <TableCell className="text-sm">{alerta.donante_nombre || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {alerta.monto ? `$${alerta.monto.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell>{getEstadoBadge(alerta.estado)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateAlertaEstado(alerta.alert_id, "en_revision")}>
                                  <Clock className="w-4 h-4 mr-2" /> Marcar en revisión
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateAlertaEstado(alerta.alert_id, "resuelta")}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Marcar resuelta
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateAlertaEstado(alerta.alert_id, "descartada")}>
                                  <XCircle className="w-4 h-4 mr-2" /> Descartar
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

          {/* Reglas Tab */}
          <TabsContent value="reglas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={reglaDialogOpen} onOpenChange={(open) => {
                setReglaDialogOpen(open);
                if (!open) resetReglaForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700" data-testid="add-regla-btn">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Regla
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingRegla ? "Editar Regla" : "Nueva Regla de Alerta"}</DialogTitle>
                    <DialogDescription>
                      Configura las condiciones para generar alertas automáticas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre de la regla</Label>
                      <Input
                        value={reglaForm.nombre}
                        onChange={(e) => setReglaForm({ ...reglaForm, nombre: e.target.value })}
                        placeholder="Ej: Umbral de transacción"
                        data-testid="regla-nombre"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={reglaForm.descripcion}
                        onChange={(e) => setReglaForm({ ...reglaForm, descripcion: e.target.value })}
                        placeholder="Descripción de la regla"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de regla</Label>
                        <Select
                          value={reglaForm.tipo_regla}
                          onValueChange={(v) => setReglaForm({ ...reglaForm, tipo_regla: v, condiciones: {} })}
                        >
                          <SelectTrigger data-testid="regla-tipo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="umbral_monto">Umbral de Monto</SelectItem>
                            <SelectItem value="nivel_riesgo_donante">Nivel Riesgo Donante</SelectItem>
                            <SelectItem value="keywords_descripcion">Keywords Sospechosos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Severidad</Label>
                        <Select
                          value={reglaForm.severidad}
                          onValueChange={(v) => setReglaForm({ ...reglaForm, severidad: v })}
                        >
                          <SelectTrigger data-testid="regla-severidad">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Condiciones según tipo */}
                    {reglaForm.tipo_regla === "umbral_monto" && (
                      <div className="space-y-2">
                        <Label>Monto mínimo (MXN)</Label>
                        <Input
                          type="number"
                          value={reglaForm.condiciones.monto_minimo || ""}
                          onChange={(e) => setReglaForm({
                            ...reglaForm,
                            condiciones: { ...reglaForm.condiciones, monto_minimo: e.target.value }
                          })}
                          placeholder="100000"
                          data-testid="regla-monto"
                        />
                      </div>
                    )}

                    {reglaForm.tipo_regla === "keywords_descripcion" && (
                      <div className="space-y-2">
                        <Label>Keywords (separados por coma)</Label>
                        <Textarea
                          value={reglaForm.condiciones.keywords || ""}
                          onChange={(e) => setReglaForm({
                            ...reglaForm,
                            condiciones: { ...reglaForm.condiciones, keywords: e.target.value }
                          })}
                          placeholder="efectivo, urgente, anónimo"
                          data-testid="regla-keywords"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label>Regla activa</Label>
                      <Switch
                        checked={reglaForm.activa}
                        onCheckedChange={(v) => setReglaForm({ ...reglaForm, activa: v })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReglaDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleCreateRegla} data-testid="regla-submit">
                      {editingRegla ? "Actualizar" : "Crear Regla"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Reglas List */}
            <div className="grid gap-4">
              {reglas.length === 0 ? (
                <Card className="bg-white border-gray-100">
                  <CardContent className="text-center py-12">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay reglas configuradas</p>
                  </CardContent>
                </Card>
              ) : (
                reglas.map((regla) => (
                  <Card key={regla.rule_id} className={`bg-white border-gray-100 ${!regla.activa && "opacity-60"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900">{regla.nombre}</h3>
                            {getSeveridadBadge(regla.severidad)}
                            {!regla.activa && <Badge variant="outline">Inactiva</Badge>}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{regla.descripcion}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Tipo: {regla.tipo_regla}</span>
                            <span>Activaciones: {regla.veces_activada}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={regla.activa}
                            onCheckedChange={() => handleToggleRegla(regla.rule_id)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRegla(regla)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRegla(regla.rule_id)}
                                className="text-red-600"
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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

export default AlertasPage;
