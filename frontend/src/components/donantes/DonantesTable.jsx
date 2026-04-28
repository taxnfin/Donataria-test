import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Users, User, Building, Globe, MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export const DonantesTable = ({ donantes, loading, onEdit, onDelete }) => {
  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  if (donantes.length === 0) return <div className="text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay donantes registrados</p></div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          <TableHead className="text-xs uppercase tracking-wider text-gray-500">Donante</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-gray-500">Tipo</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-gray-500">RFC</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-gray-500">Contacto</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-gray-500 text-right">Total Donativos</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donantes.map((d) => (
          <TableRow key={d.donante_id} className="hover:bg-gray-50/50" data-testid={`donante-row-${d.donante_id}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${d.tipo_persona === "moral" ? "bg-blue-100" : "bg-emerald-100"}`}>
                  {d.tipo_persona === "moral" ? <Building className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{d.nombre}</p>
                  {d.es_extranjero && <div className="flex items-center gap-1 text-xs text-gray-500"><Globe className="w-3 h-3" />{d.pais || "Extranjero"}</div>}
                </div>
              </div>
            </TableCell>
            <TableCell><Badge variant="outline" className={d.tipo_persona === "moral" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>{d.tipo_persona === "moral" ? "Moral" : "Fisica"}</Badge></TableCell>
            <TableCell className="font-mono text-sm">{d.rfc || (d.es_extranjero ? "XEXX010101000" : "-")}</TableCell>
            <TableCell className="text-sm text-gray-600">{d.email || d.telefono || "-"}</TableCell>
            <TableCell className="text-right"><span className="font-semibold text-emerald-600">{formatCurrency(d.total_donativos || 0)}</span><p className="text-xs text-gray-400">{d.num_donativos || 0} donativos</p></TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to={`/donantes/${d.donante_id}`}><Eye className="w-4 h-4 mr-2" />Ver detalle</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(d)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(d.donante_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
