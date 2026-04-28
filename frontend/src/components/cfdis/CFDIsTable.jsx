import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { FileText, MoreHorizontal, Download, Stamp, XCircle, Check } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const estadoStyles = {
  borrador: "bg-gray-100 text-gray-700", emitido: "bg-blue-100 text-blue-700",
  timbrado: "bg-green-100 text-green-700", cancelado: "bg-red-100 text-red-700"
};

export const CFDIsTable = ({ cfdis, loading, backendUrl, onTimbrar, onCancelar }) => {
  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>;
  if (cfdis.length === 0) return <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay CFDIs emitidos</p></div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead className="text-xs uppercase">Folio</TableHead>
          <TableHead className="text-xs uppercase">Fecha</TableHead>
          <TableHead className="text-xs uppercase">Donante</TableHead>
          <TableHead className="text-xs uppercase text-right">Monto</TableHead>
          <TableHead className="text-xs uppercase">Estado</TableHead>
          <TableHead className="text-xs uppercase">UUID Fiscal</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cfdis.map((c) => (
          <TableRow key={c.cfdi_id} className="hover:bg-gray-50/50" data-testid={`cfdi-row-${c.cfdi_id}`}>
            <TableCell className="font-mono font-semibold text-sm">{c.folio}</TableCell>
            <TableCell className="text-sm">{c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString('es-MX') : '-'}</TableCell>
            <TableCell className="font-medium">{c.donante_nombre || c.donante_id}</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrency(c.monto)}</TableCell>
            <TableCell><Badge className={estadoStyles[c.estado] || estadoStyles.borrador}>{c.estado}</Badge></TableCell>
            <TableCell className="font-mono text-xs text-gray-500 truncate max-w-[150px]">{c.uuid_fiscal || "-"}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(`${backendUrl}/api/cfdis/${c.cfdi_id}/pdf`, '_blank')} data-testid={`download-cfdi-${c.cfdi_id}`}><Download className="w-4 h-4 mr-2" />Descargar PDF</DropdownMenuItem>
                  {c.estado === "emitido" && <DropdownMenuItem onClick={() => onTimbrar(c.cfdi_id)} data-testid={`timbrar-${c.cfdi_id}`}><Check className="w-4 h-4 mr-2" />Timbrar</DropdownMenuItem>}
                  {c.estado !== "cancelado" && <DropdownMenuItem onClick={() => onCancelar(c.cfdi_id)} className="text-red-600"><XCircle className="w-4 h-4 mr-2" />Cancelar</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
