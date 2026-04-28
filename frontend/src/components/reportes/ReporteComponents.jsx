import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { FileText, MoreHorizontal, Download, Send, CheckCircle, Trash2, FilePlus, LayoutTemplate, Clock } from "lucide-react";

const tipoBadgeColors = {
  str_sar: "bg-red-100 text-red-700", operacion_relevante: "bg-amber-100 text-amber-700",
  operacion_inusual: "bg-orange-100 text-orange-700", donantes_pep: "bg-purple-100 text-purple-700",
  reporte_mensual: "bg-blue-100 text-blue-700"
};
const tipoLabels = { str_sar: "STR/SAR", operacion_relevante: "Op. Relevante", operacion_inusual: "Op. Inusual", donantes_pep: "Donantes PEP", reporte_mensual: "Mensual" };

const estadoConfig = {
  borrador: { icon: Clock, color: "bg-gray-100 text-gray-700" },
  enviado: { icon: Send, color: "bg-blue-100 text-blue-700" },
  acuse_recibido: { icon: CheckCircle, color: "bg-green-100 text-green-700" }
};

export const ReportesTable = ({ reportes, loading, onDownloadPDF, onUpdateEstado, onDelete }) => (
  <Card className="bg-white border-gray-100">
    <CardContent className="p-0">
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>
      ) : reportes.length === 0 ? (
        <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay reportes generados</p></div>
      ) : (
        <Table>
          <TableHeader><TableRow className="bg-gray-50/50">
            <TableHead className="text-xs uppercase">Fecha</TableHead><TableHead className="text-xs uppercase">Reporte</TableHead>
            <TableHead className="text-xs uppercase">Tipo</TableHead><TableHead className="text-xs uppercase">Destinatario</TableHead>
            <TableHead className="text-xs uppercase">Periodo</TableHead><TableHead className="text-xs uppercase">Estado</TableHead><TableHead className="w-12"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {reportes.map((r) => {
              const { icon: EIcon, color: eColor } = estadoConfig[r.estado] || estadoConfig.borrador;
              return (
                <TableRow key={r.report_id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('es-MX')}</TableCell>
                  <TableCell><div><p className="font-medium text-gray-900">{r.titulo}</p>{r.descripcion && <p className="text-xs text-gray-500 truncate max-w-xs">{r.descripcion}</p>}</div></TableCell>
                  <TableCell><Badge className={tipoBadgeColors[r.tipo] || "bg-gray-100 text-gray-700"}>{tipoLabels[r.tipo] || r.tipo}</Badge></TableCell>
                  <TableCell className="text-sm">{r.destinatario}</TableCell>
                  <TableCell className="text-xs text-gray-500">{r.datos?.periodo || "N/A"}</TableCell>
                  <TableCell><Badge className={eColor}><EIcon className="w-3 h-3 mr-1" />{r.estado?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDownloadPDF(r.report_id)} data-testid={`download-pdf-${r.report_id}`}><Download className="w-4 h-4 mr-2" />Descargar PDF</DropdownMenuItem>
                        {r.estado === "borrador" && <DropdownMenuItem onClick={() => onUpdateEstado(r.report_id, "enviado")}><Send className="w-4 h-4 mr-2" />Marcar enviado</DropdownMenuItem>}
                        {r.estado === "enviado" && <DropdownMenuItem onClick={() => onUpdateEstado(r.report_id, "acuse_recibido")}><CheckCircle className="w-4 h-4 mr-2" />Acuse recibido</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => onDelete(r.report_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
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

export const PlantillasGrid = ({ plantillas, onUseTemplate, onDelete }) => {
  if (plantillas.length === 0) return (
    <Card className="col-span-full bg-white border-gray-100"><CardContent className="text-center py-12"><LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No hay plantillas configuradas</p></CardContent></Card>
  );
  return plantillas.map((p) => (
    <Card key={p.template_id} className="bg-white border-gray-100 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div><CardTitle className="text-base">{p.nombre}</CardTitle><CardDescription className="text-xs">{p.descripcion}</CardDescription></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUseTemplate(p)} data-testid={`use-template-${p.template_id}`}><FilePlus className="w-4 h-4 mr-2" />Generar Reporte</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(p.template_id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge className={tipoBadgeColors[p.tipo_reporte] || "bg-gray-100 text-gray-700"}>{tipoLabels[p.tipo_reporte] || p.tipo_reporte}</Badge>
          <Badge variant="outline">{p.destinatario}</Badge><Badge variant="outline">{p.formato}</Badge><Badge variant="outline" className="capitalize">{p.periodicidad}</Badge>
        </div>
      </CardContent>
    </Card>
  ));
};
