import { useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Activity,
  Pill,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";

export default function PatientHistory({ selectedPatient, consultations, darkMode }) {
  const [filtre, setFiltre] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  if (!selectedPatient) return null;

  const documents = Array.isArray(selectedPatient?.documents) ? selectedPatient.documents : [];
  const ordonnances = Array.isArray(selectedPatient?.ordonnances) ? selectedPatient.ordonnances : [];

  const docTypesPrincipaux = ["ordonnance_scannee", "compte_rendu_consultation", "carnet_vaccination", "certificat_medical"];

  const DOC_LABELS = {
    resultat_labo: "Résultat de laboratoire",
    imagerie_radio: "Imagerie / Radio",
    imagerie_echographie: "Échographie",
    imagerie_scanner: "Scanner",
    imagerie_irm: "IRM",
    mammographie: "Mammographie",
  };

  // Build flat chronological timeline
  const timeline = [];

  function displayDate(raw) {
    if (!raw) return "";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return raw;
    }
  }

  // Consultations
  consultations.forEach((c) => {
    timeline.push({
      id: `consult-${c.id}`,
      type: "consultation",
      sortDate: c.dateRaw || c.date || "",
      date: displayDate(c.dateRaw || c.date),
      time: c.time,
      title: c.reason || "Consultation",
      subtitle: c.doctor || "",
      description: c.notes || "",
      diagnosis: c.diagnosis || "",
      anamnese: c.anamnese || "",
      examen_clinique: c.examen_clinique || "",
      code_cim10: c.code_cim10 || "",
      treatment: c.treatment || "",
      demandes_labo: c.demandes_labo || "",
      instructions_patient: c.instructions_patient || "",
      suivi_necessaire: c.suivi_necessaire || false,
      date_prochain_rdv: c.date_prochain_rdv || "",
      statut: c.statut || "",
      icon: Activity,
      color: "blue",
    });

    if (c.prescriptions && c.prescriptions.length > 0) {
      c.prescriptions.forEach((p) => {
        timeline.push({
          id: `presc-${p.id}`,
          type: "prescription",
          sortDate: c.dateRaw || c.date || "",
          date: displayDate(c.dateRaw || c.date),
          time: c.time,
          title: p.name,
          subtitle: `${p.dosage || ""} — ${c.doctor || ""}`.trim(),
          description: `${p.frequency || ""} - ${p.duration || ""}`,
          doctor: c.doctor || "",
          icon: Pill,
          color: "green",
        });
      });
    }

    if (c.labResults && c.labResults.length > 0) {
      c.labResults.forEach((l) => {
        timeline.push({
          id: `lab-${l.id}`,
          type: "labo",
          sortDate: c.dateRaw || c.date || "",
          date: displayDate(c.dateRaw || c.date),
          time: c.time,
          title: l.title,
          subtitle: c.doctor || "",
          description: l.description || "",
          icon: FileText,
          color: "purple",
        });
      });
    }
  });

  // Ordonnances — categorize by type_ordonnance
  ordonnances.forEach((o) => {
    const isImagerie = o.type_ordonnance === "imagerie";
    const isBiologie = o.type_ordonnance === "biologie";
    const lignes = (o.lignes || []).map((l) => `${l.medicament_nom} ${l.dosage || ""}`).join(", ");
    const isPatientCreated = !o.medecin_id;
    const doctorName = o.medecin_nom_libre || "";

    timeline.push({
      id: `ord-${o.id}`,
      type: isImagerie || isBiologie ? "labo" : "prescription",
      sortDate: o.date || "",
      date: displayDate(o.date),
      time: "",
      title: `Ordonnance ${o.numero}`,
      subtitle: doctorName || lignes || o.motif || "Ordonnance",
      description: o.notes || "",
      isPatientCreated,
      motif: o.motif || "",
      lignes: o.lignes || [],
      icon: Pill,
      color: isImagerie ? "purple" : isBiologie ? "purple" : "green",
    });
  });

  // Documents non-principaux
  documents.filter((d) => !docTypesPrincipaux.includes(d.type)).forEach((d) => {
    timeline.push({
      id: `doc-${d.id}`,
      type: "labo",
      sortDate: d.date || "",
      date: displayDate(d.date),
      time: "",
      title: DOC_LABELS[d.type] || d.type,
      subtitle: d.nom,
      description: d.description || "",
      icon: FileText,
      color: "purple",
    });
  });

  // Filter
  const filteredTimeline = timeline.filter((item) => {
    if (filtre === "all") return true;
    return item.type === filtre;
  });

  // Sort by raw date (most recent first)
  filteredTimeline.sort((a, b) => {
    const da = new Date(a.sortDate);
    const db = new Date(b.sortDate);
    const ta = !isNaN(da.getTime()) ? da.getTime() : 0;
    const tb = !isNaN(db.getTime()) ? db.getTime() : 0;
    return tb - ta;
  });

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
          <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

          <div className="space-y-4">
            {filteredTimeline.map((item) => {
              const Icon = item.icon;
              const colors = colorMap[item.color];
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="relative flex gap-4">
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                    <Icon size={18} />
                  </div>

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
                          {item.isPatientCreated && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${darkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                              <User size={10} />
                              Par le patient
                            </span>
                          )}
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

                    {isExpanded && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                        {item.type === "consultation" && (
                          <>
                            {item.diagnosis && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-blue-400" : "text-blue-700"}`}>Diagnostic</p>
                                <p className={`text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{item.diagnosis}</p>
                              </div>
                            )}
                            {item.anamnese && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Anamnèse</p>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.anamnese}</p>
                              </div>
                            )}
                            {item.examen_clinique && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Examen clinique</p>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.examen_clinique}</p>
                              </div>
                            )}
                            {item.treatment && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-green-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-green-400" : "text-green-700"}`}>Plan de traitement</p>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.treatment}</p>
                              </div>
                            )}
                            {item.demandes_labo && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-purple-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-purple-400" : "text-purple-700"}`}>Demandes labo</p>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.demandes_labo}</p>
                              </div>
                            )}
                            {item.instructions_patient && (
                              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-amber-50"}`}>
                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? "text-amber-400" : "text-amber-700"}`}>Instructions patient</p>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.instructions_patient}</p>
                              </div>
                            )}
                            {item.date_prochain_rdv && (
                              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Prochain RDV : {displayDate(item.date_prochain_rdv)}
                              </p>
                            )}
                          </>
                        )}
                        {item.type === "prescription" && item.lignes && item.lignes.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                  <th className={`text-left py-1 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médicament</th>
                                  <th className={`text-left py-1 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Dosage</th>
                                  <th className={`text-left py-1 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Posologie</th>
                                  <th className={`text-left py-1 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Durée</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.lignes.map((l, i) => (
                                  <tr key={i} className={`border-b ${darkMode ? "border-gray-600" : "border-gray-100"}`}>
                                    <td className={`py-1.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{l.medicament_nom}</td>
                                    <td className={`py-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{l.dosage} ({l.forme})</td>
                                    <td className={`py-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{l.posologie}</td>
                                    <td className={`py-1.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{l.duree_jours} jour{l.duree_jours > 1 ? "s" : ""}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {item.type === "prescription" && item.motif && !item.lignes?.length && (
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Motif : {item.motif}</p>
                        )}
                        {item.description && item.type !== "consultation" && (
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.description}</p>
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
