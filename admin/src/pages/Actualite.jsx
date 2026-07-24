import { useState, useEffect, useCallback } from "react";
import { Plus, Images, Pencil, Trash2, Eye, X, Link, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";

const EMOJIS = ["📢", "🏥", "🔬", "💉", "🩺", "⚕️", "🧬", "💊", "🫀", "🧠"];
const COULEURS = [
  { label: "Rouge", value: "bg-red-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Bleu", value: "bg-blue-500" },
  { label: "Vert", value: "bg-green-500" },
  { label: "Violet", value: "bg-purple-500" },
  { label: "Teal", value: "bg-teal-500" },
];

export default function Actualite({ darkMode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ titre: "", description: "", lien: "", couleur: "bg-blue-500", icon: "📢", est_active: true, ordre: 0 });

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await API.get("/actualites", { params: { limit: 100 } });
      setItems(data);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ titre: "", description: "", lien: "", couleur: "bg-blue-500", icon: "📢", est_active: true, ordre: items.length });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({ titre: item.titre, description: item.description, lien: item.lien || "", couleur: item.couleur || "bg-blue-500", icon: item.icon || "📢", est_active: item.est_active, ordre: item.ordre || 0 });
    setShowModal(true);
  };

  const openView = (item) => { setSelected(item); setShowViewModal(true); };
  const openDelete = (item) => { setSelected(item); setShowDeleteModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim()) {
      toast.error("Titre et description requis");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await API.put(`/actualites/${editingId}`, formData);
        toast.success("Actualité modifiée");
      } else {
        await API.post("/actualites", formData);
        toast.success("Actualité créée");
      }
      setShowModal(false);
      fetchItems();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/actualites/${selected.id}`);
      toast.success("Actualité supprimée");
      setShowDeleteModal(false);
      setSelected(null);
      fetchItems();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Carrousels d'actualités</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{items.length} actualité{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          <Plus size={18} /> Nouvelle actualité
        </button>
      </div>

      {items.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Images size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Aucune actualité pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 ${item.couleur || 'bg-blue-500'}`}>
                    {item.icon || "📢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</h3>
                      {!item.est_active && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>
                      )}
                      {item.lien && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Link size={10} /> Lien
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ordre: {item.ordre}</span>
                    </div>
                    <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.description}</p>
                    <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Créé le {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      {item.updated_at && item.updated_at !== item.created_at && (
                        <> · Modifié le {new Date(item.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => openView(item)} className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Eye size={16} /></button>
                  <button onClick={() => openEdit(item)} className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Pencil size={16} /></button>
                  <button onClick={() => openDelete(item)} className="p-2 rounded-lg transition hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{editingId ? "Modifier" : "Nouvelle actualité"}</h2>
              <button onClick={() => setShowModal(false)} className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Icône</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setFormData(prev => ({ ...prev, icon: e }))}
                      className={`text-xl w-10 h-10 rounded-lg flex items-center justify-center transition ${formData.icon === e ? "bg-blue-100 ring-2 ring-blue-500" : "bg-gray-100 hover:bg-gray-200"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {COULEURS.map(c => (
                    <button key={c.value} type="button" onClick={() => setFormData(prev => ({ ...prev, couleur: c.value }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${c.value} ${formData.couleur === c.value ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}>
                      <span className="text-white text-xs font-bold">{c.label[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Titre *</label>
                <input type="text" value={formData.titre} onChange={e => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="Titre de l'actualité" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description *</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="Description détaillée..." />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Lien (optionnel)</label>
                <input type="url" value={formData.lien} onChange={e => setFormData(prev => ({ ...prev, lien: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="https://..." />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Ordre d'affichage</label>
                <input type="number" min="0" value={formData.ordre} onChange={e => setFormData(prev => ({ ...prev, ordre: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="est_active" checked={formData.est_active} onChange={e => setFormData(prev => ({ ...prev, est_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-500" />
                <label htmlFor="est_active" className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Publié (visible par les patients)</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50">
                  {isSubmitting ? "Sauvegarde..." : editingId ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowViewModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${selected.couleur || 'bg-blue-500'}`}>
                  {selected.icon || "📢"}
                </div>
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{selected.titre}</h2>
              </div>
              <button onClick={() => setShowViewModal(false)} className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X size={20} /></button>
            </div>
            <div className="p-5">
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {!selected.est_active && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>}
              </p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selected.description}</p>
              {selected.lien && (
                <div className={`mt-4 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <a href={selected.lien} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                    <Link size={16} /> Voir le lien
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-sm p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer l'actualité</h2>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Voulez-vous vraiment supprimer "{selected.titre}" ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
