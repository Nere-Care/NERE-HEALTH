import { useState, useEffect } from "react";
import PaymentSetupModal from "./PaymentSetupModal";
import StatsCards from "./StatsCards";
import WithdrawModal from "./WithdrawModal";
import PatientsPaymentsTable from "./PatientsPaymentsTable";
import DoctorPaymentsHistory from "./DoctorPaymentsHistory";
import { patientPayments, doctorPayments, paymentStats } from "./paymentsData";

export default function DoctorPayments({ darkMode }) {
  const [showSetup, setShowSetup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [configured, setConfigured] = useState(false);
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