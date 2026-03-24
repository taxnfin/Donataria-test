import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
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
  Calendar
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const ConfiguracionPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  }, []);

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
      </div>
    </DashboardLayout>
  );
};

export default ConfiguracionPage;
