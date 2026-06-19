import { UserRound } from "lucide-react";

export default function InvoiceCard({ invoice, darkMode }) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-4 transition-colors ${
        darkMode
          ? "border-green-800 bg-green-900/20 text-white"
          : "border-green-100 bg-green-50/30 text-black"
      }`}
    >

      <h2
        className={`font-semibold ${
          darkMode ? "text-white" : "text-[#2C3850]"
        }`}
      >
        Consultation Request
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

        <div className="space-y-2">

          <p className="flex items-center gap-2">
            <UserRound
              className={`w-4 h-4 ${
                darkMode ? "text-gray-300" : "text-gray-500"
              }`}
            />
            {invoice.patient}
          </p>

          <p>
            Requested by: <b>{invoice.requestedBy}</b>
          </p>

          <p>
            Specialist: <b>{invoice.specialist}</b>
          </p>

        </div>

        <div className="space-y-2">

          <p>
            Specialty: <b>{invoice.specialty}</b>
          </p>

          <p>
            Service: <b>{invoice.service}</b>
          </p>

          <p className="text-xl font-bold text-green-700">
            {invoice.amount} {invoice.currency}
          </p>

        </div>

      </div>

    </div>
  );
}