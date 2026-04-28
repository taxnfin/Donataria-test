import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Calendar, Clock, CheckCircle2, AlertTriangle, XCircle, MoreHorizontal } from "lucide-react";

const urgencyColors = {
  verde: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-700" },
  ambar: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
  rojo: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700" },
  vencida: { bg: "bg-gray-50", border: "border-gray-300", dot: "bg-gray-500", text: "text-gray-700" },
};

const estadoStyles = {
  pendiente: "bg-amber-100 text-amber-700", cumplida: "bg-green-100 text-green-700",
  en_proceso: "bg-blue-100 text-blue-700", omitida: "bg-red-100 text-red-700",
};

export const ObligacionCard = ({ obl, onUpdateEstado, onDelete }) => {
  const urg = urgencyColors[obl.urgencia] || urgencyColors.verde;
  const fLimite = obl.fecha_limite ? new Date(obl.fecha_limite).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <Card className={`bg-white border-gray-100 hover:shadow-md transition-shadow`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-3 h-3 rounded-full mt-2 ${urg.dot}`} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900">{obl.nombre}</h3>
              <Badge className={estadoStyles[obl.estado] || estadoStyles.pendiente}>{obl.estado}</Badge>
            </div>
            {obl.descripcion && <p className="text-sm text-gray-500 mb-2">{obl.descripcion}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fLimite}</span>
              {obl.fundamento_legal && <span>{obl.fundamento_legal}</span>}
              {obl.dias_restantes !== undefined && (
                <Badge variant="outline" className={urg.text}>
                  {obl.dias_restantes > 0 ? `${obl.dias_restantes} dias` : obl.dias_restantes === 0 ? "Hoy" : "Vencida"}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateEstado(obl.obligacion_id, "en_proceso")}>En proceso</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateEstado(obl.obligacion_id, "cumplida")}><CheckCircle2 className="w-4 h-4 mr-2" />Cumplida</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateEstado(obl.obligacion_id, "omitida")} className="text-red-600"><XCircle className="w-4 h-4 mr-2" />Omitida</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
