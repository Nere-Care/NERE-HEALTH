import { CalendarDays, Droplets, ChevronRight, Baby } from "lucide-react";

export default function PatientListCard({ patient, onClick, darkMode }) {
  // Détection femme enceinte
  const isFemmeEnceinte =
    patient?.gender === "Female" &&
    patient?.age >= 15 &&
    patient?.age <= 50 &&
    patient?.isPregnant === true;

  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl px-4 py-4 cursor-pointer hover:shadow-md transition overflow-hidden
      ${darkMode ? "bg-gray-900 border-gray-700 hover:shadow-gray-950/40" : "bg-white border-gray-200"}
      ${isFemmeEnceinte ? (darkMode ? "border-pink-700" : "border-pink-300") : ""}`}
    >
      <div className="flex items-center gap-4 w-full min-w-0">
        {/* PHOTO */}
        <img
          src={patient.image}
          alt={patient.name}
          className="w-16 h-16 rounded-2xl object-cover shrink-0"
        />

        {/* NAME + ID */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-sm sm:text-base truncate
              ${darkMode ? "text-white" : "text-[#2C3850]"}`}>
              {patient.name}
            </h3>
            {isFemmeEnceinte && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700">
                <Baby size={10} />
                Enceinte
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm truncate
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {patient.patientId}
          </p>
        </div>

        {/* AGE + GENDER */}
        <div className={`hidden md:block text-sm whitespace-nowrap shrink-0
          ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {patient.age} yrs • {patient.gender}
        </div>

        {/* BLOOD TYPE */}
        <div className={`hidden lg:flex items-center gap-1 text-sm whitespace-nowrap shrink-0
          ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <Droplets className="w-4 h-4 text-red-500" />
          {patient.bloodType}
        </div>

        {/* LAST VISIT */}
        <div className={`hidden xl:flex items-center gap-1 text-sm whitespace-nowrap shrink-0
          ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <CalendarDays className="w-4 h-4 text-blue-500" />
          {patient.lastVisit}
        </div>

        {/* ARROW */}
        <ChevronRight
          className={`w-5 h-5 shrink-0
          ${darkMode ? "text-gray-500" : "text-gray-400"}`}
        />
      </div>
    </div>
  );
}