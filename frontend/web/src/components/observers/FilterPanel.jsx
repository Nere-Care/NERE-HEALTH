import { useState } from "react";
import { Filter, RefreshCw } from "lucide-react";

export default function FilterPanel({ darkMode, onFilterChange }) {
  const [filters, setFilters] = useState({
    region: "all",
    period: "month",
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const reset = () => {
    const defaults = { region: "all", period: "month" };
    setFilters(defaults);
    onFilterChange?.(defaults);
  };

  return (
    <div className={`p-4 rounded-2xl border space-y-3 ${
      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter size={16} />
          Filtres
        </h3>
        <button 
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Réinitialiser
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <select
          value={filters.region}
          onChange={(e) => handleChange("region", e.target.value)}
          className={`p-2.5 rounded-xl text-sm border bg-transparent outline-none ${
            darkMode ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <option value="all">Toutes régions</option>
          <option value="littoral">Littoral</option>
          <option value="centre">Centre</option>
          <option value="nord">Nord</option>
          <option value="ouest">Ouest</option>
          <option value="sud">Sud</option>
        </select>
        
        <select
          value={filters.period}
          onChange={(e) => handleChange("period", e.target.value)}
          className={`p-2.5 rounded-xl text-sm border bg-transparent outline-none ${
            darkMode ? "border-slate-700" : "border-gray-300"
          }`}
        >
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="quarter">3 derniers mois</option>
          <option value="year">Année en cours</option>
        </select>
      </div>
    </div>
  );
}