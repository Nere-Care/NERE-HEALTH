import { useState } from "react";
import { Baby, X, Heart, AlertCircle, ChevronDown, ChevronUp, Trash2, Calendar, Stethoscope, Scissors } from "lucide-react";

const colorMap = (darkMode) => ({
  green: { bg: darkMode ? "bg-green-900/30" : "bg-green-100", text: darkMode ? "text-green-400" : "text-green-600", border: darkMode ? "border-green-800" : "border-green-200" },
  purple: { bg: darkMode ? "bg-purple-900/30" : "bg-purple-100", text: darkMode ? "text-purple-400" : "text-purple-600", border: darkMode ? "border-purple-800" : "border-purple-200" },
  red: { bg: darkMode ? "bg-red-900/30" : "bg-red-100", text: darkMode ? "text-red-400" : "text-red-600", border: darkMode ? "border-red-800" : "border-red-200" },
  gray: { bg: darkMode ? "bg-gray-600/30" : "bg-gray-200", text: darkMode ? "text-gray-400" : "text-gray-700", border: darkMode ? "border-gray-500" : "border-gray-300" },
  orange: { bg: darkMode ? "bg-orange-900/30" : "bg-orange-100", text: darkMode ? "text-orange-400" : "text-orange-600", border: darkMode ? "border-orange-800" : "border-orange-200" },
  brown: { bg: darkMode ? "bg-amber-900/30" : "bg-amber-100", text: darkMode ? "text-amber-600" : "text-amber-800", border: darkMode ? "border-amber-800" : "border-amber-200" },
  blue: { bg: darkMode ? "bg-blue-900/30" : "bg-blue-100", text: darkMode ? "text-blue-400" : "text-blue-600", border: darkMode ? "border-blue-800" : "border-blue-200" },
  amber: { bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-100", text: darkMode ? "text-yellow-400" : "text-yellow-600", border: darkMode ? "border-yellow-800" : "border-yellow-200" },
});

function getIconAndColor(g) {
  if (g.issue === "Grossesse en cours") return { icon: Baby, color: "amber", label: "Grossesse en cours" };
  if (g.issue === "Naissance") {
    if (g.type_accouchement === "Césarienne") return { icon: Scissors, color: "purple", label: "Césarienne" };
    return { icon: Baby, color: "green", label: "Naissance" };
  }
  if (g.issue === "Fausse couche") return { icon: X, color: "red", label: "Fausse couche" };
  if (g.issue === "Mortinaissance") return { icon: Heart, color: "gray", label: "Mortinaissance" };
  if (g.issue === "Grossesse extra-utérine") return { icon: AlertCircle, color: "orange", label: "GEU" };
  if (g.issue === "IVG") return { icon: X, color: "brown", label: "IVG" };
  if (g.issue === "IMG") return { icon: X, color: "blue", label: "IMG" };
  return { icon: Stethoscope, color: "amber", label: "Grossesse" };
}

function calculateDPA(dateStr, type) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setDate(date.getDate() + (type === "DDR" ? 280 : 266));
  return date.toISOString().split("T")[0];
}

export default function ObstetricTimeline({ grossesses, onUpdate, darkMode, readOnly = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const colors = colorMap(darkMode);

  const handleUpdateGrossesse = (id, updates) => {
    const newGrossesses = grossesses.map((g) => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates };
      if ((updates.date_debut !== undefined || updates.type_debut !== undefined) && updated.date_debut && updated.type_debut && !updated.dpa_manuelle) {
        updated.dpa = calculateDPA(updated.date_debut, updated.type_debut);
      }
      return updated;
    });
    onUpdate(newGrossesses);
  };

  const handleDeleteGrossesse = (id) => {
    if (window.confirm("Supprimer cet historique de grossesse ?")) {
      onUpdate(grossesses.filter((g) => g.id !== id));
    }
  };

  const sortedGrossesses = [...grossesses].sort((a, b) => {
    if (a.issue === "Grossesse en cours") return -1;
    if (b.issue === "Grossesse en cours") return 1;
    return new Date(b.date_accouchement || b.date_perte || "") - new Date(a.date_accouchement || a.date_perte || "");
  });

  if (grossesses.length === 0) {
    return (
      <div className={`text-center py-8 rounded-xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
        <Baby className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium text-sm">Aucun historique obstétrical enregistré</p>
        <p className="text-xs mt-1">Ajoutez une grossesse pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className="space-y-4">
        {sortedGrossesses.map((g) => {
          const { icon: Icon, color, label } = getIconAndColor(g);
          const c = colors[color];
          const isExpanded = expandedId === g.id;
          const originalIndex = grossesses.findIndex((og) => og.id === g.id);
          const title = g.issue === "Grossesse en cours" ? "Grossesse actuelle" : `Grossesse n°${grossesses.length - originalIndex}`;

          let summaryLine1 = "";
          let summaryLine2 = "";
          if (g.issue === "Grossesse en cours") {
            summaryLine1 = g.dpa ? `DPA: ${new Date(g.dpa).toLocaleDateString("fr-FR")}` : "";
            summaryLine2 = `${g.nb_enfants || 1} bébé${(g.nb_enfants || 1) > 1 ? "s" : ""} attendu${(g.nb_enfants || 1) > 1 ? "s" : ""}`;
          } else if (g.issue === "Naissance") {
            summaryLine1 = g.type_accouchement || "Naissance";
            summaryLine2 = g.date_accouchement ? new Date(g.date_accouchement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
          } else {
            summaryLine1 = label;
            summaryLine2 = g.date_perte ? new Date(g.date_perte).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
          }

          return (
            <div key={g.id} className="relative flex gap-4">
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg} ${c.text} shadow-sm`}>
                <Icon size={20} />
              </div>
              <div className={`flex-1 border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? "shadow-md" : "hover:shadow-sm"} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className={`p-4 cursor-pointer flex items-center justify-between ${isExpanded ? (darkMode ? "bg-gray-750" : "bg-gray-50") : ""}`} onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>{label}</span>
                    </div>
                    {!isExpanded && (
                      <div className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <span>{summaryLine1}</span>
                        {summaryLine2 && <span className="ml-2">• {summaryLine2}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={readOnly} onClick={(e) => { e.stopPropagation(); handleDeleteGrossesse(g.id); }} className={`p-1.5 rounded-lg transition-colors ${readOnly ? "opacity-30 cursor-not-allowed" : ""} ${darkMode ? "hover:bg-gray-700 text-gray-400 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}>
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-dashed animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                        <label className={`text-[10px] uppercase tracking-wider font-bold mb-2 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Début de grossesse</label>
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => handleUpdateGrossesse(g.id, { type_debut: "DDR" })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${g.type_debut === "DDR" ? (darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700") : (darkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600 shadow-sm")}`}>DDR</button>
                          <button onClick={() => handleUpdateGrossesse(g.id, { type_debut: "conception" })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${g.type_debut === "conception" ? (darkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-700") : (darkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-600 shadow-sm")}`}>Conception</button>
                        </div>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="date" value={g.date_debut || ""} onChange={(e) => handleUpdateGrossesse(g.id, { date_debut: e.target.value })}
                            className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <p className="text-[10px] mt-1 text-gray-400 italic">
                          Cette date est calculée automatiquement. Si votre médecin a déterminé une autre date, vous pouvez la modifier.
                        </p>
                        <button onClick={() => { const newDpa = calculateDPA(g.date_debut, g.type_debut); handleUpdateGrossesse(g.id, { dpa: newDpa, dpa_manuelle: false }); }}
                          className="mt-2 text-[10px] text-blue-500 hover:underline">Recalculer automatiquement</button>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                        <label className={`text-[10px] uppercase tracking-wider font-bold mb-2 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date prévue d'accouchement (DPA)</label>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="date" value={g.dpa || ""} onChange={(e) => handleUpdateGrossesse(g.id, { dpa: e.target.value, dpa_manuelle: true })}
                            className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                        <label className={`text-[10px] uppercase tracking-wider font-bold mb-2 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Nombre d'enfants {g.issue === "Grossesse en cours" ? "attendus" : ""}</label>
                        <input type="number" min="1" value={g.nb_enfants || 1} onChange={(e) => handleUpdateGrossesse(g.id, { nb_enfants: parseInt(e.target.value) || 1 })}
                          className={`w-full border rounded-lg px-3 py-1.5 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                      </div>
                      <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                        <label className={`text-[10px] uppercase tracking-wider font-bold mb-2 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Issue de la grossesse</label>
                        <select value={g.issue || ""} onChange={(e) => handleUpdateGrossesse(g.id, { issue: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-1.5 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                          <option value="">Sélectionner...</option>
                          <option value="Grossesse en cours">Grossesse en cours</option>
                          <option value="Naissance">Naissance</option>
                          <option value="Fausse couche">Fausse couche</option>
                          <option value="Mortinaissance">Mortinaissance</option>
                          <option value="Grossesse extra-utérine">Grossesse extra-utérine</option>
                          <option value="IVG">Interruption volontaire (IVG)</option>
                          <option value="IMG">Interruption médicale (IMG)</option>
                        </select>
                      </div>
                    </div>
                    {g.issue === "Naissance" && (
                      <div className={`mt-4 p-4 rounded-xl border ${darkMode ? "bg-green-900/10 border-green-900/30" : "bg-green-50 border-green-100"}`}>
                        <h5 className={`text-xs font-bold mb-3 ${darkMode ? "text-green-400" : "text-green-700"}`}>Détails de l'accouchement</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Type d'accouchement</label>
                            <select value={g.type_accouchement || ""} onChange={(e) => handleUpdateGrossesse(g.id, { type_accouchement: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              <option value="">Sélectionner...</option>
                              <option value="Voie basse">Voie basse</option>
                              <option value="Césarienne">Césarienne</option>
                              <option value="Forceps">Forceps</option>
                              <option value="Ventouse">Ventouse</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de naissance</label>
                            <input type="date" value={g.date_accouchement || ""} onChange={(e) => handleUpdateGrossesse(g.id, { date_accouchement: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`} />
                          </div>
                        </div>
                      </div>
                    )}
                    {(g.issue === "Fausse couche" || g.issue === "Mortinaissance" || g.issue === "Grossesse extra-utérine" || g.issue === "IVG" || g.issue === "IMG") && (
                      <div className={`mt-4 p-4 rounded-xl border ${darkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-100"}`}>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de l'événement</label>
                            <input type="date" value={g.date_perte || ""} onChange={(e) => handleUpdateGrossesse(g.id, { date_perte: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Commentaires</label>
                      <textarea value={g.commentaires || ""} onChange={(e) => handleUpdateGrossesse(g.id, { commentaires: e.target.value })} rows="2" placeholder="Notes complémentaires..."
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
