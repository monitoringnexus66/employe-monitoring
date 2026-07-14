import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (logs: any[], userName: string, date: Date) => {
  if (!logs || logs.length === 0) return;

  const headers = ["Time", "Application", "Window Title", "Duration (Seconds)", "Status"];
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleTimeString(),
    log.appName,
    log.windowTitle.replace(/,/g, ""), // Sanitize commas
    log.durationSeconds,
    log.isIdle ? "Idle" : "Active"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Timesheet_${userName.replace(/\s+/g, '_')}_${date.toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (logs: any[], userName: string, date: Date) => {
  if (!logs || logs.length === 0) return;

  const doc = new jsPDF();
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Activity Timesheet Report", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Employee: ${userName}`, 14, 32);
  doc.text(`Date: ${dateStr}`, 14, 38);
  doc.text(`Total Records: ${logs.length}`, 14, 44);

  // Table
  const tableData = logs.map(log => [
    new Date(log.timestamp).toLocaleTimeString(),
    log.appName,
    log.windowTitle.length > 40 ? log.windowTitle.substring(0, 40) + '...' : log.windowTitle,
    `${log.durationSeconds}s`,
    log.isIdle ? "Idle" : "Active"
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Time", "Application", "Window Title", "Duration", "Status"]],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 20 }
    }
  });

  doc.save(`Timesheet_${userName.replace(/\s+/g, '_')}_${date.toISOString().split('T')[0]}.pdf`);
};
