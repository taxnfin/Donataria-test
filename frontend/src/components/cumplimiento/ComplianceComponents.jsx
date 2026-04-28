import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ShieldCheck } from "lucide-react";

const fmt = (v) => `$${(v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export const ComplianceScoreCard = ({ score }) => {
  const color = score >= 80 ? "emerald" : score >= 60 ? "blue" : score >= 40 ? "amber" : "red";
  return (
    <Card className="bg-white border-gray-100">
      <CardContent className="p-6 text-center">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-${color}-50 mb-4`}>
          <span className={`text-3xl font-bold text-${color}-600`}>{score}%</span>
        </div>
        <p className="font-semibold text-gray-900">Score de Cumplimiento</p>
        <Progress value={score} className="h-2 mt-3" />
      </CardContent>
    </Card>
  );
};

export const ComplianceBreakdownTable = ({ desglose }) => {
  if (!desglose || desglose.length === 0) return null;
  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead className="text-xs uppercase">Obligacion</TableHead><TableHead className="text-xs uppercase">Estado</TableHead><TableHead className="text-xs uppercase">Porcentaje</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        {desglose.map((item) => (
          <TableRow key={item.nombre || item.tipo}>
            <TableCell className="font-medium">{item.nombre || item.tipo}</TableCell>
            <TableCell><Badge className={item.porcentaje >= 80 ? "bg-green-100 text-green-700" : item.porcentaje >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{item.porcentaje}%</Badge></TableCell>
            <TableCell><Progress value={item.porcentaje} className="h-1.5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
