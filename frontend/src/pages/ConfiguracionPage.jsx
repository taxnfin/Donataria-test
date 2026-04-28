import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Building, Save, FileText, Mail, Phone, MapPin, Calendar, Plus } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { LogoUploadSection } from "../components/config/LogoUploadSection";
import { NotificationsSection } from "../components/config/NotificationsSection";
import { CronSection } from "../components/config/CronSection";
import { MembersSection } from "../components/config/MembersSection";

const rubrosData = [
  { value: "asistencial", label: "Asistencial" },
  { value: "educativo", label: "Educativo" },
  { value: "investigacion", label: "Investigacion cientifica o tecnologica" },
  { value: "cultural", label: "Cultural" },
  { value: "ecologico", label: "Ecologico" },
  { value: "becas", label: "Becas educativas" },
  { value: "obras_publicas", label: "Obras o servicios publicos" },
  { value: "otro", label: "Otro" }
];

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
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState("admin");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", rfc: "", rubro: "asistencial", direccion: "", telefono: "", email: ""
  });

  useEffect(() => {
    fetchOrganizacion();
    fetchNotificationStatus();
    fetchCronStatus();
    fetchMembers();
    fetchMyRole();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCronStatus = async () => {
    try {
      const response = await axios.get(`${API}/cron/status`, { withCredentials: true });
      setCronStatus(response.data);
    } catch (error) { console.error("Error fetching cron status:", error); }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/organizacion/miembros`, { withCredentials: true });
      setMembers(response.data);
    } catch { setMembers([]); }
  };

  const fetchMyRole = async () => {
    try {
      const response = await axios.get(`${API}/organizacion/mi-rol`, { withCredentials: true });
      setMyRole(response.data.role);
    } catch { setMyRole("admin"); }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) { toast.error("Ingresa un email"); return; }
    setInviting(true);
    try {
      await axios.post(`${API}/organizacion/miembros`, { user_email: inviteEmail, role: inviteRole }, { withCredentials: true });
      toast.success("Miembro invitado/actualizado");
      setInviteDialogOpen(false); setInviteEmail(""); setInviteRole("viewer");
      fetchMembers();
    } catch (error) { toast.error(error.response?.data?.detail || "Error al invitar miembro"); }
    finally { setInviting(false); }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/organizacion/miembros/${userId}/role`, { user_email: "", role: newRole }, { withCredentials: true });
      toast.success("Rol actualizado"); fetchMembers();
    } catch (error) { toast.error(error.response?.data?.detail || "Error al cambiar rol"); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Seguro que deseas eliminar este miembro?")) return;
    try {
      await axios.delete(`${API}/organizacion/miembros/${userId}`, { withCredentials: true });
      toast.success("Miembro eliminado"); fetchMembers();
    } catch (error) { toast.error(error.response?.data?.detail || "Error al eliminar miembro"); }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const response = await axios.post(`${API}/cron/notificaciones-diarias`, {}, { withCredentials: true });
      toast.success(response.data.message || "Cron ejecutado");
    } catch (error) { toast.error("Error al ejecutar cron"); }
    finally { setRunningCron(false); }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) { toast.error("Ingresa el nombre"); return; }
    setCreatingOrg(true);
    try {
      await axios.post(`${API}/organizaciones`, { nombre: newOrgName, rfc: newOrgRfc || undefined }, { withCredentials: true });
      toast.success("Organizacion creada");
      setNewOrgDialogOpen(false); setNewOrgName(""); setNewOrgRfc("");
      window.location.reload();
    } catch (error) { toast.error(error.response?.data?.detail || "Error al crear"); }
    finally { setCreatingOrg(false); }
  };

  const fetchNotificationStatus = async () => {
    try {
      const response = await axios.get(`${API}/notifications/status`, { withCredentials: true });
      setNotificationStatus(response.data);
    } catch (error) { console.error("Error fetching notification status:", error); }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const response = await axios.post(`${API}/notifications/send-test`, {}, { withCredentials: true });
      if (response.data.status === "success") toast.success("Email de prueba enviado.");
      else if (response.data.status === "skipped") toast.warning("El servicio de email no esta configurado.");
      else toast.error("Error al enviar email de prueba.");
    } catch { toast.error("Error al enviar email de prueba."); }
    finally { setSendingTest(false); }
  };

  const handleSendNotifications = async () => {
    setSendingNotifications(true);
    try {
      const response = await axios.post(`${API}/notifications/check-and-send`, {}, { withCredentials: true });
      toast.success(response.data.message);
    } catch (error) { toast.error(error.response?.data?.detail || "Error al enviar notificaciones."); }
    finally { setSendingNotifications(false); }
  };

  const fetchOrganizacion = async () => {
    try {
      const response = await axios.get(`${API}/organizacion`, { withCredentials: true });
      setFormData({
        nombre: response.data.nombre || "", rfc: response.data.rfc || "", rubro: response.data.rubro || "asistencial",
        direccion: response.data.direccion || "", telefono: response.data.telefono || "", email: response.data.email || ""
      });
      setLogoUrl(response.data.logo_url || null);
    } catch (error) { if (error.response?.status !== 404) toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await axios.put(`${API}/organizacion`, formData, { withCredentials: true });
      toast.success("Organizacion actualizada");
    } catch (error) { toast.error(error.response?.data?.detail || "Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) { toast.error("Solo se aceptan imagenes PNG, JPG o WebP"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("La imagen no debe superar 2MB"); return; }
    setUploadingLogo(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const response = await axios.post(`${API}/organizacion/logo`, fd, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      setLogoUrl(response.data.logo_url); toast.success("Logo actualizado");
    } catch { toast.error("Error al subir logo"); }
    finally { setUploadingLogo(false); }
  };

  const handleDeleteLogo = async () => {
    try { await axios.delete(`${API}/organizacion/logo`, { withCredentials: true }); setLogoUrl(null); toast.success("Logo eliminado"); }
    catch { toast.error("Error al eliminar logo"); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl" data-testid="configuracion-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Configuracion</h1>
          <p className="text-gray-500">Administra los datos de tu organizacion</p>
        </div>

        <LogoUploadSection logoUrl={logoUrl} uploadingLogo={uploadingLogo} onUpload={handleLogoUpload} onDelete={handleDeleteLogo} />

        {/* Organization Form */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Datos de la Organizacion</CardTitle>
                <CardDescription>Informacion fiscal y de contacto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-400" />Nombre / Razon Social</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Fundacion Ejemplo A.C." data-testid="config-nombre" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfc" className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" />RFC</Label>
                  <Input id="rfc" value={formData.rfc} onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })} placeholder="XXX000000XXX" maxLength={12} className="font-mono" data-testid="config-rfc" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rubro">Rubro de la organizacion</Label>
                <Select value={formData.rubro} onValueChange={(value) => setFormData({ ...formData, rubro: value })}>
                  <SelectTrigger data-testid="config-rubro"><SelectValue /></SelectTrigger>
                  <SelectContent>{rubrosData.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />Correo electronico</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contacto@organizacion.org" data-testid="config-email" /></div>
                <div className="space-y-2"><Label htmlFor="telefono" className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />Telefono</Label><Input id="telefono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="55 1234 5678" data-testid="config-telefono" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="direccion" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />Domicilio fiscal</Label><Input id="direccion" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} placeholder="Calle, Numero, Colonia, CP, Ciudad" data-testid="config-direccion" /></div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} data-testid="config-save-btn">
                  {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4"><div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-amber-600 mt-0.5" /><div><p className="font-medium text-amber-900">Autorizacion SAT</p><p className="text-sm text-amber-700">La configuracion de fechas de autorizacion y vigencia estara disponible en una version futura.</p></div></div></CardContent></Card>

        <NotificationsSection notificationStatus={notificationStatus} sendingTest={sendingTest} sendingNotifications={sendingNotifications} onSendTest={handleSendTestEmail} onSendNotifications={handleSendNotifications} />

        <CronSection cronStatus={cronStatus} runningCron={runningCron} onRunCron={handleRunCron} />

        {/* Multi-Donataria */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-blue-600" /></div><div><CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Multi-Donataria</CardTitle><CardDescription>Gestiona multiples organizaciones desde una sola cuenta</CardDescription></div></div></CardHeader>
          <CardContent>
            <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" data-testid="create-org-btn"><Building className="w-4 h-4 mr-2" />Crear Nueva Organizacion</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva Organizacion</DialogTitle><DialogDescription>Crea una nueva donataria autorizada.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label htmlFor="org-name">Nombre *</Label><Input id="org-name" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="Ej: Fundacion ABC" data-testid="new-org-name" /></div>
                  <div className="space-y-2"><Label htmlFor="org-rfc">RFC (opcional)</Label><Input id="org-rfc" value={newOrgRfc} onChange={(e) => setNewOrgRfc(e.target.value.toUpperCase())} placeholder="Ej: FAB123456XX0" data-testid="new-org-rfc" /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOrgDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateOrg} disabled={creatingOrg} className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-new-org">{creatingOrg ? "Creando..." : "Crear Organizacion"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <MembersSection
          members={members} myRole={myRole} inviteDialogOpen={inviteDialogOpen} setInviteDialogOpen={setInviteDialogOpen}
          inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole}
          inviting={inviting} onInvite={handleInviteMember} onChangeRole={handleChangeRole} onRemoveMember={handleRemoveMember}
        />
      </div>
    </DashboardLayout>
  );
};

export default ConfiguracionPage;
