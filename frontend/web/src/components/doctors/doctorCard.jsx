// ================================
// DoctorCard.jsx (IMPROVED)
// ================================
import { Star, MapPin, Send } from "lucide-react";

export default function DoctorCard({ doctor, darkMode }) {
  return (
    <div
      className={`
        group flex flex-col overflow-hidden
        rounded-2xl border transition-all duration-300
        w-full max-w-[290px] sm:max-w-[310px] mx-auto
        hover:shadow-xl hover:-translate-y-1
        ${darkMode
          ? "bg-gray-900 border-gray-800 text-white"
          : "bg-white border-gray-200 text-gray-900"
        }
      `}
    >
      {/* IMAGE */}
      <div className="relative">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-full h-40 sm:h-44 md:h-48 object-cover"
        />

        {/* subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">

        {/* NAME + SPECIALTY */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold truncate">
            {doctor.name}
          </h3>

          <p
            className={`text-xs sm:text-sm mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {doctor.specialty}
          </p>
        </div>

        {/* INFO */}
        <div className="mt-4 space-y-2 text-sm">

          {/* CITY + RATING */}
          <div className="flex items-center justify-between">

            <div
              className={`flex items-center gap-1 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-xs sm:text-sm">{doctor.city}</span>
            </div>

            <div className="flex items-center gap-1 font-semibold">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs sm:text-sm">{doctor.rating}</span>
            </div>

          </div>

          {/* HOSPITAL */}
          <p
            className={`text-xs truncate ${
              darkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            {doctor.hospital}
          </p>

          {/* EXPERIENCE BADGE */}
          <div className="flex items-center justify-between">

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                darkMode
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {doctor.experience} yrs exp
            </span>

          </div>
        </div>

        {/* BUTTON */}
        <button
          className="
            mt-5 w-full flex items-center justify-center gap-2
            py-2.5 rounded-xl text-sm font-medium
            bg-blue-600 text-white
            hover:bg-blue-700 active:scale-[0.98]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-400
          "
        >
          <Send className="w-4 h-4" />
          Ask for opinion
        </button>

      </div>
    </div>
  );
}