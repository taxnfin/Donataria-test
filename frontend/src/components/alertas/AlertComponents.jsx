import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Shield, MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const severidadStyles = {
  baja: "bg-gray-100 text-gray-700", media: "bg-blue-100 text-blue-700",
  alta: "bg-amber-100 text-amber-700", critica: "bg-red-100 text-red-700"
};

const estadoConfig = {
  nueva: { icon: AlertCircle, color: "bg-red-100 text-red-700" },
  en_revision: { icon: Clock, color: "bg-amber-100 text-amber-700" },
  resuelta: { icon: CheckCircle, color: "bg-green-100 text-green-700" },
  descartada: { icon: XCircle, color: "bg-gray-100 text-gray-600" }
};

export const AlertasTable = ({ alertas, loading, onUpdateEstado }) => (
  <Card className="bg-white border-gray-100">
    <CardContent className="p-0">
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : alertas.length === 0 ? (
        <div className="text-center py-12"><Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay alertas</p></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs uppercase">Fecha</TableHead>
              <TableHead className="text-xs uppercase">Alerta</TableHead>
              <TableHead className="text-xs uppercase">Severidad</TableHead>
              <TableHead className="text-xs uppercase">Donante</TableHead>
              <TableHead className="text-xs uppercase text-right">Monto</TableHead>
              <TableHead className="text-xs uppercase">Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertas.map((alerta) => {
              const { icon: EstadoIcon, color: estadoColor } = estadoConfig[alerta.estado] || estadoConfig.nueva;
              return (
                <TableRow key={alerta.alert_id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm">{new Date(alerta.created_at).toLocaleDateString('es-MX')}</TableCell>
                  <TableCell>
                    <div><p className="font-medium text-gray-900">{alerta.titulo}</p><p className="text-xs text-gray-500 truncate max-w-xs">{alerta.descripcion}</p></div>
                  </TableCell>
                  <TableCell><Badge className={severidadStyles[alerta.severidad] || severidadStyles.media}>{alerta.severidad}</Badge></TableCell>
                  <TableCell className="text-sm">{alerta.donante_nombre || "-"}</TableCell>
                  <TableCell className="text-right font-medium">{alerta.monto ? `$${alerta.monto.toLocaleString()}` : "-"}</TableCell>
                  <TableCell><Badge className={estadoColor}><EstadoIcon className="w-3 h-3 mr-1" />{alerta.estado}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateEstado(alerta.alert_id, "en_revision")}><Clock className="w-4 h-4 mr-2" />Marcar en revision</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateEstado(alerta.alert_id, "resuelta")}><CheckCircle className="w-4 h-4 mr-2" />Marcar resuelta</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateEstado(alerta.alert_id, "descartada")}><XCircle className="w-4 h-4 mr-2" />Descartar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const ReglaCard = ({ regla, onToggle, onEdit, onDelete }) => {
  const sev = severidadStyles[regla.severidad] || severidadStyles.media;
  return (
    <Card className={`bg-white border-gray-100 ${!regla.activa && "opacity-60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{regla.nombre}</h3>
              <Badge className={sev}>{regla.severidad}</Badge>
              {!regla.activa && <Badge variant="outline">Inactiva</Badge>}
            </div>
            <p className="text-sm text-gray-500 mt-1">{regla.descripcion}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>Tipo: {regla.tipo_regla}</span><span>Activaciones: {regla.veces_activada}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={regla.activa} onCheckedChange={() => onToggle(regla.rule_id)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(regla)}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(regla.rule_id)} className="text-red-600">Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
