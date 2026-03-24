import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
  ClipboardList,
  Download,
  User,
  PlusCircle,
  Pencil,
  Trash2,
  Send,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PAGE_SIZE = 20;

const AuditoriaPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterEntidad, setFilterEntidad] = useState("all");
  const [filterAccion, setFilterAccion] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE);
      params.set("skip", page * PAGE_SIZE);
      if (filterEntidad !== "all") params.set("entidad", filterEntidad);
      if (filterAccion !== "all") params.set("accion", filterAccion);

      const response = await axios.get(`${API}/auditoria?${params}`, { withCredentials: true });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("Error al cargar bitácora");
    } finally {
      setLoading(false);
    }
  }, [page, filterEntidad, filterAccion]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filterEntidad !== "all") params.set("entidad", filterEntidad);
    if (filterAccion !== "all") params.set("accion", filterAccion);
    window.open(`${BACKEND_URL}/api/auditoria/export?${params}`, '_blank');
  };

  const getAccionIcon = (accion) => {
    const icons = {
      crear: <PlusCircle className="w-4 h-4 text-green-500" />,
      actualizar: <Pencil className="w-4 h-4 text-blue-500" />,
      eliminar: <Trash2 className="w-4 h-4 text-red-500" />,
      timbrar: <ShieldCheck className="w-4 h-4 text-violet-500" />,
      enviar: <Send className="w-4 h-4 text-cyan-500" />,
    };
    return icons[accion] || <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getAccionBadge = (accion) => {
    const colors = {
      crear: "bg-green-100 text-green-700",
      actualizar: "bg-blue-100 text-blue-700",
      eliminar: "bg-red-100 text-red-700",
      timbrar: "bg-violet-100 text-violet-700",
      enviar: "bg-cyan-100 text-cyan-700"
    };
    return (
      <Badge className={`${colors[accion] || "bg-gray-100 text-gray-700"} hover:${colors[accion] || "bg-gray-100"}`}>
        {accion}
      </Badge>
    );
  };

  const getEntidadBadge = (entidad) => {
    const colors = {
      donante: "bg-indigo-100 text-indigo-700",
      donativo: "bg-amber-100 text-amber-700",
      cfdi: "bg-violet-100 text-violet-700",
      reporte: "bg-rose-100 text-rose-700"
    };
    return (
      <Badge variant="outline" className={colors[entidad] || ""}>
        {entidad}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-testid="auditoria-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Bitácora de Auditoría
            </h1>
            <p className="text-gray-500">Registro de todas las acciones del sistema</p>
          </div>
          <Button variant="outline" onClick={handleExportCSV} data-testid="export-audit-csv">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterEntidad} onValueChange={(v) => { setFilterEntidad(v); setPage(0); }}>
            <SelectTrigger className="w-40" data-testid="filter-entidad">
              <SelectValue placeholder="Entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="donante">Donantes</SelectItem>
              <SelectItem value="donativo">Donativos</SelectItem>
              <SelectItem value="cfdi">CFDIs</SelectItem>
              <SelectItem value="reporte">Reportes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAccion} onValueChange={(v) => { setFilterAccion(v); setPage(0); }}>
            <SelectTrigger className="w-40" data-testid="filter-accion">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="crear">Crear</SelectItem>
              <SelectItem value="actualizar">Actualizar</SelectItem>
              <SelectItem value="eliminar">Eliminar</SelectItem>
              <SelectItem value="timbrar">Timbrar</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center text-sm text-gray-500 ml-auto">
            {total} registros
          </div>
        </div>

        {/* Table */}
        <Card className="bg-white border-gray-100">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sin registros de auditoría</p>
                <p className="text-sm text-gray-400 mt-1">Las acciones se registran automáticamente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs uppercase">Fecha</TableHead>
                    <TableHead className="text-xs uppercase">Usuario</TableHead>
                    <TableHead className="text-xs uppercase">Acción</TableHead>
                    <TableHead className="text-xs uppercase">Entidad</TableHead>
                    <TableHead className="text-xs uppercase">ID</TableHead>
                    <TableHead className="text-xs uppercase">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.audit_id} className="hover:bg-gray-50/50">
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-sm">{log.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAccionIcon(log.accion)}
                          {getAccionBadge(log.accion)}
                        </div>
                      </TableCell>
                      <TableCell>{getEntidadBadge(log.entidad)}</TableCell>
                      <TableCell className="text-xs text-gray-400 font-mono max-w-[100px] truncate">
                        {log.entidad_id}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                        {Object.entries(log.detalles || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
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
            <p className="text-sm text-gray-500">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditoriaPage;
