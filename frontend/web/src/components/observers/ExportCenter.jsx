import { jsPDF } from "jspdf";

export default function ExportCenter({ darkMode }) {
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Health Observatory Report", 10, 10);
    doc.text("Generated statistics for NGO / Government", 10, 20);
    doc.save("observer-report.pdf");
  };

  return (
    <div className={`p-4 rounded-xl border
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">Export Center</h3>

      <button
        onClick={exportPDF}
        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
      >
        Export Full Report (PDF)
      </button>

    </div>
  );
}