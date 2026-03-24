import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
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
import { Checkbox } from "../components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Users,
  Building,
  User,
  Globe,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const DonantesPage = () => {
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDonante, setEditingDonante] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo_persona: "fisica",
    rfc: "",
    es_extranjero: false,
    email: "",
    telefono: "",
    direccion: "",
    pais: "México"
  });

  useEffect(() => {
    fetchDonantes();
  }, [filterTipo, search]);

  const fetchDonantes = async () => {
    try {
      const params = new URLSearchParams();
      if (filterTipo !== "all") params.append("tipo_persona", filterTipo);
      if (search) params.append("search", search);
      
      const response = await axios.get(`${API}/donantes?${params}`, {
        withCredentials: true
      });
      setDonantes(response.data);
    } catch (error) {
      toast.error("Error al cargar donantes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDonante) {
        await axios.put(`${API}/donantes/${editingDonante.donante_id}`, formData, {
          withCredentials: true
        });
        toast.success("Donante actualizado");
      } else {
        await axios.post(`${API}/donantes`, formData, {
          withCredentials: true
        });
        toast.success("Donante creado");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchDonantes();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al guardar donante";
      toast.error(message);
    }
  };

  const handleEdit = (donante) => {
    setEditingDonante(donante);
    setFormData({
      nombre: donante.nombre,
      tipo_persona: donante.tipo_persona,
      rfc: donante.rfc || "",
      es_extranjero: donante.es_extranjero,
      email: donante.email || "",
      telefono: donante.telefono || "",
      direccion: donante.direccion || "",
      pais: donante.pais || "México"
    });
    setDialogOpen(true);
  };

  const handleDelete = async (donanteId) => {
    if (!confirm("¿Estás seguro de eliminar este donante?")) return;
    
    try {
      await axios.delete(`${API}/donantes/${donanteId}`, {
        withCredentials: true
      });
      toast.success("Donante eliminado");
      fetchDonantes();
    } catch (error) {
      toast.error("Error al eliminar donante");
    }
  };

  const resetForm = () => {
    setEditingDonante(null);
    setFormData({
      nombre: "",
      tipo_persona: "fisica",
      rfc: "",
      es_extranjero: false,
      email: "",
      telefono: "",
      direccion: "",
      pais: "México"
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="donantes-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Donantes
            </h1>
            <p className="text-gray-500">Gestiona tu base de donantes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="add-donante-btn">
                <Plus className="w-4 h-4" /> Nuevo Donante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  {editingDonante ? "Editar Donante" : "Nuevo Donante"}
                </DialogTitle>
                <DialogDescription>
                  {editingDonante ? "Actualiza la información del donante" : "Registra un nuevo donante en tu base de datos"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo / Razón social *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del donante"
                    required
                    data-testid="donante-nombre-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_persona">Tipo de persona *</Label>
                    <Select
                      value={formData.tipo_persona}
                      onValueChange={(value) => setFormData({ ...formData, tipo_persona: value })}
                    >
                      <SelectTrigger data-testid="donante-tipo-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fisica">Persona Física</SelectItem>
                        <SelectItem value="moral">Persona Moral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input
                      id="rfc"
                      value={formData.rfc}
                      onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                      placeholder={formData.tipo_persona === "fisica" ? "XXXX000000XXX" : "XXX000000XXX"}
                      maxLength={formData.tipo_persona === "fisica" ? 13 : 12}
                      disabled={formData.es_extranjero}
                      data-testid="donante-rfc-input"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_extranjero"
                    checked={formData.es_extranjero}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      es_extranjero: checked,
                      rfc: checked ? "" : formData.rfc,
                      pais: checked ? "" : "México"
                    })}
                    data-testid="donante-extranjero-check"
                  />
                  <Label htmlFor="es_extranjero" className="text-sm">
                    Donante extranjero (sin RFC mexicano)
                  </Label>
                </div>

                {formData.es_extranjero && (
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formData.pais}
                      onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                      placeholder="País de origen"
                      data-testid="donante-pais-input"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      data-testid="donante-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="55 1234 5678"
                      data-testid="donante-telefono-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección completa"
                    data-testid="donante-direccion-input"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="donante-submit-btn">
                    {editingDonante ? "Actualizar" : "Crear Donante"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o RFC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-donantes"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-48" data-testid="filter-tipo">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="fisica">Persona Física</SelectItem>
                  <SelectItem value="moral">Persona Moral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : donantes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay donantes registrados</p>
                <Button 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar primer donante
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Donante</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Tipo</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">RFC</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Contacto</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 text-right">Total Donativos</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donantes.map((donante) => (
                    <TableRow key={donante.donante_id} className="hover:bg-gray-50/50" data-testid={`donante-row-${donante.donante_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            donante.tipo_persona === "moral" ? "bg-blue-100" : "bg-emerald-100"
                          }`}>
                            {donante.tipo_persona === "moral" ? (
                              <Building className="w-5 h-5 text-blue-600" />
                            ) : (
                              <User className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{donante.nombre}</p>
                            {donante.es_extranjero && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Globe className="w-3 h-3" />
                                {donante.pais || "Extranjero"}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          donante.tipo_persona === "moral" 
                            ? "border-blue-200 text-blue-700 bg-blue-50" 
                            : "border-emerald-200 text-emerald-700 bg-emerald-50"
                        }>
                          {donante.tipo_persona === "moral" ? "Moral" : "Física"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {donante.rfc || <span className="text-gray-400">N/A</span>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {donante.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {donante.email}
                            </div>
                          )}
                          {donante.telefono && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {donante.telefono}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(donante.total_donativos || 0)}
                        <p className="text-xs text-gray-500 font-normal">
                          {donante.numero_donativos || 0} donativo(s)
                        </p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/donantes/${donante.donante_id}`} className="flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(donante)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(donante.donante_id)}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DonantesPage;
