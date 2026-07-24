import { useState, useEffect } from 'react';
import { Search, Filter, Star, MapPin, Clock, Heart, Video, User, Loader } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { get } from '../../services/apiClient';

export default function Annuaire({ darkMode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [medecins, setMedecins] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [specialites, setSpecialites] = useState([]);
  const [specialitesMap, setSpecialitesMap] = useState({});
  const [medecinSpecMap, setMedecinSpecMap] = useState({});
  const [structuresMap, setStructuresMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [recherche, setRecherche] = useState("");
  const [filtreSpec, setFiltreSpec] = useState(searchParams.get("specialite") || "Toutes");
  const [favoris, setFavoris] = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get('/api/medecins'),
      get('/api/specialites'),
      get('/api/medecin_specialites'),
    ]).then(async ([medecinsData, specsData, medSpecsData]) => {
      const uMap = {};
      const structMap = {};
      await Promise.all(medecinsData.map(async (m) => {
        try {
          const u = await get(`/api/users/${m.id}`);
          uMap[m.id] = u;
        } catch { /* ignore */ }
        if (m.structure_id && !structMap[m.structure_id]) {
          try {
            const s = await get(`/api/structures/${m.structure_id}`);
            structMap[m.structure_id] = s;
          } catch { /* ignore */ }
        }
      }));
      const sMap = {};
      specsData.forEach(s => { sMap[s.id] = s; });
      const msMap = {};
      medSpecsData.forEach(ms => {
        if (!msMap[ms.medecin_id]) msMap[ms.medecin_id] = [];
        msMap[ms.medecin_id].push(ms);
      });
      setMedecins(medecinsData);
      setUsersMap(uMap);
      setSpecialites(specsData);
      setSpecialitesMap(sMap);
      setMedecinSpecMap(msMap);
      setStructuresMap(structMap);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const getSpecialitePrincipale = (medId) => {
    const specs = medecinSpecMap[medId];
    if (!specs || specs.length === 0) return '';
    const principale = specs.find(s => s.principale) || specs[0];
    return specialitesMap[principale.specialite_id]?.libelle_fr || '';
  };

  const getSpecialitesNoms = (medId) => {
    const specs = medecinSpecMap[medId];
    if (!specs) return [];
    return specs.map(s => specialitesMap[s.specialite_id]?.libelle_fr).filter(Boolean);
  };

  const medecinsFiltres = medecins.filter((m) => {
    const user = usersMap[m.id];
    const nom = user ? [user.prenom, user.nom].filter(Boolean).join(' ') : '';
    const specs = getSpecialitesNoms(m.id).join(' ');
    const matchRecherche = nom.toLowerCase().includes(recherche.toLowerCase()) || specs.toLowerCase().includes(recherche.toLowerCase());
    const matchSpec = filtreSpec === "Toutes" || getSpecialitePrincipale(m.id) === filtreSpec;
    return matchRecherche && matchSpec;
  });

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`p-9 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="mb-6 -mt-2">
        <h1 className="text-2xl font-bold text-blue-500">Trouver un Médecin</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Parcourez notre réseau de professionnels de santé</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 flex-1 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Rechercher par nom ou spécialité..."
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>
        <button className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm flex-shrink-0 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
          <Filter size={16} /> Filtres
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {[{ label: "Toutes" }, ...specialites.map(s => ({ label: s.libelle_fr }))].map((spec) => (
          <button key={spec.label} onClick={() => setFiltreSpec(spec.label)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filtreSpec === spec.label ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            {spec.label}
          </button>
        ))}
      </div>

      <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{medecinsFiltres.length} médecin(s) trouvé(s)</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {medecinsFiltres.map((medecin) => {
          const user = usersMap[medecin.id];
          const nom = user ? `Dr. ${[user.prenom, user.nom].filter(Boolean).join(' ')}` : 'Médecin';
          const specPrincipale = getSpecialitePrincipale(medecin.id);
          const structure = medecin.structure_id ? structuresMap[medecin.structure_id] : null;
          const note = parseFloat(medecin.note_moyenne || 0);
          return (
            <div key={medecin.id} onClick={() => navigate(`/medecin/${medecin.id}`)}
              className={`rounded-2xl shadow p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md ${darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"}`}>
              <div className="relative">
                <div className={`w-full h-40 rounded-xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <User size={48} className="text-blue-300" />
                  )}
                </div>
                <button onClick={(e) => toggleFavori(medecin.id, e)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
                  <Heart size={16} className={favoris[medecin.id] ? "text-red-500 fill-red-500" : "text-gray-400"} />
                </button>
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${medecin.disponible_maintenant ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                  {medecin.disponible_maintenant ? "Disponible" : "Indisponible"}
                </div>
              </div>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{nom}</p>
                    <p className="text-xs text-blue-500 font-medium">{specPrincipale}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#FBBF24" className="text-yellow-400" />
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{note.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-gray-400" />
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{medecin.annees_experience} ans d'expérience</span>
                </div>
                {structure && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-400" />
                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{structure.nom_etablissement} • {structure.ville}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {getSpecialitesNoms(medecin.id).map((s, i) => (
                  <span key={i} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{s}</span>
                ))}
              </div>
              {medecin.biographie && (
                <p className={`text-xs leading-relaxed truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {medecin.biographie}
                </p>
              )}
              <div className="flex gap-2 mt-1">
                <button onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}
                  className={`flex-1 border rounded-xl py-2 text-xs font-medium ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>Message</button>
                <button onClick={(e) => { e.stopPropagation(); if (medecin.disponible_maintenant) navigate(`/medecin/${medecin.id}`); }}
                  className={`flex-1 rounded-xl py-2 text-xs font-medium ${
                    medecin.disponible_maintenant
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}>Réserver</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
