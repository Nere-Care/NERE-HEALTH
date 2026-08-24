import { useState } from "react";
import { API_BASE_URL } from "../../../services/apiClient";
import {
  User,
  Droplets,
  CalendarDays,
  Activity,
  AlertTriangle,
  Pill,
  Apple,
  Syringe,
  Baby,
  Heart,
  Shield,
  FileText,
  Clock,
  Download,
  Eye,
  Stethoscope,
  ClipboardList,
  BadgeCheck,
  Scissors,
  RefreshCw,
  X,
} from "lucide-react";

function resolveDocUrl(url) {
  if (!url) return '#';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}



const DOC_TYPE_LABELS = {
  ordonnance_scannee: "Ordonnance de médicaments",
  compte_rendu_consultation: "Compte rendu de consultation",
  carnet_vaccination: "Carnet de vaccination",
  certificat_medical: "Certificat médical",
  resultat_labo: "Résultat de laboratoire",
  imagerie_radio: "Imagerie / Radio",
  imagerie_echographie: "Échographie",
  imagerie_scanner: "Scanner",
  imagerie_irm: "IRM",
  mammographie: "Mammographie",
};

const DOC_TYPE_ICONS = {
  ordonnance_scannee: Pill,
  compte_rendu_consultation: ClipboardList,
  carnet_vaccination: Syringe,
  certificat_medical: BadgeCheck,
  resultat_labo: Activity,
  imagerie_radio: FileText,
  imagerie_echographie: FileText,
  imagerie_scanner: FileText,
  imagerie_irm: FileText,
  mammographie: FileText,
};

const DOC_TYPE_COLORS = {
  ordonnance_scannee: "bg-blue-100 text-blue-700",
  compte_rendu_consultation: "bg-purple-100 text-purple-700",
  carnet_vaccination: "bg-green-100 text-green-700",
  certificat_medical: "bg-orange-100 text-orange-700",
  resultat_labo: "bg-cyan-100 text-cyan-700",
  imagerie_radio: "bg-gray-100 text-gray-700",
  imagerie_echographie: "bg-gray-100 text-gray-700",
  imagerie_scanner: "bg-gray-100 text-gray-700",
  imagerie_irm: "bg-gray-100 text-gray-700",
  mammographie: "bg-gray-100 text-gray-700",
};

export default function PatientInfo({ selectedPatient, darkMode, onOrdonnanceCreated }) {
  const [previewDoc, setPreviewDoc] = useState(null);

  if (!selectedPatient) return null;

  const consultations = Array.isArray(selectedPatient?.consultations)
    ? selectedPatient.consultations
    : [];

  const ordonnances = Array.isArray(selectedPatient?.ordonnances)
    ? selectedPatient.ordonnances.filter(
        (o) => o.type_ordonnance !== "biologie" && o.type_ordonnance !== "imagerie"
      )
    : [];

  const documents = Array.isArray(selectedPatient?.documents)
    ? selectedPatient.documents
    : [];

  const totalConsultations = consultations.length;
  const totalPrescriptions = ordonnances.length;
  const totalLabResults = consultations.reduce(
    (acc, c) => acc + (Array.isArray(c?.labResults) ? c.labResults.length : 0),
    0
  );

  const lastVisit = selectedPatient?.lastVisit || "Aucune donnée";

  const antecedents = selectedPatient?.antecedents || [];

  const habitudes = selectedPatient?.habitudes || {
    alimentation: "",
    tabac: "",
    alcool: "",
    activitePhysique: "",
    sommeil: "",
    allergies: [],
  };

  const vaccins = selectedPatient?.vaccins || [];
  const operations = selectedPatient?.operations || [];
  const traitements_chroniques = selectedPatient?.traitements_chroniques || [];

  const isFemmeEnceinte =
    selectedPatient?.gender === "Female" &&
    selectedPatient?.age >= 15 &&
    selectedPatient?.age <= 50 &&
    selectedPatient?.isPregnant === true;

  const suiviGrossesse = selectedPatient?.suiviGrossesse || null;

  const sectionClass = `p-4 border rounded-xl transition ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`;

  const titleClass = `font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"
    }`;

  const docsByType = {};
  documents.forEach((d) => {
    const t = d.type || "autre";
    if (!docsByType[t]) docsByType[t] = [];
    docsByType[t].push(d);
  });

  const docsAllTypes = Object.keys(docsByType).filter((t) => docsByType[t]?.length > 0);

  return (
    <div
      className={`p-5 border mt-6 rounded-xl text-sm space-y-6 transition ${darkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-700 border-gray-200"
        }`}
    >
      <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
        Informations du patient
      </h3>

      {/* ========== INFOS PRINCIPALES ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Âge" value={selectedPatient?.age ?? "N/A"} darkMode={darkMode} />
        <InfoRow label="Genre" value={selectedPatient?.gender || "N/A"} darkMode={darkMode} />
        <InfoRow label="Groupe sanguin" value={selectedPatient?.bloodType || "N/A"} darkMode={darkMode} icon={<Droplets className="w-3 h-3 text-red-500" />} />
        <InfoRow
          label="Niveau de risque"
          value={selectedPatient?.age > 50 ? "Élevé" : selectedPatient?.age > 35 ? "Moyen" : "Faible"}
          darkMode={darkMode}
          icon={<AlertTriangle className="w-3 h-3 text-orange-500" />}
        />
        <InfoRow label="Statut" value="Patient actif" darkMode={darkMode} />
        <InfoRow label="Dernière visite" value={lastVisit} darkMode={darkMode} icon={<CalendarDays className="w-3 h-3 text-blue-500" />} />
      </div>

      {/* ========== RÉSUMÉ MÉDICAL ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Activity size={16} className="text-blue-500" />
          Résumé médical
        </p>
        <div className="space-y-1">
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Consultations : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalConsultations}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Ordonnances émises : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalPrescriptions}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Documents médicaux : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{documents.length}</span>
          </p>
        </div>
      </div>

      {/* ========== ANTECÉDENTS MÉDICAUX ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Heart size={16} className="text-red-500" />
          Antécédents médicaux
        </p>

        {antecedents.length > 0 ? (
          <div className="space-y-2">
            {antecedents.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.statut === "chronique"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-green-100 text-green-600"
                  }`}>
                  {a.type === "Chirurgie" ? (
                    <Activity size={14} />
                  ) : (
                    <Heart size={14} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {a.nom}
                    </p>
                    {a.statut && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.statut === "chronique"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                        }`}>
                        {a.statut}
                      </span>
                    )}
                  </div>
                  {a.date && (
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {a.type} • {a.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun antécédent enregistré
          </p>
        )}
      </div>

      {/* ========== ANTECÉDENTS FAMILIAUX ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Heart size={16} className="text-pink-500" />
          Antécédents familiaux
        </p>
        {selectedPatient?.antecedentsFamiliaux ? (
          <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {selectedPatient.antecedentsFamiliaux}
          </p>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun antécédent familial renseigné
          </p>
        )}
      </div>

      {/* ========== HABITUDES DE VIE ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Apple size={16} className="text-green-500" />
          Habitudes de vie & alimentaires
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HabitItem label="Alimentation" value={habitudes.alimentation || "Non renseigné"} darkMode={darkMode} />
          <HabitItem label="Tabac" value={habitudes.tabac || "Non renseigné"} darkMode={darkMode} />
          <HabitItem label="Alcool" value={habitudes.alcool || "Non renseigné"} darkMode={darkMode} />
          <HabitItem label="Activité physique" value={habitudes.activitePhysique || "Non renseigné"} darkMode={darkMode} />
          <HabitItem label="Sommeil" value={habitudes.sommeil || "Non renseigné"} darkMode={darkMode} />
        </div>

        {habitudes.allergies && habitudes.allergies.length > 0 && (
          <div className="mt-4">
            <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Allergies connues
            </p>
            <div className="flex flex-wrap gap-2">
              {habitudes.allergies.map((allergie, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium"
                >
                  ⚠️ {allergie}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== VACCINS ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Syringe size={16} className="text-purple-500" />
          Vaccins effectués
        </p>

        {vaccins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Vaccin</th>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date</th>
                  <th className={`text-left py-2 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Rappel</th>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {vaccins.map((v, idx) => {
                  const dateAdm = v.date ? new Date(v.date) : null;
                  const dateRappel = v.date_rappel ? new Date(v.date_rappel) : null;
                  const now = new Date();
                  let statut = "complet";
                  if (dateRappel) {
                    statut = dateRappel < now ? "en_retard" : "à_jour";
                  }
                  return (
                    <tr key={v.id || idx} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                      <td className={`py-2.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {v.nom || v.vaccin || "—"}
                        {v.maladie && <span className={`block text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{v.maladie}</span>}
                      </td>
                      <td className={`py-2.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {dateAdm ? dateAdm.toLocaleDateString('fr-FR') : "—"}
                      </td>
                      <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {dateRappel ? dateRappel.toLocaleDateString('fr-FR') : "—"}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${
                          statut === "à_jour"
                            ? "bg-green-100 text-green-700"
                            : statut === "en_retard"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}>
                          {statut === "à_jour" ? "À jour" : statut === "en_retard" ? "En retard" : "Complet"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun vaccin enregistré
          </p>
        )}
      </div>

      {/* ========== OPÉRATIONS CHIRURGICALES ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Scissors size={16} className="text-orange-500" />
          Opérations chirurgicales
        </p>
        {operations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Opération</th>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date</th>
                  <th className={`text-left py-2 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Chirurgien</th>
                  <th className={`text-left py-2 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Hôpital</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`py-2.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {op.nom || "—"}
                      {op.complications && (
                        <span className="block text-[10px] text-red-500">⚠ {op.complications}</span>
                      )}
                    </td>
                    <td className={`py-2.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {op.date ? new Date(op.date).toLocaleDateString('fr-FR') : "—"}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {op.chirurgien || "—"}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {op.hopital || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucune opération enregistrée
          </p>
        )}
      </div>

      {/* ========== TRAITEMENTS CHRONIQUES ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <RefreshCw size={16} className="text-blue-500" />
          Traitements réguliers
        </p>
        {traitements_chroniques.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médicament</th>
                  <th className={`text-left py-2 font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Dose</th>
                  <th className={`text-left py-2 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Fréquence</th>
                  <th className={`text-left py-2 font-semibold hidden sm:table-cell ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Depuis</th>
                </tr>
              </thead>
              <tbody>
                {traitements_chroniques.map((t, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`py-2.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {t.nom || "—"}
                      {t.prescripteur && (
                        <span className={`block text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Prescrit par {t.prescripteur}
                        </span>
                      )}
                    </td>
                    <td className={`py-2.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {t.dose || "—"}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {t.frequence || "—"}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {t.date_debut ? new Date(t.date_debut).toLocaleDateString('fr-FR') : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun traitement régulier enregistré
          </p>
        )}
      </div>

      {/* ========== SUIVI GROSSESSE ========== */}

      {isFemmeEnceinte && suiviGrossesse && (
        <div className={`p-4 border rounded-xl transition ${darkMode ? "bg-pink-900/20 border-pink-800" : "bg-pink-50 border-pink-200"
          }`}>
          <p className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-pink-300" : "text-pink-700"}`}>
            <Baby size={16} />
            Suivi de grossesse
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <GrossesseStat label="Semaines d'aménorrhée" value={`${suiviGrossesse.semainesAmenorrhee} SA`} darkMode={darkMode} />
            <GrossesseStat label="Terme prévu" value={new Date(suiviGrossesse.termePrévu).toLocaleDateString('fr-FR')} darkMode={darkMode} />
            <GrossesseStat label="Visites prénatales" value={suiviGrossesse.nombreVisites} darkMode={darkMode} />
            <GrossesseStat label="Prochaine visite" value={new Date(suiviGrossesse.prochaineVisite).toLocaleDateString('fr-FR')} darkMode={darkMode} />
            <GrossesseStat label="Poids actuel" value={`${suiviGrossesse.poids} kg`} darkMode={darkMode} />
            <GrossesseStat label="Tension" value={suiviGrossesse.tension} darkMode={darkMode} />
          </div>

          {suiviGrossesse.observations && (
            <div className={`p-3 rounded-lg ${darkMode ? "bg-pink-900/30" : "bg-white"}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${darkMode ? "text-pink-300" : "text-pink-700"}`}>
                Observations
              </p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {suiviGrossesse.observations}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========== ORDONNANCES ========== */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-3">
          <p className={titleClass} style={{ marginBottom: 0 }}>
            <Pill size={16} className="text-blue-500" />
            Ordonnances de médicaments
          </p>
        </div>

        {ordonnances.length > 0 ? (
          <div className="space-y-3">
            {ordonnances.map((o) => (
              <div
                key={o.id}
                className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Pill size={14} className="text-blue-400" />
                    <span className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                      Ordonnance {o.numero}
                    </span>
                    {!o.medecin_id && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${darkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                        <User size={10} />
                        Par le patient
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {o.date ? new Date(o.date).toLocaleDateString('fr-FR') : ""}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${o.statut === "active" ? "bg-green-100 text-green-700"
                        : o.statut === "utilisee" ? "bg-blue-100 text-blue-700"
                          : o.statut === "expiree" ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }`}>
                      {o.statut}
                    </span>
                  </div>
                </div>
                {/* Medecin + Motif + Consultation liee */}
                <div className="flex flex-wrap gap-3 mb-2">
                  {o.medecin_nom_libre && (
                    <span className={`text-xs inline-flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <User size={12} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      {o.medecin_nom_libre}
                    </span>
                  )}
                  {o.motif && (
                    <span className={`text-xs inline-flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif :</span> {o.motif}
                    </span>
                  )}
                  {o.consultation_id && (() => {
                    const cons = consultations.find((c) => c.id === o.consultation_id);
                    return cons ? (
                      <span className={`text-xs inline-flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Consultation :</span> {cons.date || cons.created_at?.slice(0, 10)} — {cons.reason || cons.motif || ""}
                      </span>
                    ) : null;
                  })()}
                </div>
                {o.notes && (
                  <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {o.notes}
                  </p>
                )}
                {o.lignes && o.lignes.length > 0 && (
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
                        {o.lignes.map((l, i) => (
                          <tr key={i} className={`border-b ${darkMode ? "border-gray-600" : "border-gray-100"}`}>
                            <td className={`py-1.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                              {l.medicament_nom}
                            </td>
                            <td className={`py-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {l.dosage} ({l.forme})
                            </td>
                            <td className={`py-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {l.posologie}
                            </td>
                            <td className={`py-1.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {l.duree_jours} jour{l.duree_jours > 1 ? "s" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucune ordonnance enregistrée
          </p>
        )}
      </div>

      {/* ========== DOCUMENTS MÉDICAUX ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <FileText size={16} className="text-indigo-500" />
          Documents médicaux
        </p>

        {documents.length > 0 ? (
          <div className="space-y-4">
            {docsAllTypes.map((type) => {
              const Icon = DOC_TYPE_ICONS[type] || FileText;
              const colorClass = DOC_TYPE_COLORS[type] || "bg-gray-100 text-gray-700";
              return (
                <div key={type}>
                  <p className={`text-xs font-semibold uppercase mb-2 flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <Icon size={14} />
                    {DOC_TYPE_LABELS[type] || type}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${colorClass}`}>
                      {docsByType[type].length}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {docsByType[type].map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                            {d.nom}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {d.date && (
                              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {new Date(d.date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                            {d.description && (
                              <span className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {d.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {d.url && (
                          <div className="flex items-center gap-1 ml-3">
                            <button
                              onClick={() => setPreviewDoc(d)}
                              title="Visualiser"
                              className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-600 text-green-400" : "hover:bg-green-50 text-green-600"
                                }`}
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={resolveDocUrl(d.url)}
                              download={d.nom || "document"}
                              title="Télécharger"
                              className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-600 text-blue-400" : "hover:bg-blue-50 text-blue-600"
                                }`}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun document médical disponible
          </p>
        )}
      </div>

      {/* ========== INDICATEURS RAPIDES ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={sectionClass}>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Fréquence des consultations</p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalConsultations > 3 ? "Fréquent" : "Normal"}
          </p>
        </div>
        <div className={sectionClass}>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Niveau de suivi</p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalLabResults > 2 ? "Élevé" : "Standard"}
          </p>
        </div>
      </div>

      {/* ========== MODAL APERÇU DOCUMENT ========== */}
      {previewDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className={`relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-sm truncate">{previewDoc.nom || "Document médical"}</p>
                <p className="text-xs text-gray-400">{DOC_TYPE_LABELS[previewDoc.type] || previewDoc.type || "Autre"}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/10 min-h-[350px]">
              {previewDoc.url?.startsWith('data:image/') || previewDoc.nom?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={resolveDocUrl(previewDoc.url)} alt={previewDoc.nom} className="max-w-full max-h-[72vh] rounded-lg object-contain" />
              ) : previewDoc.url?.startsWith('data:application/pdf') || previewDoc.nom?.match(/\.pdf$/i) ? (
                <iframe src={resolveDocUrl(previewDoc.url)} className="w-full h-[72vh] rounded-lg" title="Aperçu PDF" />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aperçu direct non disponible</p>
                  <a
                    href={resolveDocUrl(previewDoc.url)}
                    download={previewDoc.nom || "document"}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    <Download size={14} /> Télécharger le document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ========== SOUS-COMPOSANTS ==========

function InfoRow({ label, value, darkMode, icon }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{label}:</span>
      {icon}
      <span className={darkMode ? "text-gray-200" : "text-gray-800"}>{value}</span>
    </p>
  );
}

function HabitItem({ label, value, darkMode }) {
  return (
    <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${darkMode ? "text-white" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function GrossesseStat({ label, value, darkMode }) {
  return (
    <div className={`p-2.5 rounded-lg ${darkMode ? "bg-pink-900/30" : "bg-white"}`}>
      <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
        {label}
      </p>
      <p className={`text-sm font-bold mt-0.5 ${darkMode ? "text-white" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
