import { CalendarDays, Droplets, ChevronRight } from "lucide-react";

export default function PatientListCard({ patient, onClick, darkMode }) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl px-4 py-4 cursor-pointer hover:shadow-md transition
        ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="flex items-center gap-4 w-full min-w-0">

        {/* AVATAR INITIALES */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0
          ${darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
          {patient.initiales || "?"}
        </div>

        {/* NOM + ID */}
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm sm:text-base truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
            {patient.nom}
          </h3>
          <p className={`text-xs sm:text-sm truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {patient.numero_patient}
          </p>
        </div>

        {/* AGE + SEXE */}
        <div className={`hidden md:block text-sm whitespace-nowrap flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {patient.age ? `${patient.age} ans` : "N/A"} • {patient.sexe === "M" ? "Homme" : patient.sexe === "F" ? "Femme" : "N/A"}
        </div>

        {/* GROUPE SANGUIN */}
        {patient.groupe_sanguin && (
          <div className={`hidden lg:flex items-center gap-1 text-sm whitespace-nowrap flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <Droplets className="w-4 h-4 text-red-500" />
            {patient.groupe_sanguin}
          </div>
        )}

        {/* DERNIERE VISITE */}
        {patient.derniere_visite && (
          <div className={`hidden xl:flex items-center gap-1 text-sm whitespace-nowrap flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <CalendarDays className="w-4 h-4 text-blue-500" />
            {patient.derniere_visite}
          </div>
        )}

        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
      </div>
    </div>
  );
}