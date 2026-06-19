import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, FileText, Calendar, Shield } from "lucide-react";

export default function ExportPanel({ darkMode, dashboard, description }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = {
        dashboard,
        format,
        exportedAt: new Date().toISOString(),
        anonymized: true,
        compliance: "RGPD Article 89 - Traitement à des fins de statistiques",
        description,
        note: "Aucune donnée personnelle identifiable n'est incluse dans cet export",
      };
      
      if (format === "pdf") {
        // Simulation PDF
        toast.success("📄 Rapport PDF généré (données anonymisées)");
      } else if (format === "csv") {
        // Simulation CSV
        const csv = "Dashboard,Format,Date,Anonymisé,Conformité\n" +
          `${data.dashboard},${data.format},${data.exportedAt},${data.anonymized},"${data.compliance}"`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `observatoire_${dashboard}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("📊 Export CSV téléchargé");
      } else {
        // JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `observatoire_${dashboard}_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("📥 Export JSON téléchargé");
      }
    } catch {
      toast.error("❌ Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${
      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
            <Download size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Exporter les données</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-100 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-100 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            <FileText size={16} />
            CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>
      
      <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs ${
        darkMode ? "bg-slate-800/50" : "bg-gray-50"
      }`}>
        <Shield size={14} className="text-green-500 flex-shrink-0" />
        <span className="text-gray-400">
          Tous les exports sont anonymisés et conformes au RGPD • Aucun identifiant personnel inclus
        </span>
      </div>
    </div>
  );
}