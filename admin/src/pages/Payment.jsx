import { useState, useMemo, useCallback } from "react";
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
} from "lucide-react";

/* ================= MOCK DATA ================= */
const initialPayments = [
  {
    id: 1001,
    patient: "Marie Ndzi",
    patientEmail: "marie.ndzi@email.cm",
    patientPhone: "+237 690 111 222",
    professional: "Dr. Martin Nkono",
    structure: "Hôpital Laquintinie",
    reason: "Consultation cardiologique",
    amount: 25000,
    method: "Mobile Money",
    provider: "MTN Mobile Money",
    reference: "TXN-2026-001001",
    status: "Payé",
    date: "2026-05-18",
    time: "14:32",
    notes: "Paiement reçu et vérifié",
  },
  {
    id: 1002,
    patient: "Paul Tchoumi",
    patientEmail: "paul.tchoumi@email.cm",
    patientPhone: "+237 670 333 444",
    professional: "Dr. Sarah Ngono",
    structure: "CHU Yaoundé",
    reason: "Suivi pédiatrique",
    amount: 15000,
    method: "Carte bancaire",
    provider: "Visa **** 4532",
    reference: "TXN-2026-001002",
    status: "En attente",
    date: "2026-05-17",
    time: "09:15",
    notes: "En cours de validation bancaire",
  },
  {
    id: 1003,
    patient: "Brigitte Essomba",
    patientEmail: "brigitte.essomba@email.cm",
    patientPhone: "+237 655 555 666",
    professional: "Dr. Paul Mbe",
    structure: "Hôpital Général Douala",
    reason: "Bilan annuel complet",
    amount: 45000,
    method: "Mobile Money",
    provider: "Orange Money",
    reference: "TXN-2026-001003",
    status: "Échoué",
    date: "2026-05-16",
    time: "16:45",
    notes: "Solde insuffisant - réessayez",
  },
];

/* ================= COMPONENT ================= */
export default function PaymentsPage({ darkMode }) {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [methodFilter, setMethodFilter] = useState("Tous");
  
  // Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ================= KPI ================= */
  const stats = useMemo(() => {
    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const paidAmount = payments.filter(p => p.status === "Payé").reduce((acc, p) => acc + p.amount, 0);
    
    return {
      total: payments.length,
      paid: payments.filter(p => p.status === "Payé").length,
      pending: payments.filter(p => p.status === "En attente").length,
      failed: payments.filter(p => p.status === "Échoué").length,
      totalAmount,
      paidAmount,
    };
  }, [payments]);

  /* ================= FILTER ================= */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.patient.toLowerCase().includes(search.toLowerCase()) ||
        p.professional.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "Tous" || p.status === statusFilter;
      const matchMethod = methodFilter === "Tous" || p.method === methodFilter;
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

  const handleMarkPaid = useCallback((id) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, status: "Payé", notes: "Marqué comme payé manuellement" } : p
    ));
    toast.success("✅ Paiement marqué comme payé");
    if (selectedPayment?.id === id) {
      setSelectedPayment(prev => prev ? { ...prev, status: "Payé" } : null);
    }
  }, [selectedPayment]);

  const handleMarkFailed = useCallback((id) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, status: "Échoué", notes: "Échec confirmé" } : p
    ));
    toast.error("🚫 Paiement marqué comme échoué");
    if (selectedPayment?.id === id) {
      setSelectedPayment(prev => prev ? { ...prev, status: "Échoué" } : null);
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

  const closeModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  }, []);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      "Payé": "bg-green-500/10 text-green-500 border-green-500/20",
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

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total transactions", value: stats.total, icon: Hash, color: "blue", sub: "Paiements enregistrés" },
          { title: "Payés", value: `${stats.paid} • ${formatAmount(stats.paidAmount)} FCFA`, icon: CheckCircle2, color: "green", sub: "Validés" },
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
          {["Tous", "Payé", "En attente", "Échoué"].map((status) => (
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
                    {p.patient.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" title={p.patient}>{p.patient}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Hash size={12} className="flex-shrink-0" />
                      <span className="truncate">{p.reference}</span>
                    </p>
                  </div>
                </div>
                {getStatusBadge(p.status)}
              </div>

              {/* Amount & Method */}
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-green-500">{formatAmount(p.amount)} FCFA</p>
                <span className="text-sm flex items-center gap-1">
                  {getMethodIcon(p.method)} {p.method}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <User size={14} className="flex-shrink-0" />
                  <span className="truncate" title={p.professional}>{p.professional}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Building2 size={14} className="flex-shrink-0" />
                  <span className="truncate" title={p.structure}>{p.structure}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText size={14} className="flex-shrink-0" />
                  <span className="truncate" title={p.reason}>{p.reason}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>{formatDate(p.date)} • {p.time}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t dark:border-slate-800">
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
                      title="Marquer payé"
                    >
                      <CheckCircle2 size={16} className="flex-shrink-0" />
                      <span className="text-xs">Payé</span>
                    </button>
                    <button
                      onClick={() => handleMarkFailed(p.id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-red-500/10 text-red-500"
                      title="Marquer échoué"
                    >
                      <XCircle size={16} className="flex-shrink-0" />
                      <span className="text-xs">Échec</span>
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
                  <h2 className="font-bold text-lg truncate" title={p.patient}>{p.patient}</h2>
                  <p className="text-sm">
                    <span className="font-semibold text-green-500">{formatAmount(p.amount)} FCFA</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="flex items-center gap-1 inline">
                      {getMethodIcon(p.method)} {p.method}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(p.date)} • {p.time}
                  </p>
                </div>

                {/* CENTER: Details */}
                <div className="text-sm space-y-2 text-gray-400 flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2">
                    <User size={14} className="flex-shrink-0" /> 
                    <span className="truncate" title={p.professional}>{p.professional}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="flex-shrink-0" /> 
                    <span className="truncate" title={p.structure}>{p.structure}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="flex-shrink-0" /> 
                    <span className="truncate" title={p.reason}>{p.reason}</span>
                  </div>
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
                          title="Marquer payé"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleMarkFailed(p.id)}
                          className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition" 
                          title="Marquer échoué"
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
              <p className="text-2xl sm:text-3xl font-bold text-green-500">{formatAmount(payment.amount)} FCFA</p>
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

          {/* Patient Info */}
          <Section title="Informations Patient" icon={User} darkMode={darkMode}>
            <DetailRow label="Nom" value={payment.patient} darkMode={darkMode} />
            <DetailRow label="Email" value={payment.patientEmail} icon={Mail} darkMode={darkMode} />
            <DetailRow label="Téléphone" value={payment.patientPhone} icon={Phone} darkMode={darkMode} />
          </Section>

          {/* Consultation Info */}
          <Section title="Consultation" icon={FileText} darkMode={darkMode}>
            <DetailRow label="Professionnel" value={payment.professional} darkMode={darkMode} />
            <DetailRow label="Structure" value={payment.structure} icon={Building2} darkMode={darkMode} />
            <DetailRow label="Motif" value={payment.reason} darkMode={darkMode} />
          </Section>

          {/* Payment Info */}
          <Section title="Transaction" icon={CreditCard} darkMode={darkMode}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <DetailRow label="Méthode" value={`${payment.method} (${payment.provider})`} darkMode={darkMode} />
              <DetailRow label="Date & Heure" value={`${formatDate(payment.date)} à ${payment.time}`} icon={Clock} darkMode={darkMode} />
              <DetailRow label="Référence" value={payment.reference} darkMode={darkMode} highlight />
              <DetailRow label="Statut" value={payment.status} darkMode={darkMode} />
            </div>
            {payment.notes && (
              <div className={`mt-4 p-4 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm">{payment.notes}</p>
              </div>
            )}
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
                <CheckCircle2 size={18} /> <span className="hidden xs:inline">Marquer comme payé</span><span className="xs:hidden">Payé</span>
              </button>
              <button onClick={onMarkFailed}
                className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2">
                <XCircle size={18} /> <span className="hidden xs:inline">Marquer comme échoué</span><span className="xs:hidden">Échec</span>
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
              href={`https://wa.me/?text=Bonjour, je confirme le paiement ${payment.reference} de ${formatAmount(payment.amount)} FCFA`}
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