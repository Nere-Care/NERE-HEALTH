import { useState } from 'react';
import { MapPin, Phone, Clock, Search, Star } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';
import { useNavigate } from 'react-router-dom';

const data = {
  Hopitaux: [
    { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", bp: "B.P: 5408", tel: "+237 658 648 394", horaire: "24h/24", statut: "Ouvert", note: 4.5 },
    { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", bp: "B.P: 1234", tel: "+237 658 648 395", horaire: "24h/24", statut: "Ouvert", note: 4.2 },
    { id: 3, nom: "Hôpital Jamot", ville: "Yaoundé", bp: "B.P: 4021", tel: "+237 658 648 396", horaire: "24h/24", statut: "Ouvert", note: 3.8 },
    { id: 4, nom: "Hôpital Laquintinie", ville: "Douala", bp: "B.P: 0000", tel: "+237 658 648 397", horaire: "24h/24", statut: "Ouvert", note: 4.0 },
  ],
  Cliniques: [
    { id: 5, nom: "Clinique du Wouri", ville: "Douala", bp: "B.P: 2021", tel: "+237 691 234 567", horaire: "07h - 22h", statut: "Ouvert", note: 4.7 },
    { id: 6, nom: "Clinique Bastos", ville: "Yaoundé", bp: "B.P: 3045", tel: "+237 691 234 568", horaire: "08h - 20h", statut: "Ouvert", note: 4.6 },
    { id: 7, nom: "Clinique La Grâce", ville: "Douala", bp: "B.P: 1122", tel: "+237 691 234 569", horaire: "07h - 21h", statut: "Fermé", note: 3.5 },
    { id: 8, nom: "Clinique Monkam", ville: "Yaoundé", bp: "B.P: 5566", tel: "+237 691 234 570", horaire: "08h - 22h", statut: "Ouvert", note: 4.3 },
  ],
  Pharmacies: [
    { id: 9, nom: "Pharmacie du Marché Central", ville: "Yaoundé", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert", note: 4.8 },
    { id: 10, nom: "Pharmacie Française", ville: "Douala", bp: "B.P: 2002", tel: "+237 677 123 457", horaire: "07h - 23h", statut: "Ouvert", note: 4.5 },
    { id: 11, nom: "Pharmacie de la Paix", ville: "Bafoussam", bp: "B.P: 3003", tel: "+237 677 123 458", horaire: "08h - 20h", statut: "Fermé", note: 3.9 },
    { id: 12, nom: "Pharmacie Ndokoti", ville: "Douala", bp: "B.P: 4004", tel: "+237 677 123 459", horaire: "24h/24", statut: "Ouvert", note: 4.1 },
  ],
};

const icones = { Hopitaux: "H", Cliniques: "C", Pharmacies: "P" };
const couleurs = {
  Hopitaux: { bg: "bg-blue-100", text: "text-blue-600", active: "bg-blue-500" },
  Cliniques: { bg: "bg-green-100", text: "text-green-600", active: "bg-green-500" },
  Pharmacies: { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
};

export default function StructuresSante({ darkMode }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("Hopitaux");
  const [recherche, setRecherche] = useState("");

  const structures = data[onglet].filter(s =>
    s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    s.ville.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      
      <div className="mb-6 mt-2">
        <h1 className={`text-2xl font-extrabold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Structures de Santé
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Trouvez et localisez facilement les centres de soins proches de vous.
        </p>
      </div>

      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-sm mb-6 border
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une structure..."
          className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(data).map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${onglet === tab ? `${couleurs[tab].active} text-white shadow-lg` : 
              darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500 border border-gray-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {structures.map((structure) => (
          <div 
            key={structure.id}
            onClick={() => navigate(`/profilstructure/${structure.id}`)}
            className={`rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all border
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-50 shadow-sm"}`}
          >
            <div className={`w-14 h-14 rounded-2xl ${couleurs[onglet].bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xl font-bold ${couleurs[onglet].text}`}>{icones[onglet]}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{structure.nom}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-500">{structure.note}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={10}/>{structure.ville}</span>
                <span className="flex items-center gap-1"><Clock size={10}/>{structure.horaire}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}