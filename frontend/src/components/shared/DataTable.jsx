import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Eye, FileText, Download, Send } from "lucide-react";

export const DataTable = ({ columns, data, emptyIcon: EmptyIcon, emptyMessage = "Sin datos", loading }) => {
  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  if (!data || data.length === 0) return (
    <div className="text-center py-12">
      {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
      <p className="text-gray-500">{emptyMessage}</p>
    </div>
  );
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/50">
          {columns.map((col) => (
            <TableHead key={col.key} className={`text-xs uppercase ${col.className || ""}`}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={row.id || row[columns[0]?.key] || idx} className="hover:bg-gray-50/50">
            {columns.map((col) => (
              <TableCell key={col.key} className={col.cellClassName || ""}>
                {col.render ? col.render(row) : row[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const ActionDropdown = ({ actions }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {actions.map((action, i) => (
        <DropdownMenuItem key={action.label} onClick={action.onClick} className={action.destructive ? "text-red-600" : ""}>
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
