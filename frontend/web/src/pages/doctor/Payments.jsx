import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function Payments() {
  const [selectedMethod, setSelectedMethod] = useState("card");

  const invoice = {
    patient: "John Doe",
    consultation: "General Consultation",
    amount: 15000,
    currency: "XAF",
  };

  const paymentsHistory = [
    { id: 1, method: "Card", amount: 15000, status: "paid", date: "2026-04-20" },
    { id: 2, method: "Mobile Money", amount: 10000, status: "pending", date: "2026-04-18" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* DASHBOARD OFFSET */}
      <div className="ml-0 md:ml-[260px] pt-0 md:pt-[90px] p-4 md:p-6">

        {/* ================= CENTRAL WHITE CONTAINER ================= */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 border border-gray-100">

          {/* HEADER */}
          <div>
            <h1 className="text-xl font-semibold text-[#2C3850]">
              Payments
            </h1>
            <p className="text-sm text-gray-500">
              Manage billing, invoices and transactions
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">

              {/* INVOICE */}
              <div className="border border-green-100 rounded-xl p-5 bg-green-50/30 space-y-3">

                <h2 className="font-semibold text-[#2C3850]">
                  Invoice Summary
                </h2>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="text-gray-500">Patient:</span>{" "}
                    {invoice.patient}
                  </p>

                  <p>
                    <span className="text-gray-500">Service:</span>{" "}
                    {invoice.consultation}
                  </p>

                  <p className="text-xl font-semibold text-green-700 mt-2">
                    Total: {invoice.amount} {invoice.currency}
                  </p>
                </div>

              </div>

              {/* PAYMENT METHODS */}
              <div className="border rounded-xl p-5 space-y-4">

                <h2 className="font-semibold text-[#2C3850]">
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <button
                    onClick={() => setSelectedMethod("card")}
                    className={`p-4 border rounded-xl flex items-center gap-2 transition ${
                      selectedMethod === "card"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Card
                  </button>

                  <button
                    onClick={() => setSelectedMethod("mobile")}
                    className={`p-4 border rounded-xl flex items-center gap-2 transition ${
                      selectedMethod === "mobile"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    Mobile Money
                  </button>

                  <button
                    onClick={() => setSelectedMethod("cash")}
                    className={`p-4 border rounded-xl flex items-center gap-2 transition ${
                      selectedMethod === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    Cash
                  </button>

                </div>

                <button className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition font-medium">
                  Process Payment
                </button>

              </div>

            </div>

            {/* RIGHT */}
            <div className="border rounded-xl p-5 space-y-4 bg-white">

              <h2 className="font-semibold text-[#2C3850]">
                Payment History
              </h2>

              <div className="space-y-3">

                {paymentsHistory.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-xl p-3 text-sm hover:bg-gray-50 transition"
                  >

                    <div>
                      <p className="font-medium">{p.method}</p>
                      <p className="text-xs text-gray-500">{p.date}</p>
                    </div>

                    <div className="text-right">

                      <p className="font-semibold">
                        {p.amount} XAF
                      </p>

                      <div className="text-xs flex items-center gap-1">

                        {p.status === "paid" && (
                          <span className="text-green-600 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Paid
                          </span>
                        )}

                        {p.status === "pending" && (
                          <span className="text-yellow-600 flex items-center gap-1 font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </span>
                        )}

                        {p.status === "failed" && (
                          <span className="text-red-600 flex items-center gap-1 font-medium">
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}