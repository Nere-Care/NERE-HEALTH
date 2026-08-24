import { useEffect, useState } from "react";
import {
  Video,
  Calendar,
  Clock,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Play,
  TrendingUp,
  Activity,
  FileText,
  User,
} from "lucide-react";
import { getRelativeBeneficiary } from "../../../utils/proche";

export default function IdleScreen({
  darkMode,
  startConsultation,
  rdvDuJour,
  historique,
  stats,
  todayStats,
}) {
  const [recherche, setRecherche] = useState("");
  const [tabActif, setTabActif] = useState("file"); // file | historique
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const canStart = (rdv) =>
    rdv.statut === "en_attente" &&
    new Date(rdv.dateDebut).getTime() - 2 * 60 * 1000 <= now;

  const minutesAvantDebut = (rdv) => {
    const diff = new Date(rdv.dateDebut).getTime() - now;
    if (diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / 60000));
  };

  const rdvFiltres = rdvDuJour.filter((r) =>
    r.patientName.toLowerCase().includes(recherche.toLowerCase()) ||
    r.motif.toLowerCase().includes(recherche.toLowerCase())
  );

  const historiqueFiltre = (historique || []).filter((h) =>
    h.patientName.toLowerCase().includes(recherche.toLowerCase()) ||
    h.motif.toLowerCase().includes(recherche.toLowerCase())
  );

  const statutConfig = {
    en_attente: {
      label: "En attente",
      color: "text-orange-500",
      bg: darkMode ? "bg-orange-900/30" : "bg-orange-50",
      icon: AlertCircle,
    },
    en_cours: {
      label: "En cours",
      color: "text-blue-500",
      bg: darkMode ? "bg-blue-900/30" : "bg-blue-50",
      icon: Activity,
    },
    termine: {
      label: "Terminé",
      color: "text-green-500",
      bg: darkMode ? "bg-green-900/30" : "bg-green-50",
      icon: CheckCircle,
    },
    expire: {
      label: "Expiré",
      color: "text-gray-400",
      bg: darkMode ? "bg-gray-700/50" : "bg-gray-100",
      icon: Clock,
    },
  };

  return (
    <div className={`min-h-screen p-3 sm:p-5 lg:p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
            Téléconsultation
          </h1>
          <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
            Gérez vos consultations à distance
          </p>
        </div>

        <button
          onClick={() => startConsultation({
            id: Date.now(),
            patientName: "Consultation rapide",
            age: null,
            motif: "Consultation non planifiée",
            heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            statut: "en_cours",
            avatar: "?",
            dossier: { antecedents: [], allergies: [], dernierConsultation: null },
          })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-medium w-full sm:w-auto justify-center"
        >
          <Video className="w-4 h-4" />
          Consultation rapide
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="RDV aujourd'hui"
          value={stats.total}
          color="blue"
          darkMode={darkMode}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="En attente"
          value={stats.enAttente}
          color="orange"
          darkMode={darkMode}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="En cours"
          value={stats.enCours}
          color="green"
          darkMode={darkMode}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Terminées"
          value={stats.terminees}
          color="purple"
          darkMode={darkMode}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* FILE D'ATTENTE (2/3) */}
        <div className={`lg:col-span-2 rounded-2xl p-4 sm:p-5 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className={`flex gap-1 p-1 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <button
                onClick={() => setTabActif("file")}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition
                  ${tabActif === "file"
                    ? "bg-blue-600 text-white"
                    : darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                File d'attente ({stats.enAttente})
              </button>
              <button
                onClick={() => setTabActif("historique")}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition
                  ${tabActif === "historique"
                    ? "bg-blue-600 text-white"
                    : darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Historique
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 sm:flex-initial max-w-xs
              ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className={`bg-transparent outline-none text-sm w-full
                  ${darkMode ? "text-white placeholder-gray-400" : "text-gray-800"}`}
              />
            </div>
          </div>

          {/* Contenu */}
          {tabActif === "file" ? (
            <div className="space-y-2">
              {rdvFiltres.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Aucun RDV trouvé
                  </p>
                </div>
              ) : (
                rdvFiltres.map((rdv) => {
                  const config = statutConfig[rdv.statut];
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={rdv.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition
                        ${darkMode ? "bg-gray-700/50 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"}`}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {rdv.avatar}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm sm:text-base truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                            {rdv.patientName}
                          </p>
                          {rdv.age && (
                            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {rdv.age} ans
                            </span>
                          )}
                          {(() => {
                            const pb = getRelativeBeneficiary(rdv);
                            return pb ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-md">
                                <User size={10} /> Pour : {pb}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <p className={`text-xs sm:text-sm truncate ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {rdv.motif}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            <Clock size={10} />
                            {rdv.date} à {rdv.heure}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                            <StatusIcon size={10} />
                            {config.label}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      {rdv.statut === "en_attente" && canStart(rdv) && (
                        <button
                          onClick={() => startConsultation(rdv)}
                          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm hover:bg-blue-700 transition flex-shrink-0"
                        >
                          <Play size={14} className="fill-white" />
                          <span className="hidden sm:inline">Démarrer</span>
                        </button>
                      )}

                      {rdv.statut === "en_attente" && !canStart(rdv) && (
                        <span className="flex items-center gap-1.5 bg-gray-300 text-gray-500 px-3 py-2 rounded-xl text-xs sm:text-sm cursor-not-allowed flex-shrink-0">
                          <Clock size={14} />
                          <span className="hidden sm:inline">Disponible dans {minutesAvantDebut(rdv)} min</span>
                        </span>
                      )}

                      {rdv.statut === "en_cours" && (
                        <button
                          onClick={() => startConsultation(rdv)}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm hover:bg-green-700 transition flex-shrink-0 animate-pulse"
                        >
                          <Activity size={14} />
                          <span className="hidden sm:inline">Reprendre</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {historiqueFiltre.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Aucun historique
                  </p>
                </div>
              ) : (
                historiqueFiltre.map((h) => {
                  const hConfig = statutConfig[h.statut] || statutConfig.expire;
                  const HIcon = hConfig.icon;
                  return (
                  <div
                    key={h.id}
                    className={`flex items-center gap-3 p-3 rounded-xl
                      ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {h.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {h.patientName}
                      </p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {h.motif}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h.date} à {h.heure}</p>
                      <span className={`flex items-center gap-1 text-xs font-medium justify-end ${hConfig.color}`}>
                        <HIcon size={10} />
                        {hConfig.label}
                      </span>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* INFO RAPIDE (1/3) */}
        <div className="space-y-4">
          {/* Prochain RDV */}
          <div className={`rounded-2xl p-4 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <h3 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Calendar className="w-4 h-4 text-blue-500" />
              Prochain RDV
            </h3>
            {rdvDuJour.find(r => r.statut === "en_attente") ? (
              <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {rdvDuJour.find(r => r.statut === "en_attente").patientName}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {rdvDuJour.find(r => r.statut === "en_attente").motif}
                </p>
                <p className="text-xs text-blue-500 font-semibold mt-2">
                  {rdvDuJour.find(r => r.statut === "en_attente").date} à {rdvDuJour.find(r => r.statut === "en_attente").heure}
                </p>
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun RDV à venir
              </p>
            )}
          </div>

          {/* Stats rapides */}
          {todayStats && todayStats.count > 0 && (
            <div className={`rounded-2xl p-4 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <h3 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <TrendingUp className="w-4 h-4 text-green-500" />
                Aujourd'hui
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Consultations</span>
                  <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{todayStats.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Durée moyenne</span>
                  <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{todayStats.avgDurationMin} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Taux de complétion</span>
                  <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{todayStats.tauxCompletion}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant StatCard
function StatCard({ icon, label, value, color, darkMode }) {
  const colors = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", dark: "bg-blue-900/30" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", dark: "bg-orange-900/30" },
    green: { bg: "bg-green-100", text: "text-green-600", dark: "bg-green-900/30" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", dark: "bg-purple-900/30" },
  };

  const c = colors[color];

  return (
    <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2
        ${darkMode ? c.dark : c.bg} ${c.text}`}>
        {icon}
      </div>
      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}