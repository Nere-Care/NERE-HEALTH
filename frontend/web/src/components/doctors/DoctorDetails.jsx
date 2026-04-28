// ================================
// DoctorDetails.jsx (IMPROVED)
// ================================
import {
  X,
  FileText,
  Building2,
  MapPin,
  Star,
  BriefcaseBusiness,
} from "lucide-react";

export default function DoctorDetails({
  doctor,
  onClose,
  showMore,
  setShowMore,
  darkMode,
}) {
  if (!doctor) return null;

  return (
    <div
      className={`w-full h-full relative p-4 sm:p-5 rounded-2xl ${
        darkMode ? "text-white" : "text-gray-900"
      }`}
    >
      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        className={`
          absolute top-4 right-4
          w-9 h-9 flex items-center justify-center
          rounded-full border transition
          hover:scale-105 active:scale-95
          ${
            darkMode
              ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
              : "bg-white border-gray-200 hover:bg-gray-100"
          }
        `}
      >
        <X className="w-4 h-4" />
      </button>

      {/* IMAGE */}
      <div className="overflow-hidden rounded-2xl">
        <img
          src={doctor.image}
          className="w-full h-56 sm:h-64 object-cover"
          alt={doctor.name}
        />
      </div>

      {/* NAME + SPECIALTY */}
      <div className="mt-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          {doctor.name}
        </h2>

        <p
          className={`text-sm mt-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {doctor.specialty}
        </p>
      </div>

      {/* INFO GRID */}
      <div className="mt-5 space-y-3 text-sm">

        {/* HOSPITAL */}
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 mt-0.5 opacity-80" />
          <span className="leading-snug">{doctor.hospital}</span>
        </div>

        {/* CITY + RATING */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 opacity-80" />
            <span>{doctor.city}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>{doctor.rating}</span>
          </div>

        </div>

        {/* EXPERIENCE */}
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="w-4 h-4 opacity-80" />
          <span>{doctor.experience} years experience</span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="mt-6">
        <div className="flex items-center gap-2 font-semibold mb-2">
          <FileText className="w-4 h-4 opacity-80" />
          <span>Description</span>
        </div>

        <p
          className={`text-sm leading-relaxed ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {showMore
            ? doctor.description
            : doctor.description?.slice(0, 120) + "…"}
        </p>

        {doctor.description?.length > 120 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline transition"
          >
            {showMore ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* ACTION BUTTON */}
      <div className="mt-6">
        <button
          className="
            w-full flex items-center justify-center gap-2
            py-3 rounded-xl text-sm font-medium
            bg-blue-600 text-white
            hover:bg-blue-700 active:scale-[0.98]
            transition
            focus:outline-none focus:ring-2 focus:ring-blue-400
          "
        >
          Ask for opinion
        </button>
      </div>
    </div>
  );
}