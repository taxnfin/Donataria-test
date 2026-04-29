import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Search, Download } from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { DonantesTable } from "../components/donantes/DonantesTable";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DonantesPage = () => {
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDonante, setEditingDonante] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", tipo_persona: "fisica", rfc: "", es_extranjero: false, email: "", telefono: "", direccion: "", pais: "Mexico" });

  useEffect(() => { fetchDonantes(); }, [search, filterTipo]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDonantes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterTipo !== "all") params.append("tipo", filterTipo);
      const res = await axios.get(`${API}/donantes?${params}`, { withCredentials: true });
      setDonantes(res.data);
    } catch { toast.error("Error al cargar donantes"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDonante) { await axios.put(`${API}/donantes/${editingDonante.donante_id}`, formData, { withCredentials: true }); toast.success("Donante actualizado"); }
      else { await axios.post(`${API}/donantes`, formData, { withCredentials: true }); toast.success("Donante creado"); }
      setDialogOpen(false); resetForm(); fetchDonantes();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  const handleEdit = (d) => { setEditingDonante(d); setFormData({ nombre: d.nombre, tipo_persona: d.tipo_persona, rfc: d.rfc || "", es_extranjero: d.es_extranjero || false, email: d.email || "", telefono: d.telefono || "", direccion: d.direccion || "", pais: d.pais || "Mexico" }); setDialogOpen(true); };
  const handleDelete = async (id) => { if (!confirm("Eliminar este donante?")) return; try { await axios.delete(`${API}/donantes/${id}`, { withCredentials: true }); toast.success("Eliminado"); fetchDonantes(); } catch { toast.error("Error"); } };
  const resetForm = () => { setEditingDonante(null); setFormData({ nombre: "", tipo_persona: "fisica", rfc: "", es_extranjero: false, email: "", telefono: "", direccion: "", pais: "Mexico" }); };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="donantes-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Donantes</h1><p className="text-gray-500">Gestiona tu base de donantes</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(`${BACKEND_URL}/api/exportar/donantes`, '_blank')} data-testid="export-donantes-btn"><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="add-donante-btn"><Plus className="w-4 h-4" /> Nuevo Donante</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{editingDonante ? "Editar Donante" : "Nuevo Donante"}</DialogTitle><DialogDescription>{editingDonante ? "Actualiza la informacion" : "Registra un nuevo donante"}</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Nombre / Razon social *</Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required data-testid="donante-nombre-input" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tipo persona *</Label><Select value={formData.tipo_persona} onValueChange={(v) => setFormData({ ...formData, tipo_persona: v })}><SelectTrigger data-testid="donante-tipo-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fisica">Persona Fisica</SelectItem><SelectItem value="moral">Persona Moral</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>RFC</Label><Input value={formData.rfc} onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })} maxLength={formData.tipo_persona === "fisica" ? 13 : 12} disabled={formData.es_extranjero} data-testid="donante-rfc-input" /></div>
                  </div>
                  <div className="flex items-center space-x-2"><Checkbox checked={formData.es_extranjero} onCheckedChange={(c) => setFormData({ ...formData, es_extranjero: c, rfc: c ? "" : formData.rfc, pais: c ? "" : "Mexico" })} data-testid="donante-extranjero-check" /><Label className="text-sm">Donante extranjero</Label></div>
                  {formData.es_extranjero && <div className="space-y-2"><Label>Pais</Label><Input value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} data-testid="donante-pais-input" /></div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} data-testid="donante-email-input" /></div>
                    <div className="space-y-2"><Label>Telefono</Label><Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} data-testid="donante-telefono-input" /></div>
                  </div>
                  <div className="space-y-2"><Label>Direccion</Label><Input value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} data-testid="donante-direccion-input" /></div>
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="donante-submit-btn">{editingDonante ? "Actualizar" : "Crear Donante"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="bg-white border-gray-100"><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Buscar por nombre o RFC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="search-donantes" /></div>
          <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-full sm:w-48" data-testid="filter-tipo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los tipos</SelectItem><SelectItem value="fisica">Persona Fisica</SelectItem><SelectItem value="moral">Persona Moral</SelectItem></SelectContent></Select>
        </div></CardContent></Card>

        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"><CardContent className="p-0">
          <DonantesTable donantes={donantes} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
};

export default DonantesPage;
