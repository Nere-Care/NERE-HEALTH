import { Star, MapPin, Send } from "lucide-react";

export default function DoctorCard({ doctor, darkMode, onAskOpinion }) {
  if (!doctor) return null;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 w-full max-w-[290px] sm:max-w-[310px] mx-auto hover:shadow-xl hover:-translate-y-1 ${
        darkMode ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* IMAGE */}
      <div className="relative">
        {doctor.image_url ? (
          <img src={doctor.image_url} alt={doctor.nom} className="w-full h-40 sm:h-44 md:h-48 object-cover" />
        ) : (
          <div className="w-full h-40 sm:h-44 md:h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold">
            {doctor.nom?.charAt(0) || "D"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* NAME + SPECIALTY */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold truncate">
            {doctor.nom}
          </h3>
          <p className={`text-xs sm:text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {doctor.specialite}
          </p>
        </div>

        {/* INFO */}
        <div className="mt-4 space-y-2 text-sm">
          {/* CITY + RATING */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              <MapPin className="w-4 h-4" />
              <span className="text-xs sm:text-sm">{doctor.ville || "N/A"}</span>
            </div>

            <div className="flex items-center gap-1 font-semibold">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs sm:text-sm">{doctor.note_moyenne?.toFixed(1) || "0.0"}</span>
            </div>
          </div>

          {/* HOSPITAL */}
          <p className={`text-xs truncate ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            {doctor.structure_nom || "Structure non renseignée"}
          </p>

          {/* EXPERIENCE BADGE */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              {doctor.annees_experience || 0} yrs exp
            </span>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskOpinion?.(doctor);
          }}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all duration-200"
        >
          <Send className="w-4 h-4" />
          Ask for opinion
        </button>
      </div>
    </div>
  );
}