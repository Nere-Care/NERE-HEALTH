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
} from "lucide-react";

export default function PatientInfo({ selectedPatient, darkMode }) {
  if (!selectedPatient) return null;

  const consultations = Array.isArray(selectedPatient?.consultations)
    ? selectedPatient.consultations
    : [];

  const totalConsultations = consultations.length;
  const totalPrescriptions = consultations.reduce(
    (acc, c) => acc + (Array.isArray(c?.prescriptions) ? c.prescriptions.length : 0),
    0
  );
  const totalLabResults = consultations.reduce(
    (acc, c) => acc + (Array.isArray(c?.labResults) ? c.labResults.length : 0),
    0
  );

  const lastVisit = selectedPatient?.lastVisit || "No data available";

  // Données simulées (à remplacer par les vraies données du patient)
  const antecedents = selectedPatient?.antecedents || [
    { id: 1, type: "Maladie", nom: "Hypertension artérielle", date: "2020", statut: "chronique" },
    { id: 2, type: "Chirurgie", nom: "Appendicectomie", date: "2015", statut: "guéri" },
  ];

  const habitudes = selectedPatient?.habitudes || {
    alimentation: "Équilibrée",
    tabac: "Non",
    alcool: "Occasionnel",
    activitePhysique: "3x/semaine",
    sommeil: "7-8h/nuit",
    allergies: ["Arachides", "Latex"],
  };

  const vaccins = selectedPatient?.vaccins || [
    { id: 1, nom: "COVID-19 (3ème dose)", date: "2023-03-15", rappel: "2024-03-15", statut: "à_jour" },
    { id: 2, nom: "Grippe saisonnière", date: "2023-10-20", rappel: "2024-10-20", statut: "à_jour" },
    { id: 3, nom: "Tétanos", date: "2018-05-10", rappel: "2023-05-10", statut: "en_retard" },
    { id: 4, nom: "Hépatite B", date: "2010-01-15", rappel: null, statut: "complet" },
  ];

  // Détection femme enceinte (femme, âge 15-50 ans, flag isPregnant)
  const isFemmeEnceinte =
    selectedPatient?.gender === "Female" &&
    selectedPatient?.age >= 15 &&
    selectedPatient?.age <= 50 &&
    selectedPatient?.isPregnant === true;

  const suiviGrossesse = selectedPatient?.suiviGrossesse || {
    semainesAmenorrhee: 24,
    termePrévu: "2026-09-15",
    nombreVisites: 4,
    prochaineVisite: "2026-06-20",
    poids: 68,
    tension: "12/8",
    groupeSanguin: "O+",
    observations: "Grossesse évolutive sans complication. Échographie T2 prévue.",
  };

  // Section styling
  const sectionClass = `p-4 border rounded-xl transition ${
    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }`;

  const titleClass = `font-semibold mb-3 flex items-center gap-2 ${
    darkMode ? "text-white" : "text-gray-900"
  }`;

  return (
    <div
      className={`p-5 border mt-6 rounded-xl text-sm space-y-6 transition ${
        darkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-700 border-gray-200"
      }`}
    >
      <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
        Patient Information
      </h3>

      {/* ========== INFOS PRINCIPALES ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="ID" value={selectedPatient?.patientId || "N/A"} darkMode={darkMode} />
        <InfoRow label="Age" value={selectedPatient?.age ?? "N/A"} darkMode={darkMode} />
        <InfoRow label="Gender" value={selectedPatient?.gender || "N/A"} darkMode={darkMode} />
        <InfoRow label="Blood Type" value={selectedPatient?.bloodType || "N/A"} darkMode={darkMode} icon={<Droplets className="w-3 h-3 text-red-500" />} />
        <InfoRow
          label="Risk Level"
          value={selectedPatient?.age > 50 ? "High" : selectedPatient?.age > 35 ? "Medium" : "Low"}
          darkMode={darkMode}
          icon={<AlertTriangle className="w-3 h-3 text-orange-500" />}
        />
        <InfoRow label="Status" value="Active Patient" darkMode={darkMode} />
      </div>

      {/* ========== RÉSUMÉ MÉDICAL ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Activity size={16} className="text-blue-500" />
          Medical Summary
        </p>
        <div className="space-y-1">
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Total consultations: <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalConsultations}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Prescriptions issued: <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalPrescriptions}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Lab tests performed: <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalLabResults}</span>
          </p>
        </div>
      </div>

      {/* ========== DERNIÈRE VISITE ========== */}
      <div className={sectionClass}>
        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Last Visit</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{lastVisit}</p>
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
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  a.statut === "chronique"
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      a.statut === "chronique"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {a.statut}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {a.type} • {a.date}
                  </p>
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

      {/* ========== HABITUDES DE VIE ========== */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Apple size={16} className="text-green-500" />
          Habitudes de vie & alimentaires
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HabitItem label="Alimentation" value={habitudes.alimentation} darkMode={darkMode} />
          <HabitItem label="Tabac" value={habitudes.tabac} darkMode={darkMode} />
          <HabitItem label="Alcool" value={habitudes.alcool} darkMode={darkMode} />
          <HabitItem label="Activité physique" value={habitudes.activitePhysique} darkMode={darkMode} />
          <HabitItem label="Sommeil" value={habitudes.sommeil} darkMode={darkMode} />
        </div>

        {/* Allergies */}
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
                {vaccins.map((v) => (
                  <tr key={v.id} className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`py-2.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {v.nom}
                    </td>
                    <td className={`py-2.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {new Date(v.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {v.rappel ? new Date(v.rappel).toLocaleDateString('fr-FR') : "—"}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${
                        v.statut === "à_jour"
                          ? "bg-green-100 text-green-700"
                          : v.statut === "en_retard"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {v.statut === "à_jour" ? "À jour" : v.statut === "en_retard" ? "En retard" : "Complet"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun vaccin enregistré
          </p>
        )}
      </div>

      {/* ========== SUIVI GROSSESSE (si applicable) ========== */}
      {isFemmeEnceinte && (
        <div className={`p-4 border rounded-xl transition ${
          darkMode ? "bg-pink-900/20 border-pink-800" : "bg-pink-50 border-pink-200"
        }`}>
          <p className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-pink-300" : "text-pink-700"}`}>
            <Baby size={16} />
            Suivi de grossesse
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <GrossesseStat
              label="Semaines d'aménorrhée"
              value={`${suiviGrossesse.semainesAmenorrhee} SA`}
              darkMode={darkMode}
            />
            <GrossesseStat
              label="Terme prévu"
              value={new Date(suiviGrossesse.termePrévu).toLocaleDateString('fr-FR')}
              darkMode={darkMode}
            />
            <GrossesseStat
              label="Visites prénatales"
              value={suiviGrossesse.nombreVisites}
              darkMode={darkMode}
            />
            <GrossesseStat
              label="Prochaine visite"
              value={new Date(suiviGrossesse.prochaineVisite).toLocaleDateString('fr-FR')}
              darkMode={darkMode}
            />
            <GrossesseStat
              label="Poids actuel"
              value={`${suiviGrossesse.poids} kg`}
              darkMode={darkMode}
            />
            <GrossesseStat
              label="Tension"
              value={suiviGrossesse.tension}
              darkMode={darkMode}
            />
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

      {/* ========== INDICATEURS RAPIDES ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={sectionClass}>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Consultation Load</p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalConsultations > 3 ? "Frequent" : "Normal"}
          </p>
        </div>
        <div className={sectionClass}>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Monitoring Level</p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalLabResults > 2 ? "High" : "Standard"}
          </p>
        </div>
      </div>
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