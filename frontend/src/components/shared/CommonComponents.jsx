import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export const StatCard = ({ title, value, icon: Icon, color = "gray", subtitle }) => (
  <Card className="bg-white border-gray-100">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon className={`w-8 h-8 text-${color}-200`} />}
      </div>
    </CardContent>
  </Card>
);

export const SeveridadBadge = ({ severidad }) => {
  const styles = {
    baja: "bg-gray-100 text-gray-700",
    media: "bg-blue-100 text-blue-700",
    alta: "bg-amber-100 text-amber-700",
    critica: "bg-red-100 text-red-700"
  };
  return <Badge className={styles[severidad] || styles.media}>{severidad}</Badge>;
};

export const EstadoBadge = ({ estado, icons }) => {
  const config = {
    nueva: { color: "bg-red-100 text-red-700" },
    en_revision: { color: "bg-amber-100 text-amber-700" },
    resuelta: { color: "bg-green-100 text-green-700" },
    descartada: { color: "bg-gray-100 text-gray-600" },
    pendiente: { color: "bg-amber-100 text-amber-700" },
    cumplida: { color: "bg-green-100 text-green-700" },
    omitida: { color: "bg-red-100 text-red-700" },
    en_proceso: { color: "bg-blue-100 text-blue-700" },
    borrador: { color: "bg-amber-100 text-amber-700" },
    presentada: { color: "bg-green-100 text-green-700" },
    presentado: { color: "bg-green-100 text-green-700" },
    timbrado: { color: "bg-green-100 text-green-700" },
    cancelado: { color: "bg-red-100 text-red-700" },
  };
  const { color } = config[estado] || { color: "bg-gray-100 text-gray-600" };
  return <Badge className={color}>{estado}</Badge>;
};

export const EmptyState = ({ icon: Icon, message, action }) => (
  <div className="text-center py-12">
    {Icon && <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
    <p className="text-gray-500">{message}</p>
    {action}
  </div>
);

export const LoadingSpinner = ({ color = "emerald" }) => (
  <div className="flex items-center justify-center h-48">
    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${color}-600`} />
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Chivo, sans-serif' }}>{title}</h1>
      {subtitle && <p className="text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);
