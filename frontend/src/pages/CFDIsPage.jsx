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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  Plus, 
  FileText,
  Stamp,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const CFDIsPage = () => {
  const [cfdis, setCfdis] = useState([]);
  const [donativos, setDonativos] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timbrarDialog, setTimbrarDialog] = useState(null);
  const [cancelarDialog, setCancelarDialog] = useState(null);
  const [filterEstado, setFilterEstado] = useState("all");
  const [formData, setFormData] = useState({
    donativo_id: "",
    donante_id: "",
    monto: 0,
    moneda: "MXN",
    tipo_donativo: "no_oneroso",
    leyenda: "El donante no recibe bienes o servicios a cambio del donativo otorgado."
  });

  useEffect(() => {
    fetchData();
  }, [filterEstado]);

  const fetchData = async () => {
    try {
      const params = filterEstado !== "all" ? `?estado=${filterEstado}` : "";
      const [cfdisRes, donativosRes, donantesRes] = await Promise.all([
        axios.get(`${API}/cfdis${params}`, { withCredentials: true }),
        axios.get(`${API}/donativos`, { withCredentials: true }),
        axios.get(`${API}/donantes`, { withCredentials: true })
      ]);
      setCfdis(cfdisRes.data);
      // Filter donativos without CFDI
      setDonativos(donativosRes.data.filter(d => !d.cfdi_id));
      setDonantes(donantesRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleDonativoSelect = (donativoId) => {
    const donativo = donativos.find(d => d.donativo_id === donativoId);
    if (donativo) {
      setFormData({
        ...formData,
        donativo_id: donativoId,
        donante_id: donativo.donante_id,
        monto: donativo.monto,
        moneda: donativo.moneda,
        tipo_donativo: donativo.tipo_donativo
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.donativo_id) {
      toast.error("Selecciona un donativo");
      return;
    }

    try {
      await axios.post(`${API}/cfdis`, formData, {
        withCredentials: true
      });
      
      toast.success("CFDI creado exitosamente");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al crear CFDI";
      toast.error(message);
    }
  };

  const handleTimbrar = async (cfdiId) => {
    try {
      await axios.post(`${API}/cfdis/${cfdiId}/timbrar`, {}, {
        withCredentials: true
      });
      toast.success("CFDI timbrado exitosamente (simulación)");
      setTimbrarDialog(null);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al timbrar CFDI";
      toast.error(message);
    }
  };

  const handleCancelar = async (cfdiId) => {
    try {
      await axios.post(`${API}/cfdis/${cfdiId}/cancelar`, {}, {
        withCredentials: true
      });
      toast.success("CFDI cancelado");
      setCancelarDialog(null);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || "Error al cancelar CFDI";
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      donativo_id: "",
      donante_id: "",
      monto: 0,
      moneda: "MXN",
      tipo_donativo: "no_oneroso",
      leyenda: "El donante no recibe bienes o servicios a cambio del donativo otorgado."
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "borrador":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100"><Clock className="w-3 h-3 mr-1" /> Borrador</Badge>;
      case "timbrado":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Timbrado</Badge>;
      case "cancelado":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getDonanteName = (donanteId) => {
    const donante = donantes.find(d => d.donante_id === donanteId);
    return donante?.nombre || "Desconocido";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="cfdis-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              CFDIs de Donativos
            </h1>
            <p className="text-gray-500">Comprobantes fiscales digitales</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="add-cfdi-btn">
                <Plus className="w-4 h-4" /> Emitir CFDI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Emitir CFDI de Donativo
                </DialogTitle>
                <DialogDescription>
                  Genera un comprobante fiscal para un donativo registrado
                </DialogDescription>
              </DialogHeader>
              
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Fundamento legal</p>
                  <p className="text-blue-600">Art. 29 y 29-A del CFF, Art. 86 Fracc. II LISR</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donativo">Donativo *</Label>
                  <Select
                    value={formData.donativo_id}
                    onValueChange={handleDonativoSelect}
                  >
                    <SelectTrigger data-testid="cfdi-donativo-select">
                      <SelectValue placeholder="Selecciona un donativo sin CFDI" />
                    </SelectTrigger>
                    <SelectContent>
                      {donativos.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          No hay donativos pendientes de CFDI
                        </div>
                      ) : (
                        donativos.map((donativo) => (
                          <SelectItem key={donativo.donativo_id} value={donativo.donativo_id}>
                            {getDonanteName(donativo.donante_id)} - {formatCurrency(donativo.monto, donativo.moneda)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {formData.donativo_id && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Donante</Label>
                        <Input 
                          value={getDonanteName(formData.donante_id)} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto</Label>
                        <Input 
                          value={formatCurrency(formData.monto, formData.moneda)} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de donativo</Label>
                      <Input 
                        value={formData.tipo_donativo.replace('_', ' ')} 
                        disabled 
                        className="bg-gray-50 capitalize"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leyenda">Leyenda obligatoria</Label>
                      <Textarea
                        id="leyenda"
                        value={formData.leyenda}
                        onChange={(e) => setFormData({ ...formData, leyenda: e.target.value })}
                        className="bg-amber-50 border-amber-200"
                        rows={2}
                        data-testid="cfdi-leyenda"
                      />
                      <p className="text-xs text-gray-500">
                        Esta leyenda es requerida por el SAT para CFDIs de donativos
                      </p>
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700" 
                    disabled={!formData.donativo_id}
                    data-testid="cfdi-submit-btn"
                  >
                    Crear CFDI
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-48" data-testid="filter-estado">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="timbrado">Timbrado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Modo de simulación</p>
            <p className="text-sm text-amber-700">
              El timbrado de CFDIs está en modo simulación. La integración real con PAC se implementará en una versión futura.
            </p>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            ) : cfdis.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay CFDIs registrados</p>
                <Button 
                  className="mt-4 bg-violet-600 hover:bg-violet-700"
                  onClick={() => setDialogOpen(true)}
                  disabled={donativos.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" /> Emitir primer CFDI
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Folio</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Donante</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 text-right">Monto</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Estado</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Fecha</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cfdis.map((cfdi) => (
                    <TableRow key={cfdi.cfdi_id} className="hover:bg-gray-50/50" data-testid={`cfdi-row-${cfdi.cfdi_id}`}>
                      <TableCell className="font-mono text-sm font-medium text-violet-700">
                        {cfdi.folio}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cfdi.donante_nombre}</p>
                          <p className="text-xs text-gray-500">{cfdi.donante_rfc || "Sin RFC"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(cfdi.monto, cfdi.moneda)}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(cfdi.estado)}
                        {cfdi.uuid_fiscal && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            UUID: {cfdi.uuid_fiscal.substring(0, 8)}...
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(cfdi.fecha_emision)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {cfdi.estado === "borrador" && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setTimbrarDialog(cfdi.cfdi_id)}
                              data-testid={`timbrar-btn-${cfdi.cfdi_id}`}
                            >
                              <Stamp className="w-4 h-4 mr-1" /> Timbrar
                            </Button>
                          )}
                          {cfdi.estado !== "cancelado" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCancelarDialog(cfdi.cfdi_id)}
                              data-testid={`cancelar-btn-${cfdi.cfdi_id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Timbrar Dialog */}
        <AlertDialog open={!!timbrarDialog} onOpenChange={() => setTimbrarDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Timbrar CFDI?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción simulará el timbrado del CFDI. En producción, esto enviaría el comprobante al PAC para su certificación.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleTimbrar(timbrarDialog)}
              >
                Confirmar Timbrado
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancelar Dialog */}
        <AlertDialog open={!!cancelarDialog} onOpenChange={() => setCancelarDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar CFDI?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción marcará el CFDI como cancelado. Esta operación no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleCancelar(cancelarDialog)}
              >
                Confirmar Cancelación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CFDIsPage;
