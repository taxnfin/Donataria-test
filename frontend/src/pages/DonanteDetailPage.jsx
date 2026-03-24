import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { 
  ArrowLeft, 
  Building, 
  User, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const DonanteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donante, setDonante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonante();
  }, [id]);

  const fetchDonante = async () => {
    try {
      const response = await axios.get(`${API}/donantes/${id}`, {
        withCredentials: true
      });
      setDonante(response.data);
    } catch (error) {
      toast.error("Error al cargar donante");
      navigate("/donantes");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!donante) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Donante no encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="donante-detail-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/donantes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              {donante.nombre}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={
                donante.tipo_persona === "moral" 
                  ? "border-blue-200 text-blue-700 bg-blue-50" 
                  : "border-emerald-200 text-emerald-700 bg-emerald-50"
              }>
                {donante.tipo_persona === "moral" ? "Persona Moral" : "Persona Física"}
              </Badge>
              {donante.es_extranjero && (
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                  <Globe className="w-3 h-3 mr-1" /> Extranjero
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Información del Donante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  donante.tipo_persona === "moral" ? "bg-blue-100" : "bg-emerald-100"
                }`}>
                  {donante.tipo_persona === "moral" ? (
                    <Building className="w-6 h-6 text-blue-600" />
                  ) : (
                    <User className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{donante.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {donante.rfc || (donante.es_extranjero ? "Sin RFC (Extranjero)" : "RFC no registrado")}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                {donante.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{donante.email}</span>
                  </div>
                )}
                {donante.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{donante.telefono}</span>
                  </div>
                )}
                {donante.direccion && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{donante.direccion}</span>
                  </div>
                )}
                {donante.es_extranjero && donante.pais && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{donante.pais}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Resumen de Donativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-sm text-emerald-700">Total Donado</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {formatCurrency(donante.total_donativos || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{donante.numero_donativos || 0}</p>
                    <p className="text-sm text-gray-500">Donativos</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {donante.historial_donativos?.filter(d => d.cfdi_id).length || 0}
                    </p>
                    <p className="text-sm text-gray-500">CFDIs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={`/donativos?donante=${donante.donante_id}`} className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Registrar Donativo
                </Button>
              </Link>
              <Link to="/cfdis" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4 text-violet-600" />
                  Emitir CFDI
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Donativos */}
        <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Historial de Donativos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!donante.historial_donativos?.length ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay donativos registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Fecha</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Tipo</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Monto</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">Moneda</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-gray-500">CFDI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donante.historial_donativos.map((donativo) => (
                    <TableRow key={donativo.donativo_id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(donativo.fecha_donativo)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {donativo.tipo_donativo?.replace('_', ' ') || 'No oneroso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(donativo.monto)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{donativo.moneda}</Badge>
                      </TableCell>
                      <TableCell>
                        {donativo.cfdi_id ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Con CFDI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Pendiente
                          </Badge>
                        )}
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

export default DonanteDetailPage;
