import { useState } from "react";
import { CreditCard, Smartphone, Banknote, CheckCircle } from "lucide-react";
import { saveMethodesPaiement } from "../../../services/factureService";

export default function PaymentMethods({ selected, setSelected, darkMode }) {
  const [numero, setNumero] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const methods = [
    { key: "mtn_momo",     label: "MTN Mobile Money", icon: Smartphone },
    { key: "orange_money", label: "Orange Money",      icon: Smartphone },
    { key: "bank",         label: "Virement bancaire", icon: Banknote   },
  ];

  const handleSave = async () => {
    if (!selected || !numero.trim()) return;
    try {
      setSaving(true);
      await saveMethodesPaiement([{ type: selected, valeur: numero, actif: true }]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition
    ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200"}`;

  return (
    <div className="space-y-4">
      <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
        Methode de reception des paiements
      </h2>

      <div className="grid grid-cols-1 gap-2">
        {methods.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setSelected(key); setSaved(false); }}
            className={`p-3 border-2 rounded-xl flex items-center gap-3 transition text-sm font-medium
              ${selected === key
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : darkMode
                  ? "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
          >
            <Icon size={18} />
            {label}
            {selected === key && <CheckCircle size={16} className="ml-auto text-blue-500" />}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-3">
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder={selected === "bank" ? "IBAN / Numero de compte" : "Ex: +237 6XX XXX XXX"}
            className={inputClass}
          />
          <button
            onClick={handleSave}
            disabled={saving || !numero.trim()}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50
              ${saved
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {saving ? "Sauvegarde..." : saved ? "Sauvegarde avec succes !" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}