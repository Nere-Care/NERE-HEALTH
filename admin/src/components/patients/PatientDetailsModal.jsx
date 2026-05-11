import { X } from "lucide-react";

export default function PatientDetailsModal({
  patient,
  onClose,
  darkMode,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-4xl rounded-2xl p-6 overflow-y-auto max-h-[90vh] ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Fiche Patient</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-4">Informations Personnelles</h3>

            <div className="space-y-3 text-sm">
              <p><strong>Nom :</strong> {patient.nom}</p>
              <p><strong>Email :</strong> {patient.email}</p>
              <p><strong>Téléphone :</strong> {patient.telephone}</p>
              <p><strong>Adresse :</strong> {patient.adresse}</p>
              <p><strong>Sexe :</strong> {patient.sexe}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Informations Médicales</h3>

            <div className="space-y-3 text-sm">
              <p><strong>Groupe :</strong> {patient.groupe}</p>
              <p><strong>Allergies :</strong> {patient.allergies}</p>
              <p><strong>Antécédents :</strong> {patient.antecedents}</p>
              <p><strong>Médecin :</strong> {patient.medecin}</p>
              <p><strong>Assurance :</strong> {patient.assurance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}   