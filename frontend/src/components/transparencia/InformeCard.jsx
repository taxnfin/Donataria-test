import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { FileText, MoreHorizontal, Download, Edit, Trash2, Eye, Send } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0);
const estadoStyles = { borrador: "bg-amber-100 text-amber-700", presentado: "bg-green-100 text-green-700" };

export const InformeCard = ({ informe, backendUrl, onEdit, onDelete, onPresentar }) => (
  <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">Ejercicio {informe.ejercicio_fiscal}</h3>
            <Badge className={estadoStyles[informe.estado] || estadoStyles.borrador}>{informe.estado}</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">Ficha 19/ISR</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`${backendUrl}/api/transparencia/${informe.informe_id}/pdf`, '_blank')}><Download className="w-4 h-4 mr-2" />PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(informe)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
            {informe.estado === "borrador" && <DropdownMenuItem onClick={() => onPresentar(informe.informe_id)}><Send className="w-4 h-4 mr-2" />Presentar</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => onDelete(informe.informe_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-emerald-50 rounded"><p className="text-[10px] text-emerald-600">Donativos recibidos</p><p className="font-semibold text-emerald-800 text-sm">{formatCurrency(informe.total_donativos_recibidos)}</p></div>
        <div className="p-2 bg-blue-50 rounded"><p className="text-[10px] text-blue-600">Donativos especie</p><p className="font-semibold text-blue-800 text-sm">{formatCurrency(informe.total_donativos_especie)}</p></div>
        <div className="p-2 bg-amber-50 rounded"><p className="text-[10px] text-amber-600">Gastos admin</p><p className="font-semibold text-amber-800 text-sm">{formatCurrency(informe.total_gastos_admin)} ({informe.porcentaje_gastos_admin?.toFixed(1)}%)</p></div>
        <div className="p-2 bg-violet-50 rounded"><p className="text-[10px] text-violet-600">Beneficiarios</p><p className="font-semibold text-violet-800 text-sm">{(informe.numero_beneficiarios || 0).toLocaleString()}</p></div>
      </div>
    </CardContent>
  </Card>
);
