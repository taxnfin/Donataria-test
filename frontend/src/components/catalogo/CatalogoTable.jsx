import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BookOpen, Link as LinkIcon, ExternalLink } from "lucide-react";

const estatusColors = { activa: "bg-green-100 text-green-700", revocada: "bg-red-100 text-red-700", suspendida: "bg-amber-100 text-amber-700" };

export const CatalogoTable = ({ items, loading, onLink }) => {
  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  if (!items || items.length === 0) return <div className="text-center py-12"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No se encontraron registros</p></div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead className="text-xs uppercase">Nombre</TableHead>
          <TableHead className="text-xs uppercase">RFC</TableHead>
          <TableHead className="text-xs uppercase">Giro</TableHead>
          <TableHead className="text-xs uppercase">Estado</TableHead>
          <TableHead className="text-xs uppercase">Estatus SAT</TableHead>
          {onLink && <TableHead className="w-12"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.catalogo_id || item.rfc} className="hover:bg-gray-50/50">
            <TableCell className="font-medium text-sm">{item.nombre}</TableCell>
            <TableCell className="font-mono text-xs">{item.rfc}</TableCell>
            <TableCell className="text-sm text-gray-600">{item.giro}</TableCell>
            <TableCell className="text-sm">{item.estado_republica}</TableCell>
            <TableCell><Badge className={estatusColors[item.estatus_sat] || "bg-gray-100 text-gray-700"}>{item.estatus_sat}</Badge></TableCell>
            {onLink && <TableCell><Button variant="ghost" size="sm" onClick={() => onLink(item)} className="h-7 text-xs"><LinkIcon className="w-3 h-3 mr-1" />Vincular</Button></TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
