import { useState } from "react";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Heart,
  Video,
  User,
} from "lucide-react";

import { medecins, specialites } from "../../constants/medecins";
import { useNavigate } from "react-router-dom";

export default function Annuaire({ darkMode }) {
  const navigate = useNavigate();

  const [recherche, setRecherche] = useState("");
  const [filtreSpec, setFiltreSpec] = useState("Toutes");

  const [favoris, setFavoris] = useState(
    medecins.reduce((acc, m) => ({ ...acc, [m.id]: m.favoris }), {})
  );

  const medecinsFiltres = medecins.filter((m) => {
    const matchSearch =
      m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      m.specialite.toLowerCase().includes(recherche.toLowerCase());

    const matchSpec =
      filtreSpec === "Toutes" || m.specialite === filtreSpec;

    return matchSearch && matchSpec;
  });

  const toggleFavori = (id, e) => {
    e.stopPropagation();
    setFavoris((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`p-4 space-y-5 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* ================= HEADER ================= */}
      <div className="space-y-1">
        <h1 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Trouver un médecin
        </h1>

        <p className="text-sm text-gray-500">
          Réseau de professionnels de santé disponibles
        </p>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl
        ${darkMode ? "bg-gray-800" : "bg-white shadow-sm"}`}>

        <Search size={16} className="text-gray-400" />

        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un médecin ou une spécialité..."
          className="w-full bg-transparent outline-none text-sm"
        />

        <Filter size={16} className="text-gray-400 cursor-pointer" />
      </div>

      {/* ================= SPECIALITES ================= */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {specialites.map((spec) => (
          <button
            key={spec.label}
            onClick={() => setFiltreSpec(spec.label)}
            className={`
              whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition
              ${
                filtreSpec === spec.label
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-gray-800 text-gray-300"
                  : "bg-white text-gray-600 shadow-sm"
              }
            `}
          >
            {spec.label}
          </button>
        ))}
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {medecinsFiltres.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/medecin/${m.id}`)}
            className={`
              group cursor-pointer rounded-xl p-4 transition
              ${darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:shadow-md"}
            `}
          >

            {/* TOP */}
            <div className="flex justify-between items-start">

              <div className="space-y-1">
                <h3 className="text-sm font-medium">{m.nom}</h3>

                <p className="text-xs text-blue-500 font-medium">
                  {m.specialite}
                </p>
              </div>

              {/* FAVORI */}
              <button
                onClick={(e) => toggleFavori(m.id, e)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <Heart
                  size={16}
                  className={
                    favoris[m.id]
                      ? "text-red-500 fill-red-500"
                      : "text-gray-400"
                  }
                />
              </button>
            </div>

            {/* INFO */}
            <div className="mt-3 space-y-1 text-xs text-gray-500">

              <div className="flex items-center gap-2">
                <Star size={12} className="text-yellow-400" />
                {m.note}
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={12} />
                {m.clinique}
              </div>

              <div className="flex items-center gap-2">
                <Clock size={12} />
                {m.experience} ans
              </div>

            </div>

            {/* BADGE */}
            <div className="mt-3">
              <span className={`
                text-[10px] px-2 py-1 rounded-full
                ${m.disponible
                  ? "bg-green-500/10 text-green-500"
                  : "bg-gray-500/10 text-gray-400"}
              `}>
                {m.disponible ? "Disponible" : "Indisponible"}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="mt-4 flex gap-2">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/messages");
                }}
                className="flex-1 text-xs py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Message
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/medecin/${m.id}`);
                }}
                className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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