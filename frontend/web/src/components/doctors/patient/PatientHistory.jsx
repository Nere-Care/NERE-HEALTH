import { useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Activity,
  Pill,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function PatientHistory({ selectedPatient, consultations, darkMode }) {
  const [filtre, setFiltre] = useState("all"); // all | consultations | prescriptions | labos
  const [expandedId, setExpandedId] = useState(null);

  if (!selectedPatient) return null;

  // Construire une timeline unifiée
  const timeline = [];

  // Ajouter les consultations
  consultations.forEach((c) => {
    timeline.push({
      id: `consult-${c.id}`,
      type: "consultation",
      date: c.date,
      time: c.time,
      title: c.reason || "Consultation",
      subtitle: `Dr. ${c.doctor || "N/A"}`,
      description: c.notes || "",
      diagnosis: c.diagnosis,
      icon: Activity,
      color: "blue",
    });

    // Ajouter les prescriptions liées
    if (c.prescriptions && c.prescriptions.length > 0) {
      c.prescriptions.forEach((p) => {
        timeline.push({
          id: `presc-${p.id}`,
          type: "prescription",
          date: c.date,
          time: c.time,
          title: p.name,
          subtitle: p.dosage,
          description: `${p.frequency} - ${p.duration}`,
          icon: Pill,
          color: "green",
        });
      });
    }

    // Ajouter les résultats de labo
    if (c.labResults && c.labResults.length > 0) {
      c.labResults.forEach((l) => {
        timeline.push({
          id: `lab-${l.id}`,
          type: "labo",
          date: c.date,
          time: c.time,
          title: l.title,
          subtitle: "Résultat de laboratoire",
          description: "",
          icon: FileText,
          color: "purple",
        });
      });
    }
  });

  // Filtrer selon le type
  const filteredTimeline = timeline.filter((item) => {
    if (filtre === "all") return true;
    return item.type === filtre;
  });

  // Trier par date (plus récent en premier)
  filteredTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  const colorMap = {
    blue: {
      bg: darkMode ? "bg-blue-900/30" : "bg-blue-100",
      text: darkMode ? "text-blue-400" : "text-blue-600",
      border: darkMode ? "border-blue-800" : "border-blue-200",
    },
    green: {
      bg: darkMode ? "bg-green-900/30" : "bg-green-100",
      text: darkMode ? "text-green-400" : "text-green-600",
      border: darkMode ? "border-green-800" : "border-green-200",
    },
    purple: {
      bg: darkMode ? "bg-purple-900/30" : "bg-purple-100",
      text: darkMode ? "text-purple-400" : "text-purple-600",
      border: darkMode ? "border-purple-800" : "border-purple-200",
    },
  };

  const filterButtons = [
    { id: "all", label: "Tout", count: timeline.length },
    { id: "consultation", label: "Consultations", count: timeline.filter(i => i.type === "consultation").length },
    { id: "prescription", label: "Prescriptions", count: timeline.filter(i => i.type === "prescription").length },
    { id: "labo", label: "Labos", count: timeline.filter(i => i.type === "labo").length },
  ];

  return (
    <div className="mt-6">
      {/* FILTRES */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFiltre(btn.id)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition
              ${filtre === btn.id
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {btn.label} ({btn.count})
          </button>
        ))}
      </div>

      {/* TIMELINE */}
      {filteredTimeline.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
          darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
        }`}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">Aucun historique trouvé</p>
          <p className="text-sm mt-1">Les événements médicaux apparaîtront ici</p>
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

          <div className="space-y-4">
            {filteredTimeline.map((item) => {
              const Icon = item.icon;
              const colors = colorMap[item.color];
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Icône sur la timeline */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                    <Icon size={18} />
                  </div>

                  {/* Carte */}
                  <div
                    className={`flex-1 border rounded-xl p-4 transition cursor-pointer
                      ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-750" : "bg-white border-gray-200 hover:shadow-md"}`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                            {item.title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text}`}>
                            {item.type === "consultation" ? "Consultation" : item.type === "prescription" ? "Prescription" : "Labo"}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {item.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs flex-shrink-0">
                        <CalendarDays size={12} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                        <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{item.date}</span>
                      </div>
                    </div>

                    {/* Contenu expandable */}
                    {isExpanded && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                        {item.description && (
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {item.description}
                          </p>
                        )}
                        {item.diagnosis && (
                          <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                            <p className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
                              Diagnostic
                            </p>
                            <p className={`text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                              {item.diagnosis}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-2">
                      {isExpanded ? (
                        <ChevronUp size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      ) : (
                        <ChevronDown size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}