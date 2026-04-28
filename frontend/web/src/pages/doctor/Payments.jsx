import { useState } from "react";

import {
  invoiceData,
  paymentsHistory,
} from "../../constants/doctors/PaymentsData";

import PaymentAlert from "../../components/doctors/Payment/PaymentAlert";
import InvoiceCard from "../../components/doctors/Payment/InvoiceCard";
import PaymentMethods from "../../components/doctors/Payment/PaymentMethods";
import PaymentHistory from "../../components/doctors/Payment/PaymentHistory";

export default function Payments({ darkMode }) {
  const [selectedMethod, setSelectedMethod] = useState("card");

  return (
    <div
      className={`min-h-screen w-full transition-colors ${
        darkMode ? "bg-gray-900 text-white" : "bg-while text-black"
      }`}
    >

      <div className="p-3 sm:p-4 md:p-6 w-full">

        <div
          className={`rounded-2xl shadow-sm border p-4 sm:p-6 space-y-6 w-full max-w-none ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >

          <h1 className="text-xl font-semibold text-[#3b82f6]">
            Specialist Payment System
          </h1>

          <PaymentAlert darkMode={darkMode} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-6">

              <InvoiceCard
                invoice={invoiceData}
                darkMode={darkMode}
              />

              <PaymentMethods
                selected={selectedMethod}
                setSelected={setSelectedMethod}
                darkMode={darkMode}
              />

            </div>

            <PaymentHistory
              payments={paymentsHistory}
              darkMode={darkMode}
            />

          </div>

        </div>

      </div>

    </div>
  );
}