import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertTriangle, Shield, Search, Settings, Download, AlertCircle } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { AlertRuleDialog } from "../components/alertas/AlertRuleDialog";
import { AlertasTable, ReglaCard } from "../components/alertas/AlertComponents";
import { PageHeader } from "../components/shared/CommonComponents";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AlertasPage = () => {
  const [activeTab, setActiveTab] = useState("alertas");
  const [alertas, setAlertas] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [stats, setStats] = useState({ total: 0, nuevas: 0, criticas: 0, altas: 0 });
  const [loading, setLoading] = useState(true);
  const [filterSeveridad, setFilterSeveridad] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [search, setSearch] = useState("");
  const [reglaDialogOpen, setReglaDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState(null);
  const [reglaForm, setReglaForm] = useState({ nombre: "", descripcion: "", tipo_regla: "umbral_monto", severidad: "media", condiciones: {}, activa: true });

  useEffect(() => { fetchData(); }, [filterSeveridad, filterEstado, search]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setAlertas(alertasRes.data); setReglas(reglasRes.data); setStats(statsRes.data);
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  };

  const parseCondiciones = (tipo, cond) => {
    if (tipo === "umbral_monto") return { monto_minimo: parseFloat(cond.monto_minimo) || 100000 };
    if (tipo === "keywords_descripcion") return { keywords: (cond.keywords || "").split(",").map(k => k.trim()).filter(k => k) };
    if (tipo === "nivel_riesgo_donante") return { niveles: cond.niveles || ["alto", "critico"] };
    return cond;
  };

  const handleCreateRegla = async () => {
    try {
      const payload = { ...reglaForm, condiciones: parseCondiciones(reglaForm.tipo_regla, reglaForm.condiciones) };
      if (editingRegla) { await axios.put(`${API}/alertas/reglas/${editingRegla.rule_id}`, payload, { withCredentials: true }); toast.success("Regla actualizada"); }
      else { await axios.post(`${API}/alertas/reglas`, payload, { withCredentials: true }); toast.success("Regla creada"); }
      setReglaDialogOpen(false); resetReglaForm(); fetchData();
    } catch { toast.error("Error al guardar regla"); }
  };

  const handleToggleRegla = async (ruleId) => {
    try { const res = await axios.put(`${API}/alertas/reglas/${ruleId}/toggle`, {}, { withCredentials: true }); toast.success(`Regla ${res.data.activa ? "activada" : "desactivada"}`); fetchData(); }
    catch { toast.error("Error al cambiar estado"); }
  };

  const handleDeleteRegla = async (ruleId) => {
    if (!confirm("Eliminar esta regla?")) return;
    try { await axios.delete(`${API}/alertas/reglas/${ruleId}`, { withCredentials: true }); toast.success("Regla eliminada"); fetchData(); }
    catch { toast.error("Error al eliminar regla"); }
  };

  const handleUpdateAlertaEstado = async (alertId, estado) => {
    try { await axios.put(`${API}/alertas/${alertId}/estado?estado=${estado}`, {}, { withCredentials: true }); toast.success("Estado actualizado"); fetchData(); }
    catch { toast.error("Error al actualizar estado"); }
  };

  const resetReglaForm = () => { setEditingRegla(null); setReglaForm({ nombre: "", descripcion: "", tipo_regla: "umbral_monto", severidad: "media", condiciones: {}, activa: true }); };

  const handleEditRegla = (regla) => {
    setEditingRegla(regla); setReglaForm({ nombre: regla.nombre, descripcion: regla.descripcion || "", tipo_regla: regla.tipo_regla, severidad: regla.severidad, condiciones: regla.condiciones || {}, activa: regla.activa });
    setReglaDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="alertas-page">
        <PageHeader title="Motor de Alertas AML" subtitle="Sistema de monitoreo y deteccion de riesgos">
          <Button variant="outline" onClick={() => window.open(`${BACKEND_URL}/api/exportar/alertas`, '_blank')} data-testid="export-alertas-btn"><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
        </PageHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Alertas</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div><Shield className="w-8 h-8 text-gray-300" /></div></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Nuevas</p><p className="text-2xl font-bold text-amber-600">{stats.nuevas}</p></div><AlertCircle className="w-8 h-8 text-amber-200" /></div></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Criticas</p><p className="text-2xl font-bold text-red-600">{stats.criticas}</p></div><AlertTriangle className="w-8 h-8 text-red-200" /></div></CardContent></Card>
          <Card className="bg-white border-gray-100"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Altas</p><p className="text-2xl font-bold text-amber-600">{stats.altas}</p></div><AlertTriangle className="w-8 h-8 text-amber-200" /></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="alertas" data-testid="tab-alertas"><AlertTriangle className="w-4 h-4 mr-2" /> Alertas ({alertas.length})</TabsTrigger>
            <TabsTrigger value="reglas" data-testid="tab-reglas"><Settings className="w-4 h-4 mr-2" /> Reglas ({reglas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="alertas" className="space-y-4">
            <Card className="bg-white border-gray-100"><CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar alertas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="search-alertas" /></div>
                <Select value={filterSeveridad} onValueChange={setFilterSeveridad}><SelectTrigger className="w-40"><SelectValue placeholder="Severidad" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="critica">Critica</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="baja">Baja</SelectItem></SelectContent></Select>
                <Select value={filterEstado} onValueChange={setFilterEstado}><SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="nueva">Nueva</SelectItem><SelectItem value="en_revision">En revision</SelectItem><SelectItem value="resuelta">Resuelta</SelectItem><SelectItem value="descartada">Descartada</SelectItem></SelectContent></Select>
              </div>
            </CardContent></Card>
            <AlertasTable alertas={alertas} loading={loading} onUpdateEstado={handleUpdateAlertaEstado} />
          </TabsContent>

          <TabsContent value="reglas" className="space-y-4">
            <div className="flex justify-end">
              <AlertRuleDialog open={reglaDialogOpen} onOpenChange={setReglaDialogOpen} form={reglaForm} setForm={setReglaForm} editing={editingRegla} onSubmit={handleCreateRegla} onReset={resetReglaForm} />
            </div>
            <div className="grid gap-4">
              {reglas.length === 0 ? (
                <Card className="bg-white border-gray-100"><CardContent className="text-center py-12"><Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay reglas configuradas</p></CardContent></Card>
              ) : reglas.map((regla) => (
                <ReglaCard key={regla.rule_id} regla={regla} onToggle={handleToggleRegla} onEdit={handleEditRegla} onDelete={handleDeleteRegla} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AlertasPage;
