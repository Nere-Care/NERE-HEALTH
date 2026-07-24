import { useState } from "react";
import { CreditCard, CheckCircle, Loader2, Shield } from "lucide-react";
import Modal from "../../common/Modal";

export default function PaymentModal({ darkMode, patientName, tarif, rdvInfo, onClose, onPaid }) {
  const [method, setMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const METHODS = [
    { id: "mobile_money", label: "Mobile Money", sub: "MTN / Orange / Moov" },
    { id: "carte", label: "Carte bancaire", sub: "Visa / Mastercard" },
    { id: "especes", label: "Espèces", sub: "Paiement sur place" },
  ];

  const handlePay = () => {
    if (!method) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaid?.();
        onClose();
      }, 1800);
    }, 2000);
  };

  if (success) {
    return (
      <Modal open={true} onClose={() => {}} title="" darkMode={darkMode} size="max-w-sm">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-lg">Paiement confirmé</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Le paiement pour {patientName} a été enregistré avec succès.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={<><CreditCard className="w-5 h-5 text-blue-500" /> Paiement</>} darkMode={darkMode} size="max-w-md">
      <div className="space-y-4">
          {rdvInfo && (
            <div className={`p-3 rounded-xl text-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <p className="font-medium">{patientName}</p>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {rdvInfo.motif || "Consultation"} · {rdvInfo.date || ""} {rdvInfo.time || ""}
              </p>
            </div>
          )}

          <div>
            <p className={`text-xs font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Montant à payer</p>
            <p className="text-2xl font-bold text-blue-600">{tarif ? Number(tarif).toLocaleString("fr-FR") : "—"} FCFA</p>
          </div>

          <div>
            <p className={`text-xs font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Mode de paiement</p>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    method === m.id
                      ? "border-blue-500 bg-blue-500/10"
                      : darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    method === m.id ? "border-blue-500" : darkMode ? "border-gray-500" : "border-gray-300"
                  }`}>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`flex items-center gap-2 text-xs p-3 rounded-xl ${darkMode ? "bg-green-900/20 text-green-300" : "bg-green-50 text-green-600"}`}>
            <Shield className="w-4 h-4 shrink-0" />
            Paiement sécurisé et chiffré
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}>
            Annuler
          </button>
          <button onClick={handlePay} disabled={!method || processing}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Payer maintenant"
            )}
          </button>
        </div>
    </Modal>
  );
}
