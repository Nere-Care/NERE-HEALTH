import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({ darkMode, doctor, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Supprimer ce médecin ?</h3>
          <p className="text-gray-400 mb-6">
            Vous allez supprimer <strong>{doctor.name}</strong>.<br/>
            Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onCancel}
              className={`px-5 py-2.5 rounded-xl border font-medium transition ${
                darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              Annuler
            </button>
            <button onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}