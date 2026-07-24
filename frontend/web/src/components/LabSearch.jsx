import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FlaskConical } from "lucide-react";
import { get } from "../services/apiClient";

export default function LabSearch({
  value,
  onSelect,
  placeholder = "Rechercher une analyse...",
  darkMode = false,
  className = "",
  limit = 15,
  allowCustom = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await get("/api/analyses", { search: q, limit });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    setHighlightIdx(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handleSelect = (analyse) => {
    setQuery("");
    setOpen(false);
    setHighlightIdx(-1);
    onSelect({
      nom: analyse.nom,
      categorie: analyse.categorie,
      description: analyse.description,
    });
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (open && results.length > 0 && highlightIdx >= 0) {
        e.preventDefault();
        handleSelect(results[highlightIdx]);
      } else if (allowCustom && query.trim()) {
        e.preventDefault();
        onSelect({ nom: query.trim(), categorie: "", description: "" });
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (open && results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i > 0 ? i - 1 : results.length - 1));
      }
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <FlaskConical
          size={14}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            darkMode ? "text-gray-400" : "text-gray-400"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.length >= 2) setOpen(true);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-xs outline-none ${
            darkMode
              ? "bg-gray-500 border-gray-400 text-white placeholder-gray-400"
              : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
          }`}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div
          className={`absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border shadow-lg ${
            darkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          {results.map((analyse, i) => (
            <button
              key={analyse.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(analyse);
              }}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                i === highlightIdx
                  ? darkMode
                    ? "bg-blue-600/30 text-blue-300"
                    : "bg-blue-50 text-blue-700"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium">{analyse.nom}</span>
              <span className={`ml-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                — {analyse.categorie}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-lg border px-3 py-2 text-xs ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-gray-400"
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          {allowCustom
            ? `Appuyez sur Entree pour ajouter "${query}"`
            : `Aucun resultat pour "${query}"`}
        </div>
      )}
    </div>
  );
}
