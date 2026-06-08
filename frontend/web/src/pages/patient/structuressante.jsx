import { useState } from 'react';
import { MapPin, Phone, Clock, Search, Star, Filter, Heart, Navigation, Grid, List, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const data = {
  Hopitaux: [
    { id: 1, nom: "Hôpital Général de Yaoundé", ville: "Yaoundé", quartier: "Ahala", bp: "B.P: 5408", tel: "+237 658 648 394", horaire: "24h/24", statut: "Ouvert", note: 4.5, distance: "2.3 km", services: ["Urgences", "Chirurgie", "Maternité", "Pédiatrie"], medecins: 45, assurance: ["CNPS", "Chanas Assurances"] },
    { id: 2, nom: "Hôpital Central de Yaoundé", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1234", tel: "+237 658 648 395", horaire: "24h/24", statut: "Ouvert", note: 4.2, distance: "3.1 km", services: ["Urgences", "Cardiologie", "Neurologie"], medecins: 38, assurance: ["CNPS"] },
    { id: 3, nom: "Hôpital Jamot", ville: "Yaoundé", quartier: "Mfandena", bp: "B.P: 4021", tel: "+237 658 648 396", horaire: "24h/24", statut: "Ouvert", note: 3.8, distance: "4.5 km", services: ["Pneumologie", "Psychiatrie"], medecins: 25, assurance: ["CNPS", "Activa"] },
    { id: 4, nom: "Hôpital Laquintinie", ville: "Douala", quartier: "Akwa", bp: "B.P: 0000", tel: "+237 658 648 397", horaire: "24h/24", statut: "Ouvert", note: 4.0, distance: "1.8 km", services: ["Urgences", "Maternité", "Chirurgie"], medecins: 52, assurance: ["CNPS", "Chanas"] },
  ],
  Cliniques: [
    { id: 5, nom: "Clinique du Wouri", ville: "Douala", quartier: "Akwa", bp: "B.P: 2021", tel: "+237 691 234 567", horaire: "07h - 22h", statut: "Ouvert", note: 4.7, distance: "0.8 km", services: ["Consultations", "Analyses", "Imagerie"], medecins: 15, assurance: ["CNPS", "Activa", "Chanas"] },
    { id: 6, nom: "Clinique Bastos", ville: "Yaoundé", quartier: "Bastos", bp: "B.P: 3045", tel: "+237 691 234 568", horaire: "08h - 20h", statut: "Ouvert", note: 4.6, distance: "5.2 km", services: ["VIP", "Consultations", "Chirurgie esthétique"], medecins: 12, assurance: ["International"] },
    { id: 7, nom: "Clinique La Grâce", ville: "Douala", quartier: "Bonanjo", bp: "B.P: 1122", tel: "+237 691 234 569", horaire: "07h - 21h", statut: "Fermé", note: 3.5, distance: "3.4 km", services: ["Consultations", "Maternité"], medecins: 8, assurance: ["CNPS"] },
    { id: 8, nom: "Clinique Monkam", ville: "Yaoundé", quartier: "Bastos", bp: "B.P: 5566", tel: "+237 691 234 570", horaire: "08h - 22h", statut: "Ouvert", note: 4.3, distance: "6.1 km", services: ["Consultations", "Analyses"], medecins: 10, assurance: ["CNPS", "Activa"] },
  ],
  Pharmacies: [
    { id: 9, nom: "Pharmacie du Marché Central", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert", note: 4.8, distance: "1.2 km", services: ["Médicaments", "Parapharmacie", "Conseils"], medecins: 3, assurance: [] },
    { id: 10, nom: "Pharmacie Française", ville: "Douala", quartier: "Akwa", bp: "B.P: 2002", tel: "+237 677 123 457", horaire: "07h - 23h", statut: "Ouvert", note: 4.5, distance: "2.1 km", services: ["Médicaments", "Livraison"], medecins: 2, assurance: [] },
    { id: 11, nom: "Pharmacie de la Paix", ville: "Bafoussam", quartier: "Centre", bp: "B.P: 3003", tel: "+237 677 123 458", horaire: "08h - 20h", statut: "Fermé", note: 3.9, distance: "150 km", services: ["Médicaments"], medecins: 2, assurance: [] },
    { id: 12, nom: "Pharmacie Ndokoti", ville: "Douala", quartier: "Ndokoti", bp: "B.P: 4004", tel: "+237 677 123 459", horaire: "24h/24", statut: "Ouvert", note: 4.1, distance: "4.7 km", services: ["Médicaments", "Garde de nuit"], medecins: 4, assurance: [] },
  ],
  Laboratoires: [
    { id: 13, nom: "Laboratoire du Marché Central", ville: "Yaoundé", quartier: "Centre", bp: "B.P: 1001", tel: "+237 677 123 456", horaire: "08h - 22h", statut: "Ouvert", note: 4.8, distance: "1.5 km", services: ["Analyses sanguines", "Biologie", "Sérologie"], medecins: 5, assurance: ["CNPS"] },
    { id: 14, nom: "Laboratoire Française", ville: "Douala", quartier: "Akwa", bp: "B.P: 2002", tel: "+237 677 123 457", horaire: "07h - 23h", statut: "Ouvert", note: 4.5, distance: "2.3 km", services: ["Analyses complètes", "Imagerie"], medecins: 6, assurance: ["CNPS", "Activa"] },
    { id: 15, nom: "Laboratoire de la Paix", ville: "Bafoussam", quartier: "Centre", bp: "B.P: 3003", tel: "+237 677 123 458", horaire: "08h - 20h", statut: "Fermé", note: 3.9, distance: "150 km", services: ["Analyses de base"], medecins: 3, assurance: [] },
    { id: 16, nom: "Laboratoire Ndokoti", ville: "Douala", quartier: "Ndokoti", bp: "B.P: 4004", tel: "+237 677 123 459", horaire: "24h/24", statut: "Ouvert", note: 4.1, distance: "5.0 km", services: ["Urgences biologiques", "Analyses"], medecins: 4, assurance: ["CNPS"] },
  ],
};

const icones = { Hopitaux: "H", Cliniques: "C", Pharmacies: "P", Laboratoires: "L" };
const couleurs = {
  Hopitaux: { bg: "bg-blue-100", text: "text-blue-600", active: "bg-blue-500" },
  Cliniques: { bg: "bg-green-100", text: "text-green-600", active: "bg-green-500" },
  Pharmacies: { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
  Laboratoires: { bg: "bg-yellow-100", text: "text-yellow-600", active: "bg-yellow-500" },
};

export default function StructuresSante({ darkMode, userRole }) {
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("Hopitaux");
  const [recherche, setRecherche] = useState("");
  const [villeFiltre, setVilleFiltre] = useState("");
  const [noteMin, setNoteMin] = useState(0);
  const [favoris, setFavoris] = useState([]);
  const [modeAffichage, setModeAffichage] = useState("liste");
  const [showFilters, setShowFilters] = useState(false);
  const [tri, setTri] = useState("note");

  const structures = data[onglet]
    .filter((s) => {
      const matchRecherche = s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
                            s.ville.toLowerCase().includes(recherche.toLowerCase()) ||
                            s.quartier?.toLowerCase().includes(recherche.toLowerCase());
      const matchVille = !villeFiltre || s.ville === villeFiltre;
      const matchNote = s.note >= noteMin;
      return matchRecherche && matchVille && matchNote;
    })
    .sort((a, b) => {
      if (tri === "note") return b.note - a.note;
      if (tri === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
      return a.nom.localeCompare(b.nom);
    });

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const villes = [...new Set(data[onglet].map(s => s.ville))];

  return (
    <div className={`p-4 sm:p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
          Structures de Santé
        </h1>
        <p className={`text-sm sm:text-base mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {userRole === "doctor" 
            ? "Consultez les structures partenaires pour vos patients."
            : "Trouvez et contactez facilement les centres de soins proches de vous."}
        </p>
      </div>

      {/* Barre de recherche + Filtres */}
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 flex items-center gap-2 rounded-xl px-4 py-3 shadow-sm border
          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville ou quartier..."
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl shadow-sm border transition
            ${showFilters
              ? "bg-blue-500 text-white border-blue-500"
              : darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-100 text-gray-600"}`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className={`rounded-xl p-4 mb-4 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Filtres avancés</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Ville</label>
              <select
                value={villeFiltre}
                onChange={(e) => setVilleFiltre(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
              >
                <option value="">Toutes les villes</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Note minimum</label>
              <select
                value={noteMin}
                onChange={(e) => setNoteMin(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
              >
                <option value={0}>Toutes les notes</option>
                <option value={3}>3+ étoiles</option>
                <option value={4}>4+ étoiles</option>
                <option value={4.5}>4.5+ étoiles</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Trier par</label>
              <select
                value={tri}
                onChange={(e) => setTri(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
              >
                <option value="note">Meilleure note</option>
                <option value="distance">Plus proche</option>
                <option value="nom">Nom (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Onglets + Mode affichage */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(data).map((tab) => (
            <button
              key={tab}
              onClick={() => setOnglet(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${onglet === tab
                  ? `${couleurs[tab].active} text-white shadow-lg`
                  : darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500 border border-gray-100"}`}
            >
              {tab} ({data[tab].length})
            </button>
          ))}
        </div>
        <div className={`hidden sm:flex gap-1 p-1 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <button
            onClick={() => setModeAffichage("liste")}
            className={`p-2 rounded ${modeAffichage === "liste" ? "bg-blue-500 text-white" : "text-gray-500"}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setModeAffichage("grille")}
            className={`p-2 rounded ${modeAffichage === "grille" ? "bg-blue-500 text-white" : "text-gray-500"}`}
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Compteur */}
      <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {structures.length} structure{structures.length > 1 ? "s" : ""} trouvée{structures.length > 1 ? "s" : ""}
      </p>

      {/* Liste/Grille des structures */}
      <div className={modeAffichage === "grille" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
        {structures.map((structure) => (
          <div
            key={structure.id}
            onClick={() => navigate(`/profilStructure/${structure.id}`)}
            className={`rounded-2xl p-4 cursor-pointer transition-all border relative
              ${darkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-50 shadow-sm hover:shadow-md"}`}
          >
            {/* Favori */}
            <button
              onClick={(e) => toggleFavori(structure.id, e)}
              className="absolute top-3 right-3 z-10"
            >
              <Heart
                size={18}
                className={favoris.includes(structure.id) ? "fill-red-500 text-red-500" : "text-gray-400"}
              />
            </button>

            <div className="flex items-start gap-4">
              {/* Icône */}
              <div className={`w-14 h-14 rounded-2xl ${couleurs[onglet].bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-xl font-bold ${couleurs[onglet].text}`}>
                  {icones[onglet]}
                </span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold pr-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {structure.nom}
                </h3>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-500">{structure.note}</span>
                  </div>
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>•</span>
                  <span className={`text-xs ${structure.statut === "Ouvert" ? "text-green-500 font-semibold" : "text-red-500"}`}>
                    {structure.statut}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {structure.ville} {structure.quartier && `• ${structure.quartier}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation size={10} />
                    {structure.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {structure.horaire}
                  </span>
                </div>

                {/* Services (mode grille) */}
                {modeAffichage === "grille" && structure.services && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {structure.services.slice(0, 3).map((service, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {structures.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <p className="text-lg font-semibold mb-2">Aucune structure trouvée</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  );
}