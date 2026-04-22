import { Search, Filter, MapPin, Star } from 'lucide-react';

const medecins = [
  { id: 1, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 2, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 3, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 4, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 5, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
  { id: 6, nom: "Dr. Ngassa Pierre", specialite: "Dentiste", ville: "Douala", note: 4.9 },
];

export default function Annuaire() {
  return (
    <div className="p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1">
      
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-2 bg-white">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="search anything here"
              className="outline-none text-sm w-48"
            />
          </div>
          <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Bouton Patient */}
     

      {/* Grille médecins */}
      <div className="grid grid-cols-3 gap-4">
        {medecins.map((medecin) => (
          <div key={medecin.id} className="bg-white rounded-xl shadow p-3 flex flex-col gap-2">
            
            {/* Photo */}
            <div className="w-full h-36 bg-gray-200 rounded-lg" />

            {/* Infos */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm text-gray-800">{medecin.nom}</p>
                <p className="text-xs text-blue-400">{medecin.specialite}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                {medecin.ville}
              </div>
            </div>

            {/* Note */}
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <Star size={12} fill="currentColor" />
              {medecin.note}
            </div>

            {/* Boutons */}
            <div className="flex gap-2 mt-1">
              <button className="flex-1 bg-blue-500 text-white text-xs py-2 rounded-lg hover:bg-blue-600">
                Consulter
              </button>
              <button className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-xs">
                ➤
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}