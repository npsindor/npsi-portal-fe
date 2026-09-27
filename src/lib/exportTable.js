// Shared CSV/Excel/PDF export used by every admin data table. Takes plain,
// already-display-formatted values (columns: [{ key, label }], rows: array
// of plain objects) so every format shows exactly what the on-screen table
// shows.
//
// jspdf/jspdf-autotable/xlsx are dynamically imported inside the Excel/PDF
// functions (not statically here) — they're a large chunk of JS that most
// admin-page visits never touch, so loading them only on first actual export
// click keeps every admin page's initial load small (important on mobile).

const cellText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const toMatrix = (columns, rows) => rows.map((row) => columns.map((col) => cellText(row[col.key])));

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (filename, columns, rows) => {
  const escapeCsv = (value) => {
    const text = cellText(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    columns.map((col) => escapeCsv(col.label)).join(","),
    ...rows.map((row) => columns.map((col) => escapeCsv(row[col.key])).join(",")),
  ];
  // Leading BOM so Excel opens UTF-8 (Hindi text etc.) correctly instead of mangling it.
  downloadBlob(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
};

export const exportToExcel = async (filename, columns, rows) => {
  const XLSX = await import("xlsx");
  const data = [columns.map((col) => col.label), ...toMatrix(columns, rows)];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = async (filename, title, columns, rows) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [columns.map((col) => col.label)],
    body: toMatrix(columns, rows),
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [90, 26, 42] },
  });
  doc.save(`${filename}.pdf`);
};
