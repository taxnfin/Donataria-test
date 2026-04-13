import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import {
  Shield, AlertTriangle, FileText, Users, Search, Plus, Eye, CheckCircle2, Clock, XCircle, DollarSign, Fingerprint, ClipboardList
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const fmt = (v) => `$${(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const PLDPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [opsVulnerables, setOpsVulnerables] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [matriz, setMatriz] = useState(null);
  const [kycStatus, setKycStatus] = useState([]);
  const [ddLogs, setDdLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");

  // Dialog states
  const [avisoDialog, setAvisoDialog] = useState(false);
  const [avisoForm, setAvisoForm] = useState({});
  const [ddDialog, setDdDialog] = useState(false);
  const [ddForm, setDdForm] = useState({});
  const [kycDialog, setKycDialog] = useState(false);
  const [kycForm, setKycForm] = useState({});
  const [kycDonante, setKycDonante] = useState(null);
  const [donantes, setDonantes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, opsRes, avisosRes, matrizRes, kycRes, ddRes, donRes] = await Promise.all([
        axios.get(`${API}/pld/dashboard`, { withCredentials: true }),
        axios.get(`${API}/pld/operaciones-vulnerables`, { withCredentials: true }),
        axios.get(`${API}/pld/avisos`, { withCredentials: true }),
        axios.get(`${API}/pld/matriz-riesgo`, { withCredentials: true }),
        axios.get(`${API}/pld/kyc-status`, { withCredentials: true }),
        axios.get(`${API}/pld/due-diligence`, { withCredentials: true }),
        axios.get(`${API}/donantes`, { withCredentials: true }),
      ]);
      setDashboard(dashRes.data);
      setOpsVulnerables(opsRes.data);
      setAvisos(avisosRes.data);
      setMatriz(matrizRes.data);
      setKycStatus(kycRes.data);
      setDdLogs(ddRes.data);
      setDonantes(donRes.data);
    } catch { toast.error("Error al cargar datos PLD"); }
    finally { setLoading(false); }
  };

  const handleCreateAviso = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/pld/avisos`, avisoForm, { withCredentials: true });
      toast.success("Aviso registrado");
      setAvisoDialog(false);
      loadAll();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
    finally { setSaving(false); }
  };

  const handleCreateDD = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/pld/due-diligence`, ddForm, { withCredentials: true });
      toast.success("Due diligence registrado");
      setDdDialog(false);
      loadAll();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
    finally { setSaving(false); }
  };

  const handleUpdateKYC = async () => {
    if (!kycDonante) return;
    setSaving(true);
    try {
      await axios.put(`${API}/pld/kyc/${kycDonante.donante_id}`, kycForm, { withCredentials: true });
      toast.success("KYC actualizado");
      setKycDialog(false);
      loadAll();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
    finally { setSaving(false); }
  };

  const openKycEdit = (d) => {
    setKycDonante(d);
    setKycForm({
      nivel_riesgo: d.nivel_riesgo || "",
      es_pep: d.es_pep || false,
      jurisdiccion_riesgo: d.jurisdiccion_riesgo || "bajo",
      tiene_identificacion: d.kyc_fields?.identificacion || false,
      tiene_constancia_fiscal: d.kyc_fields?.constancia_fiscal || false,
      beneficiario_controlador: d.beneficiario_controlador || "",
    });
    setKycDialog(true);
  };

  const riskColor = (nivel) => {
    const map = { critico: "bg-red-100 text-red-700", alto: "bg-orange-100 text-orange-700", medio: "bg-amber-100 text-amber-700", bajo: "bg-green-100 text-green-700" };
    return map[nivel] || "bg-gray-100 text-gray-700";
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" /></div></DashboardLayout>;

  const d = dashboard || {};
  const al = d.alertas || {};

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="pld-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>PLD / AML - Prevencion de Lavado de Dinero</h1>
          <p className="text-gray-500">Cumplimiento Art. 17 Ley Antilavado y regulacion UIF</p>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Alertas AML</p>
            <p className="text-2xl font-bold text-gray-900">{al.total || 0}</p>
            <p className="text-xs text-emerald-600">{al.tasa_resolucion || 0}% resueltas</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Ops. Vulnerables</p>
            <p className="text-2xl font-bold text-orange-600">{d.operaciones_vulnerables || 0}</p>
            <p className="text-xs text-gray-400">{">"} {fmt(d.umbral_operacion_vulnerable_mxn)}</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Avisos UIF</p>
            <p className="text-2xl font-bold text-blue-600">{d.avisos_uif?.total || 0}</p>
            <p className="text-xs text-amber-600">{d.avisos_uif?.pendientes || 0} pendientes</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">Due Diligence</p>
            <p className="text-2xl font-bold text-violet-600">{d.due_diligence?.total || 0}</p>
            <p className="text-xs text-amber-600">{d.due_diligence?.pendientes || 0} pendientes</p>
          </CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4">
            <p className="text-xs text-gray-500">KYC Completo</p>
            <p className="text-2xl font-bold text-emerald-600">{d.kyc?.kyc_porcentaje || 0}%</p>
            <Progress value={d.kyc?.kyc_porcentaje || 0} className="h-1.5 mt-1" />
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="dashboard">Dashboard AML</TabsTrigger>
            <TabsTrigger value="vulnerables">Ops. Vulnerables</TabsTrigger>
            <TabsTrigger value="avisos">Avisos UIF</TabsTrigger>
            <TabsTrigger value="matriz">Matriz Riesgo</TabsTrigger>
            <TabsTrigger value="kyc">KYC Donantes</TabsTrigger>
            <TabsTrigger value="dd">Due Diligence</TabsTrigger>
          </TabsList>

          {/* Dashboard AML */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white"><CardHeader><CardTitle className="text-base">Alertas Generadas vs Resueltas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Nuevas</span><Badge className="bg-red-100 text-red-700">{al.nuevas}</Badge></div>
                  <div className="flex justify-between text-sm"><span>En revision</span><Badge className="bg-amber-100 text-amber-700">{al.en_revision}</Badge></div>
                  <div className="flex justify-between text-sm"><span>Resueltas</span><Badge className="bg-green-100 text-green-700">{al.resueltas}</Badge></div>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold"><span>Tasa de resolucion</span><span className="text-emerald-600">{al.tasa_resolucion}%</span></div>
                </CardContent></Card>
              <Card className="bg-white"><CardHeader><CardTitle className="text-base">Resumen Matriz de Riesgo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {matriz && <>
                    <div className="flex justify-between text-sm"><span>Criticos</span><Badge className="bg-red-100 text-red-700">{matriz.stats.criticos}</Badge></div>
                    <div className="flex justify-between text-sm"><span>Altos</span><Badge className="bg-orange-100 text-orange-700">{matriz.stats.altos}</Badge></div>
                    <div className="flex justify-between text-sm"><span>Medios</span><Badge className="bg-amber-100 text-amber-700">{matriz.stats.medios}</Badge></div>
                    <div className="flex justify-between text-sm"><span>Bajos</span><Badge className="bg-green-100 text-green-700">{matriz.stats.bajos}</Badge></div>
                  </>}
                </CardContent></Card>
            </div>
          </TabsContent>

          {/* Operaciones Vulnerables */}
          <TabsContent value="vulnerables">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-600" /> Operaciones Vulnerables (Art. 17 Ley Antilavado)</CardTitle>
                <CardDescription>Donativos que igualan o superan {opsVulnerables?.umbral_umas} UMAs ({fmt(opsVulnerables?.umbral_mxn)})</CardDescription>
              </CardHeader>
              <CardContent>
                {opsVulnerables?.operaciones?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No se detectaron operaciones vulnerables</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Fecha</TableHead><TableHead>Metodo</TableHead><TableHead>Aviso UIF</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(opsVulnerables?.operaciones || []).map(op => (
                        <TableRow key={op.donativo_id}>
                          <TableCell className="font-medium">{op.donante_nombre}</TableCell>
                          <TableCell className="font-mono text-xs">{op.donante_rfc}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-700">{fmt(op.monto)}</TableCell>
                          <TableCell className="text-sm">{(op.fecha_donativo || "").substring(0, 10)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{op.metodo_pago}</Badge></TableCell>
                          <TableCell>{op.aviso_presentado ? <Badge className="bg-green-100 text-green-700 text-xs">Presentado</Badge> : <Badge className="bg-red-100 text-red-700 text-xs">Pendiente</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avisos UIF */}
          <TabsContent value="avisos">
            <Card className="bg-white">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Avisos presentados ante UIF / SAT</CardTitle>
                  <CardDescription>Registro de avisos con folios y acuses de recepcion</CardDescription>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setAvisoForm({ tipo_aviso: "operacion_vulnerable", estatus: "pendiente" }); setAvisoDialog(true); }} data-testid="new-aviso-btn">
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Aviso
                </Button>
              </CardHeader>
              <CardContent>
                {avisos.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay avisos registrados</p> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Tipo</TableHead><TableHead>Folio</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estatus</TableHead><TableHead>Acuse</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {avisos.map(a => (
                        <TableRow key={a.aviso_id}>
                          <TableCell className="text-sm">{a.tipo_aviso?.replace(/_/g, " ")}</TableCell>
                          <TableCell className="font-mono text-xs">{a.numero_folio || "-"}</TableCell>
                          <TableCell className="text-sm">{(a.fecha_presentacion || a.created_at || "").substring(0, 10)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(a.monto)}</TableCell>
                          <TableCell><Badge className={a.estatus === "acusado" ? "bg-green-100 text-green-700" : a.estatus === "presentado" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>{a.estatus}</Badge></TableCell>
                          <TableCell className="text-xs text-gray-500">{a.acuse_recepcion || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matriz de Riesgo */}
          <TabsContent value="matriz">
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-violet-600" /> Matriz de Riesgo de Donantes</CardTitle>
                <CardDescription>Scoring automatico: PEPs, jurisdiccion, monto, metodo de pago, KYC</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead className="text-right">Total Donativos</TableHead><TableHead>Score</TableHead><TableHead>Nivel</TableHead><TableHead>Factores</TableHead><TableHead>KYC</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(matriz?.matriz || []).map(m => (
                      <TableRow key={m.donante_id}>
                        <TableCell className="font-medium">{m.nombre}</TableCell>
                        <TableCell className="font-mono text-xs">{m.rfc}</TableCell>
                        <TableCell className="text-right">{fmt(m.total_donativos)}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><div className="w-10 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.score_riesgo >= 60 ? "bg-red-500" : m.score_riesgo >= 40 ? "bg-orange-500" : m.score_riesgo >= 20 ? "bg-amber-400" : "bg-green-500"}`} style={{ width: `${m.score_riesgo}%` }} /></div><span className="text-xs font-mono">{m.score_riesgo}</span></div></TableCell>
                        <TableCell><Badge className={riskColor(m.nivel_riesgo)}>{m.nivel_riesgo}</Badge></TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{m.factores.map((f, i) => <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>)}</div></TableCell>
                        <TableCell>{m.kyc_completo ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Donantes */}
          <TabsContent value="kyc">
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Fingerprint className="w-4 h-4 text-emerald-600" /> KYC de Donantes</CardTitle>
                <CardDescription>Identificacion, beneficiario controlador, constancia de situacion fiscal</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead>ID</TableHead><TableHead>Constancia</TableHead><TableHead>Benef. Controlador</TableHead><TableHead>Riesgo</TableHead><TableHead>Completitud</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {kycStatus.map(k => (
                      <TableRow key={k.donante_id}>
                        <TableCell className="font-medium">{k.nombre}{k.es_pep && <Badge className="ml-2 bg-purple-100 text-purple-700 text-[10px]">PEP</Badge>}</TableCell>
                        <TableCell className="font-mono text-xs">{k.rfc}</TableCell>
                        <TableCell>{k.kyc_fields.identificacion ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
                        <TableCell>{k.kyc_fields.constancia_fiscal ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
                        <TableCell>{k.kyc_fields.beneficiario_controlador ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
                        <TableCell>{k.kyc_fields.nivel_riesgo_asignado ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Progress value={k.kyc_porcentaje} className="h-1.5 w-16" /><span className="text-xs">{k.kyc_porcentaje}%</span></div></TableCell>
                        <TableCell><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openKycEdit(k)} data-testid={`kyc-edit-${k.donante_id}`}>Editar KYC</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Due Diligence */}
          <TabsContent value="dd">
            <Card className="bg-white">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-violet-600" /> Bitacora de Due Diligence</CardTitle>
                  <CardDescription>Registro de revisiones sobre donantes recurrentes o de alto monto</CardDescription>
                </div>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => { setDdForm({ tipo_revision: "periodica", resultado: "pendiente", documentos_revisados: [] }); setDdDialog(true); }} data-testid="new-dd-btn">
                  <Plus className="w-4 h-4 mr-1" /> Nueva Revision
                </Button>
              </CardHeader>
              <CardContent>
                {ddLogs.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay registros de due diligence</p> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Fecha</TableHead><TableHead>Donante</TableHead><TableHead>Tipo</TableHead><TableHead>Resultado</TableHead><TableHead>Revisor</TableHead><TableHead>Hallazgos</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {ddLogs.map(dd => (
                        <TableRow key={dd.dd_id}>
                          <TableCell className="text-sm">{(dd.created_at || "").substring(0, 10)}</TableCell>
                          <TableCell className="font-medium">{dd.donante_nombre || dd.donante_id}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{dd.tipo_revision}</Badge></TableCell>
                          <TableCell><Badge className={dd.resultado === "aprobado" ? "bg-green-100 text-green-700" : dd.resultado === "rechazado" ? "bg-red-100 text-red-700" : dd.resultado === "escalado" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}>{dd.resultado}</Badge></TableCell>
                          <TableCell className="text-sm">{dd.reviewer_name}</TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{dd.hallazgos || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Aviso Dialog */}
        <Dialog open={avisoDialog} onOpenChange={setAvisoDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Aviso UIF/SAT</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Tipo de aviso</Label>
                <Select value={avisoForm.tipo_aviso || ""} onValueChange={v => setAvisoForm(p => ({ ...p, tipo_aviso: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacion_vulnerable">Operacion Vulnerable</SelectItem>
                    <SelectItem value="operacion_inusual">Operacion Inusual</SelectItem>
                    <SelectItem value="operacion_relevante">Operacion Relevante</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Folio</Label><Input value={avisoForm.numero_folio || ""} onChange={e => setAvisoForm(p => ({ ...p, numero_folio: e.target.value }))} placeholder="SAT-XXXX" /></div>
                <div className="space-y-2"><Label>Monto</Label><Input type="number" value={avisoForm.monto || ""} onChange={e => setAvisoForm(p => ({ ...p, monto: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <div className="space-y-2"><Label>Fecha presentacion</Label><Input type="date" value={avisoForm.fecha_presentacion || ""} onChange={e => setAvisoForm(p => ({ ...p, fecha_presentacion: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Acuse recepcion</Label><Input value={avisoForm.acuse_recepcion || ""} onChange={e => setAvisoForm(p => ({ ...p, acuse_recepcion: e.target.value }))} placeholder="Numero de acuse" /></div>
              <div className="space-y-2"><Label>Estatus</Label>
                <Select value={avisoForm.estatus || "pendiente"} onValueChange={v => setAvisoForm(p => ({ ...p, estatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="presentado">Presentado</SelectItem>
                    <SelectItem value="acusado">Acusado</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Descripcion</Label><Textarea value={avisoForm.descripcion || ""} onChange={e => setAvisoForm(p => ({ ...p, descripcion: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAvisoDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateAviso} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? "Guardando..." : "Registrar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* KYC Dialog */}
        <Dialog open={kycDialog} onOpenChange={setKycDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>KYC - {kycDonante?.nombre}</DialogTitle><DialogDescription>Actualizar informacion de Conoce a tu Donante</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Nivel de riesgo</Label>
                <Select value={kycForm.nivel_riesgo || ""} onValueChange={v => setKycForm(p => ({ ...p, nivel_riesgo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="critico">Critico</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.es_pep || false} onCheckedChange={v => setKycForm(p => ({ ...p, es_pep: v }))} /><Label>Es Persona Politicamente Expuesta (PEP)</Label></div>
              <div className="space-y-2"><Label>Jurisdiccion de riesgo</Label>
                <Select value={kycForm.jurisdiccion_riesgo || "bajo"} onValueChange={v => setKycForm(p => ({ ...p, jurisdiccion_riesgo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo riesgo</SelectItem>
                    <SelectItem value="medio">Riesgo medio</SelectItem>
                    <SelectItem value="alto">Alto riesgo</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.tiene_identificacion || false} onCheckedChange={v => setKycForm(p => ({ ...p, tiene_identificacion: v }))} /><Label>Tiene identificacion oficial</Label></div>
              <div className="flex items-center gap-3"><Checkbox checked={kycForm.tiene_constancia_fiscal || false} onCheckedChange={v => setKycForm(p => ({ ...p, tiene_constancia_fiscal: v }))} /><Label>Tiene constancia de situacion fiscal</Label></div>
              <div className="space-y-2"><Label>Beneficiario controlador</Label><Input value={kycForm.beneficiario_controlador || ""} onChange={e => setKycForm(p => ({ ...p, beneficiario_controlador: e.target.value }))} placeholder="Nombre del beneficiario controlador" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKycDialog(false)}>Cancelar</Button>
              <Button onClick={handleUpdateKYC} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? "Guardando..." : "Actualizar KYC"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Due Diligence Dialog */}
        <Dialog open={ddDialog} onOpenChange={setDdDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Revision Due Diligence</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Donante</Label>
                <Select value={ddForm.donante_id || ""} onValueChange={v => setDdForm(p => ({ ...p, donante_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar donante" /></SelectTrigger>
                  <SelectContent>{donantes.map(d => <SelectItem key={d.donante_id} value={d.donante_id}>{d.nombre} ({d.rfc})</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Tipo de revision</Label>
                <Select value={ddForm.tipo_revision || "periodica"} onValueChange={v => setDdForm(p => ({ ...p, tipo_revision: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inicial">Inicial</SelectItem>
                    <SelectItem value="periodica">Periodica</SelectItem>
                    <SelectItem value="por_alerta">Por alerta</SelectItem>
                    <SelectItem value="por_monto">Por monto</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Resultado</Label>
                <Select value={ddForm.resultado || "pendiente"} onValueChange={v => setDdForm(p => ({ ...p, resultado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                    <SelectItem value="escalado">Escalado</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Hallazgos</Label><Textarea value={ddForm.hallazgos || ""} onChange={e => setDdForm(p => ({ ...p, hallazgos: e.target.value }))} rows={3} placeholder="Describir hallazgos de la revision..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDdDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateDD} disabled={saving} className="bg-violet-600 hover:bg-violet-700">{saving ? "Guardando..." : "Registrar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PLDPage;
