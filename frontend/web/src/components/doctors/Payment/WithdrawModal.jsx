import { X } from "lucide-react";

export default function WithdrawModal({
  isOpen,
  setOpen,
  darkMode,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">

      <div
        className={`w-full max-w-md rounded-3xl p-6 space-y-5
        ${
          darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-black"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Withdraw Funds
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-200/20 transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* FORM */}
        <div className="space-y-4">

          <input
            type="number"
            placeholder="Enter amount"
            className={`w-full rounded-2xl border p-3 outline-none
            ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
          />

          <select
            className={`w-full rounded-2xl border p-3 outline-none
            ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            }`}
          >
            <option>MTN Mobile Money</option>
            <option>Orange Money</option>
            <option>Bank Account</option>
          </select>

        </div>

        {/* BUTTON */}
        <button className="w-full rounded-2xl bg-green-600 hover:bg-green-700 py-3 text-white font-medium transition">
          Confirm Withdrawal
        </button>

      </div>
    </div>
  );
}