import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Shield } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { AMLDashboardTab, OpsVulnerablesTab, AvisosTab, MatrizRiesgoTab, KYCTab, DueDiligenceTab } from "../components/pld/PLDTabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PLDPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [opsVulnerables, setOpsVulnerables] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [matriz, setMatriz] = useState(null);
  const [kycStatus, setKycStatus] = useState([]);
  const [ddLogs, setDdLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [avisoDialog, setAvisoDialog] = useState(false);
  const [avisoForm, setAvisoForm] = useState({});
  const [ddDialog, setDdDialog] = useState(false);
  const [ddForm, setDdForm] = useState({});
  const [kycDialog, setKycDialog] = useState(false);
  const [kycForm, setKycForm] = useState({});
  const [kycDonante, setKycDonante] = useState(null);
  const [donantes, setDonantes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, o, a, m, k, dd, dn] = await Promise.all([
        axios.get(`${API}/pld/dashboard`, { withCredentials: true }),
        axios.get(`${API}/pld/operaciones-vulnerables`, { withCredentials: true }),
        axios.get(`${API}/pld/avisos`, { withCredentials: true }),
        axios.get(`${API}/pld/matriz-riesgo`, { withCredentials: true }),
        axios.get(`${API}/pld/kyc-status`, { withCredentials: true }),
        axios.get(`${API}/pld/due-diligence`, { withCredentials: true }),
        axios.get(`${API}/donantes`, { withCredentials: true }),
      ]);
      setDashboard(d.data); setOpsVulnerables(o.data); setAvisos(a.data); setMatriz(m.data); setKycStatus(k.data); setDdLogs(dd.data); setDonantes(dn.data);
    } catch { toast.error("Error al cargar datos PLD"); }
    finally { setLoading(false); }
  };

  const handleCreateAviso = async () => { setSaving(true); try { await axios.post(`${API}/pld/avisos`, avisoForm, { withCredentials: true }); toast.success("Aviso registrado"); setAvisoDialog(false); loadAll(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } finally { setSaving(false); } };
  const handleCreateDD = async () => { setSaving(true); try { await axios.post(`${API}/pld/due-diligence`, ddForm, { withCredentials: true }); toast.success("Due diligence registrado"); setDdDialog(false); loadAll(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } finally { setSaving(false); } };
  const handleUpdateKYC = async () => { if (!kycDonante) return; setSaving(true); try { await axios.put(`${API}/pld/kyc/${kycDonante.donante_id}`, kycForm, { withCredentials: true }); toast.success("KYC actualizado"); setKycDialog(false); loadAll(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } finally { setSaving(false); } };

  const openKycEdit = (d) => { setKycDonante(d); setKycForm({ nivel_riesgo: d.nivel_riesgo || "", es_pep: d.es_pep || false, jurisdiccion_riesgo: d.jurisdiccion_riesgo || "bajo", tiene_identificacion: d.kyc_fields?.identificacion || false, tiene_constancia_fiscal: d.kyc_fields?.constancia_fiscal || false, beneficiario_controlador: d.beneficiario_controlador || "" }); setKycDialog(true); };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div></DashboardLayout>;

  const d = dashboard || {};
  const al = d.alertas || {};

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="pld-page">
        <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>PLD / AML - Prevencion de Lavado de Dinero</h1><p className="text-gray-500">Cumplimiento Art. 17 Ley Antilavado y regulacion UIF</p></div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Alertas AML</p><p className="text-2xl font-bold text-gray-900">{al.total || 0}</p><p className="text-xs text-emerald-600">{al.tasa_resolucion || 0}% resueltas</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Ops. Vulnerables</p><p className="text-2xl font-bold text-orange-600">{d.operaciones_vulnerables || 0}</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Avisos UIF</p><p className="text-2xl font-bold text-blue-600">{d.avisos_uif?.total || 0}</p><p className="text-xs text-amber-600">{d.avisos_uif?.pendientes || 0} pendientes</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">Due Diligence</p><p className="text-2xl font-bold text-violet-600">{d.due_diligence?.total || 0}</p></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><p className="text-xs text-gray-500">KYC Completo</p><p className="text-2xl font-bold text-emerald-600">{d.kyc?.kyc_porcentaje || 0}%</p><Progress value={d.kyc?.kyc_porcentaje || 0} className="h-1.5 mt-1" /></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="dashboard">Dashboard AML</TabsTrigger><TabsTrigger value="vulnerables">Ops. Vulnerables</TabsTrigger><TabsTrigger value="avisos">Avisos UIF</TabsTrigger><TabsTrigger value="matriz">Matriz Riesgo</TabsTrigger><TabsTrigger value="kyc">KYC Donantes</TabsTrigger><TabsTrigger value="dd">Due Diligence</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><AMLDashboardTab alertas={al} matriz={matriz} /></TabsContent>
          <TabsContent value="vulnerables"><OpsVulnerablesTab data={opsVulnerables} /></TabsContent>
          <TabsContent value="avisos"><AvisosTab avisos={avisos} backendUrl={BACKEND_URL} onNewAviso={() => { setAvisoForm({ tipo_aviso: "operacion_vulnerable", estatus: "pendiente" }); setAvisoDialog(true); }} /></TabsContent>
          <TabsContent value="matriz"><MatrizRiesgoTab data={matriz} /></TabsContent>
          <TabsContent value="kyc"><KYCTab kycStatus={kycStatus} onEditKYC={openKycEdit} /></TabsContent>
          <TabsContent value="dd"><DueDiligenceTab ddLogs={ddLogs} onNewDD={() => { setDdForm({ tipo_revision: "periodica", resultado: "pendiente", documentos_revisados: [] }); setDdDialog(true); }} /></TabsContent>
        </Tabs>

        {/* Aviso Dialog */}
        <Dialog open={avisoDialog} onOpenChange={setAvisoDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Aviso UIF/SAT</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Tipo</Label><Select value={avisoForm.tipo_aviso || ""} onValueChange={v => setAvisoForm(p => ({ ...p, tipo_aviso: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="operacion_vulnerable">Operacion Vulnerable</SelectItem><SelectItem value="operacion_inusual">Operacion Inusual</SelectItem><SelectItem value="operacion_relevante">Operacion Relevante</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Folio</Label><Input value={avisoForm.numero_folio || ""} onChange={e => setAvisoForm(p => ({ ...p, numero_folio: e.target.value }))} /></div><div className="space-y-2"><Label>Monto</Label><Input type="number" value={avisoForm.monto || ""} onChange={e => setAvisoForm(p => ({ ...p, monto: parseFloat(e.target.value) || 0 }))} /></div></div>
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={avisoForm.fecha_presentacion || ""} onChange={e => setAvisoForm(p => ({ ...p, fecha_presentacion: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Acuse</Label><Input value={avisoForm.acuse_recepcion || ""} onChange={e => setAvisoForm(p => ({ ...p, acuse_recepcion: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Estatus</Label><Select value={avisoForm.estatus || "pendiente"} onValueChange={v => setAvisoForm(p => ({ ...p, estatus: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="presentado">Presentado</SelectItem><SelectItem value="acusado">Acusado</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Descripcion</Label><Textarea value={avisoForm.descripcion || ""} onChange={e => setAvisoForm(p => ({ ...p, descripcion: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setAvisoDialog(false)}>Cancelar</Button><Button onClick={handleCreateAviso} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Guardando..." : "Registrar"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* KYC Dialog */}
        <Dialog open={kycDialog} onOpenChange={setKycDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>KYC - {kycDonante?.nombre}</DialogTitle><DialogDescription>Actualizar informacion de Conoce a tu Donante</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Nivel de riesgo</Label><Select value={kycForm.nivel_riesgo || ""} onValueChange={v => setKycForm(p => ({ ...p, nivel_riesgo: v }))}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="bajo">Bajo</SelectItem><SelectItem value="medio">Medio</SelectItem><SelectItem value="alto">Alto</SelectItem><SelectItem value="critico">Critico</SelectItem></SelectContent></Select></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.es_pep || false} onCheckedChange={v => setKycForm(p => ({ ...p, es_pep: v }))} /><Label>Es PEP</Label></div>
              <div className="space-y-2"><Label>Jurisdiccion riesgo</Label><Select value={kycForm.jurisdiccion_riesgo || "bajo"} onValueChange={v => setKycForm(p => ({ ...p, jurisdiccion_riesgo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bajo">Bajo</SelectItem><SelectItem value="medio">Medio</SelectItem><SelectItem value="alto">Alto</SelectItem></SelectContent></Select></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.tiene_identificacion || false} onCheckedChange={v => setKycForm(p => ({ ...p, tiene_identificacion: v }))} /><Label>Tiene identificacion oficial</Label></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.tiene_constancia_fiscal || false} onCheckedChange={v => setKycForm(p => ({ ...p, tiene_constancia_fiscal: v }))} /><Label>Tiene constancia fiscal</Label></div>
              <div className="space-y-2"><Label>Beneficiario controlador</Label><Input value={kycForm.beneficiario_controlador || ""} onChange={e => setKycForm(p => ({ ...p, beneficiario_controlador: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setKycDialog(false)}>Cancelar</Button><Button onClick={handleUpdateKYC} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? "Guardando..." : "Actualizar"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DD Dialog */}
        <Dialog open={ddDialog} onOpenChange={setDdDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Revision Due Diligence</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Donante</Label><Select value={ddForm.donante_id || ""} onValueChange={v => setDdForm(p => ({ ...p, donante_id: v }))}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{donantes.map(d => <SelectItem key={d.donante_id} value={d.donante_id}>{d.nombre} ({d.rfc})</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Tipo</Label><Select value={ddForm.tipo_revision || "periodica"} onValueChange={v => setDdForm(p => ({ ...p, tipo_revision: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inicial">Inicial</SelectItem><SelectItem value="periodica">Periodica</SelectItem><SelectItem value="por_alerta">Por alerta</SelectItem><SelectItem value="por_monto">Por monto</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Resultado</Label><Select value={ddForm.resultado || "pendiente"} onValueChange={v => setDdForm(p => ({ ...p, resultado: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="aprobado">Aprobado</SelectItem><SelectItem value="rechazado">Rechazado</SelectItem><SelectItem value="escalado">Escalado</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Hallazgos</Label><Textarea value={ddForm.hallazgos || ""} onChange={e => setDdForm(p => ({ ...p, hallazgos: e.target.value }))} rows={3} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDdDialog(false)}>Cancelar</Button><Button onClick={handleCreateDD} disabled={saving} className="bg-violet-600 hover:bg-violet-700">{saving ? "Guardando..." : "Registrar"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PLDPage;
