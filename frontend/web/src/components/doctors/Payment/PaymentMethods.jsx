import { useState } from "react";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import PaymentModal from "./PaymentModal";

const icons = {
  card: CreditCard,
  mobile: Smartphone,
  wallet: Banknote,
};

export default function PaymentMethods({
  selected,
  setSelected,
  darkMode,
}) {
  const [openModal, setOpenModal] = useState(false);

  const methods = [
    { key: "card", label: "Card" },
    { key: "mobile", label: "Mobile Money" },
    { key: "wallet", label: "Wallet" },
  ];

  const handleSelect = (key) => {
    setSelected(key);
    setOpenModal(true);
  };

  return (
    <div className="space-y-4">

      <h2
        className={`font-semibold ${
          darkMode ? "text-white" : "text-[#2C3850]"
        }`}
      >
        Choose Payment Method
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {methods.map((m) => {
          const Icon = icons[m.key];

          return (
            <button
              key={m.key}
              onClick={() => handleSelect(m.key)}
              className={`p-4 border rounded-xl flex items-center gap-2 transition text-sm ${
                selected === m.key
                  ? "bg-green-50 border-green-500 text-green-700"
                  : darkMode
                  ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {m.label}
            </button>
          );
        })}

      </div>

      <PaymentModal
        isOpen={openModal}
        setOpen={setOpenModal}
        method={selected}
        darkMode={darkMode}
      />

    </div>
  );
}