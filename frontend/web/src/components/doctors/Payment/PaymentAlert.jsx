import { ShieldCheck } from "lucide-react";

export default function PaymentAlert({ darkMode }) {
  return (
    <div
      className={`rounded-xl border p-4 flex gap-3 transition-colors ${
        darkMode
          ? "border-blue-800 bg-blue-900/20"
          : "border-blue-100 bg-blue-50"
      }`}
    >

      <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />

      <div className="text-sm">
        <p className="font-medium text-blue-700">
          Inter-Physician Billing
        </p>

        <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
          Payment applies only for specialist consultation requests.
        </p>
      </div>

    </div>
  );
}