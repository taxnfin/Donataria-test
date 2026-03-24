import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  Plus, 
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  DollarSign,
  Users,
  Edit,
  Send,
  Download
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TransparenciaPage = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInforme, setEditingInforme] = useState(null);
  const [presentarDialog, setPresentarDialog] = useState(null);
  const [newYear, setNewYear] = useState(new Date().getFullYear() - 1);
  const [formData, setFormData] = useState({
    total_donativos_recibidos: 0,
    total_donativos_especie: 0,
    total_donativos_otorgados: 0,
    total_gastos_admin: 0,
    descripcion_actividades: "",
    numero_beneficiarios: 0,
    influencia_legislacion: false,
    detalle_influencia: ""
  });

  useEffect(() => {
    fetchInformes();
  }, []);

  const fetchInformes = async () => {
    try {
      const response = await axios.get(`${API}/transparencia`, {
        withCredentials: true
      });
      setInformes(response.data);
    } catch (error) {
      toast.error("Error al cargar informes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInforme = async () => {
    try {
      await axios.post(`${API}/transparencia`, {
        ejercicio_fiscal: newYear
      }, {
        withCredentials: true
      });
      toast.success(`Informe ${newYear} creado`);
      setDialogOpen(false);
      fetchInformes();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear informe";
      toast.error(message);
    }
  };

  const handleUpdateInforme = async () => {
    if (!editingInforme) return;
    
    try {
      await axios.put(`${API}/transparencia/${editingInforme.informe_id}`, formData, {
        withCredentials: true
      });
      toast.success("Informe actualizado");
      setEditingInforme(null);
      fetchInformes();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al actualizar informe";
      toast.error(message);
    }
  };

  const handleDownloadPDF = (informeId) => {
    window.open(`${BACKEND_URL}/api/transparencia/${informeId}/pdf`, '_blank');
  };

  const handlePresentar = async (informeId) => {
    try {
      await axios.post(`${API}/transparencia/${informeId}/presentar`, {}, {
        withCredentials: true
      });
      toast.success("Informe marcado como presentado");
      setPresentarDialog(null);
      fetchInformes();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al presentar informe";
      toast.error(message);
    }
  };

  const handleEdit = (informe) => {
    setEditingInforme(informe);
    setFormData({
      total_donativos_recibidos: informe.total_donativos_recibidos || 0,
      total_donativos_especie: informe.total_donativos_especie || 0,
      total_donativos_otorgados: informe.total_donativos_otorgados || 0,
      total_gastos_admin: informe.total_gastos_admin || 0,
      descripcion_actividades: informe.descripcion_actividades || "",
      numero_beneficiarios: informe.numero_beneficiarios || 0,
      influencia_legislacion: informe.influencia_legislacion || false,
      detalle_influencia: informe.detalle_influencia || ""
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "borrador":
        return <Badge variant="outline" className="border-amber-200 text-amber-700">Borrador</Badge>;
      case "presentado":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Presentado</Badge>;
      case "corregido":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Corregido</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getProgressColor = (porcentaje) => {
    if (porcentaje > 5) return "bg-red-500";
    if (porcentaje > 4) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="transparencia-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Informe de Transparencia
            </h1>
            <p className="text-gray-500">Ficha 19/ISR - Informe anual de actividades</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="create-informe-btn">
                <Plus className="w-4 h-4" /> Nuevo Informe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Crear Informe de Transparencia
                </DialogTitle>
                <DialogDescription>
                  Selecciona el ejercicio fiscal para el nuevo informe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Ejercicio Fiscal</Label>
                  <Select value={String(newYear)} onValueChange={(v) => setNewYear(Number(v))}>
                    <SelectTrigger data-testid="informe-year-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateInforme} data-testid="informe-create-submit">
                  Crear Informe
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Fundamento Legal</p>
            <p className="text-sm text-blue-700">
              Art. 82 LISR - Las donatarias autorizadas deberán presentar informe de transparencia a más tardar el 31 de mayo de cada año (Ficha 19/ISR).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : informes.length === 0 ? (
          <Card className="bg-white border-gray-100">
            <CardContent className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay informes de transparencia</p>
              <Button 
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Crear primer informe
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {informes.map((informe) => (
              <Card key={informe.informe_id} className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" data-testid={`informe-${informe.informe_id}`}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-xl" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      Ejercicio Fiscal {informe.ejercicio_fiscal}
                    </CardTitle>
                    <CardDescription>
                      Última actualización: {new Date(informe.updated_at).toLocaleDateString('es-MX')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(informe.estado)}
                    {informe.estado === "borrador" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(informe)}
                        data-testid={`edit-informe-${informe.informe_id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progreso de completitud</span>
                      <span className="text-sm text-gray-500">{informe.progreso_completitud}%</span>
                    </div>
                    <Progress value={informe.progreso_completitud} className="h-2" />
                  </div>

                  {/* KPIs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium">Total Recibido</span>
                      </div>
                      <p className="text-lg font-semibold text-emerald-900">
                        {formatCurrency(informe.total_donativos_recibidos)}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium">Otorgado a 3ros</span>
                      </div>
                      <p className="text-lg font-semibold text-blue-900">
                        {formatCurrency(informe.total_donativos_otorgados)}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">Gastos Admin</span>
                      </div>
                      <p className="text-lg font-semibold text-amber-900">
                        {formatCurrency(informe.total_gastos_admin)}
                      </p>
                    </div>

                    <div className="p-4 bg-violet-50 rounded-lg">
                      <div className="flex items-center gap-2 text-violet-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-medium">Beneficiarios</span>
                      </div>
                      <p className="text-lg font-semibold text-violet-900">
                        {informe.numero_beneficiarios?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Gastos Admin Alert */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        % Gastos Administrativos (Límite: 5% - Art. 138 RLISR)
                      </span>
                      <span className={`text-sm font-semibold ${
                        informe.porcentaje_gastos_admin > 5 ? "text-red-600" : 
                        informe.porcentaje_gastos_admin > 4 ? "text-amber-600" : "text-green-600"
                      }`}>
                        {informe.porcentaje_gastos_admin?.toFixed(2) || 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getProgressColor(informe.porcentaje_gastos_admin)}`}
                        style={{ width: `${Math.min((informe.porcentaje_gastos_admin || 0) * 20, 100)}%` }}
                      />
                    </div>
                    {informe.porcentaje_gastos_admin > 5 && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Excede el límite del 5%. No se puede presentar el informe.</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {informe.descripcion_actividades && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Descripción de Actividades</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {informe.descripcion_actividades}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadPDF(informe.informe_id)}
                      data-testid={`download-pdf-${informe.informe_id}`}
                    >
                      <Download className="w-4 h-4 mr-2" /> Descargar PDF
                    </Button>
                    {informe.estado === "borrador" && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={informe.porcentaje_gastos_admin > 5 || informe.progreso_completitud < 100}
                        onClick={() => setPresentarDialog(informe.informe_id)}
                        data-testid={`presentar-informe-${informe.informe_id}`}
                      >
                        <Send className="w-4 h-4 mr-2" /> Marcar como Presentado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingInforme} onOpenChange={(open) => !open && setEditingInforme(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                Editar Informe - Ejercicio {editingInforme?.ejercicio_fiscal}
              </DialogTitle>
              <DialogDescription>
                Actualiza la información del informe de transparencia
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_donativos">Total donativos recibidos (efectivo)</Label>
                  <Input
                    id="total_donativos"
                    type="number"
                    step="0.01"
                    value={formData.total_donativos_recibidos}
                    onChange={(e) => setFormData({ ...formData, total_donativos_recibidos: parseFloat(e.target.value) || 0 })}
                    data-testid="edit-total-donativos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_especie">Total donativos en especie</Label>
                  <Input
                    id="total_especie"
                    type="number"
                    step="0.01"
                    value={formData.total_donativos_especie}
                    onChange={(e) => setFormData({ ...formData, total_donativos_especie: parseFloat(e.target.value) || 0 })}
                    data-testid="edit-total-especie"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_otorgados">Total otorgado a terceros</Label>
                  <Input
                    id="total_otorgados"
                    type="number"
                    step="0.01"
                    value={formData.total_donativos_otorgados}
                    onChange={(e) => setFormData({ ...formData, total_donativos_otorgados: parseFloat(e.target.value) || 0 })}
                    data-testid="edit-total-otorgados"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_gastos">Total gastos administrativos</Label>
                  <Input
                    id="total_gastos"
                    type="number"
                    step="0.01"
                    value={formData.total_gastos_admin}
                    onChange={(e) => setFormData({ ...formData, total_gastos_admin: parseFloat(e.target.value) || 0 })}
                    data-testid="edit-total-gastos"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiarios">Número de beneficiarios atendidos</Label>
                <Input
                  id="beneficiarios"
                  type="number"
                  value={formData.numero_beneficiarios}
                  onChange={(e) => setFormData({ ...formData, numero_beneficiarios: parseInt(e.target.value) || 0 })}
                  data-testid="edit-beneficiarios"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción de actividades</Label>
                <Textarea
                  id="descripcion"
                  rows={4}
                  value={formData.descripcion_actividades}
                  onChange={(e) => setFormData({ ...formData, descripcion_actividades: e.target.value })}
                  placeholder="Describe las actividades realizadas conforme al objeto social de la organización"
                  data-testid="edit-descripcion"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="influencia">¿Realizó actividades que influyen en legislación?</Label>
                  <p className="text-xs text-gray-500">Conforme al Art. 82 Fracc. IV LISR</p>
                </div>
                <Switch
                  id="influencia"
                  checked={formData.influencia_legislacion}
                  onCheckedChange={(checked) => setFormData({ ...formData, influencia_legislacion: checked })}
                  data-testid="edit-influencia"
                />
              </div>

              {formData.influencia_legislacion && (
                <div className="space-y-2">
                  <Label htmlFor="detalle_influencia">Detalle de actividades de influencia</Label>
                  <Textarea
                    id="detalle_influencia"
                    rows={3}
                    value={formData.detalle_influencia}
                    onChange={(e) => setFormData({ ...formData, detalle_influencia: e.target.value })}
                    placeholder="Describe las actividades realizadas"
                    data-testid="edit-detalle-influencia"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingInforme(null)}>Cancelar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpdateInforme} data-testid="edit-informe-submit">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Presentar Dialog */}
        <AlertDialog open={!!presentarDialog} onOpenChange={() => setPresentarDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Marcar informe como presentado?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto indica que ya presentaste el informe de transparencia ante el SAT. 
                Una vez marcado como presentado, no podrás editar la información.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handlePresentar(presentarDialog)}
              >
                Confirmar Presentación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TransparenciaPage;
