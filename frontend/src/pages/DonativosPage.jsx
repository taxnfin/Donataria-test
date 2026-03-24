import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
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
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { 
  Plus, 
  Gift,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const DonativosPage = () => {
  const [donativos, setDonativos] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    donante_id: "",
    monto: "",
    moneda: "MXN",
    tipo_donativo: "no_oneroso",
    tipo_cambio: "",
    es_especie: false,
    descripcion_especie: "",
    valor_avaluo: "",
    fecha_donativo: new Date(),
    notas: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [donativosRes, donantesRes] = await Promise.all([
        axios.get(`${API}/donativos`, { withCredentials: true }),
        axios.get(`${API}/donantes`, { withCredentials: true })
      ]);
      setDonativos(donativosRes.data);
      setDonantes(donantesRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.donante_id) {
      toast.error("Selecciona un donante");
      return;
    }

    try {
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto),
        tipo_cambio: formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null,
        valor_avaluo: formData.valor_avaluo ? parseFloat(formData.valor_avaluo) : null,
        fecha_donativo: formData.fecha_donativo.toISOString()
      };

      await axios.post(`${API}/donativos`, payload, {
        withCredentials: true
      });
      
      toast.success("Donativo registrado exitosamente");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al registrar donativo";
      toast.error(message);
    }
  };

  const handleDelete = async (donativoId) => {
    if (!confirm("¿Estás seguro de eliminar este donativo?")) return;
    
    try {
      await axios.delete(`${API}/donativos/${donativoId}`, {
        withCredentials: true
      });
      toast.success("Donativo eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar donativo");
    }
  };

  const resetForm = () => {
    setFormData({
      donante_id: "",
      monto: "",
      moneda: "MXN",
      tipo_donativo: "no_oneroso",
      tipo_cambio: "",
      es_especie: false,
      descripcion_especie: "",
      valor_avaluo: "",
      fecha_donativo: new Date(),
      notas: ""
    });
  };

  const formatCurrency = (value, currency = "MXN") => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDonanteName = (donanteId) => {
    const donante = donantes.find(d => d.donante_id === donanteId);
    return donante?.nombre || "Desconocido";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="donativos-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Donativos
            </h1>
            <p className="text-gray-500">Registro de donaciones recibidas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="add-donativo-btn">
                <Plus className="w-4 h-4" /> Registrar Donativo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Registrar Donativo
                </DialogTitle>
                <DialogDescription>
                  Registra un nuevo donativo recibido
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donante">Donante *</Label>
                  <Select
                    value={formData.donante_id}
                    onValueChange={(value) => setFormData({ ...formData, donante_id: value })}
                  >
                    <SelectTrigger data-testid="donativo-donante-select">
                      <SelectValue placeholder="Selecciona un donante" />
                    </SelectTrigger>
                    <SelectContent>
                      {donantes.map((donante) => (
                        <SelectItem key={donante.donante_id} value={donante.donante_id}>
                          {donante.nombre} {donante.rfc ? `(${donante.rfc})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {donantes.length === 0 && (
                    <p className="text-xs text-amber-600">No hay donantes. Registra uno primero.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monto}
                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                        placeholder="0.00"
                        className="pl-10"
                        required
                        data-testid="donativo-monto-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select
                      value={formData.moneda}
                      onValueChange={(value) => setFormData({ ...formData, moneda: value })}
                    >
                      <SelectTrigger data-testid="donativo-moneda-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.moneda !== "MXN" && (
                  <div className="space-y-2">
                    <Label htmlFor="tipo_cambio">Tipo de Cambio (a MXN)</Label>
                    <Input
                      id="tipo_cambio"
                      type="number"
                      step="0.0001"
                      value={formData.tipo_cambio}
                      onChange={(e) => setFormData({ ...formData, tipo_cambio: e.target.value })}
                      placeholder="Ej: 17.50"
                      data-testid="donativo-tc-input"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_donativo">Tipo de Donativo</Label>
                    <Select
                      value={formData.tipo_donativo}
                      onValueChange={(value) => setFormData({ ...formData, tipo_donativo: value })}
                    >
                      <SelectTrigger data-testid="donativo-tipo-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_oneroso">No oneroso</SelectItem>
                        <SelectItem value="oneroso">Oneroso</SelectItem>
                        <SelectItem value="remunerativo">Remunerativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha del donativo</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="donativo-fecha-btn"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.fecha_donativo, "PPP", { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.fecha_donativo}
                          onSelect={(date) => date && setFormData({ ...formData, fecha_donativo: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_especie"
                    checked={formData.es_especie}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_especie: checked })}
                    data-testid="donativo-especie-check"
                  />
                  <Label htmlFor="es_especie" className="text-sm">
                    Donativo en especie (bienes o servicios)
                  </Label>
                </div>

                {formData.es_especie && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="descripcion_especie">Descripción del bien/servicio</Label>
                      <Textarea
                        id="descripcion_especie"
                        value={formData.descripcion_especie}
                        onChange={(e) => setFormData({ ...formData, descripcion_especie: e.target.value })}
                        placeholder="Describe el bien o servicio donado"
                        data-testid="donativo-desc-especie"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_avaluo">Valor de avalúo</Label>
                      <Input
                        id="valor_avaluo"
                        type="number"
                        step="0.01"
                        value={formData.valor_avaluo}
                        onChange={(e) => setFormData({ ...formData, valor_avaluo: e.target.value })}
                        placeholder="0.00"
                        data-testid="donativo-avaluo-input"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas adicionales</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas o comentarios opcionales"
                    data-testid="donativo-notas"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="donativo-submit-btn">
                    Registrar Donativo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : donativos.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay donativos registrados</p>
                <Button 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setDialogOpen(true)}
                  disabled={donantes.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" /> Registrar primer donativo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Fecha</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Donante</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Tipo</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 text-right">Monto</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">CFDI</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donativos.map((donativo) => (
                    <TableRow key={donativo.donativo_id} className="hover:bg-gray-50/50" data-testid={`donativo-row-${donativo.donativo_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {formatDate(donativo.fecha_donativo)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDonanteName(donativo.donante_id)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="capitalize">
                            {donativo.tipo_donativo?.replace('_', ' ') || 'No oneroso'}
                          </Badge>
                          {donativo.es_especie && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 block w-fit">
                              En especie
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">{formatCurrency(donativo.monto, donativo.moneda)}</p>
                          {donativo.moneda !== "MXN" && donativo.tipo_cambio && (
                            <p className="text-xs text-gray-500">
                              TC: {donativo.tipo_cambio} → {formatCurrency(donativo.monto * donativo.tipo_cambio)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {donativo.cfdi_id ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <FileText className="w-3 h-3 mr-1" /> Emitido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(donativo.donativo_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

export default DonativosPage;
