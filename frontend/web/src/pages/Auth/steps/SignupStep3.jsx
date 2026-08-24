import { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown, X, Loader } from "lucide-react";
import Input from "../../../components/form/Input";
import ExperienceInput from "../../../components/form/ExperienceInput";
import { FileText, User } from "lucide-react";
import { API_BASE_URL } from "../../../services/auth";

export default function SignupStep3({
  hopital,
  setHopital,
  numeroOrdre,
  setNumeroOrdre,
  experience,
  setExperience,
  presentation,
  setPresentation,
  documentsFiles,
  setDocumentsFiles,
  handleSubmit,
  loading,
  errors,
  resetToLogin,
}) {
  const [structures, setStructures] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStructure, setNewStructure] = useState({ nom: "", adresse: "", ville: "Douala", telephone: "" });
  const [addingStructure, setAddingStructure] = useState(false);
  const [addError, setAddError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/structures/list`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setStructures(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = structures.filter(s =>
    s.nom_etablissement.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (name) => {
    setHopital(name);
    setSearch("");
    setOpen(false);
  };

  const handleAddStructure = async () => {
    setAddError("");
    if (!newStructure.nom.trim()) { setAddError("Le nom est requis"); return; }
    if (!newStructure.adresse.trim()) { setAddError("L'adresse est requise"); return; }
    setAddingStructure(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/structures/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_etablissement: newStructure.nom.trim(),
          adresse: newStructure.adresse.trim(),
          ville: newStructure.ville.trim() || "Douala",
          telephone_pro: newStructure.telephone.trim() || null,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Erreur");
      }
      const result = await resp.json();
      setStructures(prev => {
        if (prev.some(s => s.id === result.id)) return prev;
        return [...prev, { id: result.id, nom_etablissement: result.nom_etablissement }].sort((a, b) => a.nom_etablissement.localeCompare(b.nom_etablissement));
      });
      setHopital(result.nom_etablissement);
      setShowAddModal(false);
      setNewStructure({ nom: "", adresse: "", ville: "Douala", telephone: "" });
    } catch (err) {
      setAddError(err.message || "Erreur lors de la création");
    } finally {
      setAddingStructure(false);
    }
  };

  const handleFileChange = (e) => {
    setDocumentsFiles([...e.target.files]);
  };

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        <div className="space-y-5">

          {/* Structure autocomplete */}
          <div ref={ref} className="relative">
            <div
              onClick={() => setOpen(!open)}
              className={`
                flex items-center justify-between
                border ${errors.hopital ? 'border-red-400' : 'border-gray-200'}
                rounded-2xl bg-white px-4 py-4 shadow-sm cursor-pointer
                hover:border-[#2F80ED] focus-within:border-[#2F80ED] transition-all
              `}
            >
              <span className={hopital ? "text-gray-700" : "text-gray-400"}>
                {hopital || "Sélectionner une structure"}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </div>

            {open && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-lg max-h-64 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48">
                  {filtered.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(s.nom_etablissement)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition ${hopital === s.nom_etablissement ? "bg-blue-50 text-[#2F80ED] font-medium" : "text-gray-700"}`}
                    >
                      {s.nom_etablissement}
                    </button>
                  ))}
                  {filtered.length === 0 && search && (
                    <p className="px-4 py-3 text-sm text-gray-400">Aucune structure trouvée</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowAddModal(true); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#2F80ED] font-medium border-t border-gray-100 hover:bg-blue-50 transition"
                >
                  <Plus className="w-4 h-4" />
                  Autre (ajouter ma structure)
                </button>
              </div>
            )}
            {errors.hopital && <p className="text-red-500 text-xs mt-1 ml-2">{errors.hopital}</p>}
          </div>

          <Input
            icon={<User className="w-5 h-5 text-gray-500" />}
            placeholder="Professional Registration Number"
            value={numeroOrdre}
            onChange={(e) => setNumeroOrdre(e.target.value)}
            error={errors.numeroOrdre}
          />

          <div>
            <ExperienceInput
              value={experience}
              setValue={setExperience}
            />
            {errors.experience && <p className="text-red-500 text-xs mt-1 ml-2">{errors.experience}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Présentation *</label>
            <textarea
              placeholder="Parlez de votre parcours, vos spécialités, votre approche..."
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 rounded-2xl border ${errors.presentation ? 'border-red-400' : 'border-gray-200'} bg-white shadow-sm focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-100 outline-none text-gray-700 placeholder:text-gray-400 resize-none transition-all`}
            />
            {errors.presentation && <p className="text-red-500 text-xs mt-1 ml-2">{errors.presentation}</p>}
          </div>

          {(errors.api || errors.dateNaissance) && (
            <p className="text-red-500 text-sm text-center">{errors.dateNaissance || errors.api}</p>
          )}

          {/* ================= UPLOAD ================= */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Pièce d'identité (CNI / Passeport) *
            </p>

            <div className={`border-2 border-dashed ${errors.documentsFiles ? 'border-red-400 bg-red-50' : 'border-blue-300 bg-blue-50'} rounded-2xl p-8 text-center`}>

              <FileText className={`w-20 h-20 mx-auto mb-4 ${errors.documentsFiles ? 'text-red-300' : 'text-blue-300'}`} />

              <label className="inline-block bg-[#2F80ED] hover:bg-[#044EC8] transition text-white px-10 py-3 rounded-xl cursor-pointer font-medium shadow-md">
                Parcourir les fichiers
                <input type="file" hidden multiple onChange={handleFileChange} />
              </label>

              <p className="text-sm text-gray-600 mt-4 font-medium">
                Veuillez joindre votre pièce d'identité (CNI ou Passeport)
              </p>
              {documentsFiles.length > 0 && (
                <div className="mt-3 text-left">
                  <p className="text-xs font-medium text-gray-600 mb-1">Fichiers sélectionnés ({documentsFiles.length}) :</p>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {[...documentsFiles].map((f, i) => (
                      <li key={i} className="truncate">• {f.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {errors.documentsFiles ? (
              <p className="text-red-500 text-xs mt-2 ml-2 font-medium">{errors.documentsFiles}</p>
            ) : (
              <p className="text-sm text-[#B97A2B] mt-3">
                Les documents fournis doivent être lisibles et authentiques pour la validation de votre profil.
              </p>
            )}
          </div>
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Submit"}
        </button>
      </div>

      {/* FOOTER */}
      <p className="text-sm mt-8 text-center text-gray-600">
        Already have an account?{" "}
        <span
          onClick={resetToLogin}
          className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
        >
          Login
        </span>
      </p>

      {/* ADD STRUCTURE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Ajouter une structure</h3>
              <button onClick={() => { setShowAddModal(false); setAddError(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la structure *</label>
                <input
                  type="text"
                  value={newStructure.nom}
                  onChange={(e) => setNewStructure(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: Hôpital Central de Yaoundé"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                <input
                  type="text"
                  value={newStructure.adresse}
                  onChange={(e) => setNewStructure(p => ({ ...p, adresse: e.target.value }))}
                  placeholder="Ex: Rue 1.234, quartier Bastos"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={newStructure.ville}
                  onChange={(e) => setNewStructure(p => ({ ...p, ville: e.target.value }))}
                  placeholder="Douala"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={newStructure.telephone}
                  onChange={(e) => setNewStructure(p => ({ ...p, telephone: e.target.value }))}
                  placeholder="6XX XXX XXX"
                  maxLength={9}
                  pattern="6[0-9]{8}"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>

              {addError && <p className="text-red-500 text-sm">{addError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddStructure}
                disabled={addingStructure}
                className="flex-1 px-4 py-3 rounded-xl bg-[#2F80ED] text-white hover:bg-[#044EC8] transition text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingStructure ? <><Loader className="w-4 h-4 animate-spin" /> Ajout...</> : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
