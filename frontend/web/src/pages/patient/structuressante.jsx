import { useState, useEffect } from 'react';
import { Search, Filter, Star, Heart, Navigation, Clock, MapPin, Grid, List, X, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../services/apiClient';

const icones = {
  "Hôpital public": "H", "Clinique privée": "C",
  "pharmacie": "P", "laboratoire": "L",
  "CHU": "U", "Centre de santé": "S"
};
const couleurs = {
  "Hôpital public": { bg: "bg-blue-100", text: "text-blue-600", active: "bg-blue-500" },
  "Clinique privée": { bg: "bg-green-100", text: "text-green-600", active: "bg-green-500" },
  "pharmacie": { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
  "laboratoire": { bg: "bg-yellow-100", text: "text-yellow-600", active: "bg-yellow-500" },
  "CHU": { bg: "bg-red-100", text: "text-red-600", active: "bg-red-500" },
  "Centre de santé": { bg: "bg-cyan-100", text: "text-cyan-600", active: "bg-cyan-500" },
};
const DEFAULT_TYPE = "Hôpital public";

function statutLisible(s) {
  if (!s) return "Fermé";
  if (s === "verifie") return "Ouvert";
  if (s === "en_attente") return "En attente";
  if (s === "en_cours_verification") return "En vérification";
  if (s === "rejete") return "Rejeté";
  if (s === "suspendu") return "Suspendu";
  return s;
}

function estOuvert(s) {
  return s === "verifie";
}

function horaireLisible(h) {
  if (!h || typeof h !== 'object') return null;
  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const parts = jours.map(j => h[j] ? `${j[0].toUpperCase() + j.slice(1)}: ${h[j]}` : null).filter(Boolean);
  if (parts.length === 0) return h.texte || null;
  return parts.join(", ");
}

export default function StructuresSante({ darkMode }) {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState("Hopitaux");
  const [recherche, setRecherche] = useState("");
  const [villeFiltre, setVilleFiltre] = useState("");
  const [noteMin, setNoteMin] = useState(0);
  const [favoris, setFavoris] = useState([]);
  const [modeAffichage, setModeAffichage] = useState("liste");
  const [showFilters, setShowFilters] = useState(false);
  const [tri, setTri] = useState("nom");

  useEffect(() => {
    get('/api/structures', { limit: 200 })
      .then(data => setStructures(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categorieMap = {
    Hopitaux: "Hôpital public", Cliniques: "Clinique privée",
    Pharmacies: "pharmacie", Laboratoires: "laboratoire",
    CHU: "CHU", "Centre de santé": "Centre de santé",
  };

  const structuresFiltrees = structures
    .filter(s => (s.type || '').toLowerCase() === (categorieMap[onglet] || '').toLowerCase())
    .filter(s => {
      const nom = s.nom_etablissement || '';
      const ville = s.ville || '';
      const q = recherche.toLowerCase();
      return nom.toLowerCase().includes(q) || ville.toLowerCase().includes(q);
    })
    .filter(s => !villeFiltre || (s.ville || '').toLowerCase() === villeFiltre.toLowerCase())
    .sort((a, b) => {
      if (tri === "nom") return (a.nom_etablissement || '').localeCompare(b.nom_etablissement || '');
      if (tri === "ville") return (a.ville || '').localeCompare(b.ville || '');
      return 0;
    });

  const villes = [...new Set(structures.filter(s => (s.type || '').toLowerCase() === (categorieMap[onglet] || '').toLowerCase()).map(s => s.ville).filter(Boolean))];

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">Structures de Santé</h1>
        <p className={`text-sm sm:text-base mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Trouvez et contactez facilement les centres de soins proches de vous.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <div className={`flex-1 flex items-center gap-2 rounded-xl px-4 py-3 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Rechercher par nom, ville..." className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}
            value={recherche} onChange={e => setRecherche(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl shadow-sm border transition ${showFilters ? "bg-blue-500 text-white border-blue-500" : darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-100 text-gray-600"}`}>
          <Filter size={18} />
        </button>
      </div>

      {showFilters && (
        <div className={`rounded-xl p-4 mb-4 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Filtres avancés</h3>
            <button onClick={() => setShowFilters(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Ville</label>
              <select value={villeFiltre} onChange={e => setVilleFiltre(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}>
                <option value="">Toutes les villes</option>
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Trier par</label>
              <select value={tri} onChange={e => setTri(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}>
                <option value="nom">Nom (A-Z)</option>
                <option value="ville">Ville</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(categorieMap).map(tab => (
            <button key={tab} onClick={() => setOnglet(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${onglet === tab ? `${couleurs[categorieMap[tab]].active} text-white shadow-lg` : darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500 border"}`}>
              {tab} ({structures.filter(s => (s.type || '').toLowerCase() === (categorieMap[tab] || '').toLowerCase()).length})
            </button>
          ))}
        </div>
        <div className={`hidden sm:flex gap-1 p-1 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <button onClick={() => setModeAffichage("liste")}
            className={`p-2 rounded ${modeAffichage === "liste" ? "bg-blue-500 text-white" : "text-gray-500"}`}><List size={16} /></button>
          <button onClick={() => setModeAffichage("grille")}
            className={`p-2 rounded ${modeAffichage === "grille" ? "bg-blue-500 text-white" : "text-gray-500"}`}><Grid size={16} /></button>
        </div>
      </div>

      <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {structuresFiltrees.length} structure{structuresFiltrees.length > 1 ? "s" : ""} trouvée{structuresFiltrees.length > 1 ? "s" : ""}
      </p>

      <div className={modeAffichage === "grille" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
        {structuresFiltrees.map(s => {
          const type = s.type || '';
          const coul = couleurs[type] || couleurs[DEFAULT_TYPE];
          const sStatut = statutLisible(s.statut_verification);
          const sOuvert = estOuvert(s.statut_verification);
          const sHoraire = horaireLisible(s.horaires_ouverture);
          return (
            <div key={s.id} onClick={() => navigate(`/profilStructure/${s.id}`)}
              className={`rounded-2xl p-4 cursor-pointer transition-all border relative ${darkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-50 shadow-sm hover:shadow-md"}`}>
              <button onClick={(e) => toggleFavori(s.id, e)} className="absolute top-3 right-3 z-10">
                <Heart size={18} className={favoris.includes(s.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
              </button>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${coul.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xl font-bold ${coul.text}`}>{icones[type] || 'S'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold pr-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{s.nom_etablissement}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${sOuvert ? "text-green-500 font-semibold" : "text-red-500"}`}>{sStatut}</span>
                    {s.note_moyenne != null && s.note_moyenne > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-yellow-500">
                        <Star size={11} className="fill-yellow-400" /> {s.note_moyenne}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {s.ville || '-'}</span>
                    {sHoraire && <span className="flex items-center gap-1"><Clock size={10} /> {sHoraire}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {structuresFiltrees.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <p className="text-lg font-semibold mb-2">Aucune structure trouvée</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  );
}
