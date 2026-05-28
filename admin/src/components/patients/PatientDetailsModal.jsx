import { X, User, Phone, Mail, MapPin, Shield, HeartPulse, Calendar, Droplet, Edit2 } from "lucide-react";

export default function PatientDetailsModal({ patient, onClose, onEdit, darkMode }) {
  if (!patient) return null;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {patient.nom?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{patient.nom}</h2>
              <p className="text-sm text-gray-400">ID: #{patient.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} 
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-800 transition" title="Modifier">
              <Edit2 size={18} />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PERSONAL INFO */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-500" /> Informations Personnelles
            </h3>
            <div className={`rounded-2xl p-4 space-y-1 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <InfoRow icon={User} label="Nom complet" value={patient.nom} />
              <InfoRow icon={Calendar} label="Âge" value={`${patient.age} ans`} />
              <InfoRow icon={User} label="Sexe" value={patient.sexe} />
              <InfoRow icon={Phone} label="Téléphone" value={patient.telephone} />
              <InfoRow icon={Mail} label="Email" value={patient.email} />
              <InfoRow icon={MapPin} label="Adresse" value={patient.adresse} />
            </div>
          </div>

          {/* MEDICAL INFO */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <HeartPulse size={18} className="text-red-500" /> Informations Médicales
            </h3>
            <div className={`rounded-2xl p-4 space-y-1 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <InfoRow icon={Droplet} label="Groupe sanguin" value={patient.groupe} />
              <InfoRow icon={HeartPulse} label="Allergies" value={patient.allergies} />
              <InfoRow icon={HeartPulse} label="Antécédents" value={patient.antecedents} />
              <InfoRow icon={User} label="Médecin traitant" value={patient.medecin} />
              <InfoRow icon={Shield} label="Assurance" value={patient.assurance} />
              <InfoRow icon={Calendar} label="Dernière connexion" value={patient.derniereConnexion} />
            </div>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="px-6 pb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            patient.statut === "Actif" 
              ? "bg-green-500/10 text-green-500" 
              : patient.statut === "Inactif" 
                ? "bg-gray-500/10 text-gray-500" 
                : "bg-yellow-500/10 text-yellow-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              patient.statut === "Actif" ? "bg-green-500" : patient.statut === "Inactif" ? "bg-gray-500" : "bg-yellow-500"
            }`}></span>
            {patient.statut}
          </div>
        </div>
      </div>
    </div>
  );
}