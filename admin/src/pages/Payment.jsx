import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Hash,
  FileText,
  User,
  Building2,
  TrendingUp,
  AlertCircle,
  X,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  ArrowDownRight,
} from "lucide-react";

import API from "../services/api";
import { initCurrencyRates, toXAF, formatXAF } from "../services/currency";

const STATUS_MAP = {
  valide_manuellement: "Payé",
  confirme: "Payé",
  en_attente_validation: "En attente",
  echoue: "Échoué",
  rembourse: "Remboursé",
  initie: "Initié",
  annule: "Annulé",
  expire: "Expiré",
};

const METHOD_LABELS = {
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
  carte_visa: "Carte Visa",
  carte_mastercard: "Carte Mastercard",
  virement_bancaire: "Virement",
  notchpay: "Notchpay",
  stripe: "Stripe",
  portefeuille_nere: "Portefeuille NERE",
};

/* ================= COMPONENT ================= */
export default function PaymentsPage({ darkMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [retraits, setRetraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [methodFilter, setMethodFilter] = useState("Tous");
  const [retraitSearch, setRetraitSearch] = useState("");
  const [retraitStatusFilter, setRetraitStatusFilter] = useState("Tous");
  
  // Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Active tab for navigation — read from URL or default to "retraits"
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "retraits");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    initCurrencyRates();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const [paiRes, usersRes, patientsRes, medecinsRes, retraitsRes, demandesRes] = await Promise.all([
          API.get("/paiements"),
          API.get("/users"),
          API.get("/patients"),
          API.get("/medecins"),
          API.get("/admin/retraits"),
          API.get("/demandes-avis").catch(() => ({ data: [] })),
        ]);
        const items = Array.isArray(paiRes.data) ? paiRes.data : paiRes.data?.data ?? [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? [];
        const patients = Array.isArray(patientsRes.data) ? patientsRes.data : patientsRes.data?.data ?? [];
        const medecins = Array.isArray(medecinsRes.data) ? medecinsRes.data : medecinsRes.data?.data ?? [];
        const demandes = Array.isArray(demandesRes.data) ? demandesRes.data : demandesRes.data?.data ?? [];
        const userMap = {};
        for (const u of users) userMap[u.id] = u;
        const patientCodeMap = {};
        for (const p of patients) patientCodeMap[p.id] = p.code_patient || "";
        const medecinCodeMap = {};
        for (const m of medecins) medecinCodeMap[m.id] = m.code_medecin || "";
        const demandeMap = {};
        for (const d of demandes) demandeMap[d.id] = d;
        const mapped = items.map((item) => {
          const pat = userMap[item.patient_id];
          const med = userMap[item.medecin_id];
          const isSequestre = item.type_paiement === "sequestre_avis";
          const isRemboursement = item.type_paiement === "remboursement_sequestre";
          const isHonoraires = item.type_paiement === "honoraires_avis";
          const displayStatus = isSequestre ? "Retenu" : isRemboursement ? "Remboursé" : (STATUS_MAP[item.statut] ?? item.statut ?? "En attente");
          const displayAmount = isSequestre ? Number(item.montant_total) || 0 : Number(item.montant_medecin) || Number(item.montant_total) || 0;
          const demande = item.demande_avis_id ? demandeMap[item.demande_avis_id] : null;
          const demandeur = demande && userMap[demande.medecin_demandeur_id]
            ? `Dr. ${userMap[demande.medecin_demandeur_id].prenom || ""} ${userMap[demande.medecin_demandeur_id].nom || ""}`.trim()
            : "";
          return {
            id: item.id,
            patientId: (patientCodeMap[item.patient_id] || item.patient_id) ?? "",
            medecinId: (medecinCodeMap[item.medecin_id] || item.medecin_id) ?? "",
            patient: pat ? `${pat.prenom || ""} ${pat.nom || ""}`.trim() : "",
            professional: med ? `Dr. ${med.prenom || ""} ${med.nom || ""}`.trim() : "",
            demandeur,
            rdvId: item.rdv_id ?? "",
            amount: displayAmount,
            method: (METHOD_LABELS[item.methode] || item.methode) ?? "",
            methodKey: item.methode ?? "",
            provider: item.fournisseur ?? "",
            reference: item.reference ?? "",
            referenceFournisseur: item.reference_fournisseur ?? "",
            statut: item.statut ?? "",
            status: displayStatus,
            type_paiement: item.type_paiement || "",
            date: item.created_at ?? "",
            fraisPlateforme: Number(item.frais_plateforme) || 0,
            montantMedecin: Number(item.montant_medecin) || 0,
            devise: item.devise ?? "XAF",
          };
        });
        if (!cancelled) {
          setPayments(mapped);
          const enrichedRetraits = (Array.isArray(retraitsRes.data) ? retraitsRes.data : []).map((r) => {
            const medUser = userMap[r.medecin_id];
            const medecinInfo = medecins.find(m => m.id === r.medecin_id);
            return {
              ...r,
              medecinNom: medUser ? `${medUser.prenom || ""} ${medUser.nom || ""}`.trim() : "",
              medecinEmail: medUser?.email ?? "",
              medecinTelephone: medUser?.telephone ?? "",
              medecinCode: medecinInfo?.code_medecin ?? "",
            };
          });
          setRetraits(enrichedRetraits);
        }
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des paiements");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPayments();
    return () => { cancelled = true; };
  }, []);

  /* ================= KPI ================= */
  const stats = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === "Payé");
    const paidAmountXAF = paidPayments.reduce((acc, p) => acc + toXAF(p.amount, p.devise), 0);
    const totalAmountXAF = payments.reduce((acc, p) => acc + toXAF(p.amount, p.devise), 0);
    
    return {
      total: payments.length,
      paid: paidPayments.length,
      pending: payments.filter(p => p.status === "En attente").length,
      failed: payments.filter(p => p.status === "Échoué").length,
      totalAmount: totalAmountXAF,
      paidAmount: paidAmountXAF,
    };
  }, [payments]);

  /* ================= PENDING COUNTS ================= */
  const pendingRetraitsCount = useMemo(() => retraits.filter(r => r.statut === "en_attente").length, [retraits]);
  const pendingPaymentsCount = useMemo(() => payments.filter(p => p.status === "En attente").length, [payments]);

  /* ================= RETRAITS STATS ================= */
  const retraitsStats = useMemo(() => {
    const pendingRetraits = retraits.filter(r => r.statut === "en_attente");
    const validatedRetraits = retraits.filter(r => r.statut === "valide" || r.statut === "effectue");
    const pendingAmount = pendingRetraits.reduce((a, r) => a + toXAF(Number(r.montant) || 0, r.devise), 0);
    const withdrawnAmount = validatedRetraits.reduce((a, r) => a + toXAF(Number(r.montant) || 0, r.devise), 0);
    return {
      total: retraits.length,
      pendingCount: pendingRetraits.length,
      pendingAmount,
      withdrawnCount: validatedRetraits.length,
      withdrawnAmount,
    };
  }, [retraits]);

  /* ================= RETRAITS FILTER ================= */
  function getRetraitRef(r) {
    if (r.reference) return r.reference;
    const idPart = (r.id || "").replace(/-/g, "").slice(0, 12).toUpperCase();
    return `TRF-RET-${idPart}`;
  }

  const filteredRetraits = useMemo(() => {
    return retraits.filter((r) => {
      const q = retraitSearch.toLowerCase();
      const ref = getRetraitRef(r).toLowerCase();
      const matchSearch =
        !q ||
        (r.medecinNom || "").toLowerCase().includes(q) ||
        (r.medecinEmail || "").toLowerCase().includes(q) ||
        (r.medecinTelephone || "").toLowerCase().includes(q) ||
        (r.methode || "").toLowerCase().includes(q) ||
        ref.includes(q) ||
        (r.medecinCode || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q);
      const matchStatus = retraitStatusFilter === "Tous" ||
        (retraitStatusFilter === "En attente" && r.statut === "en_attente") ||
        (retraitStatusFilter === "Validé" && r.statut === "valide") ||
        (retraitStatusFilter === "Rejeté" && r.statut === "rejete") ||
        (retraitStatusFilter === "Effectué" && r.statut === "effectue");
      return matchSearch && matchStatus;
    });
  }, [retraits, retraitSearch, retraitStatusFilter]);

  const METHOD_FILTER_MAP = {
    "Mobile Money": ["mtn_momo", "orange_money"],
    "Carte bancaire": ["carte_visa", "carte_mastercard"],
    "Espèces": ["especes"],
  };

  /* ================= FILTER ================= */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        (p.patient || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.professional || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.reference || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "Tous" || p.status === statusFilter;
      const matchMethod = methodFilter === "Tous" ||
        (METHOD_FILTER_MAP[methodFilter] || []).includes(p.methodKey);
      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  /* ================= ACTIONS ================= */
  const handleViewDetails = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  }, []);

  const handleMarkPaid = useCallback(async (id) => {
    try {
      await API.put(`/paiements/${id}/valider`, { statut: "valide_manuellement" });
      setPayments(prev => prev.map(p =>
        p.id === id ? { ...p, status: "Payé", statut: "valide_manuellement" } : p
      ));
      toast.success("✅ Paiement validé");
      if (selectedPayment?.id === id) {
        setSelectedPayment(prev => prev ? { ...prev, status: "Payé", statut: "valide_manuellement" } : null);
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de la validation");
    }
  }, [selectedPayment]);

  const handleMarkFailed = useCallback(async (id) => {
    try {
      await API.put(`/paiements/${id}/valider`, { statut: "echoue" });
      setPayments(prev => prev.map(p =>
        p.id === id ? { ...p, status: "Échoué", statut: "echoue" } : p
      ));
      toast.error("🚫 Paiement rejeté");
      if (selectedPayment?.id === id) {
        setSelectedPayment(prev => prev ? { ...prev, status: "Échoué", statut: "echoue" } : null);
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors du rejet");
    }
  }, [selectedPayment]);

  const handleDownloadReceipt = useCallback((payment) => {
    try {
      const receipt = {
        reference: payment.reference,
        patient: payment.patient,
        amount: `${payment.amount.toLocaleString()} FCFA`,
        date: `${payment.date} à ${payment.time}`,
        structure: payment.structure,
        professional: payment.professional,
        reason: payment.reason,
        method: `${payment.method} (${payment.provider})`,
        status: payment.status,
        generatedAt: new Date().toISOString(),
      };
      
      const data = JSON.stringify(receipt, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu_${payment.reference}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("📥 Reçu téléchargé");
    } catch {
      toast.error("❌ Erreur lors du téléchargement");
    }
  }, []);

  const handleCopyReference = useCallback((reference) => {
    navigator.clipboard.writeText(reference);
    toast.success("📋 Référence copiée");
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("Tous");
    setMethodFilter("Tous");
    setCurrentPage(1);
    toast.info("🔄 Filtres réinitialisés");
  }, []);

  const handleValiderRetrait = useCallback(async (retraitId) => {
    try {
      await API.put(`/admin/retraits/${retraitId}/valider`, { statut: "valide" });
      setRetraits(prev => prev.map(r => r.id === retraitId ? { ...r, statut: "valide" } : r));
      toast.success("✅ Retrait validé");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Erreur lors de la validation");
    }
  }, []);

  const handleRejeterRetrait = useCallback(async (retraitId, motif = "") => {
    try {
      await API.put(`/admin/retraits/${retraitId}/valider`, { statut: "rejete", motif_rejet: motif });
      setRetraits(prev => prev.map(r => r.id === retraitId ? { ...r, statut: "rejete" } : r));
      toast.error("🚫 Retrait rejeté");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Erreur lors du rejet");
    }
  }, []);

  const closeModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  }, []);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      "Payé": "bg-green-500/10 text-green-500 border-green-500/20",
      "Retenu": "bg-amber-500/10 text-amber-500 border-amber-500/20",
      "Remboursé": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "En attente": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "Échoué": "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status] || styles["En attente"]}`}>
        {status}
      </span>
    );
  };

  const getMethodIcon = (method) => {
    if (method.includes("Mobile")) return "📱";
    if (method.includes("Carte")) return "💳";
    if (method.includes("Espèces")) return "💵";
    return "💰";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  if (loading) {
    return (
      <div className={`min-h-screen p-3 sm:p-4 lg:p-6 transition-all ${bg}`}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-4 lg:p-6 space-y-5 lg:space-y-6 transition-all ${bg}`}>
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex items-center gap-2">
            <CreditCard className="text-blue-500 flex-shrink-0" size={28} />
            <span>Gestion des Paiements</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Suivi intelligent des transactions médicales</p>
        </div>
      </div>

      {/* ================= KPI PAIEMENTS ================= */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-blue-500" />
          <h2 className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Paiements</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total", value: stats.total, icon: Hash, color: "blue", sub: "Transactions" },
            { title: "Payés", value: `${stats.paid}`, icon: CheckCircle2, color: "green", sub: `${formatXAF(stats.paidAmount)} FCFA` },
            { title: "En attente", value: stats.pending, icon: Clock, color: "yellow", sub: "À valider" },
            { title: "Échoués", value: stats.failed, icon: AlertCircle, color: "red", sub: "À revoir" },
          ].map((item, i) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: "bg-blue-500/10 text-blue-500",
              green: "bg-green-500/10 text-green-500",
              yellow: "bg-yellow-500/10 text-yellow-500",
              red: "bg-red-500/10 text-red-500",
            };
            return (
              <div key={i} className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${
                darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{item.title}</p>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">{item.value}</h2>
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.sub}</p>
                  </div>
                  <div className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= KPI RETRAITS ================= */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-purple-500" />
          <h2 className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Retraits</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total", value: retraitsStats.total, icon: Hash, color: "purple", sub: "Demandes" },
            { title: "Retiré", value: retraitsStats.withdrawnCount, icon: ArrowDownRight, color: "green", sub: `${formatXAF(retraitsStats.withdrawnAmount)} FCFA` },
            { title: "En attente", value: retraitsStats.pendingCount, icon: Clock, color: "yellow", sub: "À traiter" },
            { title: "Montant en attente", value: formatXAF(retraitsStats.pendingAmount), icon: AlertCircle, color: "red", sub: "FCFA" },
          ].map((item, i) => {
            const Icon = item.icon;
            const colorClasses = {
              purple: "bg-purple-500/10 text-purple-500",
              green: "bg-green-500/10 text-green-500",
              yellow: "bg-yellow-500/10 text-yellow-500",
              red: "bg-red-500/10 text-red-500",
            };
            return (
              <div key={i} className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${
                darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{item.title}</p>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">{item.value}</h2>
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.sub}</p>
                  </div>
                  <div className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= NAVIGATION BUTTONS ================= */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bouton Validation des retraits */}
        <button
          onClick={() => { setActiveTab("retraits"); setCurrentPage(1); setSearchParams({ tab: "retraits" }); }}
          className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all ${
            activeTab === "retraits"
              ? "border-purple-500 shadow-lg shadow-purple-500/20"
              : darkMode ? "border-slate-700 hover:border-slate-600" : "border-gray-200 hover:border-gray-300"
          } ${darkMode ? "bg-slate-900" : "bg-white"}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeTab === "retraits" ? "bg-purple-500 text-white" : darkMode ? "bg-slate-800 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
              <Wallet size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm sm:text-base">Validation des retraits</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Gérer les demandes de retrait</p>
            </div>
          </div>
          {/* Badge de notification */}
          {pendingRetraitsCount > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[28px] h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center px-2 shadow-lg animate-pulse">
              {pendingRetraitsCount}
            </div>
          )}
        </button>

        {/* Bouton Validation des paiements */}
        <button
          onClick={() => { setActiveTab("paiements"); setCurrentPage(1); setSearchParams({ tab: "paiements" }); }}
          className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all ${
            activeTab === "paiements"
              ? "border-green-500 shadow-lg shadow-green-500/20"
              : darkMode ? "border-slate-700 hover:border-slate-600" : "border-gray-200 hover:border-gray-300"
          } ${darkMode ? "bg-slate-900" : "bg-white"}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeTab === "paiements" ? "bg-green-500 text-white" : darkMode ? "bg-slate-800 text-green-400" : "bg-green-100 text-green-600"}`}>
              <CheckCircle2 size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm sm:text-base">Validation des paiements</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Gérer les paiements en attente</p>
            </div>
          </div>
          {/* Badge de notification */}
          {pendingPaymentsCount > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[28px] h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center px-2 shadow-lg animate-pulse">
              {pendingPaymentsCount}
            </div>
          )}
        </button>
      </div>

      {/* ================= RETRAITS SECTION ================= */}
      {activeTab === "retraits" && (
        <>
          {/* ================= RETRAITS FILTERS ================= */}
          <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={retraitSearch}
                onChange={(e) => setRetraitSearch(e.target.value)}
                placeholder="Rechercher médecin, téléphone, email, méthode, référence..."
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
            {/* Status filter buttons */}
            <div className="flex flex-wrap gap-2">
              {["Tous", "En attente", "Validé", "Rejeté", "Effectué"].map((s) => (
                <button
                  key={s}
                  onClick={() => setRetraitStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    retraitStatusFilter === s
                      ? "bg-purple-600 text-white"
                      : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ================= RETRAITS EN ATTENTE ================= */}
          {filteredRetraits.filter(r => r.statut === "en_attente").length > 0 && (
            <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${card}`}>
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-purple-500" />
                <h2 className="font-semibold text-lg">Demandes de retrait en attente ({filteredRetraits.filter(r => r.statut === "en_attente").length})</h2>
              </div>
              <div className="space-y-3">
                {filteredRetraits.filter(r => r.statut === "en_attente").map((r) => (
                  <div key={r.id} className={`p-4 rounded-xl border space-y-3 ${
                    darkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"
                  }`}>
                    {/* Header: Montant + Méthode */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight size={14} className="text-purple-500" />
                        <span className="font-semibold text-sm">
                          {formatXAF(toXAF(Number(r.montant) || 0, r.devise))} FCFA
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"
                        }`}>
                          {r.methode}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        En attente
                      </span>
                    </div>
                    {/* Infos médecin */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <div className="flex items-center gap-2">
                        <User size={12} className="flex-shrink-0 text-purple-400" />
                        <span className="font-medium text-gray-300">{r.medecinNom || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="flex-shrink-0 text-purple-400" />
                        <span>{r.medecinTelephone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="flex-shrink-0 text-purple-400" />
                        <span className="truncate">{r.medecinEmail || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="flex-shrink-0 text-purple-400" />
                        <span>{r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                      {r.medecinCode && (
                        <div className="flex items-center gap-2">
                          <Hash size={12} className="flex-shrink-0 text-purple-400" />
                          <span className="font-mono">{r.medecinCode}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Hash size={12} className="flex-shrink-0 text-purple-400" />
                        <span className="font-mono">{getRetraitRef(r)}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleValiderRetrait(r.id)}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Valider
                      </button>
                      <button
                        onClick={() => handleRejeterRetrait(r.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition flex items-center gap-1.5"
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= ALL RETRAITS (Historique + autres statuts) ================= */}
          {filteredRetraits.length > 0 ? (
            <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${card}`}>
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-gray-400" />
                <h3 className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Tous les retraits ({filteredRetraits.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredRetraits.map((r) => {
                  const statusBadge = {
                    en_attente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    valide: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    rejete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    effectue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  };
                  const statutLabel = { en_attente: "En attente", valide: "Validé", rejete: "Rejeté", effectue: "Effectué" };
                  return (
                    <div key={r.id} className={`p-3 rounded-lg space-y-2 ${
                      darkMode ? "bg-slate-800" : "bg-gray-50"
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium">{formatXAF(toXAF(Number(r.montant) || 0, r.devise))} FCFA</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            darkMode ? "bg-slate-700 text-gray-300" : "bg-gray-200 text-gray-600"
                          }`}>{r.methode}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${statusBadge[r.statut] || ""}`}>
                          {statutLabel[r.statut] || r.statut}
                        </span>
                      </div>
                      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        <span className="flex items-center gap-1"><User size={10} /> {r.medecinNom || "—"}</span>
                        {r.medecinCode && <span className="flex items-center gap-1 font-mono"><Hash size={10} /> {r.medecinCode}</span>}
                        <span className="flex items-center gap-1"><Phone size={10} /> {r.medecinTelephone || "—"}</span>
                        <span className="flex items-center gap-1 font-mono"><Hash size={10} /> {getRetraitRef(r)}</span>
                        {r.motif_rejet && <span className="text-red-400 italic">Motif: {r.motif_rejet}</span>}
                        <span className="flex items-center gap-1"><Clock size={10} /> {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <div className="flex flex-col items-center gap-3">
                <Wallet size={40} className="opacity-50 text-purple-500" />
                <p className="text-gray-400">Aucun retrait trouvé</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= PAIEMENTS SECTION ================= */}
      {activeTab === "paiements" && (
        <>
          {/* ================= FILTERS ================= */}
          <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher patient, médecin, référence..."
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {["Tous", "Payé", "Retenu", "Remboursé", "En attente", "Échoué", "Annulé"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
              {["Tous", "Mobile Money", "Carte bancaire", "Espèces"].map((method) => (
                <button
                  key={method}
                  onClick={() => { setMethodFilter(method); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    methodFilter === method
                      ? "bg-blue-600 text-white"
                      : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {method}
                </button>
              ))}
              <button 
                onClick={resetFilters}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
                title="Réinitialiser"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* ================= MOBILE CARDS ================= */}
          <div className="lg:hidden space-y-4">
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((p) => (
                <div key={p.id} className={`rounded-2xl border p-4 space-y-4 ${card}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getMethodIcon(p.method)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate" title={p.reference}>{p.reference}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Hash size={12} className="flex-shrink-0" />
                          <span className="truncate">{p.method}</span>
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  {/* Amount & Method */}
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-green-500">{formatAmount(p.amount)} {p.devise}</p>
                    <span className="text-sm flex items-center gap-1">
                      {p.provider}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} className="flex-shrink-0" />
                      <span>{formatDate(p.date)}</span>
                    </div>
                    {p.fraisPlateforme > 0 && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FileText size={14} className="flex-shrink-0" />
                        <span>Frais plateforme: {formatAmount(p.fraisPlateforme)} {p.devise}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  onClick={() => handleViewDetails(p)}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                  title="Voir détails"
                >
                  <Eye size={16} className="flex-shrink-0" />
                  <span className="text-xs">Voir</span>
                </button>
                
                {p.status === "En attente" && (
                  <>
                    <button
                      onClick={() => handleMarkPaid(p.id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-green-500/10 text-green-500"
                      title="Valider le paiement"
                    >
                      <CheckCircle2 size={16} className="flex-shrink-0" />
                      <span className="text-xs">Valider</span>
                    </button>
                    <button
                      onClick={() => handleMarkFailed(p.id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-red-500/10 text-red-500"
                      title="Rejeter le paiement"
                    >
                      <XCircle size={16} className="flex-shrink-0" />
                      <span className="text-xs">Rejeter</span>
                    </button>
                  </>
                )}
                
                    <button
                      onClick={() => handleDownloadReceipt(p)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-purple-500/10 text-purple-500"
                      title="Télécharger reçu"
                    >
                      <Download size={16} className="flex-shrink-0" />
                      <span className="text-xs">Reçu</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={`rounded-2xl border p-10 text-center ${card}`}>
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle size={40} className="opacity-50" />
                  <p className="text-gray-400">Aucun paiement trouvé</p>
                  <button onClick={resetFilters} className="text-blue-500 hover:underline text-sm">
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= DESKTOP LIST ================= */}
          <div className={`hidden lg:block rounded-2xl border overflow-hidden ${card}`}>
            <div className="space-y-4 p-4">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-3xl border flex flex-col lg:flex-row justify-between gap-4 transition hover:shadow-lg ${
                      darkMode ? "hover:border-slate-700" : "hover:border-gray-300"
                    }`}
                  >
                    {/* LEFT: Payment Info */}
                    <div className="space-y-2 min-w-[200px]">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Hash size={12} /> #{p.reference}
                      </div>
                      <h2 className="font-bold text-lg">{p.method}</h2>
                      <p className="text-sm">
                        <span className="font-semibold text-green-500">{formatAmount(p.amount)} {p.devise}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span>{p.provider}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(p.date)}
                      </p>
                    </div>

                    {/* CENTER: Details */}
                    <div className="text-sm space-y-2 text-gray-400 flex-1 min-w-[250px]">
                      {p.fraisPlateforme > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="flex-shrink-0" />
                          <span>Frais plateforme: {formatAmount(p.fraisPlateforme)} {p.devise}</span>
                        </div>
                      )}
                      {p.montantMedecin > 0 && (
                        <div className="flex items-center gap-2">
                          <User size={14} className="flex-shrink-0" />
                          <span>Montant médecin: {formatAmount(p.montantMedecin)} {p.devise}</span>
                        </div>
                      )}
                      {p.referenceFournisseur && (
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="flex-shrink-0" />
                          <span>Réf. externe: {p.referenceFournisseur}</span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Status & Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                      {getStatusBadge(p.status)}
                      
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleViewDetails(p)}
                          className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-500 transition" 
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {p.status === "En attente" && (
                          <>
                            <button 
                              onClick={() => handleMarkPaid(p.id)}
                              className="p-2 rounded-xl hover:bg-green-500/10 text-green-500 transition" 
                              title="Valider le paiement"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleMarkFailed(p.id)}
                              className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition" 
                              title="Rejeter le paiement"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDownloadReceipt(p)}
                          className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-500 transition" 
                          title="Télécharger reçu"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle size={40} className="opacity-50" />
                    <p>Aucun paiement trouvé</p>
                    <button onClick={resetFilters} className="text-blue-500 hover:underline text-sm">
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Pagination */}
            {totalPages > 1 && (
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
                darkMode ? "border-slate-800" : "border-gray-200"
              }`}>
                <p className="text-sm text-gray-400 text-center sm:text-left">
                  Page {currentPage} sur {totalPages} • {filteredPayments.length} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                      darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                      darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= MOBILE PAGINATION ================= */}
          {totalPages > 1 && (
            <div className="lg:hidden flex flex-col items-center gap-3">
              <p className="text-sm text-gray-400 text-center">Page {currentPage} sur {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= DETAILS MODAL (Responsive) ================= */}
      {showDetailsModal && selectedPayment && (
        <PaymentDetailsModal
          darkMode={darkMode}
          payment={selectedPayment}
          onClose={closeModal}
          onMarkPaid={() => handleMarkPaid(selectedPayment.id)}
          onMarkFailed={() => handleMarkFailed(selectedPayment.id)}
          onDownload={() => handleDownloadReceipt(selectedPayment)}
          onCopyReference={() => handleCopyReference(selectedPayment.reference)}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          formatAmount={formatAmount}
        />
      )}
    </div>
  );
}

/* ================= PAYMENT DETAILS MODAL (Responsive) ================= */
function PaymentDetailsModal({ 
  darkMode, payment, onClose, onMarkPaid, onMarkFailed, onDownload, onCopyReference,
  getStatusBadge, formatDate, formatAmount 
}) {
  const isPending = payment.status === "En attente";
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
              <CreditCard size={20} className="sm:size-24" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate" title="Détails du paiement">Détails du paiement</h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate" title={`Référence: #${payment.reference}`}>
                Réf: #{payment.reference}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Amount & Status */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-400">Montant</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-500">{formatAmount(payment.montantMedecin)} {payment.devise}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {getStatusBadge(payment.status)}
              <button 
                onClick={onCopyReference}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <Copy size={12} /> <span className="hidden xs:inline">Copier réf.</span>
              </button>
            </div>
          </div>

          {/* RDV Info */}
          <Section title={payment.type_paiement === "sequestre_avis" ? "Séquestre avis médical" : payment.type_paiement === "honoraires_avis" ? "Honoraires avis médical" : payment.type_paiement === "remboursement_sequestre" ? "Remboursement séquestre" : "Rendez-vous"} icon={FileText} darkMode={darkMode}>
            {payment.type_paiement && payment.type_paiement !== "consultation" && (
              <DetailRow label="Type" value={payment.status === "Retenu" ? "Séquestre avis médical" : payment.status === "Remboursé" ? "Remboursement séquestre" : "Honoraires avis médical"} darkMode={darkMode} />
            )}
            {payment.demandeur && (
              <div className={`flex items-start gap-2 py-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <User size={14} className="mt-0.5 shrink-0 opacity-50" />
                <div className="min-w-0">
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Médecin demandeur</span>
                  <p className="text-sm font-semibold truncate">{payment.demandeur}</p>
                </div>
              </div>
            )}
            <div className={`flex items-start gap-2 py-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <User size={14} className="mt-0.5 shrink-0 opacity-50" />
              <div className="min-w-0">
                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{payment.type_paiement === "sequestre_avis" || payment.type_paiement === "remboursement_sequestre" ? "Patient" : "Patient"}</span>
                <p className="text-sm font-semibold truncate">{payment.patient || "—"}</p>
              </div>
            </div>
            <div className={`flex items-start gap-2 py-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div className={`w-[14px] h-[14px] mt-0.5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-500"}`}>M</div>
              <div className="min-w-0">
                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{payment.type_paiement === "sequestre_avis" ? "Plateforme (séquestre)" : payment.type_paiement === "honoraires_avis" ? "Médecin expert" : "Médecin"}</span>
                <p className="text-sm font-semibold truncate">{payment.type_paiement === "sequestre_avis" ? "Néré Health" : payment.professional || "—"}</p>
              </div>
            </div>
          </Section>

          {/* Payment Info */}
          <Section title="Transaction" icon={CreditCard} darkMode={darkMode}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DetailRow label="Méthode" value={payment.method} darkMode={darkMode} />
              <DetailRow label="Fournisseur" value={payment.provider} icon={Building2} darkMode={darkMode} />
              <DetailRow label="Date" value={formatDate(payment.date)} icon={Clock} darkMode={darkMode} />
              <DetailRow label="Statut" value={payment.status} darkMode={darkMode} />
              <DetailRow label="Référence" value={payment.reference} darkMode={darkMode} highlight />
              {payment.referenceFournisseur && (
                <DetailRow label="Réf. externe" value={payment.referenceFournisseur} darkMode={darkMode} />
              )}
              <DetailRow label="Frais plateforme" value={`${formatAmount(payment.fraisPlateforme)} ${payment.devise}`} darkMode={darkMode} />
              <DetailRow label="Montant médecin" value={`${formatAmount(payment.montantMedecin)} ${payment.devise}`} darkMode={darkMode} />
            </div>
          </Section>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className={`p-4 sm:p-5 border-t dark:border-slate-700 space-y-3 sm:space-y-4 flex-shrink-0 ${
          darkMode ? "bg-slate-900/50" : "bg-gray-50"
        }`}>
          
          {/* Status Actions */}
          {isPending && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={onMarkPaid}
                className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Valider le paiement
              </button>
              <button onClick={onMarkFailed}
                className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2">
                <XCircle size={18} /> Rejeter le paiement
              </button>
            </div>
          )}

          {/* Other Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={onDownload}
              className={`w-full sm:flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              <Download size={16} /> <span className="hidden xs:inline">Télécharger reçu</span><span className="xs:hidden">Reçu</span>
            </button>
            <a 
              href={`https://wa.me/?text=Bonjour, je confirme le paiement ${payment.reference} de ${formatAmount(payment.amount)} ${payment.devise}`}
              target="_blank" rel="noopener noreferrer"
              className={`w-full sm:w-auto p-2.5 rounded-xl border transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}
              title="Partager par WhatsApp"
            >
              <ExternalLink size={16} /> <span className="hidden xs:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */
function Section({ title, icon: Icon, children, darkMode }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-blue-500 flex-shrink-0" />}
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, darkMode, highlight = false }) {
  return (
    <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        {Icon && <Icon size={12} className="flex-shrink-0" />}
        {label}
      </p>
      <p className={`font-medium text-sm truncate ${highlight ? "text-blue-500 font-mono" : ""}`} title={value}>
        {value || "—"}
      </p>
    </div>
  );
}
