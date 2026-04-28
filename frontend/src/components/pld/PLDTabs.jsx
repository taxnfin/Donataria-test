import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Shield, AlertTriangle, FileText, CheckCircle2, XCircle, Fingerprint, ClipboardList, Plus, Download } from "lucide-react";

const fmt = (v) => `$${(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const riskColor = (nivel) => ({ critico: "bg-red-100 text-red-700", alto: "bg-orange-100 text-orange-700", medio: "bg-amber-100 text-amber-700", bajo: "bg-green-100 text-green-700" }[nivel] || "bg-gray-100 text-gray-700");

export const AMLDashboardTab = ({ alertas, matriz }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card className="bg-white"><CardHeader><CardTitle className="text-base">Alertas Generadas vs Resueltas</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm"><span>Nuevas</span><Badge className="bg-red-100 text-red-700">{alertas.nuevas}</Badge></div>
        <div className="flex justify-between text-sm"><span>En revision</span><Badge className="bg-amber-100 text-amber-700">{alertas.en_revision}</Badge></div>
        <div className="flex justify-between text-sm"><span>Resueltas</span><Badge className="bg-green-100 text-green-700">{alertas.resueltas}</Badge></div>
        <Separator />
        <div className="flex justify-between text-sm font-semibold"><span>Tasa de resolucion</span><span className="text-emerald-600">{alertas.tasa_resolucion}%</span></div>
      </CardContent></Card>
    <Card className="bg-white"><CardHeader><CardTitle className="text-base">Resumen Matriz de Riesgo</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {matriz && <>
          <div className="flex justify-between text-sm"><span>Criticos</span><Badge className="bg-red-100 text-red-700">{matriz.stats.criticos}</Badge></div>
          <div className="flex justify-between text-sm"><span>Altos</span><Badge className="bg-orange-100 text-orange-700">{matriz.stats.altos}</Badge></div>
          <div className="flex justify-between text-sm"><span>Medios</span><Badge className="bg-amber-100 text-amber-700">{matriz.stats.medios}</Badge></div>
          <div className="flex justify-between text-sm"><span>Bajos</span><Badge className="bg-green-100 text-green-700">{matriz.stats.bajos}</Badge></div>
        </>}
      </CardContent></Card>
  </div>
);

export const OpsVulnerablesTab = ({ data }) => (
  <Card className="bg-white">
    <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-600" /> Operaciones Vulnerables (Art. 17 Ley Antilavado)</CardTitle>
      <CardDescription>Donativos que igualan o superan {data?.umbral_umas} UMAs ({fmt(data?.umbral_mxn)})</CardDescription></CardHeader>
    <CardContent>
      {data?.operaciones?.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No se detectaron operaciones vulnerables</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Fecha</TableHead><TableHead>Metodo</TableHead><TableHead>Aviso UIF</TableHead></TableRow></TableHeader>
          <TableBody>{(data?.operaciones || []).map(op => (
            <TableRow key={op.donativo_id}>
              <TableCell className="font-medium">{op.donante_nombre}</TableCell>
              <TableCell className="font-mono text-xs">{op.donante_rfc}</TableCell>
              <TableCell className="text-right font-semibold text-orange-700">{fmt(op.monto)}</TableCell>
              <TableCell className="text-sm">{(op.fecha_donativo || "").substring(0, 10)}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{op.metodo_pago}</Badge></TableCell>
              <TableCell>{op.aviso_presentado ? <Badge className="bg-green-100 text-green-700 text-xs">Presentado</Badge> : <Badge className="bg-red-100 text-red-700 text-xs">Pendiente</Badge>}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const AvisosTab = ({ avisos, backendUrl, onNewAviso }) => (
  <Card className="bg-white">
    <CardHeader className="flex-row items-center justify-between">
      <div><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Avisos presentados ante UIF / SAT</CardTitle><CardDescription>Registro de avisos con folios y acuses de recepcion</CardDescription></div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => window.open(`${backendUrl}/api/pld/avisos/export/csv`, "_blank")} data-testid="export-avisos-csv"><Download className="w-4 h-4 mr-1" /> CSV</Button>
        <Button size="sm" variant="outline" onClick={() => window.open(`${backendUrl}/api/pld/avisos/export/reporte`, "_blank")} data-testid="export-avisos-reporte"><FileText className="w-4 h-4 mr-1" /> Reporte</Button>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onNewAviso} data-testid="new-aviso-btn"><Plus className="w-4 h-4 mr-1" /> Nuevo Aviso</Button>
      </div>
    </CardHeader>
    <CardContent>
      {avisos.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay avisos registrados</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Folio</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estatus</TableHead><TableHead>Acuse</TableHead></TableRow></TableHeader>
          <TableBody>{avisos.map(a => (
            <TableRow key={a.aviso_id}>
              <TableCell className="text-sm">{a.tipo_aviso?.replace(/_/g, " ")}</TableCell>
              <TableCell className="font-mono text-xs">{a.numero_folio || "-"}</TableCell>
              <TableCell className="text-sm">{(a.fecha_presentacion || a.created_at || "").substring(0, 10)}</TableCell>
              <TableCell className="text-right font-medium">{fmt(a.monto)}</TableCell>
              <TableCell><Badge className={a.estatus === "acusado" ? "bg-green-100 text-green-700" : a.estatus === "presentado" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>{a.estatus}</Badge></TableCell>
              <TableCell className="text-xs text-gray-500">{a.acuse_recepcion || "-"}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const MatrizRiesgoTab = ({ data }) => (
  <Card className="bg-white">
    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-violet-600" /> Matriz de Riesgo de Donantes</CardTitle><CardDescription>Scoring automatico: PEPs, jurisdiccion, monto, metodo de pago, KYC</CardDescription></CardHeader>
    <CardContent>
      <Table>
        <TableHeader><TableRow><TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Score</TableHead><TableHead>Nivel</TableHead><TableHead>Factores</TableHead><TableHead>KYC</TableHead></TableRow></TableHeader>
        <TableBody>{(data?.matriz || []).map(m => (
          <TableRow key={m.donante_id}>
            <TableCell className="font-medium">{m.nombre}</TableCell>
            <TableCell className="font-mono text-xs">{m.rfc}</TableCell>
            <TableCell className="text-right">{fmt(m.total_donativos)}</TableCell>
            <TableCell><div className="flex items-center gap-2"><div className="w-10 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.score_riesgo >= 60 ? "bg-red-500" : m.score_riesgo >= 40 ? "bg-orange-500" : m.score_riesgo >= 20 ? "bg-amber-400" : "bg-green-500"}`} style={{ width: `${m.score_riesgo}%` }} /></div><span className="text-xs font-mono">{m.score_riesgo}</span></div></TableCell>
            <TableCell><Badge className={riskColor(m.nivel_riesgo)}>{m.nivel_riesgo}</Badge></TableCell>
            <TableCell><div className="flex flex-wrap gap-1">{m.factores.map((f, i) => <Badge key={`${f}-${i}`} variant="outline" className="text-[10px]">{f}</Badge>)}</div></TableCell>
            <TableCell>{m.kyc_completo ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}</TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </CardContent>
  </Card>
);

export const KYCTab = ({ kycStatus, onEditKYC }) => (
  <Card className="bg-white">
    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Fingerprint className="w-4 h-4 text-emerald-600" /> KYC de Donantes</CardTitle><CardDescription>Identificacion, beneficiario controlador, constancia de situacion fiscal</CardDescription></CardHeader>
    <CardContent>
      <Table>
        <TableHeader><TableRow><TableHead>Donante</TableHead><TableHead>RFC</TableHead><TableHead>ID</TableHead><TableHead>Constancia</TableHead><TableHead>Benef.</TableHead><TableHead>Riesgo</TableHead><TableHead>Completitud</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>{kycStatus.map(k => (
          <TableRow key={k.donante_id}>
            <TableCell className="font-medium">{k.nombre}{k.es_pep && <Badge className="ml-2 bg-purple-100 text-purple-700 text-[10px]">PEP</Badge>}</TableCell>
            <TableCell className="font-mono text-xs">{k.rfc}</TableCell>
            <TableCell>{k.kyc_fields.identificacion ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
            <TableCell>{k.kyc_fields.constancia_fiscal ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
            <TableCell>{k.kyc_fields.beneficiario_controlador ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
            <TableCell>{k.kyc_fields.nivel_riesgo_asignado ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</TableCell>
            <TableCell><div className="flex items-center gap-2"><Progress value={k.kyc_porcentaje} className="h-1.5 w-16" /><span className="text-xs">{k.kyc_porcentaje}%</span></div></TableCell>
            <TableCell><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEditKYC(k)} data-testid={`kyc-edit-${k.donante_id}`}>Editar KYC</Button></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </CardContent>
  </Card>
);

export const DueDiligenceTab = ({ ddLogs, onNewDD }) => (
  <Card className="bg-white">
    <CardHeader className="flex-row items-center justify-between">
      <div><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-violet-600" /> Bitacora de Due Diligence</CardTitle><CardDescription>Registro de revisiones sobre donantes recurrentes o de alto monto</CardDescription></div>
      <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={onNewDD} data-testid="new-dd-btn"><Plus className="w-4 h-4 mr-1" /> Nueva Revision</Button>
    </CardHeader>
    <CardContent>
      {ddLogs.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No hay registros de due diligence</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Donante</TableHead><TableHead>Tipo</TableHead><TableHead>Resultado</TableHead><TableHead>Revisor</TableHead><TableHead>Hallazgos</TableHead></TableRow></TableHeader>
          <TableBody>{ddLogs.map(dd => (
            <TableRow key={dd.dd_id}>
              <TableCell className="text-sm">{(dd.created_at || "").substring(0, 10)}</TableCell>
              <TableCell className="font-medium">{dd.donante_nombre || dd.donante_id}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{dd.tipo_revision}</Badge></TableCell>
              <TableCell><Badge className={dd.resultado === "aprobado" ? "bg-green-100 text-green-700" : dd.resultado === "rechazado" ? "bg-red-100 text-red-700" : dd.resultado === "escalado" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}>{dd.resultado}</Badge></TableCell>
              <TableCell className="text-sm">{dd.reviewer_name}</TableCell>
              <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{dd.hallazgos || "-"}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);
