import { useState } from 'react';
import { Search, Filter, Star, MapPin, Clock, Heart, Video, User } from 'lucide-react';
import { medecins, specialites } from '../../constants/medecins';
import { useNavigate } from 'react-router-dom';

export default function Annuaire({ darkMode }) {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [filtreSpec, setFiltreSpec] = useState("Toutes");
  const [favoris, setFavoris] = useState(
    medecins.reduce((acc, m) => ({ ...acc, [m.id]: m.favoris }), {})
  );

  const medecinsFiltres = medecins.filter((m) => {
    const matchRecherche =
      m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      m.specialite.toLowerCase().includes(recherche.toLowerCase());

    const matchSpec = filtreSpec === "Toutes" || m.specialite === filtreSpec;

    return matchRecherche && matchSpec;
  });

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Titre */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Trouver un Médecin
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Parcourez notre réseau de professionnels de santé
        </p>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 flex-1
          ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par nom ou spécialité..."
            className={`outline-none text-sm w-full ${
              darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""
            }`}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        <button className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm flex-shrink-0
          ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
          <Filter size={16} />
          Filtres
        </button>
      </div>

      {/* Spécialités */}
      <div className="flex gap-2 flex-wrap mb-6">
        {specialites.map((spec) => (
          <button
            key={spec.label}
            onClick={() => setFiltreSpec(spec.label)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${
                filtreSpec === spec.label
                  ? "bg-blue-600 text-white"
                  : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            {spec.label}
          </button>
        ))}
      </div>

      {/* Résultats */}
      <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {medecinsFiltres.length} médecin(s) trouvé(s)
      </p>

      {/* Liste */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {medecinsFiltres.map((medecin) => (
          <div
            key={medecin.id}
            onClick={() => navigate(`/medecin/${medecin.id}`)}
            className={`rounded-2xl shadow p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md
              ${darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"}`}
          >

            {/* Image */}
            <div className="relative">
              <div className={`w-full h-40 rounded-xl flex items-center justify-center
                ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <User size={48} className="text-blue-300" />
              </div>

              <button
                onClick={(e) => toggleFavori(medecin.id, e)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"
              >
                <Heart
                  size={16}
                  className={favoris[medecin.id] ? "text-red-500 fill-red-500" : "text-gray-400"}
                />
              </button>

              <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold
                ${medecin.disponible ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                {medecin.disponible ? "Disponible" : "Indisponible"}
              </div>
            </div>

            {/* Infos */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {medecin.nom}
                  </p>
                  <p className="text-xs text-blue-500 font-medium">
                    {medecin.specialite}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Star size={12} fill="#FBBF24" className="text-yellow-400" />
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {medecin.note}
                  </span>
                </div>
              </div>

              <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {medecin.description}
              </p>
            </div>

            {/* Détails */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-gray-400" />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {medecin.experience} d'expérience
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-gray-400" />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {medecin.clinique}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">
                  Prochain : {medecin.prochainRdv}
                </span>
              </div>
            </div>

            {/* Modes */}
            <div className="flex gap-2">
              {medecin.modes.map((mode) => (
                <span
                  key={mode}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                    ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                >
                  {mode === "Video" ? <Video size={11} /> : <User size={11} />}
                  {mode}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/messages'); }}
                className={`flex-1 border rounded-xl py-2 text-xs font-medium
                  ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
              >
                Message
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/medecin/${medecin.id}`); }}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-xs font-medium hover:bg-blue-700"
              >
                Réserver
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}