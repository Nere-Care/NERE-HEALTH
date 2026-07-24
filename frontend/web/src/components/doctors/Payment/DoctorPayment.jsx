import { useState, useEffect, useCallback } from "react";
import PaymentSetupModal from "./PaymentSetupModal";
import StatsCards from "./StatsCards";
import WithdrawModal from "./WithdrawModal";
import PatientsPaymentsTable from "./PatientsPaymentsTable";
import DoctorPaymentsHistory from "./DoctorPaymentsHistory";
import { get } from "../../../services/apiClient";

const METHOD_LABELS = {
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
  carte_visa: "Visa",
  carte_mastercard: "Mastercard",
  virement_bancaire: "Virement bancaire",
  notchpay: "Notchpay",
  stripe: "Stripe",
  portefeuille_nere: "Portefeuille Nere",
};

const STATUS_LABELS = {
  initie: "Pending",
  en_cours: "Pending",
  paye: "Paid",
  echoue: "Failed",
  annule: "Refunded",
  rembourse: "Refunded",
};

function transformPaiement(p) {
  return {
    id: p.id,
    matricule: p.reference,
    patient: p.patient_id ? `Patient ${String(p.patient_id).slice(0, 8)}` : "-",
    patient_id: p.patient_id,
    medecin_id: p.medecin_id,
    service: METHOD_LABELS[p.methode] || p.fournisseur || "Consultation",
    amount: `${Number(p.montant_total).toLocaleString()} ${p.devise || "XAF"}`,
    method: METHOD_LABELS[p.methode] || p.methode || "-",
    date: p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "-",
    status: STATUS_LABELS[p.statut] || p.statut || "Pending",
    raw_status: p.statut,
    receipt: null,
  };
}

export default function DoctorPayments({ darkMode }) {
  const [showSetup, setShowSetup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [configured, setConfigured] = useState(false);

  const [patientPayments, setPatientPayments] = useState([]);
  const [doctorPayments, setDoctorPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await get("/api/paiements", { limit: 200 });
      const list = (data || []).map(transformPaiement);
      setPatientPayments(list);
      setDoctorPayments(list);

      const totalPaid = list
        .filter((p) => p.raw_status === "paye")
        .reduce((s, p) => s + Number(p.amount.replace(/[^0-9]/g, "")), 0);
      const totalPending = list
        .filter((p) => p.raw_status === "initie" || p.raw_status === "en_cours")
        .reduce((s, p) => s + Number(p.amount.replace(/[^0-9]/g, "")), 0);
      const totalFailed = list
        .filter((p) => p.raw_status === "echoue")
        .reduce((s, p) => s + Number(p.amount.replace(/[^0-9]/g, "")), 0);

      setPaymentStats([
        { id: 1, title: "Withdrawn Amount", amount: `${totalPaid.toLocaleString()} XAF` },
        { id: 2, title: "Ready To Withdraw", amount: `${totalPending.toLocaleString()} XAF` },
        { id: 3, title: "Settlements", amount: `${totalFailed.toLocaleString()} XAF` },
      ]);
    } catch (err) {
      console.error("Erreur chargement paiements:", err);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { if (!configured) setShowSetup(true); }, [configured]);

  return (
    <div className={`min-h-screen p-3 ${darkMode?'bg-gray-900 text-white':'bg-gray-50 text-black'}`}>
      <div className={`rounded-2xl border p-4 space-y-4 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-bold text-lg">Financial Dashboard</h1>
            <p className={`text-xs mt-0.5 ${darkMode?'text-gray-400':'text-gray-500'}`}>Manage payments</p>
          </div>
          <button onClick={()=>setShowWithdraw(true)} className="bg-green-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px]">Withdraw</button>
        </div>
        <StatsCards stats={paymentStats} darkMode={darkMode} />
        <PatientsPaymentsTable payments={patientPayments} darkMode={darkMode} />
        <div className="flex justify-end">
          <button onClick={()=>setShowHistory(true)} className="bg-blue-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px]">View History</button>
        </div>
      </div>
      <PaymentSetupModal isOpen={showSetup} setOpen={setShowSetup} setPaymentConfigured={setConfigured} darkMode={darkMode} />
      <WithdrawModal isOpen={showWithdraw} setOpen={setShowWithdraw} darkMode={darkMode} />
      {showHistory && <DoctorPaymentsHistory payments={doctorPayments} darkMode={darkMode} />}
    </div>
  );
}