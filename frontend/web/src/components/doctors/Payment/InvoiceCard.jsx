import { UserRound, CheckCircle, Clock, XCircle } from "lucide-react";

export default function InvoiceCard({ invoice, darkMode }) {
  if (!invoice) return null;

  const statutConfig = {
    confirme:   { label: "Paye",       color: "bg-green-100 text-green-600",  icon: CheckCircle },
    paid:       { label: "Paye",       color: "bg-green-100 text-green-600",  icon: CheckCircle },
    initie:     { label: "En attente", color: "bg-yellow-100 text-yellow-600", icon: Clock },
    en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-600", icon: Clock },
    pending:    { label: "En attente", color: "bg-yellow-100 text-yellow-600", icon: Clock },
    annule:     { label: "Annule",     color: "bg-red-100 text-red-600",       icon: XCircle },
    failed:     { label: "Echoue",     color: "bg-red-100 text-red-600",       icon: XCircle },
  };

  const config = statutConfig[invoice.status] || statutConfig.pending;
  const StatutIcon = config.icon;

  return (
    <div className={`rounded-xl border p-5 space-y-4 transition-colors
      ${darkMode ? "border-green-800 bg-green-900/20 text-white" : "border-green-100 bg-green-50/30 text-black"}`}>

      <div className="flex items-center justify-between">
        <h2 className={`font-semibold ${darkMode ? "text-white" : "text-[#2C3850]"}`}>
          Consultation
        </h2>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${config.color}`}>
          <StatutIcon size={12} />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <p className="flex items-center gap-2">
            <UserRound className={`w-4 h-4 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
            {invoice.patient || invoice.service || "Patient"}
          </p>
          <p>
            Date : <b>{invoice.date || "N/A"}</b>
          </p>
          <p>
            Methode : <b>{invoice.method || "N/A"}</b>
          </p>
        </div>

        <div className="space-y-2">
          <p>
            Reference : <b className="text-xs">{invoice.reference || invoice.id || "N/A"}</b>
          </p>
          <p className="text-xl font-bold text-green-700">
            {typeof invoice.amount === "number"
              ? invoice.amount.toLocaleString()
              : invoice.amount || "0"} {invoice.devise || "XAF"}
          </p>
        </div>
      </div>
    </div>
  );
}