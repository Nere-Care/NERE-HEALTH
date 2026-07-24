import { useState, useEffect } from "react";
import { Megaphone, ChevronRight, X, Link } from "lucide-react";
import { get } from "../../../services/apiClient";

export default function NewsPanel({ darkMode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    get("/api/mises_a_jour", { limit: 5 })
      .then((data) => setItems(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <Megaphone size={16} className="text-blue-500" /> News & Updates
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-gray-400">Aucune actualité</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto" style={{ maxHeight: "260px" }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className={`w-full text-left flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition hover:opacity-80`}
            >
              <span className="text-xl mt-0.5">{item.icon || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</p>
                <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.contenu}</p>
                <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
              </div>
              <ChevronRight size={16} className={`mt-1 flex-shrink-0 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selected.icon || "🔔"}</span>
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{selected.titre}</h2>
              </div>
              <button onClick={() => setSelected(null)} className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selected.contenu}</p>
              {selected.lien && (
                <div className={`mt-4 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <a href={selected.lien} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                    <Link size={16} /> Voir le lien
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
