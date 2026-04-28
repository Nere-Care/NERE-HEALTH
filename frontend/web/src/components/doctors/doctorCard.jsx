// ================================
// DoctorCard.jsx
// ================================
import { Star, MapPin, Send } from "lucide-react";

export default function DoctorCard({ doctor, darkMode }) {
  return (
    <div
      className={`
      flex flex-col border-2 border-[#27772B]
      rounded-2xl shadow p-4 sm:p-5
      w-full max-w-[280px] sm:max-w-[300px] mx-auto
      transition hover:shadow-lg
      ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}
    `}
    >
      {/* IMAGE */}
      <img
        src={doctor.image}
        className="
          w-full h-36 sm:h-40 md:h-44
          rounded-xl object-cover
        "
        alt={doctor.name}
      />

      {/* NAME + SPECIALTY */}
      <div className="mt-3 ">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold">
          {doctor.name}
        </h3>

        <p
          className={`text-xs sm:text-sm font-light ${
            darkMode ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {doctor.specialty}
        </p>
      </div>

      {/* INFO BLOCK */}
      <div
        className={`
        mt-4 flex flex-col sm:flex-row
        sm:justify-between gap-2 sm:gap-0
        text-sm
        ${darkMode ? "text-gray-300" : "text-gray-600"}
      `}
      >
        {/* CITY */}
        <div className="flex items-center gap-1 justify-center sm:justify-start">
          <MapPin className="w-4 h-4 " />
          <span className="text-xs sm:text-sm">{doctor.city}</span>
        </div>

        {/* RATING */}
        <div className="flex items-center gap-1 justify-center sm:justify-end font-bold">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <span className="text-xs sm:text-sm">{doctor.rating}</span>
        </div>
      </div>

      {/* HOSPITAL + EXPERIENCE */}
      <div
        className={`
        mt-2 flex flex-col sm:flex-row
        sm:justify-between gap-1 sm:gap-0
        text-xs text-center sm:text-left
        ${darkMode ? "text-gray-400" : "text-gray-500"}
      `}
      >
        <span className="truncate">{doctor.hospital}</span>

        <span>{doctor.experience} yrs exp</span>
      </div>

      {/* BUTTON */}
      <button
        className="
        w-full mt-4
        bg-[#044EEC] text-white
        py-2 rounded-lg
        hover:bg-[#033DCB] transition
        text-sm sm:text-base
      "
      >
        Ask for an opinion
      </button>
    </div>
  );
}