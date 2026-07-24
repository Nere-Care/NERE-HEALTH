import { useState, useEffect, useCallback } from "react";
import { Plus, Megaphone, Pencil, Trash2, Eye, X, Link } from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";

const EMOJIS = ["🔔", "📢", "🔒", "💳", "🏥", "💉", "⚠️", "🎯", "📰", "🚀"];

export default function MiseAJour({ darkMode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ titre: "", contenu: "", icon: "🔔", lien: "", est_active: true, est_visible_medecin: false });

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await API.get("/mises_a_jour", { params: { limit: 100 } });
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
    setFormData({ titre: "", contenu: "", icon: "🔔", lien: "", est_active: true, est_visible_medecin: false });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({ titre: item.titre, contenu: item.contenu, icon: item.icon || "🔔", lien: item.lien || "", est_active: item.est_active, est_visible_medecin: item.est_visible_medecin || false });
    setShowModal(true);
  };

  const openView = (item) => { setSelected(item); setShowViewModal(true); };

  const openDelete = (item) => { setSelected(item); setShowDeleteModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      toast.error("Titre et contenu requis");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await API.put(`/mises_a_jour/${editingId}`, formData);
        toast.success("Mise à jour modifiée");
      } else {
        await API.post("/mises_a_jour", formData);
        toast.success("Mise à jour créée");
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
      await API.delete(`/mises_a_jour/${selected.id}`);
      toast.success("Mise à jour supprimée");
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
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Mises à jour</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{items.length} article{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          <Plus size={18} /> Nouvelle mise à jour
        </button>
      </div>

      {items.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Megaphone size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Aucune mise à jour pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{item.icon || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</h3>
                      {!item.est_active && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>
                      )}
                      {item.est_active && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Patients</span>
                      )}
                      {item.est_visible_medecin && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Médecins</span>
                      )}
                      {item.lien && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Link size={10} /> Lien
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.contenu}</p>
                    <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{editingId ? "Modifier" : "Nouvelle mise à jour"}</h2>
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
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Titre *</label>
                <input type="text" value={formData.titre} onChange={e => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="Titre de la mise à jour" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Contenu *</label>
                <textarea rows={5} value={formData.contenu} onChange={e => setFormData(prev => ({ ...prev, contenu: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="Description détaillée..." />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Lien (optionnel)</label>
                <input type="url" value={formData.lien} onChange={e => setFormData(prev => ({ ...prev, lien: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="est_active" checked={formData.est_active} onChange={e => setFormData(prev => ({ ...prev, est_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-500" />
                <label htmlFor="est_active" className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Publié (visible par les patients)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="est_visible_medecin" checked={formData.est_visible_medecin} onChange={e => setFormData(prev => ({ ...prev, est_visible_medecin: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-500" />
                <label htmlFor="est_visible_medecin" className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Visible par les médecins</label>
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

      {/* View Modal */}
      {showViewModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowViewModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.icon || "🔔"}</span>
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{selected.titre}</h2>
              </div>
              <button onClick={() => setShowViewModal(false)} className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X size={20} /></button>
            </div>
            <div className="p-5">
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {!selected.est_active && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>}
              </p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selected.contenu}</p>
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

      {/* Delete Modal */}
      {showDeleteModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-sm p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <h2 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer la mise à jour</h2>
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
