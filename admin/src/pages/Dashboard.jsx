import { useState, useEffect } from "react";
import {
  Users, UserCheck, Hospital, Stethoscope, TrendingUp,
  Wallet, CreditCard, Ticket, CalendarCheck, ArrowDownRight,
  Clock, AlertCircle, FileText,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { initCurrencyRates, toXAF, formatXAF } from "../services/currency";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

const RDV_STATUS = {
  en_attente: "En attente",
  confirme: "Confirmé",
  annule_patient: "Annulé",
  annule_medecin: "Annulé",
  en_cours: "En cours",
  termine: "Terminé",
  en_attente_paiement: "En attente paiement",
  paye_en_attente_validation: "Payé (validation)",
};

export default function Dashboard({ darkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState({ patients: 0, medecins: 0, structures: 0 });
  const [consultationsData, setConsultationsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [hospitalData, setHospitalData] = useState([]);

  const [retraitsPending, setRetraitsPending] = useState([]);
  const [paiementsPending, setPaiementsPending] = useState([]);
  const [revenusConfirme, setRevenusConfirme] = useState(0);
  const [rdvRecents, setRdvRecents] = useState([]);
  const [ticketsOuverts, setTicketsOuverts] = useState([]);
  const [pendingProfileChanges, setPendingProfileChanges] = useState([]);

  useEffect(() => {
    initCurrencyRates();
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get("/tables/patients/count"),
        API.get("/tables/medecins/count"),
        API.get("/tables/structures/count"),
        API.get("/consultations"),
        API.get("/patients"),
        API.get("/admin/retraits"),
        API.get("/paiements"),
        API.get("/rendez_vous"),
        API.get("/tickets"),
        API.get("/admin/medecins/pending-profile-changes"),
      ]);

      const getCount = (r) => r.status === "fulfilled" ? r.value.data.count ?? (Array.isArray(r.value.data) ? r.value.data.length : 0) : 0;
      const getData = (r) => r.status === "fulfilled" ? (Array.isArray(r.value.data) ? r.value.data : r.value.data?.data ?? []) : [];

      const pCount = getCount(results[0]);
      const mCount = getCount(results[1]);
      const sCount = getCount(results[2]);

      setCounts({ patients: pCount, medecins: mCount, structures: sCount });

      setUsersData([
        { name: "Patients", value: pCount || 1 },
        { name: "Médecins", value: mCount || 1 },
        { name: "Structures", value: sCount || 1 },
      ]);

      // Patients par ville
      const patientsList = getData(results[4]);
      const byVille = {};
      patientsList.forEach((p) => {
        const ville = p.ville || "Non renseigné";
        byVille[ville] = (byVille[ville] || 0) + 1;
      });
      setHospitalData(
        Object.entries(byVille)
          .map(([hospital, patients]) => ({ hospital, patients }))
          .sort((a, b) => b.patients - a.patients)
          .slice(0, 6)
      );

      // Consultations par mois
      const consultations = getData(results[3]);
      const byMonth = {};
      consultations.forEach((c) => {
        const d = new Date(c.created_at || c.date_consultation);
        const month = d.toLocaleString("fr-FR", { month: "short" });
        byMonth[month] = (byMonth[month] || 0) + 1;
      });
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      setConsultationsData(
        months.map((m) => ({ month: m, consultations: byMonth[m] || 0 }))
      );

      // Retraits en attente
      const retraits = getData(results[5]);
      const pendingRetraits = retraits.filter((r) => r.statut === "en_attente");
      setRetraitsPending(pendingRetraits);

      // Paiements
      const paiements = getData(results[6]);
      const pendingPaiements = paiements.filter((p) =>
        (p.statut === "en_attente_validation" || p.statut === "initie") &&
        p.type_paiement !== "sequestre_avis" && p.type_paiement !== "remboursement_sequestre"
      );
      setPaiementsPending(pendingPaiements);

      const confirmedPayments = paiements.filter((p) =>
        (p.statut === "confirme" || p.statut === "valide_manuellement") &&
        p.type_paiement !== "sequestre_avis" && p.type_paiement !== "remboursement_sequestre"
      );
      const totalRev = confirmedPayments.reduce((acc, p) => {
        const val = toXAF(Number(p.montant_medecin) || Number(p.montant_total) || 0, p.devise);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      setRevenusConfirme(totalRev);

      // RDV récents
      const rdv = getData(results[7]);
      setRdvRecents(rdv.slice(0, 5));

      // Tickets ouverts
      const tickets = getData(results[8]);
      setTicketsOuverts(tickets.filter((t) => t.statut === "ouvert" || t.statut === "en_cours"));

      // Demandes modification profil
      const profileChanges = getData(results[9]);
      setPendingProfileChanges(Array.isArray(profileChanges) ? profileChanges : []);

    } catch (e) {
      console.error("Erreur chargement Dashboard:", e);
    } finally {
      setLoading(false);
    }
  }

  const card = darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow";

  return (
    <div className={`min-h-screen w-full overflow-x-hidden p-3 sm:p-5 lg:p-6 transition-all duration-300 ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="min-w-0">
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold break-words ${darkMode ? "text-white" : "text-gray-800"}`}>
            Dashboard Administrateur
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vue globale du système hospitalier intelligent
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {/* ================= TOP STATS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Patients */}
            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden ${card}`}>
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br from-blue-500 to-cyan-500" />
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Patients</p>
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 ${darkMode ? "text-white" : "text-gray-800"}`}>{counts.patients.toLocaleString()}</h2>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
                  <Users className="text-white" size={24} />
                </div>
              </div>
            </div>
            {/* Médecins */}
            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden ${card}`}>
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br from-emerald-500 to-green-500" />
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médecins</p>
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 ${darkMode ? "text-white" : "text-gray-800"}`}>{counts.medecins.toLocaleString()}</h2>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-500 flex-shrink-0">
                  <Stethoscope className="text-white" size={24} />
                </div>
              </div>
            </div>
            {/* Structures */}
            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden ${card}`}>
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br from-violet-500 to-purple-500" />
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Structures</p>
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 ${darkMode ? "text-white" : "text-gray-800"}`}>{counts.structures.toLocaleString()}</h2>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-500 flex-shrink-0">
                  <Hospital className="text-white" size={24} />
                </div>
              </div>
            </div>
            {/* Revenus confirmés */}
            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden ${card}`}>
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br from-green-500 to-emerald-500" />
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Revenus confirmés</p>
                  <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 ${darkMode ? "text-white" : "text-gray-800"}`}>{formatXAF(revenusConfirme)}</h2>
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>FCFA</p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0">
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* ================= ACTION CARDS (Paiements / Retraits en attente) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Retraits en attente */}
            <button
              onClick={() => navigate("/payments?tab=retraits")}
              className={`rounded-3xl p-4 sm:p-5 lg:p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg ${
                retraitsPending.length > 0 ? "ring-2 ring-purple-500/50" : ""
              } ${card}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${retraitsPending.length > 0 ? "bg-purple-500 text-white" : darkMode ? "bg-slate-800 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Retraits en attente</h3>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>À valider ou rejeter</p>
                  </div>
                </div>
                {retraitsPending.length > 0 && (
                  <div className="min-w-[32px] h-8 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center justify-center px-2 animate-pulse">
                    {retraitsPending.length}
                  </div>
                )}
              </div>
              {retraitsPending.length > 0 ? (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Total à verser: <span className="text-purple-500 font-bold">{formatXAF(retraitsPending.reduce((a, r) => a + (Number(r.montant) || 0), 0))} {retraitsPending[0]?.devise || "XAF"}</span>
                  </p>
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucune demande en attente</p>
              )}
            </button>

            {/* Paiements en attente */}
            <button
              onClick={() => navigate("/payments?tab=paiements")}
              className={`rounded-3xl p-4 sm:p-5 lg:p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg ${
                paiementsPending.length > 0 ? "ring-2 ring-green-500/50" : ""
              } ${card}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${paiementsPending.length > 0 ? "bg-green-500 text-white" : darkMode ? "bg-slate-800 text-green-400" : "bg-green-100 text-green-600"}`}>
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Paiements en attente</h3>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>À confirmer</p>
                  </div>
                </div>
                {paiementsPending.length > 0 && (
                  <div className="min-w-[32px] h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center px-2 animate-pulse">
                    {paiementsPending.length}
                  </div>
                )}
              </div>
              {paiementsPending.length > 0 ? (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Total: <span className="text-green-500 font-bold">{formatXAF(paiementsPending.reduce((a, p) => a + toXAF(Number(p.montant_medecin) || Number(p.montant_total) || 0, p.devise), 0))} FCFA</span>
                  </p>
                </div>
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucun paiement en attente</p>
              )}
            </button>
          </div>

          {/* ================= CHARTS ROW 1 ================= */}
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6 ${card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Activité des consultations</h2>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Évolution mensuelle</p>
                </div>
                <CalendarCheck className="text-blue-500 flex-shrink-0" />
              </div>
              <div className="flex flex-col h-[260px] sm:h-[320px] lg:h-[350px] min-h-0 min-w-0 w-full">
                <div className="flex-1 min-h-0 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={consultationsData}>
                      <defs>
                        <linearGradient id="colorConsult" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                      <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="consultations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorConsult)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${card}`}>
              <div className="mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Répartition utilisateurs</h2>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Vue globale des comptes</p>
              </div>
              <div className="flex flex-col h-[260px] sm:h-[300px] min-h-0 min-w-0 w-full">
                <div className="flex-1 min-h-0 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={usersData} dataKey="value" cx="50%" cy="50%" outerRadius={window.innerWidth < 640 ? 70 : 100} label>
                        {usersData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ================= CHARTS ROW 2 + RECENT RDV ================= */}
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6 ${card}`}>
              <div className="mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Patients par ville</h2>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Répartition géographique</p>
              </div>
              <div className="flex flex-col h-[260px] sm:h-[320px] min-h-0 min-w-0 w-full">
                <div className="flex-1 min-h-0 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hospitalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                      <XAxis dataKey="hospital" stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                      <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Derniers RDV */}
            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${card}`}>
              <div className="flex items-center gap-3 mb-6">
                <CalendarCheck className="text-blue-500" size={20} />
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Derniers RDV</h2>
              </div>
              <div className="space-y-3">
                {rdvRecents.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun rendez-vous</p>
                ) : (
                  rdvRecents.map((r, i) => {
                    const rdvStatusBadge = {
                      en_attente: "bg-yellow-100 text-yellow-700",
                      confirme: "bg-green-100 text-green-700",
                      annule_patient: "bg-red-100 text-red-700",
                      annule_medecin: "bg-red-100 text-red-700",
                      en_cours: "bg-blue-100 text-blue-700",
                      termine: "bg-gray-100 text-gray-600",
                      en_attente_paiement: "bg-orange-100 text-orange-700",
                      paye_en_attente_validation: "bg-purple-100 text-purple-700",
                    };
                    const rdvStatusDark = {
                      en_attente: "dark:bg-yellow-900/30 dark:text-yellow-400",
                      confirme: "dark:bg-green-900/30 dark:text-green-400",
                      annule_patient: "dark:bg-red-900/30 dark:text-red-400",
                      annule_medecin: "dark:bg-red-900/30 dark:text-red-400",
                      en_cours: "dark:bg-blue-900/30 dark:text-blue-400",
                      termine: "dark:bg-gray-800 dark:text-gray-400",
                      en_attente_paiement: "dark:bg-orange-900/30 dark:text-orange-400",
                      paye_en_attente_validation: "dark:bg-purple-900/30 dark:text-purple-400",
                    };
                    const dateStr = r.date_heure_debut ? new Date(r.date_heure_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                    return (
                      <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-400">#{r.numero_rdv || "—"}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rdvStatusBadge[r.statut] || ""} ${darkMode ? rdvStatusDark[r.statut] || "" : ""}`}>
                            {RDV_STATUS[r.statut] || r.statut}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {dateStr}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ================= TICKETS + DEMANDES PROFIL ================= */}
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Tickets ouverts */}
            <button
              onClick={() => navigate("/tickets")}
              className={`rounded-3xl p-4 sm:p-5 lg:p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg ${card}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Ticket className="text-orange-500" size={20} />
                  <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Tickets support</h2>
                </div>
                {ticketsOuverts.length > 0 && (
                  <span className="min-w-[28px] h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center px-2">
                    {ticketsOuverts.length}
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {ticketsOuverts.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucun ticket ouvert</p>
                ) : (
                  ticketsOuverts.slice(0, 5).map((t, i) => (
                    <div key={i} className={`p-3 rounded-xl flex items-start gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                      <AlertCircle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.sujet || t.titre || "Ticket"}</p>
                        <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {t.priorite && <span className={`font-medium ${t.priorite === "haute" || t.priorite === "urgente" ? "text-red-400" : ""}`}>{t.priorite} • </span>}
                          {t.created_at ? new Date(t.created_at).toLocaleDateString("fr-FR") : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </button>

            {/* Demandes modification profil */}
            <button
              onClick={() => navigate("/doctors")}
              className={`rounded-3xl p-4 sm:p-5 lg:p-6 text-left transition-all hover:scale-[1.01] hover:shadow-lg ${card}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="text-violet-500" size={20} />
                  <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Modifications profil</h2>
                </div>
                {pendingProfileChanges.length > 0 && (
                  <span className="min-w-[28px] h-7 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center px-2">
                    {pendingProfileChanges.length}
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {pendingProfileChanges.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucune demande en attente</p>
                ) : (
                  pendingProfileChanges.slice(0, 5).map((pc, i) => {
                    const fieldLabels = {
                      tarif_modification: "Modification tarif",
                      structure_modification: "Modification structure",
                      diplomes: "Diplôme",
                      certifications: "Certification",
                      experience_history: "Expérience",
                    };
                    const isTarif = pc.field === "tarif_modification";
                    const isStructure = pc.field === "structure_modification";
                    const newTarif = isTarif ? (pc.item?.tarif_consultation ?? null) : null;
                    const newDevise = isTarif ? (pc.item?.devise || "XAF") : null;
                    const newStructure = isStructure ? (pc.item?.structure_nom || pc.item?.structure_id) : null;
                    const dateDemande = pc.item?.date_demande;
                    return (
                      <div key={i} className={`p-3 rounded-xl flex items-start gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                        <UserCheck size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{pc.medecin_nom || "Médecin"}</p>
                          <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {fieldLabels[pc.field] || pc.field}
                            {isTarif && newTarif !== null && (
                              <span className="text-violet-400 font-medium"> — {Number(newTarif).toLocaleString()} {newDevise}</span>
                            )}
                            {isStructure && newStructure && (
                              <span className="text-violet-400 font-medium"> — {newStructure}</span>
                            )}
                          </p>
                          {dateDemande && (
                            <p className={`text-[11px] mt-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                              {new Date(dateDemande).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
