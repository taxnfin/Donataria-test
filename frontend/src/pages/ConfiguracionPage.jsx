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
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const ConfiguracionPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
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
  }, []);

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

  const rubros = [
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
                    {rubros.map((rubro) => (
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
      </div>
    </DashboardLayout>
  );
};

export default ConfiguracionPage;
