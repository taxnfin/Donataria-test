import { Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const SemaforoWidget = ({ semaforo }) => {
  if (!semaforo) return null;
  return (
    <Card className="bg-white border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" data-testid="semaforo-widget">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-4 h-4 rounded-full animate-pulse ${
            semaforo.semaforo === "verde" ? "bg-green-500" :
            semaforo.semaforo === "ambar" ? "bg-amber-500" : "bg-red-500"
          }`} />
          <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>Semaforo de Cumplimiento</h3>
          <span className={`ml-auto text-2xl font-bold ${
            semaforo.score_general >= 80 ? "text-green-600" :
            semaforo.score_general >= 60 ? "text-amber-600" : "text-red-600"
          }`}>{semaforo.score_general}%</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(semaforo.indicadores).map(([key, ind]) => (
            <Link key={key} to={key === "cumplimiento" ? "/cumplimiento" : key === "kyc" ? "/pld" : key === "control_10" ? "/declaracion-anual" : "/alertas"}>
              <div className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                ind.color === "verde" ? "border-green-200 bg-green-50/50" :
                ind.color === "ambar" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {ind.color === "verde" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> :
                   ind.color === "ambar" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> :
                   <XCircle className="w-3.5 h-3.5 text-red-600" />}
                  <span className="text-xs font-medium text-gray-600">{ind.label}</span>
                </div>
                <p className={`text-lg font-bold ${
                  ind.color === "verde" ? "text-green-700" :
                  ind.color === "ambar" ? "text-amber-700" : "text-red-700"
                }`}>{key === "control_10" ? `${ind.porcentaje}%` : `${ind.score}%`}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{ind.detalle}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
