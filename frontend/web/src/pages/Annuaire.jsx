import { Search, Filter, MapPin, Star } from "lucide-react";

const medecins = [
  { id: 1, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 2, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 3, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 4, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 5, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 6, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
];

export default function Annuaire({ darkMode }) {
  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">

        <h1 className={`text-xl font-bold border-b-2 pb-1 w-fit ${
          darkMode ? "text-white border-blue-500" : "text-blue-600 border-blue-600"
        }`}>
          Annuaire des médecins
        </h1>

        {/* SEARCH + FILTER */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">

          {/* SEARCH */}
          <div className={`flex items-center border rounded-lg px-3 py-2 gap-2 flex-1 min-w-0
            ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}>

            <Search size={16} className="text-gray-400 flex-shrink-0" />

            <input
              type="text"
              placeholder="Rechercher un médecin..."
              className={`outline-none text-sm w-full min-w-0
                ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : "bg-white text-gray-800"}`}
            />
          </div>

          {/* FILTER */}
          <button className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm flex-shrink-0
            ${darkMode
              ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            <Filter size={16} />
            Filtrer
          </button>

        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {medecins.map((medecin) => (
          <div
            key={medecin.id}
            className={`rounded-xl shadow p-3 flex flex-col gap-2 transition
              ${darkMode ? "bg-gray-800" : "bg-white"}
              ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
            `}
          >

            {/* IMAGE */}
            <div className={`w-full h-36 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`} />

            {/* INFO */}
            <div className="flex justify-between items-start">

              <div>
                <p className={`font-semibold text-sm ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}>
                  {medecin.nom}
                </p>

                <p className="text-xs text-blue-400">
                  {medecin.specialite}
                </p>
              </div>

              <div className={`flex items-center gap-1 text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                <MapPin size={12} />
                {medecin.ville}
              </div>

            </div>

            {/* NOTE */}
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <Star size={12} fill="currentColor" />
              {medecin.note}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-1">

              <button className="flex-1 bg-blue-500 text-white text-xs py-2 rounded-lg hover:bg-blue-600 transition">
                Consulter
              </button>

              <button className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-xs transition">
                ➤
              </button>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}