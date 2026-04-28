import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BookOpen, Search, Upload, Plus, Link as LinkIcon, Trash2, ChevronLeft, ChevronRight, Eye, ExternalLink } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { CatalogoTable } from "../components/catalogo/CatalogoTable";

const PAGE_SIZE = 20;

const CatalogoPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterGiro, setFilterGiro] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterEstatus, setFilterEstatus] = useState("all");
  const [giros, setGiros] = useState([]);
  const [estados, setEstados] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [vinculados, setVinculados] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingDonante, setLinkingDonante] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchFilters = async () => { try { const r = await axios.get(`${API}/catalogo/donatarias/giros`); setGiros(r.data.giros); setEstados(r.data.estados); } catch (e) { console.error("Error:", e); } };
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); params.set("limit", PAGE_SIZE); params.set("skip", page * PAGE_SIZE);
      if (search) params.set("search", search); if (filterGiro !== "all") params.set("giro", filterGiro);
      if (filterEstado !== "all") params.set("estado", filterEstado); if (filterEstatus !== "all") params.set("estatus_sat", filterEstatus);
      const r = await axios.get(`${API}/catalogo/donatarias?${params}`); setItems(r.data.items); setTotal(r.data.total);
    } catch { toast.error("Error al cargar catalogo"); } finally { setLoading(false); }
  }, [page, search, filterGiro, filterEstado, filterEstatus]);

  useEffect(() => { fetchFilters(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearchChange = (value) => { if (searchTimeout) clearTimeout(searchTimeout); setSearchTimeout(setTimeout(() => { setSearch(value); setPage(0); }, 400)); };
  const handleViewDetail = async (item) => { setSelectedItem(item); setDetailOpen(true); try { const r = await axios.get(`${API}/catalogo/donatarias/${item.catalogo_id}/vinculados`, { withCredentials: true }); setVinculados(r.data); } catch { setVinculados([]); } };
  const handleLinkDonante = async () => { if (!linkingDonante || !selectedItem) return; try { await axios.post(`${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vincular?donante_id=${linkingDonante}`, {}, { withCredentials: true }); toast.success("Vinculado"); setLinkDialogOpen(false); setLinkingDonante(""); const r = await axios.get(`${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vinculados`, { withCredentials: true }); setVinculados(r.data); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleUnlink = async (donanteId) => { if (!selectedItem) return; try { await axios.delete(`${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vincular/${donanteId}`, { withCredentials: true }); toast.success("Desvinculado"); setVinculados(v => v.filter(d => d.donante_id !== donanteId)); } catch { toast.error("Error"); } };
  const fetchDonantes = async () => { try { const r = await axios.get(`${API}/donantes`, { withCredentials: true }); setDonantes(r.data); } catch (e) { console.error("Error:", e); } };
  const handleImportCSV = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const fd = new FormData(); fd.append("file", file); const r = await axios.post(`${API}/catalogo/donatarias/import`, fd, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }); toast.success(`Importados: ${r.data.imported}`); setImportDialogOpen(false); fetchItems(); } catch { toast.error("Error"); } finally { setUploading(false); } };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="catalogo-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Catalogo SAT - Donatarias Autorizadas</h1><p className="text-gray-500">Directorio oficial de {total} donatarias</p></div>
          <Button variant="outline" onClick={() => { setImportDialogOpen(true); }} data-testid="import-csv-btn"><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
        </div>

        <Card className="bg-white border-gray-100"><CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar por nombre o RFC..." onChange={(e) => handleSearchChange(e.target.value)} className="pl-10" data-testid="search-catalogo" /></div>
            <Select value={filterGiro} onValueChange={(v) => { setFilterGiro(v); setPage(0); }}><SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Giro" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los giros</SelectItem>{giros.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
            <Select value={filterEstatus} onValueChange={(v) => { setFilterEstatus(v); setPage(0); }}><SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Estatus" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="activa">Activa</SelectItem><SelectItem value="revocada">Revocada</SelectItem><SelectItem value="suspendida">Suspendida</SelectItem></SelectContent></Select>
          </div>
        </CardContent></Card>

        <Card className="bg-white border-gray-100"><CardContent className="p-0">
          <CatalogoTable items={items} loading={loading} onLink={handleViewDetail} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t"><p className="text-sm text-gray-500">{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button></div>
            </div>
          )}
        </CardContent></Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selectedItem?.nombre}</DialogTitle><DialogDescription>RFC: {selectedItem?.rfc}</DialogDescription></DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Giro:</span><span>{selectedItem?.giro}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado:</span><span>{selectedItem?.estado_republica}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estatus SAT:</span><Badge className={selectedItem?.estatus_sat === "activa" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{selectedItem?.estatus_sat}</Badge></div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2"><span className="font-medium">Donantes vinculados</span><Button size="sm" variant="outline" onClick={() => { fetchDonantes(); setLinkDialogOpen(true); }}><Plus className="w-3 h-3 mr-1" />Vincular</Button></div>
                {vinculados.length === 0 ? <p className="text-gray-400 text-xs">Sin donantes vinculados</p> : vinculados.map(v => <div key={v.donante_id} className="flex items-center justify-between p-2 bg-gray-50 rounded"><span>{v.nombre} ({v.rfc})</span><Button size="sm" variant="ghost" onClick={() => handleUnlink(v.donante_id)}><Trash2 className="w-3 h-3 text-red-500" /></Button></div>)}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>Vincular Donante</DialogTitle></DialogHeader>
            <Select value={linkingDonante} onValueChange={setLinkingDonante}><SelectTrigger><SelectValue placeholder="Seleccionar donante" /></SelectTrigger><SelectContent>{donantes.map(d => <SelectItem key={d.donante_id} value={d.donante_id}>{d.nombre} ({d.rfc})</SelectItem>)}</SelectContent></Select>
            <DialogFooter><Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button><Button onClick={handleLinkDonante} className="bg-emerald-600 hover:bg-emerald-700">Vincular</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent><DialogHeader><DialogTitle>Importar Catalogo CSV</DialogTitle></DialogHeader>
            <Input type="file" accept=".csv" onChange={handleImportCSV} disabled={uploading} />{uploading && <p className="text-sm text-gray-500">Importando...</p>}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CatalogoPage;
