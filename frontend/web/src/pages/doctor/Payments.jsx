import { useState } from "react";
import {
  Download,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  CreditCard,
  Smartphone,
  Building2,
} from "lucide-react";

import PaymentSetupModal from "../../components/doctors/Payment/PaymentSetupModal";
import StatsCards from "../../components/doctors/Payment/StatsCards";
import PatientsPaymentsTable from "../../components/doctors/Payment/PatientsPaymentTable";
import DoctorPaymentsHistory from "../../components/doctors/Payment/DoctorsPaymentsHistory";
import WithdrawModal from "../../components/doctors/Payment/WithdrawModal";

import {
  doctorPayments,
  patientPayments,
  paymentStats,
} from "../../constants/doctors/PaymentsData";

export default function Payments({ darkMode }) {
  // ✅ Tableau de méthodes configurées (plusieurs possibles)
  const [configuredMethods, setConfiguredMethods] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sauvegarder les méthodes configurées
  const handleSaveMethods = (methods) => {
    setConfiguredMethods(methods);
    setShowSetup(false);
    showToast(
      methods.length > 1
        ? `${methods.length} méthodes de paiement configurées`
        : "Méthode de paiement configurée"
    );
  };

  // Demande de retrait
  const handleWithdraw = () => {
    if (configuredMethods.length === 0) {
      showToast("Veuillez d'abord configurer au moins une méthode de paiement", "error");
      setShowSetup(true);
      return;
    }
    setShowWithdraw(true);
  };

  // Confirmer le retrait
  const handleConfirmWithdraw = (amount, method) => {
    showToast(`Retrait de ${amount} XAF vers ${method.label} en cours`);
    setShowWithdraw(false);
  };

  const handleDownload = (url) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      showToast("Aucun reçu disponible", "error");
    }
  };

  const closeDetails = () => setSelected(null);

  // Icône par méthode
  const getMethodIcon = (type) => {
    switch (type) {
      case "momo":
      case "orange":
        return Smartphone;
      case "bank":
        return Building2;
      default:
        return CreditCard;
    }
  };

  const getMethodLabel = (type) => {
    switch (type) {
      case "momo": return "MTN Mobile Money";
      case "orange": return "Orange Money";
      case "bank": return "Virement bancaire";
      default: return type;
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors p-3 sm:p-5 lg:p-6
        ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}
    >
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in
            ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* MODALS */}
      <PaymentSetupModal
        isOpen={showSetup}
        setOpen={setShowSetup}
        darkMode={darkMode}
        onSave={handleSaveMethods}
        currentMethods={configuredMethods}
      />

      <WithdrawModal
        isOpen={showWithdraw}
        setOpen={setShowWithdraw}
        darkMode={darkMode}
        onConfirm={handleConfirmWithdraw}
        availableBalance={paymentStats?.find(s => s.title === "Ready To Withdraw")?.amount || 0}
        configuredMethods={configuredMethods}
      />

      {/* PAYMENT DETAILS MODAL */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeDetails}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:max-w-lg rounded-t-[30px] sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto
              ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
          >
            <button
              onClick={closeDetails}
              className={`absolute top-4 right-4 p-2 rounded-full transition
                ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-6 pr-10 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Payment Details
            </h3>

            <div className="space-y-4 text-sm sm:text-base">
              {[
                ["Matricule", selected.matricule || `PAT-${String(selected.id).padStart(4, "0")}`],
                ["Patient", selected.patient],
                ["Service", selected.service],
                ["Date", selected.date],
                ["Amount", selected.amount],
                ["Method", selected.method],
              ].map(([key, value], i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <span className={`flex-shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {key}
                  </span>
                  <span className="font-medium text-right break-words">{value}</span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-4">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                    ${selected.status === "Paid"
                      ? "bg-green-500 text-white"
                      : selected.status === "Pending"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"}`}
                >
                  {selected.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDownload(selected.receipt)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition min-h-[48px] flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download Receipt
              </button>
              <button
                onClick={closeDetails}
                className={`flex-1 py-3 rounded-xl font-medium transition min-h-[48px]
                  ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className={`rounded-2xl border p-4 sm:p-6 space-y-6 transition
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
              Doctor Payments
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Manage settlements & withdrawals
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl text-sm font-medium text-white transition min-h-[48px]
                ${showHistory ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {showHistory ? "Show Patients" : "View History"}
            </button>

            <button
              onClick={handleWithdraw}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition min-h-[48px]"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* ⚠️ ALERTE : Aucune méthode configurée */}
        {configuredMethods.length === 0 ? (
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 border-dashed
            ${darkMode ? "bg-orange-900/20 border-orange-700" : "bg-orange-50 border-orange-300"}`}>
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${darkMode ? "text-orange-300" : "text-orange-700"}`}>
                Aucune méthode de paiement configurée
              </p>
              <p className={`text-xs mt-1 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                Configurez au moins une méthode pour pouvoir effectuer des retraits.
              </p>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition flex-shrink-0"
            >
              <Plus size={14} />
              Configurer
            </button>
          </div>
        ) : (
          /* ✅ Méthodes configurées - Affichage */
          <div className={`rounded-xl p-4 ${darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold uppercase ${darkMode ? "text-green-400" : "text-green-700"}`}>
                Méthodes de paiement configurées ({configuredMethods.length})
              </p>
              <button
                onClick={() => setShowSetup(true)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition
                  ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
              >
                Modifier
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {configuredMethods.map((m, i) => {
                const Icon = getMethodIcon(m.type);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg
                      ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${m.type === "momo" ? "bg-yellow-100 text-yellow-600" :
                        m.type === "orange" ? "bg-orange-100 text-orange-600" :
                        "bg-blue-100 text-blue-600"}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {getMethodLabel(m.type)}
                      </p>
                      <p className={`text-[11px] truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {m.accountName} • {m.accountNumber}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATS */}
        <StatsCards stats={paymentStats} darkMode={darkMode} />

        {/* CONTENT */}
        <div className="w-full overflow-hidden">
          {showHistory ? (
            <DoctorPaymentsHistory payments={doctorPayments} darkMode={darkMode} />
          ) : (
            <PatientsPaymentsTable
              payments={patientPayments}
              darkMode={darkMode}
              onViewDetails={setSelected}
              onDownloadReceipt={handleDownload}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}