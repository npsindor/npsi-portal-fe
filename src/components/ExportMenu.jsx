import React from "react";
import { Download, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exportTable";

// Drop this next to any admin table's search bar: <ExportMenu filename="families" title="Families" columns={...} rows={...} />
// columns: [{ key, label }] — label is the header text, key reads from each row.
// rows: plain, already-display-formatted objects (dates as strings, etc).
export default function ExportMenu({ filename, title, columns, rows, labels }) {
  const t = {
    export: labels?.export || "Export",
    csv: labels?.csv || "CSV",
    excel: labels?.excel || "Excel (.xlsx)",
    pdf: labels?.pdf || "PDF",
  };
  const disabled = !rows || rows.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {t.export}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(filename, columns, rows)}>
          <FileText className="mr-2 h-4 w-4" /> {t.csv}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(filename, columns, rows)}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {t.excel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(filename, title || filename, columns, rows)}>
          <FileType className="mr-2 h-4 w-4" /> {t.pdf}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
