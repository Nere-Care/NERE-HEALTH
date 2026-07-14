import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import StatsCards from "../../components/doctors/payment/StatsCards";
import PaymentHistory from "../../components/doctors/payment/PaymentHistory";
import PaymentMethods from "../../components/doctors/payment/PaymentMethods";
import PaymentAlert from "../../components/doctors/payment/PaymentAlert";
import WithdrawModal from "../../components/doctors/payment/WithdrawModal";
import {
  fetchStatsPaiements,
  fetchMesPaiements,
  demanderRetrait,
} from "../../services/factureService";

export default function DoctorPayment({ darkMode }) {
  const [stats, setStats] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [statsData, paiementsData] = await Promise.all([
        fetchStatsPaiements(),
        fetchMesPaiements(),
      ]);
      setStats(statsData ?? []);
      setPayments(paiementsData ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const handleRetrait = async (montant, methode) => {
    try {
      const result = await demanderRetrait(montant, methode);
      setWithdrawSuccess(result);
      setShowWithdraw(false);
      charger();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-500">Paiements</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vos revenus et historique de paiements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={charger}
            className={`p-2 rounded-xl transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-100 border border-gray-200"}`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-500" : ""} />
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
          >
            Retirer des fonds
          </button>
        </div>
      </div>

      {/* Erreur */}
      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      {/* Succes retrait */}
      {withdrawSuccess && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4
          ${darkMode ? "bg-green-900/30 text-green-300" : "bg-green-50 text-green-700"}`}>
          Demande de retrait enregistree — Ref : {withdrawSuccess.reference}
          <button onClick={() => setWithdrawSuccess(null)} className="ml-auto text-xs underline">OK</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Stats */}
          <StatsCards stats={stats} darkMode={darkMode} />

          {/* Alerte facturation inter-medecins */}
          <PaymentAlert darkMode={darkMode} />

          {/* Methodes + Historique */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`rounded-2xl border p-5 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              <PaymentMethods
                selected={selectedMethod}
                setSelected={setSelectedMethod}
                darkMode={darkMode}
              />
            </div>

            <div className={`rounded-2xl border p-5 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              <PaymentHistory payments={payments} darkMode={darkMode} />
            </div>
          </div>

        </div>
      )}

      {/* Modal retrait */}
      {showWithdraw && (
        <WithdrawModal
          darkMode={darkMode}
          onClose={() => setShowWithdraw(false)}
          onConfirm={handleRetrait}
          disponible={stats.find(s => s.title === "Ready To Withdraw")?.amount || "0 XAF"}
        />
      )}
    </div>
  );
}