import { useState } from "react";
import { X, CreditCard, Smartphone, Building2, CheckCircle, Plus, Trash2 } from "lucide-react";

export default function PaymentSetupModal({
  isOpen,
  setOpen,
  darkMode,
  onSave,
  currentMethods = [],
}) {
  // Liste des méthodes sélectionnées avec leurs configs
  const [methods, setMethods] = useState(
    currentMethods.length > 0
      ? currentMethods
      : []
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const availableMethods = [
    { id: "momo", label: "MTN Mobile Money", icon: Smartphone, color: "bg-yellow-500", placeholder: "Numéro MTN (6XXXXXXXX)" },
    { id: "orange", label: "Orange Money", icon: Smartphone, color: "bg-orange-500", placeholder: "Numéro Orange (6XXXXXXXX)" },
    { id: "bank", label: "Virement bancaire", icon: Building2, color: "bg-blue-500", placeholder: "Numéro de compte" },
  ];

  // Activer/désactiver une méthode
  const toggleMethod = (methodId) => {
    const exists = methods.find(m => m.type === methodId);
    if (exists) {
      setMethods(methods.filter(m => m.type !== methodId));
    } else {
      const methodInfo = availableMethods.find(m => m.id === methodId);
      setMethods([
        ...methods,
        {
          type: methodId,
          accountName: "",
          accountNumber: "",
          iban: methodId === "bank" ? "" : null,
          label: methodInfo.label,
        }
      ]);
    }
    setErrors({});
  };

  // Mettre à jour un champ d'une méthode
  const updateMethod = (type, field, value) => {
    setMethods(methods.map(m =>
      m.type === type ? { ...m, [field]: value } : m
    ));
    if (errors[type]) {
      setErrors({ ...errors, [type]: {} });
    }
  };

  // Validation
  const validate = () => {
    if (methods.length === 0) {
      setErrors({ global: "Sélectionnez au moins une méthode" });
      return false;
    }

    const newErrors = {};
    let hasError = false;

    methods.forEach(m => {
      const methodErrors = {};
      if (!m.accountName.trim()) {
        methodErrors.accountName = "Requis";
        hasError = true;
      }
      if (!m.accountNumber.trim()) {
        methodErrors.accountNumber = "Requis";
        hasError = true;
      } else if (m.type !== "bank") {
        const phoneRegex = /^(237)?[6][0-9]{8}$/;
        const clean = m.accountNumber.replace(/\s/g, "");
        if (!phoneRegex.test(clean)) {
          methodErrors.accountNumber = "Format invalide";
          hasError = true;
        }
      }
      if (m.type === "bank" && !m.iban?.trim()) {
        methodErrors.iban = "Requis";
        hasError = true;
      }
      if (Object.keys(methodErrors).length > 0) {
        newErrors[m.type] = methodErrors;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  // Sauvegarder
  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      onSave(methods);
      setSaving(false);
    }, 500);
  };

  const inputStyle = `w-full rounded-lg border p-2.5 outline-none transition text-sm
    ${darkMode
      ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
      : "bg-white border-gray-300 text-black focus:border-blue-500"}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto
          ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Méthodes de paiement</h2>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Sélectionnez une ou plusieurs méthodes
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* SÉLECTION DES MÉTHODES */}
        <div className="mb-5">
          <label className={`text-xs font-semibold uppercase mb-2 block
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Choisir les méthodes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {availableMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = methods.some(method => method.type === m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMethod(m.id)}
                  className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2
                    ${isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : darkMode
                      ? "border-gray-700 hover:border-gray-600"
                      : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`w-8 h-8 rounded-full ${m.color} flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    isSelected ? "text-blue-600" : darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {m.label}
                  </span>
                  {isSelected && (
                    <CheckCircle size={14} className="text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
          {errors.global && (
            <p className="text-xs text-red-500 mt-2">{errors.global}</p>
          )}
        </div>

        {/* CONFIGURATION DE CHAQUE MÉTHODE SÉLECTIONNÉE */}
        {methods.length > 0 && (
          <div className="space-y-4">
            <label className={`text-xs font-semibold uppercase block
              ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Configurer les informations
            </label>

            {methods.map((m) => {
              const methodInfo = availableMethods.find(am => am.id === m.type);
              const Icon = methodInfo.icon;
              const methodErrors = errors[m.type] || {};

              return (
                <div
                  key={m.type}
                  className={`rounded-xl border-2 p-4 space-y-3
                    ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                >
                  {/* Header méthode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${methodInfo.color} flex items-center justify-center`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <span className="font-semibold text-sm">{methodInfo.label}</span>
                    </div>
                    <button
                      onClick={() => toggleMethod(m.type)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Retirer cette méthode"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Champs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        placeholder="Nom du titulaire"
                        value={m.accountName}
                        onChange={(e) => updateMethod(m.type, "accountName", e.target.value)}
                        className={`${inputStyle} ${methodErrors.accountName ? "border-red-500" : ""}`}
                      />
                      {methodErrors.accountName && (
                        <p className="text-[11px] text-red-500 mt-1">{methodErrors.accountName}</p>
                      )}
                    </div>
                    <div>
                      <input
                        placeholder={methodInfo.placeholder}
                        value={m.accountNumber}
                        onChange={(e) => updateMethod(m.type, "accountNumber", e.target.value)}
                        className={`${inputStyle} ${methodErrors.accountNumber ? "border-red-500" : ""}`}
                      />
                      {methodErrors.accountNumber && (
                        <p className="text-[11px] text-red-500 mt-1">{methodErrors.accountNumber}</p>
                      )}
                    </div>
                  </div>

                  {m.type === "bank" && (
                    <div>
                      <input
                        placeholder="IBAN"
                        value={m.iban || ""}
                        onChange={(e) => updateMethod(m.type, "iban", e.target.value)}
                        className={`${inputStyle} ${methodErrors.iban ? "border-red-500" : ""}`}
                      />
                      {methodErrors.iban && (
                        <p className="text-[11px] text-red-500 mt-1">{methodErrors.iban}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* INFO SÉCURITÉ */}
        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs mt-4
          ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
          <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            Vos informations sont chiffrées. Vous pouvez modifier ou ajouter des méthodes à tout moment.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setOpen(false)}
            className={`flex-1 py-3 rounded-xl font-medium transition
              ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || methods.length === 0}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Enregistrer ({methods.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}