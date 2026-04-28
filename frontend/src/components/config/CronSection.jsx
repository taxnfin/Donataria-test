import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Clock, Play, CheckCircle2 } from "lucide-react";

export const CronSection = ({ cronStatus, runningCron, onRunCron }) => (
  <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <CardTitle style={{ fontFamily: 'Chivo, sans-serif' }}>Recordatorios Automaticos</CardTitle>
          <CardDescription>Envio diario de recordatorios para obligaciones fiscales proximas a vencer</CardDescription>
        </div>
        {cronStatus?.scheduler_active ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100" data-testid="cron-status-badge"><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100" data-testid="cron-status-badge"><Clock className="w-3 h-3 mr-1" /> Inactivo</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <p className="text-sm text-gray-600"><strong>Horario:</strong> Todos los dias a las 8:00 AM (hora Ciudad de Mexico)</p>
        <p className="text-sm text-gray-600"><strong>Notifica:</strong> Obligaciones con 7, 3 o 1 dia(s) restantes</p>
        <p className="text-sm text-gray-600"><strong>Email configurado:</strong>{" "}
          {cronStatus?.email_configured ? <span className="text-green-600 font-medium">Si</span> : <span className="text-amber-600 font-medium">No (requiere RESEND_API_KEY)</span>}
        </p>
      </div>
      <Button variant="outline" onClick={onRunCron} disabled={runningCron} data-testid="run-cron-btn">
        {runningCron ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />Ejecutando...</> : <><Play className="w-4 h-4 mr-2" />Ejecutar Cron Manualmente</>}
      </Button>
    </CardContent>
  </Card>
);
