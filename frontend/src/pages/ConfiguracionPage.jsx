import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  Building, 
  Save,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Upload,
  ImageIcon,
  Trash2,
  Plus
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const ConfiguracionPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [cronStatus, setCronStatus] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgRfc, setNewOrgRfc] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    rfc: "",
    rubro: "asistencial",
    direccion: "",
    telefono: "",
    email: ""
  });

  useEffect(() => {
    fetchOrganizacion();
    fetchNotificationStatus();
    fetchCronStatus();
  }, []);

  const fetchCronStatus = async () => {
    try {
      const response = await axios.get(`${API}/cron/status`, { withCredentials: true });
      setCronStatus(response.data);
    } catch (error) {
      console.error("Error fetching cron status:", error);
    }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const response = await axios.post(`${API}/cron/notificaciones-diarias`, {}, { withCredentials: true });
      toast.success(`Cron ejecutado. ${response.data.notifications_queued || 0} notificaciones en cola.`);
    } catch (error) {
      toast.error("Error al ejecutar cron");
    } finally {
      setRunningCron(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setCreatingOrg(true);
    try {
      await axios.post(`${API}/organizaciones`, {
        nombre: newOrgName,
        rfc: newOrgRfc,
        rubro: "asistencial",
        direccion: "",
        telefono: "",
        email: ""
      }, { withCredentials: true });
      toast.success("Organización creada. Cambiando...");
      setNewOrgDialogOpen(false);
      setNewOrgName("");
      setNewOrgRfc("");
      window.location.reload();
    } catch (error) {
      toast.error("Error al crear organización");
    } finally {
      setCreatingOrg(false);
    }
  };

  const fetchNotificationStatus = async () => {
    try {
      const response = await axios.get(`${API}/notifications/status`, {
        withCredentials: true
      });
      setNotificationStatus(response.data);
    } catch (error) {
      console.error("Error fetching notification status:", error);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const response = await axios.post(`${API}/notifications/send-test`, {}, {
        withCredentials: true
      });
      if (response.data.status === "success") {
        toast.success("Email de prueba enviado. Revisa tu bandeja de entrada.");
      } else if (response.data.status === "skipped") {
        toast.warning("El servicio de email no está configurado.");
      } else {
        toast.error("Error al enviar email de prueba.");
      }
    } catch (error) {
      toast.error("Error al enviar email de prueba.");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendNotifications = async () => {
    setSendingNotifications(true);
    try {
      const response = await axios.post(`${API}/notifications/check-and-send`, {}, {
        withCredentials: true
      });
      toast.success(response.data.message);
    } catch (error) {
      const message = error.response?.data?.detail || "Error al enviar notificaciones.";
      toast.error(message);
    } finally {
      setSendingNotifications(false);
    }
  };

  const fetchOrganizacion = async () => {
    try {
      const response = await axios.get(`${API}/organizacion`, {
        withCredentials: true
      });
      setFormData({
        nombre: response.data.nombre || "",
        rfc: response.data.rfc || "",
        rubro: response.data.rubro || "asistencial",
        direccion: response.data.direccion || "",
        telefono: response.data.telefono || "",
        email: response.data.email || ""
      });
      setLogoUrl(response.data.logo_url || null);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Error al cargar datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API}/organizacion`, formData, {
        withCredentials: true
      });
      toast.success("Organización actualizada");
    } catch (error) {
      const message = error.response?.data?.detail || "Error al guardar";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Solo se aceptan imágenes PNG, JPG o WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API}/organizacion/logo`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setLogoUrl(response.data.logo_url);
      toast.success("Logo actualizado");
    } catch (error) {
      toast.error("Error al subir logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await axios.delete(`${API}/organizacion/logo`, { withCredentials: true });
      setLogoUrl(null);
      toast.success("Logo eliminado");
    } catch (error) {
      toast.error("Error al eliminar logo");
    }
  };

  const rubrosData = [
    { value: "asistencial", label: "Asistencial" },
    { value: "educativo", label: "Educativo" },
    { value: "investigacion", label: "Investigación científica o tecnológica" },
    { value: "cultural", label: "Cultural" },
    { value: "ecologico", label: "Ecológico" },
    { value: "becas", label: "Becas educativas" },
    { value: "obras_publicas", label: "Obras o servicios públicos" },
    { value: "otro", label: "Otro" }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl" data-testid="configuracion-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Configuración
          </h1>
          <p className="text-gray-500">Administra los datos de tu organización</p>
        </div>

        {/* Logo Upload */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Logo de la Organización
                </CardTitle>
                <CardDescription>
                  Se muestra en todos los PDFs generados (CFDIs, reportes, cumplimiento)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {logoUrl ? (
                <div className="relative group">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-1"
                    data-testid="org-logo-preview"
                  />
                  <button
                    onClick={handleDeleteLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid="delete-logo-btn"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div className="flex-1">
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {uploadingLogo ? "Subiendo..." : "Subir logo"}
                  </span>
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  data-testid="logo-upload-input"
                  disabled={uploadingLogo}
                />
                <p className="text-xs text-gray-400 mt-2">PNG, JPG o WebP. Máximo 2MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Form */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Datos de la Organización
                </CardTitle>
                <CardDescription>
                  Información fiscal y de contacto
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre y RFC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    Nombre / Razón Social
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Fundación Ejemplo A.C."
                    data-testid="config-nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    RFC
                  </Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="XXX000000XXX"
                    maxLength={12}
                    className="font-mono"
                    data-testid="config-rfc"
                  />
                </div>
              </div>

              {/* Rubro */}
              <div className="space-y-2">
                <Label htmlFor="rubro">Rubro de la organización</Label>
                <Select
                  value={formData.rubro}
                  onValueChange={(value) => setFormData({ ...formData, rubro: value })}
                >
                  <SelectTrigger data-testid="config-rubro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rubrosData.map((rubro) => (
                      <SelectItem key={rubro.value} value={rubro.value}>
                        {rubro.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@organizacion.org"
                    data-testid="config-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="55 1234 5678"
                    data-testid="config-telefono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Domicilio fiscal
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle, Número, Colonia, CP, Ciudad"
                  data-testid="config-direccion"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                  data-testid="config-save-btn"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Autorización SAT</p>
                <p className="text-sm text-amber-700">
                  La configuración de fechas de autorización y vigencia de la autorización SAT 
                  estará disponible en una versión futura.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Notificaciones por Email
                </CardTitle>
                <CardDescription>
                  Recibe alertas cuando tus obligaciones fiscales estén próximas a vencer
                </CardDescription>
              </div>
              {notificationStatus?.email_configured ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Configurado
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <AlertTriangle className="w-3 h-3 mr-1" /> No configurado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationStatus?.email_configured ? (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Email de envío:</strong> {notificationStatus.sender_email}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    data-testid="send-test-email-btn"
                  >
                    {sendingTest ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Email de Prueba
                      </>
                    )}
                  </Button>
                  
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendNotifications}
                    disabled={sendingNotifications}
                    data-testid="send-notifications-btn"
                  >
                    {sendingNotifications ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Recordatorios Ahora
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Se enviarán recordatorios para obligaciones que venzan en los próximos 15 días.
                </p>
              </>
            ) : (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Para activar las notificaciones:</strong>
                </p>
                <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Crea una cuenta en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
                  <li>Obtén tu API Key desde el dashboard</li>
                  <li>Configura las variables de entorno: RESEND_API_KEY y SENDER_EMAIL</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduler Card */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Recordatorios Automáticos
                </CardTitle>
                <CardDescription>
                  Envío diario de recordatorios para obligaciones fiscales próximas a vencer
                </CardDescription>
              </div>
              {cronStatus?.scheduler_active ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100" data-testid="cron-status-badge">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100" data-testid="cron-status-badge">
                  <Clock className="w-3 h-3 mr-1" /> Inactivo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Horario:</strong> Todos los días a las 8:00 AM (hora Ciudad de México)
              </p>
              <p className="text-sm text-gray-600">
                <strong>Notifica:</strong> Obligaciones con 7, 3 o 1 día(s) restantes
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email configurado:</strong>{" "}
                {cronStatus?.email_configured ? (
                  <span className="text-green-600 font-medium">Sí</span>
                ) : (
                  <span className="text-amber-600 font-medium">No (requiere RESEND_API_KEY)</span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRunCron}
              disabled={runningCron}
              data-testid="run-cron-btn"
            >
              {runningCron ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Ejecutando...
                </div>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Ejecutar Cron Manualmente
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Nueva Organización */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Multi-Donataria
                </CardTitle>
                <CardDescription>
                  Gestiona múltiples organizaciones desde una sola cuenta
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="create-org-btn">
                  <Building className="w-4 h-4 mr-2" />
                  Crear Nueva Organización
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Organización</DialogTitle>
                  <DialogDescription>
                    Crea una nueva donataria autorizada. Los datos se pueden completar después en Configuración.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nombre de la Organización *</Label>
                    <Input
                      id="org-name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Ej: Fundación ABC"
                      data-testid="new-org-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-rfc">RFC (opcional)</Label>
                    <Input
                      id="org-rfc"
                      value={newOrgRfc}
                      onChange={(e) => setNewOrgRfc(e.target.value.toUpperCase())}
                      placeholder="Ej: FAB123456XX0"
                      data-testid="new-org-rfc"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOrgDialogOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleCreateOrg} 
                    disabled={creatingOrg}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid="submit-new-org"
                  >
                    {creatingOrg ? "Creando..." : "Crear Organización"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConfiguracionPage;
