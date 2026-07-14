import { useState, useEffect } from "react";
import { X, AlertCircle, Wallet, CheckCircle } from "lucide-react";

export default function WithdrawModal({ 
  isOpen,           // ✅ Nouveau : contrôle la visibilité
  setOpen,          // ✅ Nouveau : alternative à onClose
  onClose,          // ✅ Ancien : fonction de fermeture
  onConfirm, 
  disponible = 0,   // ✅ Valeur par défaut
  availableBalance = 0, // ✅ Alternative à disponible
  configuredMethods = [],
  darkMode 
}) {
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("mtn_momo");
  const [numero, setNumero] = useState("");
  const [sending, setSending] = useState(false);
  const [erreur, setErreur] = useState(null);

  // ✅ Calculer le solde disponible (supporte les deux formats)
  const soldeDisponible = disponible || availableBalance || 0;

  // ✅ Fermer le modal
  const handleClose = () => {
    setMontant("");
    setNumero("");
    setErreur(null);
    setSending(false);
    
    // Appeler onClose OU setOpen selon ce qui est disponible
    if (onClose) {
      onClose();
    } else if (setOpen) {
      setOpen(false);
    }
  };

  // ✅ Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ✅ Si le modal n'est pas ouvert, ne rien afficher
  if (isOpen === false) return null;

  const handleSubmit = async () => {
    const val = parseFloat(montant);
    if (!val || val <= 0) {
      setErreur("Montant invalide.");
      return;
    }
    if (val < 1000) {
      setErreur("Le montant minimum est de 1 000 XAF.");
      return;
    }
    if (val > soldeDisponible) {
      setErreur(`Solde insuffisant. Maximum: ${soldeDisponible.toLocaleString()} XAF`);
      return;
    }
    if (!numero.trim()) {
      setErreur("Veuillez entrer votre numéro de compte.");
      return;
    }
    
    try {
      setSending(true);
      setErreur(null);
      await onConfirm(val, { type: methode, label: methode });
      handleClose(); // ✅ Fermer après succès
    } catch (err) {
      setErreur(err.message || "Erreur lors du retrait");
    } finally {
      setSending(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition
    ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500" : "bg-white border-gray-200 focus:border-green-500"}`;

  // ✅ Méthodes configurées ou par défaut
  const methodesDisponibles = configuredMethods.length > 0 
    ? configuredMethods 
    : [
        { type: "mtn_momo", label: "MTN Mobile Money" },
        { type: "orange_money", label: "Orange Money" },
        { type: "bank", label: "Virement bancaire" },
      ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose} // ✅ Fermer en cliquant sur le backdrop
    >
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up
          ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
        onClick={(e) => e.stopPropagation()} // ✅ Empêcher la fermeture en cliquant dans le modal
      >

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
              <Wallet className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-600"}`} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Demande de retrait</h2>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Transfert vers votre compte
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Solde disponible */}
          <div className={`p-4 rounded-xl text-center ${darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
            <p className={`text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Solde disponible</p>
            <p className="text-3xl font-bold text-green-600">
              {soldeDisponible.toLocaleString()} <span className="text-lg">XAF</span>
            </p>
          </div>

          {erreur && (
            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm
              ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> 
              <span>{erreur}</span>
            </div>
          )}

          <div>
            <label className={`text-sm font-semibold mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Montant à retirer (XAF)
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => {
                setMontant(e.target.value);
                if (erreur) setErreur(null);
              }}
              placeholder="Ex: 25000"
              min="1000"
              className={inputClass}
            />
            
            {/* Montants rapides */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[5000, 10000, 25000, 50000].map((qa) => (
                <button
                  key={qa}
                  onClick={() => {
                    setMontant(qa.toString());
                    if (erreur) setErreur(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition
                    ${darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {qa.toLocaleString()}
                </button>
              ))}
              {soldeDisponible > 0 && (
                <button
                  onClick={() => {
                    setMontant(soldeDisponible.toString());
                    if (erreur) setErreur(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition
                    ${darkMode
                      ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                      : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={`text-sm font-semibold mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Méthode de retrait
            </label>
            <div className="space-y-2">
              {methodesDisponibles.map((m) => (
                <button
                  key={m.type}
                  onClick={() => {
                    setMethode(m.type);
                    if (erreur) setErreur(null);
                  }}
                  className={`w-full p-3 rounded-xl border-2 transition flex items-center gap-3 text-left
                    ${methode === m.type
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : darkMode
                      ? "border-gray-700 hover:border-gray-600"
                      : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${m.type === "mtn_momo" || m.type === "momo" ? "bg-yellow-100 text-yellow-600" :
                      m.type === "orange_money" || m.type === "orange" ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600"}`}>
                    <Wallet size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {m.label || m.type}
                    </p>
                    {m.accountNumber && (
                      <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {m.accountName} • {m.accountNumber}
                      </p>
                    )}
                  </div>
                  {methode === m.type && (
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`text-sm font-semibold mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {methode === "bank" ? "IBAN / Numéro de compte" : "Numéro de téléphone"}
            </label>
            <input
              type="text"
              value={numero}
              onChange={(e) => {
                setNumero(e.target.value);
                if (erreur) setErreur(null);
              }}
              placeholder={methode === "bank" ? "Ex: CM21 1000 1000 ..." : "Ex: +237 6XX XXX XXX"}
              className={inputClass}
            />
          </div>

          {/* Récapitulatif */}
          {montant && parseFloat(montant) > 0 && (
            <div className={`p-3 rounded-xl text-sm ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
              <p className="font-semibold mb-1">Récapitulatif</p>
              <p className="text-xs">
                Retrait de <strong>{parseFloat(montant).toLocaleString()} XAF</strong> via{" "}
                <strong>{methodesDisponibles.find(m => m.type === methode)?.label || methode}</strong>
              </p>
              <p className="text-xs mt-1 opacity-80">
                Délai estimé : 24 à 48 heures
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-5 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <button
            onClick={handleClose}
            disabled={sending}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition
              ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || !montant || !numero}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirmer le retrait
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}