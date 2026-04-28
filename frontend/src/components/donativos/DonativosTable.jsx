import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Gift, MoreHorizontal, Edit, Trash2, FileText, Download } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export const DonativosTable = ({ donativos, loading, onEdit, onDelete }) => {
  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  if (donativos.length === 0) return <div className="text-center py-12"><Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay donativos registrados</p></div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead className="text-xs uppercase">Fecha</TableHead>
          <TableHead className="text-xs uppercase">Donante</TableHead>
          <TableHead className="text-xs uppercase text-right">Monto</TableHead>
          <TableHead className="text-xs uppercase">Tipo</TableHead>
          <TableHead className="text-xs uppercase">Metodo Pago</TableHead>
          <TableHead className="text-xs uppercase">CFDI</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donativos.map((d) => (
          <TableRow key={d.donativo_id} className="hover:bg-gray-50/50" data-testid={`donativo-row-${d.donativo_id}`}>
            <TableCell className="text-sm">{d.fecha_donativo ? new Date(d.fecha_donativo).toLocaleDateString('es-MX') : '-'}</TableCell>
            <TableCell className="font-medium text-gray-900">{d.donante_nombre || d.donante_id}</TableCell>
            <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(d.monto)}{d.moneda !== "MXN" && <span className="text-xs text-gray-400 ml-1">{d.moneda}</span>}</TableCell>
            <TableCell><Badge variant="outline" className={d.es_especie ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}>{d.es_especie ? "Especie" : "Efectivo"}</Badge></TableCell>
            <TableCell className="text-sm text-gray-600">{d.metodo_pago || "-"}</TableCell>
            <TableCell>{d.cfdi_id ? <Badge className="bg-green-100 text-green-700 text-xs">Emitido</Badge> : <Badge variant="outline" className="text-xs">Pendiente</Badge>}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(d)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(d.donativo_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
