import { exportToPdf } from "../../serviceApp/exportPDF";

export default function ExportPanel({ darkMode }) {

  const handleExport = () => {
    try {
      exportToPdf({
        totalPatients: 1200000,
        activeDiseases: 24,
        criticalCases: 3450,
        vaccinationRate: "78%"
      });
    } catch (error) {
      console.error("PDF export error:", error);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">
        Export Center
      </h3>

      <button
        onClick={handleExport}
        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Export PDF Report
      </button>

    </div>
  );
}