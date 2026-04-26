import { useState } from 'react';
import { MapPin, Phone, Clock, Search } from 'lucide-react';

const data = {
  Hopitaux: [
    { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", bp: "B.P: 5408", tel: "+237 658 648 394", horaire: "24h/24", statut: "Ouvert" },
    { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", bp: "B.P: 1234", tel: "+237 658 648 395", horaire: "24h/24", statut: "Ouvert" },
    { id: 3, nom: "Hôpital Jamot", ville: "Yaoundé", bp: "B.P: 4021", tel: "+237 658 648 396", horaire: "24h/24", statut: "Ouvert" },
    { id: 4, nom: "Hôpital Laquintinie", ville: "Douala", bp: "B.P: 0000", tel: "+237 658 648 397", horaire: "24h/24", statut: "Ouvert" },
  ],
  Cliniques: [
    { id: 1, nom: "Clinique du Wouri", ville: "Douala", bp: "B.P: 2021", tel: "+237 691 234 567", horaire: "07h - 22h", statut: "Ouvert" },
    { id: 2, nom: "Clinique Bastos", ville: "Yaoundé", bp: "B.P: 3045", tel: "+237 691 234 568", horaire: "08h - 20h", statut: "Ouvert" },
    { id: 3, nom: "Clinique La Grâce", ville: "Douala", bp: "B.P: 1122", tel: "+237 691 234 569", horaire: "07h - 21h", statut: "Fermé" },
    { id: 4, nom: "Clinique Monkam", ville: "Yaoundé", bp: "B.P: 5566", tel: "+237 691 234 570", horaire: "08h - 22h", statut: "Ouvert" },
  ],
  Pharmacies: [
    { id: 1, nom: "Pharmacie du Marché Central", ville: "Yaoundé", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert" },
    { id: 2, nom: "Pharmacie Française", ville: "Douala", bp: "B.P: 2002", tel: "+237 677 123 457", horaire: "07h - 23h", statut: "Ouvert" },
    { id: 3, nom: "Pharmacie de la Paix", ville: "Bafoussam", bp: "B.P: 3003", tel: "+237 677 123 458", horaire: "08h - 20h", statut: "Fermé" },
    { id: 4, nom: "Pharmacie Ndokoti", ville: "Douala", bp: "B.P: 4004", tel: "+237 677 123 459", horaire: "24h/24", statut: "Ouvert" },
  ],
  Laboratoires: [
    { id: 1, nom: "Laboratoire Pasteur", ville: "Yaoundé", bp: "B.P: 5005", tel: "+237 699 111 222", horaire: "07h - 18h", statut: "Ouvert" },
    { id: 2, nom: "Labo Analyse Médicale Douala", ville: "Douala", bp: "B.P: 6006", tel: "+237 699 111 223", horaire: "07h - 17h", statut: "Ouvert" },
    { id: 3, nom: "Laboratoire Bio Santé", ville: "Bafoussam", bp: "B.P: 7007", tel: "+237 699 111 224", horaire: "08h - 16h", statut: "Fermé" },
    { id: 4, nom: "Centre d'Analyses Médicales", ville: "Yaoundé", bp: "B.P: 8008", tel: "+237 699 111 225", horaire: "07h - 19h", statut: "Ouvert" },
  ],
};

const icones = {
  Hopitaux: "H",
  Cliniques: "C",
  Pharmacies: "P",
  Laboratoires: "L",
};

const couleurs = {
  Hopitaux: { bg: "bg-blue-100", text: "text-blue-600", active: "bg-blue-500" },
  Cliniques: { bg: "bg-green-100", text: "text-green-600", active: "bg-green-500" },
  Pharmacies: { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
  Laboratoires: { bg: "bg-orange-100", text: "text-orange-600", active: "bg-orange-500" },
};

export default function StructuresSante() {
  const [onglet, setOnglet] = useState("Hopitaux");
  const [recherche, setRecherche] = useState("");

  const structures = data[onglet].filter(s =>
    s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    s.ville.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="p-4">

      {/* Titre */}
      <h1 className="text-lg font-bold text-blue-600 mb-2"></h1>
      <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-4">
      </button>

      {/* Barre de recherche */}
      <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow mb-4">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une structure..."
          className="outline-none text-sm w-full"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {Object.keys(data).map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${onglet === tab
                ? `${couleurs[tab].active} text-white shadow`
                : "bg-white text-gray-500 hover:bg-gray-50 shadow"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Compteur */}
      <p className="text-xs text-gray-400 mb-3">{structures.length} structure(s) trouvée(s)</p>

      {/* Liste */}
      <div className="flex flex-col gap-3">
        {structures.map((structure) => (
          <div
            key={structure.id}
            className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 hover:shadow-md transition-all"
          >
            {/* Icône */}
            <div className={`w-14 h-14 rounded-2xl ${couleurs[onglet].bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xl font-bold ${couleurs[onglet].text}`}>
                {icones[onglet]}
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800">{structure.nom}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${structure.statut === "Ouvert"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-500"
                  }`}>
                  {structure.statut}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} />
                  {structure.ville} • {structure.bp}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {structure.horaire}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Phone size={12} />
                {structure.tel}
              </div>
            </div>

            {/* Bouton */}
            <button className={`px-4 py-2 rounded-xl text-white text-xs font-semibold flex-shrink-0 ${couleurs[onglet].active}`}>
              Contacter
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}