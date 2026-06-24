import { useState, useEffect, useCallback } from 'react';
import { MapPin, Phone, Clock, Search, Star, Filter, Heart, Navigation, Grid, List, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchStructures } from '../../services/structureSante';

// Mapping type DB -> label affiché
const TYPE_LABELS = {
  hopital: "Hôpitaux",
  clinique: "Cliniques",
  pharmacie: "Pharmacies",
  laboratoire: "Laboratoires",
  centre_sante: "Centres de santé",
  cabinet: "Cabinets",
  maternite: "Maternités",
  dispensaire: "Dispensaires",
};

const TYPES_DB = ["hopital", "clinique", "pharmacie", "laboratoire", "centre_sante", "cabinet", "maternite", "dispensaire"];

const ICONES = {
  hopital: "H", clinique: "C", pharmacie: "P",
  laboratoire: "L", centre_sante: "CS", cabinet: "Cab",
  maternite: "M", dispensaire: "D",
};

const COULEURS = {
  hopital:      { bg: "bg-blue-100",   text: "text-blue-600",   active: "bg-blue-500" },
  clinique:     { bg: "bg-green-100",  text: "text-green-600",  active: "bg-green-500" },
  pharmacie:    { bg: "bg-purple-100", text: "text-purple-600", active: "bg-purple-500" },
  laboratoire:  { bg: "bg-yellow-100", text: "text-yellow-600", active: "bg-yellow-500" },
  centre_sante: { bg: "bg-pink-100",   text: "text-pink-600",   active: "bg-pink-500" },
  cabinet:      { bg: "bg-orange-100", text: "text-orange-600", active: "bg-orange-500" },
  maternite:    { bg: "bg-red-100",    text: "text-red-600",    active: "bg-red-500" },
  dispensaire:  { bg: "bg-teal-100",   text: "text-teal-600",   active: "bg-teal-500" },
};

export default function StructuresSante({ darkMode, userRole }) {
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState("hopital");
  const [recherche, setRecherche] = useState("");
  const [villeFiltre, setVilleFiltre] = useState("");
  const [noteMin, setNoteMin] = useState(0);
  const [favoris, setFavoris] = useState([]);
  const [modeAffichage, setModeAffichage] = useState("liste");
  const [showFilters, setShowFilters] = useState(false);
  const [tri, setTri] = useState("nom");

  const [structures, setStructures] = useState([]);
  const [comptes, setComptes] = useState({});
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Charger toutes les structures au montage pour avoir les comptes par type
  useEffect(() => {
    const chargerTout = async () => {
      try {
        const data = await fetchStructures({});
        // Compter par type
        const counts = {};
        TYPES_DB.forEach(t => { counts[t] = data.filter(s => s.type === t).length; });
        setComptes(counts);

        // Villes uniques
        const vs = [...new Set(data.map(s => s.ville).filter(Boolean))];
        setVilles(vs);
      } catch {}
    };
    chargerTout();
  }, []);

  // Charger structures de l'onglet actif
  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const data = await fetchStructures({
        search: recherche,
        type: onglet,
        ville: villeFiltre,
      });
      setStructures(data);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, [onglet, recherche, villeFiltre]);

  useEffect(() => {
    const delay = setTimeout(charger, 300);
    return () => clearTimeout(delay);
  }, [charger]);

  // Tri côté frontend (note et nom, distance non dispo en DB)
  const structuresFiltrees = [...structures]
    .filter(s => noteMin === 0)  // note non dispo en DB pour l'instant
    .sort((a, b) => {
      if (tri === "nom") return a.nom.localeCompare(b.nom);
      return 0;
    });

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const couleur = COULEURS[onglet] || COULEURS.hopital;
  const icone = ICONES[onglet] || "?";

  return (
    <div className={`p-4 sm:p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">Structures de Santé</h1>
        <p className={`text-sm sm:text-base mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {userRole === "doctor"
            ? "Consultez les structures partenaires pour vos patients."
            : "Trouvez et contactez facilement les centres de soins proches de vous."}
        </p>
      </div>

      {/* Recherche */}
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

      {/* Filtres avancés */}
      {showFilters && (
        <div className={`rounded-xl p-4 mb-4 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Filtres avancés</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className={`text-xs font-semibold mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Trier par</label>
              <select
                value={tri}
                onChange={(e) => setTri(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
              >
                <option value="nom">Nom (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {TYPES_DB.filter(t => comptes[t] > 0).map((type) => (
            <button
              key={type}
              onClick={() => setOnglet(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${onglet === type
                  ? `${COULEURS[type].active} text-white shadow-lg`
                  : darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500 border border-gray-100"}`}
            >
              {TYPE_LABELS[type]} ({comptes[type]})
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur */}
      {!loading && erreur && (
        <div className="text-center py-12 text-red-500">{erreur}</div>
      )}

      {/* Résultats */}
      {!loading && !erreur && (
        <>
          <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {structuresFiltrees.length} structure{structuresFiltrees.length > 1 ? "s" : ""} trouvée{structuresFiltrees.length > 1 ? "s" : ""}
          </p>

          {structuresFiltrees.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              <p className="text-lg font-semibold mb-2">Aucune structure trouvée</p>
              <p className="text-sm">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className={modeAffichage === "grille"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-4"}>
              {structuresFiltrees.map((structure) => (
                <div
                  key={structure.id}
                  onClick={() => navigate(`/profilStructure/${structure.id}`)}
                  className={`rounded-2xl p-4 cursor-pointer transition-all border relative
                    ${darkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-50 shadow-sm hover:shadow-md"}`}
                >
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
                    <div className={`w-14 h-14 rounded-2xl ${couleur.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xl font-bold ${couleur.text}`}>{icone}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold pr-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {structure.nom}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold ${
                          structure.statut_verification === "verifie" ? "text-green-500" : "text-yellow-500"
                        }`}>
                          {structure.statut_verification === "verifie" ? "Vérifié" : "En attente"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                        {structure.ville && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {structure.ville}{structure.region ? ` • ${structure.region}` : ""}
                          </span>
                        )}
                        {structure.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {structure.telephone}
                          </span>
                        )}
                        {structure.horaires && Object.keys(structure.horaires).length > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {structure.horaires.lundi?.ouverture ?? ""}
                            {structure.horaires.lundi?.fermeture ? ` - ${structure.horaires.lundi.fermeture}` : ""}
                          </span>
                        )}
                      </div>

                      {modeAffichage === "grille" && structure.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {structure.services.slice(0, 3).map((service, i) => (
                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full
                              ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
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
          )}
        </>
      )}
    </div>
  );
}