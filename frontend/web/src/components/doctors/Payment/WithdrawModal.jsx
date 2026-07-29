import { useState } from "react";
import { X, Wallet, AlertCircle, CheckCircle } from "lucide-react";

export default function WithdrawModal({
  isOpen,
  setOpen,
  darkMode,
  onConfirm,
  availableBalance = 0,
  configuredMethods = [],
  devise = "XAF",
}) {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(
    configuredMethods.length > 0 ? configuredMethods[0].type : null
  );
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Reset quand on ouvre
  const handleClose = () => {
    setAmount("");
    setSelectedMethod(configuredMethods.length > 0 ? configuredMethods[0].type : null);
    setErrors({});
    setOpen(false);
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    const numAmount = parseFloat(amount);
    const minAmount = (devise === "EUR" || devise === "USD" || devise === "GBP") ? 2 : 1000;

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = "Montant invalide";
    } else if (numAmount < minAmount) {
      newErrors.amount = `Minimum ${minAmount.toLocaleString()} ${devise}`;
    } else if (numAmount > availableBalance) {
      newErrors.amount = `Solde insuffisant (max: ${availableBalance} ${devise})`;
    }

    if (!selectedMethod) {
      newErrors.method = "Sélectionnez une méthode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const method = configuredMethods.find(m => m.type === selectedMethod);
    onConfirm(parseFloat(amount), method);
  };

  const getMethodLabel = (type) => {
    switch (type) {
      case "momo": return "MTN Mobile Money";
      case "orange": return "Orange Money";
      case "bank": return "Virement bancaire";
      default: return type;
    }
  };

  // Montants rapides selon la devise
  const QUICK_AMOUNTS = {
    XAF: [5000, 10000, 25000, 50000],
    EUR: [5, 10, 25, 50],
    USD: [5, 10, 25, 50],
    GBP: [5, 10, 25, 50],
    XOF: [5000, 10000, 25000, 50000],
  };
  const quickAmounts = QUICK_AMOUNTS[devise] || QUICK_AMOUNTS.XAF;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5
          ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Retirer des fonds</h2>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Solde disponible : <span className="font-bold text-green-500">{availableBalance} {devise}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* MONTANT */}
        <div>
          <label className={`text-xs font-semibold uppercase mb-2 block
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Montant à retirer
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors({ ...errors, amount: "" });
              }}
              placeholder="0"
              className={`w-full rounded-xl border p-3 pr-20 outline-none transition text-lg font-semibold
                ${darkMode
                  ? "bg-gray-800 border-gray-700 text-white focus:border-green-500"
                  : "bg-white border-gray-300 text-black focus:border-green-500"}
                ${errors.amount ? "border-red-500" : ""}`}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold
              ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {devise}
            </span>
          </div>
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.amount}
            </p>
          )}

          {/* Montants rapides */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                onClick={() => {
                  setAmount(qa.toString());
                  if (errors.amount) setErrors({ ...errors, amount: "" });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition
                  ${darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {qa.toLocaleString()}
              </button>
            ))}
            <button
              onClick={() => {
                setAmount(availableBalance.toString());
                if (errors.amount) setErrors({ ...errors, amount: "" });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition
                ${darkMode
                  ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                  : "bg-green-50 text-green-700 hover:bg-green-100"}`}
            >
              MAX
            </button>
          </div>
        </div>

        {/* MÉTHODE DE RETRAIT */}
        <div>
          <label className={`text-xs font-semibold uppercase mb-2 block
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Méthode de réception
          </label>
          <div className="space-y-2">
            {configuredMethods.map((m) => (
              <button
                key={m.type}
                onClick={() => {
                  setSelectedMethod(m.type);
                  if (errors.method) setErrors({ ...errors, method: "" });
                }}
                className={`w-full p-3 rounded-xl border-2 transition flex items-center gap-3 text-left
                  ${selectedMethod === m.type
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : darkMode
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  ${m.type === "momo" ? "bg-yellow-100 text-yellow-600" :
                    m.type === "orange" ? "bg-orange-100 text-orange-600" :
                    "bg-blue-100 text-blue-600"}`}>
                  <Wallet size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {getMethodLabel(m.type)}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {m.accountName} • {m.accountNumber}
                  </p>
                </div>
                {selectedMethod === m.type && (
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          {errors.method && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.method}
            </p>
          )}
        </div>

        {/* RÉCAP */}
        {amount && selectedMethod && (
          <div className={`p-3 rounded-xl text-sm
            ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
            <p className="font-semibold">Récapitulatif</p>
            <p className="text-xs mt-1">
              Retrait de <strong>{parseFloat(amount).toLocaleString()} {devise}</strong> vers{" "}
              <strong>{getMethodLabel(selectedMethod)}</strong>
            </p>
            <p className="text-xs mt-1 opacity-80">
              Délai estimé : 24 à 48 heures
            </p>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className={`flex-1 py-3 rounded-xl font-medium transition
              ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}