import { Download } from "lucide-react";
import { exportToPdf } from "../../serviceApp/exportPDF";

export default function ExportPanel({ darkMode }) {
  const handleExport = () => {
    exportToPdf({
      totalPatients: 1200000,
      activeDiseases: 24,
      criticalCases: 3450,
      vaccinationRate: "78%",
    });
  };

  return (
    <div
      className={`p-4 rounded-xl border transition
      ${
        darkMode
          ? "bg-gray-900 border-gray-800"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Export Reports</h3>
      </div>

      <button
        onClick={handleExport}
        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Generate PDF Report
      </button>
    </div>
  );
}