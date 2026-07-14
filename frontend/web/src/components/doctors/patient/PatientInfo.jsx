import {
  User, Droplets, CalendarDays, Activity, AlertTriangle,
  Pill, Apple, Syringe, Baby, Heart, Shield, FileText, Clock,
} from "lucide-react";

// ✅ Fonction helper : convertit objet/string en texte lisible
function formatValeur(valeur) {
  if (valeur === null || valeur === undefined) return "Non renseigné";
  if (typeof valeur === "string") return valeur || "Non renseigné";
  if (typeof valeur === "number") return String(valeur);
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  
  // Si c'est un objet, formater intelligemment
  if (typeof valeur === "object") {
    // Cas spécial : {actif: "...", consommation: "..."}
    if (valeur.actif !== undefined) {
      const actif = valeur.actif;
      const conso = valeur.consommation;
      if (conso && conso !== "0" && conso !== "") {
        return `${actif} (${conso})`;
      }
      return actif || "Non renseigné";
    }
    
    // Cas général : concaténer les valeurs
    const entries = Object.entries(valeur).filter(([k, v]) => v !== null && v !== undefined && v !== "");
    if (entries.length === 0) return "Non renseigné";
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
  }
  
  return String(valeur);
}

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
    (acc, c) => acc + (Array.isArray(c?.labResults) || Array.isArray(c?.documents) ? (c.labResults || c.documents).length : 0),
    0
  );

  // ✅ Adapter le champ lastVisit selon le backend
  const lastVisit = selectedPatient?.derniere_visite 
    || selectedPatient?.lastVisit 
    || "Aucune visite";

  // ✅ Antécédents : construire depuis les données backend
  const antecedents = [];
  if (selectedPatient?.antecedents_personnels) {
    antecedents.push({ 
      id: 1, 
      type: "Personnel", 
      nom: formatValeur(selectedPatient.antecedents_personnels), 
      statut: "chronique" 
    });
  }
  if (selectedPatient?.antecedents_chirurgicaux) {
    antecedents.push({ 
      id: 2, 
      type: "Chirurgie", 
      nom: formatValeur(selectedPatient.antecedents_chirurgicaux), 
      statut: "gueri" 
    });
  }
  if (selectedPatient?.antecedents_familiaux) {
    antecedents.push({ 
      id: 3, 
      type: "Familial", 
      nom: formatValeur(selectedPatient.antecedents_familiaux), 
      statut: "surveille" 
    });
  }

  // ✅ Habitudes : utiliser formatValeur pour chaque champ
  const habitudes = selectedPatient?.habitudes_vie || {};
  const habitudesAffichage = {
    alimentation: formatValeur(habitudes.alimentation),
    tabac: formatValeur(habitudes.tabac),
    alcool: formatValeur(habitudes.alcool),
    activitePhysique: formatValeur(habitudes.activite_physique || habitudes.activitePhysique),
    sommeil: formatValeur(habitudes.sommeil),
  };

  // ✅ Allergies : peut être array de strings OU array d'objets
  const allergies = Array.isArray(selectedPatient?.allergies) 
    ? selectedPatient.allergies.map(a => typeof a === 'string' ? a : (a.nom || a.allergie || formatValeur(a)))
    : [];

  // ✅ Vaccins : mapper depuis le backend
  const vaccins = (Array.isArray(selectedPatient?.vaccinations) ? selectedPatient.vaccinations : []).map((v, i) => ({
    id: v.id || i,
    nom: v.vaccin || v.nom || "Vaccin",
    date: v.date || "",
    rappel: v.prochain_rappel || v.rappel || null,
    statut: v.statut || "complet",
  }));

  // ✅ Adapter les champs selon le backend
  const patientId = selectedPatient?.numero_patient || selectedPatient?.patientId || "N/A";
  const age = selectedPatient?.age;
  const gender = selectedPatient?.sexe === "M" ? "Male" 
               : selectedPatient?.sexe === "F" ? "Female" 
               : selectedPatient?.gender || "N/A";
  const bloodType = selectedPatient?.groupe_sanguin || selectedPatient?.bloodType || "N/A";

  // Détection femme enceinte
  const isFemmeEnceinte =
    (selectedPatient?.sexe === "F" || selectedPatient?.gender === "Female") &&
    age >= 15 && age <= 50 &&
    selectedPatient?.est_enceinte === true;

  // Suivi grossesse : données par défaut si pas disponibles
  const suiviGrossesse = selectedPatient?.suivi_grossesse || selectedPatient?.suiviGrossesse || null;

  const sectionClass = `p-4 border rounded-xl transition ${
    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }`;

  const titleClass = `font-semibold mb-3 flex items-center gap-2 ${
    darkMode ? "text-white" : "text-gray-900"
  }`;

  return (
    <div className={`p-5 border mt-6 rounded-xl text-sm space-y-6 transition ${
      darkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-700 border-gray-200"
    }`}>
      <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
        Informations Patient
      </h3>

      {/* INFOS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="ID" value={patientId} darkMode={darkMode} />
        <InfoRow label="Âge" value={age !== null && age !== undefined ? `${age} ans` : "N/A"} darkMode={darkMode} />
        <InfoRow label="Sexe" value={gender} darkMode={darkMode} />
        <InfoRow label="Groupe sanguin" value={bloodType} darkMode={darkMode} icon={<Droplets className="w-3 h-3 text-red-500" />} />
        <InfoRow
          label="Niveau de risque"
          value={age > 50 ? "Élevé" : age > 35 ? "Moyen" : "Faible"}
          darkMode={darkMode}
          icon={<AlertTriangle className="w-3 h-3 text-orange-500" />}
        />
        <InfoRow label="Statut" value="Patient actif" darkMode={darkMode} />
      </div>

      {/* RÉSUMÉ MÉDICAL */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Activity size={16} className="text-blue-500" />
          Résumé médical
        </p>
        <div className="space-y-1">
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Total consultations : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalConsultations}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Prescriptions émises : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalPrescriptions}</span>
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Examens réalisés : <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{totalLabResults}</span>
          </p>
        </div>
      </div>

      {/* DERNIÈRE VISITE */}
      <div className={sectionClass}>
        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Dernière visite</p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{formatValeur(lastVisit)}</p>
      </div>

      {/* ANTÉCÉDENTS */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Heart size={16} className="text-red-500" />
          Antécédents médicaux
        </p>

        {antecedents.length > 0 ? (
          <div className="space-y-2">
            {antecedents.map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  a.statut === "chronique" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                }`}>
                  {a.type === "Chirurgie" ? <Activity size={14} /> : <Heart size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      a.statut === "chronique" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                    }`}>{a.statut}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{a.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun antécédent enregistré</p>
        )}
      </div>

      {/* HABITUDES DE VIE */}
      <div className={sectionClass}>
        <p className={titleClass}>
          <Apple size={16} className="text-green-500" />
          Habitudes de vie
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HabitItem label="Alimentation" value={habitudesAffichage.alimentation} darkMode={darkMode} />
          <HabitItem label="Tabac" value={habitudesAffichage.tabac} darkMode={darkMode} />
          <HabitItem label="Alcool" value={habitudesAffichage.alcool} darkMode={darkMode} />
          <HabitItem label="Activité physique" value={habitudesAffichage.activitePhysique} darkMode={darkMode} />
          <HabitItem label="Sommeil" value={habitudesAffichage.sommeil} darkMode={darkMode} />
        </div>

        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="mt-4">
            <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Allergies connues
            </p>
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergie, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                  ⚠️ {allergie}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VACCINS */}
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
                    <td className={`py-2.5 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{v.nom}</td>
                    <td className={`py-2.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {v.date ? new Date(v.date).toLocaleDateString('fr-FR') : "—"}
                    </td>
                    <td className={`py-2.5 hidden sm:table-cell ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {v.rappel ? new Date(v.rappel).toLocaleDateString('fr-FR') : "—"}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${
                        v.statut === "a_jour" || v.statut === "à_jour" ? "bg-green-100 text-green-700"
                        : v.statut === "en_retard" ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                      }`}>
                        {v.statut === "a_jour" || v.statut === "à_jour" ? "À jour" : v.statut === "en_retard" ? "En retard" : "Complet"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun vaccin enregistré</p>
        )}
      </div>

      {/* SUIVI GROSSESSE */}
      {isFemmeEnceinte && suiviGrossesse && (
        <div className={`p-4 border rounded-xl transition ${darkMode ? "bg-pink-900/20 border-pink-800" : "bg-pink-50 border-pink-200"}`}>
          <p className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-pink-300" : "text-pink-700"}`}>
            <Baby size={16} />
            Suivi de grossesse
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <GrossesseStat label="Semaines d'aménorrhée" value={`${suiviGrossesse.semaines_amenorrhee || suiviGrossesse.semainesAmenorrhee} SA`} darkMode={darkMode} />
            <GrossesseStat label="Terme prévu" value={new Date(suiviGrossesse.terme_prevu || suiviGrossesse.termePrévu).toLocaleDateString('fr-FR')} darkMode={darkMode} />
            <GrossesseStat label="Visites prénatales" value={suiviGrossesse.nombre_visites || suiviGrossesse.nombreVisites} darkMode={darkMode} />
            <GrossesseStat label="Prochaine visite" value={new Date(suiviGrossesse.prochaine_visite || suiviGrossesse.prochaineVisite).toLocaleDateString('fr-FR')} darkMode={darkMode} />
            <GrossesseStat label="Poids actuel" value={`${suiviGrossesse.poids} kg`} darkMode={darkMode} />
            <GrossesseStat label="Tension" value={suiviGrossesse.tension} darkMode={darkMode} />
          </div>

          {suiviGrossesse.observations && (
            <div className={`p-3 rounded-lg ${darkMode ? "bg-pink-900/30" : "bg-white"}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${darkMode ? "text-pink-300" : "text-pink-700"}`}>Observations</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{suiviGrossesse.observations}</p>
            </div>
          )}
        </div>
      )}

      {/* INDICATEURS RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={sectionClass}>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Charge de consultation</p>
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
    </div>
  );
}

// ========== SOUS-COMPOSANTS ==========

function InfoRow({ label, value, darkMode, icon }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{label}:</span>
      {icon}
      <span className={darkMode ? "text-gray-200" : "text-gray-800"}>{formatValeur(value)}</span>
    </p>
  );
}

function HabitItem({ label, value, darkMode }) {
  return (
    <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${darkMode ? "text-white" : "text-gray-800"}`}>
        {formatValeur(value)}
      </p>
    </div>
  );
}

function GrossesseStat({ label, value, darkMode }) {
  return (
    <div className={`p-2.5 rounded-lg ${darkMode ? "bg-pink-900/30" : "bg-white"}`}>
      <p className={`text-[10px] uppercase font-semibold ${darkMode ? "text-pink-300" : "text-pink-600"}`}>{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${darkMode ? "text-white" : "text-gray-800"}`}>{formatValeur(value)}</p>
    </div>
  );
}