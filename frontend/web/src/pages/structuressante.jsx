import { useState } from 'react';
import { MapPin, Phone, Clock, Search } from 'lucide-react';

const data = {
  Hopitaux: [
    { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", bp: "B.P: 5408", tel: "+237 658 648 394", horaire: "24h/24", statut: "Ouvert" },
    { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", bp: "B.P: 1234", tel: "+237 658 648 395", horaire: "24h/24", statut: "Ouvert" },
  ],
  Cliniques: [
    { id: 1, nom: "Clinique du Wouri", ville: "Douala", bp: "B.P: 2021", tel: "+237 691 234 567", horaire: "07h - 22h", statut: "Ouvert" },
  ],
  Pharmacies: [
    { id: 1, nom: "Pharmacie Centrale", ville: "Yaoundé", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert" },
  ],
  Laboratoires: [
    { id: 1, nom: "Laboratoire Pasteur", ville: "Yaoundé", bp: "B.P: 5005", tel: "+237 699 111 222", horaire: "07h - 18h", statut: "Ouvert" },
  ],
};

const icones = {
  Hopitaux: "H",
  Cliniques: "C",
  Pharmacies: "P",
  Laboratoires: "L"
};

const couleurs = {
  Hopitaux: { bg: "bg-blue-100", text: "text-blue-600", active: "bg-blue-500" },
  Cliniques: { bg: "bg-green-100", text: "text-green-600", active: "bg-green-500" },
  Pharmacies: { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
  Laboratoires: { bg: "bg-orange-100", text: "text-orange-600", active: "bg-orange-500" },
};

export default function StructuresSante({ darkMode }) {

  const [onglet, setOnglet] = useState("Hopitaux");
  const [recherche, setRecherche] = useState("");

  const structures = data[onglet].filter(s =>
    s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    s.ville.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-4">
        Structures de santé
      </h1>

      {/* Recherche */}
      <div className={`flex items-center gap-2 rounded-xl px-4 py-2 shadow mb-4
        ${darkMode ? "bg-gray-800" : "bg-white"}`}>

        <Search size={16} className="text-gray-400" />

        <input
          type="text"
          placeholder="Rechercher une structure..."
          className={`outline-none text-sm w-full
            ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(data).map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${onglet === tab
                ? `${couleurs[tab].active} text-white shadow`
                : darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700 shadow"
                  : "bg-white text-gray-500 hover:bg-gray-50 shadow"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {structures.length} structure(s) trouvée(s)
      </p>

      {/* Liste */}
      <div className="flex flex-col gap-3">
        {structures.map((structure) => (
          <div key={structure.id}
            className={`rounded-2xl shadow p-4 flex items-center gap-4
              ${darkMode ? "bg-gray-800" : "bg-white"}`}>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl ${couleurs[onglet].bg} flex items-center justify-center`}>
              <span className={`text-xl font-bold ${couleurs[onglet].text}`}>
                {icones[onglet]}
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {structure.nom}
                </h3>

                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${structure.statut === "Ouvert"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-500"
                  }`}>
                  {structure.statut}
                </span>
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {structure.ville} • {structure.bp}
                </span>

                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {structure.horaire}
                </span>
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Phone size={12} />
                {structure.tel}
              </div>
            </div>

            {/* Bouton */}
            <button className={`px-4 py-2 rounded-xl text-white text-xs font-semibold
              ${couleurs[onglet].active}`}>
              Contacter
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}