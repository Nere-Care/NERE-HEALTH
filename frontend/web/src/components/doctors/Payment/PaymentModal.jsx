import { X } from "lucide-react";

export default function PaymentModal({
  isOpen,
  setOpen,
  method,
  darkMode,
}) {
  if (!isOpen) return null;

  const inputStyle = darkMode
    ? "w-full border border-gray-700 bg-gray-800 text-white p-3 rounded-lg text-sm"
    : "w-full border p-3 rounded-lg text-sm";

  const renderContent = () => {
    switch (method) {
      case "card":
        return (
          <div className="space-y-3">
            <input placeholder="Card number" className={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="MM/YY" className={inputStyle} />
              <input placeholder="CVC" className={inputStyle} />
            </div>
          </div>
        );

      case "mobile":
        return (
          <div className="space-y-3">
            <input placeholder="Phone number" className={inputStyle} />

            <select className={inputStyle}>
              <option>MTN</option>
              <option>Orange Money</option>
            </select>
          </div>
        );

      case "wallet":
        return (
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Confirm payment using wallet balance.
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">

      <div
        className={`w-full max-w-md rounded-2xl p-5 space-y-4 animate-fadeIn ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
      >

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2
            className={`font-semibold text-sm sm:text-base ${
              darkMode ? "text-white" : "text-[#2C3850]"
            }`}
          >
            Complete Payment
          </h2>

          <button
            onClick={() => setOpen(false)}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        {renderContent()}

        {/* ACTION */}
        <button className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition text-sm sm:text-base">
          Pay Now
        </button>

      </div>
    </div>
  );
}