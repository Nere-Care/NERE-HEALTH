import { Star, MapPin, Clock, Heart, User, Send } from "lucide-react";

export default function DoctorCard({ doctor, darkMode, onAskOpinion, currentUserId }) {
  const note = parseFloat(doctor.rating || 0);
  const nom = doctor.name || "Médecin";
  return (
    <div
      className={`rounded-2xl shadow p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md ${
        darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="relative">
        <div className={`w-full h-40 rounded-xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
          {doctor.image ? (
            <img src={doctor.image} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <User size={48} className="text-blue-300" />
          )}
        </div>
        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
          <Heart size={16} className="text-gray-400" />
        </button>
        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
          doctor.available ? "bg-green-500 text-white" : "bg-gray-400 text-white"
        }`}>
          {doctor.available ? "Disponible" : "Indisponible"}
        </div>
      </div>
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{nom}</p>
            <p className="text-xs text-blue-500 font-medium">{doctor.specialty}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} fill="#FBBF24" className="text-yellow-400" />
            <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{note.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {doctor.experience > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doctor.experience} ans d'expérience</span>
          </div>
        )}
        {doctor.hospital && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-gray-400" />
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{doctor.hospital}{doctor.city ? ` • ${doctor.city}` : ""}</span>
          </div>
        )}
      </div>
      {doctor.description && (
        <p className={`text-xs leading-relaxed truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {doctor.description}
        </p>
      )}
      <button
        disabled={currentUserId === doctor.id || !doctor.available}
        onClick={(e) => { e.stopPropagation(); onAskOpinion?.(doctor); }}
        className={`mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          currentUserId === doctor.id || !doctor.available
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
        }`}
        title={
          currentUserId === doctor.id
            ? "Vous ne pouvez pas demander un avis sur votre propre profil"
            : !doctor.available
            ? "Ce médecin est indisponible"
            : ""
        }
      >
        <Send size={14} />
        Ask for opinion
      </button>
    </div>
  );
}