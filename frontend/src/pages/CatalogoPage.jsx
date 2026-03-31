import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  BookOpen,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  Link2,
  Unlink,
  Eye,
  FileUp
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const GIRO_LABELS = {
  asistencial: "Asistencial",
  educativa: "Educativa",
  cultural: "Cultural",
  ecologica: "Ecológica",
  salud: "Salud",
  investigacion: "Investigación",
  desarrollo_social: "Desarrollo Social",
  derechos_humanos: "Derechos Humanos",
  becas: "Becas",
  otro: "Otro"
};

const GIRO_COLORS = {
  asistencial: "bg-blue-100 text-blue-700",
  educativa: "bg-violet-100 text-violet-700",
  cultural: "bg-pink-100 text-pink-700",
  ecologica: "bg-green-100 text-green-700",
  salud: "bg-red-100 text-red-700",
  investigacion: "bg-cyan-100 text-cyan-700",
  desarrollo_social: "bg-amber-100 text-amber-700",
  derechos_humanos: "bg-indigo-100 text-indigo-700",
  becas: "bg-teal-100 text-teal-700"
};

const ESTATUS_CONFIG = {
  autorizada: { color: "bg-green-100 text-green-700", label: "Autorizada" },
  revocada: { color: "bg-red-100 text-red-700", label: "Revocada" },
  en_proceso: { color: "bg-amber-100 text-amber-700", label: "En Proceso" }
};

const CatalogoPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${API}/catalogo/donatarias/giros`);
      setGiros(response.data.giros);
      setEstados(response.data.estados);
    } catch {}
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE);
      params.set("skip", page * PAGE_SIZE);
      if (search) params.set("search", search);
      if (filterGiro !== "all") params.set("giro", filterGiro);
      if (filterEstado !== "all") params.set("estado", filterEstado);
      if (filterEstatus !== "all") params.set("estatus_sat", filterEstatus);

      const response = await axios.get(`${API}/catalogo/donatarias?${params}`);
      setItems(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterGiro, filterEstado, filterEstatus]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearchChange = (value) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 400);
    setSearchTimeout(timeout);
  };

  const handleViewDetail = async (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
    try {
      const response = await axios.get(`${API}/catalogo/donatarias/${item.catalogo_id}/vinculados`, { withCredentials: true });
      setVinculados(response.data);
    } catch {
      setVinculados([]);
    }
  };

  const handleLinkDonante = async () => {
    if (!linkingDonante || !selectedItem) return;
    try {
      await axios.post(
        `${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vincular?donante_id=${linkingDonante}`,
        {},
        { withCredentials: true }
      );
      toast.success("Donante vinculado");
      setLinkDialogOpen(false);
      setLinkingDonante("");
      // Refresh vinculados
      const response = await axios.get(`${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vinculados`, { withCredentials: true });
      setVinculados(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al vincular");
    }
  };

  const handleUnlink = async (donanteId) => {
    if (!selectedItem) return;
    try {
      await axios.delete(`${API}/catalogo/donatarias/${selectedItem.catalogo_id}/vincular/${donanteId}`, { withCredentials: true });
      toast.success("Vínculo eliminado");
      setVinculados(v => v.filter(d => d.donante_id !== donanteId));
    } catch {
      toast.error("Error al desvincular");
    }
  };

  const fetchDonantes = async () => {
    try {
      const response = await axios.get(`${API}/donantes`, { withCredentials: true });
      setDonantes(response.data);
    } catch {}
  };

  const handleOpenLinkDialog = () => {
    fetchDonantes();
    setLinkDialogOpen(true);
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API}/catalogo/donatarias/import`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Importados: ${response.data.imported}, Actualizados/Omitidos: ${response.data.updated_or_skipped}`);
      setImportDialogOpen(false);
      fetchItems();
    } catch (error) {
      toast.error("Error al importar CSV");
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="catalogo-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Catálogo de Donatarias
            </h1>
            <p className="text-gray-500">{total} donatarias autorizadas en México</p>
          </div>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="import-csv-btn">
            <Upload className="w-4 h-4 mr-2" /> Importar CSV
          </Button>
        </div>

        {/* Search & Filters */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, RFC o descripción..."
                  className="pl-10"
                  onChange={(e) => handleSearchChange(e.target.value)}
                  data-testid="catalog-search"
                />
              </div>
              <Select value={filterGiro} onValueChange={(v) => { setFilterGiro(v); setPage(0); }}>
                <SelectTrigger className="w-44" data-testid="filter-giro">
                  <SelectValue placeholder="Giro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los giros</SelectItem>
                  {giros.map(g => (
                    <SelectItem key={g} value={g}>{GIRO_LABELS[g] || g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstatus} onValueChange={(v) => { setFilterEstatus(v); setPage(0); }}>
                <SelectTrigger className="w-40" data-testid="filter-estatus">
                  <SelectValue placeholder="Estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="revocada">Revocada</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(0); }}>
                <SelectTrigger className="w-44" data-testid="filter-estado">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estados.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron donatarias</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase">Donataria</TableHead>
                    <TableHead className="text-xs uppercase">RFC</TableHead>
                    <TableHead className="text-xs uppercase">Giro</TableHead>
                    <TableHead className="text-xs uppercase">Estado</TableHead>
                    <TableHead className="text-xs uppercase">Estatus SAT</TableHead>
                    <TableHead className="text-xs uppercase w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.catalogo_id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <p className="font-medium text-gray-900 text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-[300px]">{item.descripcion}</p>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-600">{item.rfc}</TableCell>
                      <TableCell>
                        <Badge className={`${GIRO_COLORS[item.giro] || "bg-gray-100 text-gray-700"} text-xs hover:${GIRO_COLORS[item.giro] || "bg-gray-100"}`}>
                          {GIRO_LABELS[item.giro] || item.giro}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" /> {item.estado}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cfg = ESTATUS_CONFIG[item.estatus_sat] || ESTATUS_CONFIG.autorizada;
                          return <Badge className={`${cfg.color} text-xs hover:${cfg.color}`}>{cfg.label}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(item)}
                          data-testid={`view-detail-${item.catalogo_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {page + 1} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedItem.nombre}</DialogTitle>
                  <DialogDescription>{selectedItem.descripcion}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs uppercase">RFC</p>
                      <p className="font-mono font-medium">{selectedItem.rfc}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase">Giro</p>
                      <Badge className={`${GIRO_COLORS[selectedItem.giro] || "bg-gray-100"} text-xs`}>
                        {GIRO_LABELS[selectedItem.giro] || selectedItem.giro}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase">Estado</p>
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedItem.estado}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase">Estatus SAT</p>
                      {(() => {
                        const cfg = ESTATUS_CONFIG[selectedItem.estatus_sat] || ESTATUS_CONFIG.autorizada;
                        return <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>;
                      })()}
                    </div>
                  </div>

                  {/* Linked Donors */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Donantes Vinculados</p>
                      <Button size="sm" variant="outline" onClick={handleOpenLinkDialog} data-testid="link-donante-btn">
                        <Link2 className="w-3 h-3 mr-1" /> Vincular
                      </Button>
                    </div>
                    {vinculados.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Sin donantes vinculados</p>
                    ) : (
                      <div className="space-y-2">
                        {vinculados.map(d => (
                          <div key={d.donante_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{d.nombre}</p>
                              <p className="text-xs text-gray-400">{d.rfc}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnlink(d.donante_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Unlink className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Link Donor Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Donante</DialogTitle>
              <DialogDescription>
                Selecciona un donante de tu organización para vincularlo con {selectedItem?.nombre}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={linkingDonante} onValueChange={setLinkingDonante}>
                <SelectTrigger data-testid="select-donante-to-link">
                  <SelectValue placeholder="Seleccionar donante..." />
                </SelectTrigger>
                <SelectContent>
                  {donantes.map(d => (
                    <SelectItem key={d.donante_id} value={d.donante_id}>
                      {d.nombre} ({d.rfc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleLinkDonante} disabled={!linkingDonante} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-link-btn">
                <Link2 className="w-4 h-4 mr-2" /> Vincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import CSV Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Catálogo desde CSV</DialogTitle>
              <DialogDescription>
                El archivo CSV debe tener las columnas: nombre, rfc, giro, descripcion, estatus_sat, estado
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Formato esperado:</p>
                <code className="text-xs text-gray-600 block whitespace-pre">
{`nombre,rfc,giro,descripcion,estatus_sat,estado
"Fundación ABC",ABC123456XX0,asistencial,"Descripción...",autorizada,"CDMX"`}
                </code>
              </div>
              <label
                htmlFor="csv-import"
                className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FileUp className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? "Importando..." : "Seleccionar archivo CSV"}
                </span>
              </label>
              <input
                id="csv-import"
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                data-testid="csv-import-input"
                disabled={uploading}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CatalogoPage;
