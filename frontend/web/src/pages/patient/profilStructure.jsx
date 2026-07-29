import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Star, Share2, Heart, Navigation, Users, Shield, Calendar, MessageCircle, Copy, CheckCircle, Loader, Send, User, ShieldCheck, Languages, Briefcase, Search } from 'lucide-react';
import { get, post } from '../../services/apiClient';
import { getStoredUser } from '../../services/auth';
import { getUserTimezone } from '../../utils/timezone';

export default function ProfilStructure({ darkMode, userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = userRole || user?.role;
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favori, setFavori] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("infos");
  const [avis, setAvis] = useState([]);
  const [moyenne, setMoyenne] = useState(null);
  const [totalAvis, setTotalAvis] = useState(0);
  const [newNote, setNewNote] = useState(0);
  const [newCommentaire, setNewCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avisLoading, setAvisLoading] = useState(false);
  const [medecins, setMedecins] = useState([]);
  const [medecinsLoading, setMedecinsLoading] = useState(false);
  const [rechercheMedecin, setRechercheMedecin] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      get(`/api/structures/${id}`),
      get(`/api/structures/${id}/avis/moyenne`),
      get(`/api/structures/${id}/avis`),
    ])
      .then(([struct, stats, avisData]) => {
        setStructure(struct);
        setMoyenne(stats.moyenne);
        setTotalAvis(stats.total);
        setAvis(avisData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== "professionnels") return;
    setMedecinsLoading(true);
    get(`/api/structures/${id}/medecins`)
      .then(data => setMedecins(data || []))
      .catch(console.error)
      .finally(() => setMedecinsLoading(false));
  }, [id, activeTab]);

  const medecinsFiltres = useMemo(() => {
    if (!rechercheMedecin.trim()) return medecins;
    const q = rechercheMedecin.toLowerCase();
    return medecins.filter(m =>
      (m.nom_complet || "").toLowerCase().includes(q) ||
      (m.specialite_principale || "").toLowerCase().includes(q) ||
      (m.specialites || []).some(s => (s.specialite || "").toLowerCase().includes(q))
    );
  }, [medecins, rechercheMedecin]);

  const loadAvis = () => {
    setAvisLoading(true);
    Promise.all([
      get(`/api/structures/${id}/avis/moyenne`),
      get(`/api/structures/${id}/avis`),
    ])
      .then(([stats, avisData]) => {
        setMoyenne(stats.moyenne);
        setTotalAvis(stats.total);
        setAvis(avisData || []);
      })
      .catch(console.error)
      .finally(() => setAvisLoading(false));
  };

  const handleSubmitAvis = async () => {
    if (newNote === 0) return;
    setSubmitting(true);
    try {
      await post(`/api/structures/${id}/avis`, {
        structure_id: id,
        note: newNote,
        commentaire: newCommentaire.trim() || null,
      });
      setNewNote(0);
      setNewCommentaire("");
      loadAvis();
    } catch (err) {
      console.error('Erreur soumission avis:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
        <p className="text-center font-bold text-lg">Structure introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">Retourner à la liste</button>
      </div>
    );
  }

  const services = (structure.services_offerts || []).map(s => typeof s === 'string' ? s : s.nom || JSON.stringify(s));

  function statutLisible(s) {
    if (!s) return "Fermé";
    if (s === "verifie") return "Ouvert";
    if (s === "en_attente") return "En attente";
    if (s === "en_cours_verification") return "En vérification";
    if (s === "rejete") return "Rejeté";
    if (s === "suspendu") return "Suspendu";
    return s;
  }
  function estOuvert(s) { return s === "verifie"; }
  const sStatut = statutLisible(structure.statut_verification);
  const sOuvert = estOuvert(structure.statut_verification);
  const horaireTexte = (() => {
    const h = structure.horaires_ouverture;
    if (!h || typeof h !== 'object') return null;
    const jours = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
    const parts = jours.map(j => h[j] ? `${j[0].toUpperCase()+j.slice(1)}: ${h[j]}` : null).filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : h.texte || null;
  })();

  const tabs = [
    { id: "infos", label: "Informations" },
    { id: "services", label: `Services (${services.length})` },
    { id: "professionnels", label: `Professionnels (${structure.nombre_professionnels || 0})` },
    { id: "avis", label: `Avis (${totalAvis})` },
  ];

  return (
    <div className={`px-4 pt-2 pb-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-medium ${darkMode ? "text-blue-400 hover:text-white" : "text-blue-600 hover:text-blue-800"}`}>
          <ArrowLeft size={18} /> Retour
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setFavori(!favori)}
            className={`p-2 rounded-full transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <Heart size={20} className={favori ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>
          <button className={`p-2 rounded-full transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <Share2 size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="relative h-24 bg-gradient-to-br from-blue-700 to-blue-400 rounded-t-3xl"></div>

      <div className="px-2 sm:px-4 -mt-12 pb-10">
        <div className={`rounded-3xl shadow-2xl p-5 sm:p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-lg ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              {structure.type || 'Structure'}
            </span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${sOuvert ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
              {sStatut}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-blue-500">{structure.nom_etablissement}</h1>

          <div className="flex items-center gap-1.5 mt-2 mb-4">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm">{moyenne !== null ? moyenne : '-'} / 5</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {moyenne !== null && moyenne > 0 && (
              <div className={`text-center p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <Star size={18} className="mx-auto mb-1 text-yellow-500" />
                <p className="text-xs font-bold">{moyenne}</p>
                <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Note ({totalAvis})</p>
              </div>
            )}
            {structure.nombre_professionnels > 0 && (
              <div onClick={() => setActiveTab("professionnels")} className={`text-center p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${darkMode ? "bg-gray-700 hover:bg-gray-650" : "bg-gray-50 hover:bg-gray-100"}`}>
                <Users size={18} className="mx-auto mb-1 text-blue-500" />
                <p className="text-xs font-bold">{structure.nombre_professionnels}</p>
                <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Professionnels de santé</p>
              </div>
            )}
          </div>

          <div className={`flex gap-1 p-1 rounded-xl mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${activeTab === tab.id ? "bg-blue-500 text-white shadow" : darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "infos" && (
            <div className="space-y-5">
              {structure.description && (
                <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{structure.description}</p>
              )}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><MapPin size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Localisation</p>
                    <p className="text-sm font-medium">{structure.ville || '-'}</p>
                  </div>
                  {structure.ville && (
                    <button onClick={() => window.open(`https://maps.google.com/?q=${structure.nom_etablissement} ${structure.ville}`, '_blank')} className="p-2 rounded-lg bg-blue-500 text-white"><Navigation size={16} /></button>
                  )}
                </div>
                {structure.telephone_pro && (
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><Phone size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Téléphone</p>
                      <p className="text-sm font-medium">{structure.telephone_pro}</p>
                    </div>
                    <button onClick={() => copyToClipboard(structure.telephone_pro)} className="p-2 rounded-lg bg-gray-200 text-gray-600">
                      {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
                {structure.email_pro && (
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><MessageCircle size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                      <p className="text-sm font-medium">{structure.email_pro}</p>
                    </div>
                  </div>
                )}
                {(structure.langues_parlees?.length > 0) && (
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><Languages size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Langues parlées</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {structure.langues_parlees.map((l, i) => (
                          <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            i % 3 === 0 ? "bg-blue-100 text-blue-700" : i % 3 === 1 ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                          }`}>{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {(structure.assurances?.length > 0) && (
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><ShieldCheck size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Assurances acceptées</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {structure.assurances.map((a, i) => (
                          <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            i % 3 === 0 ? "bg-amber-100 text-amber-700" : i % 3 === 1 ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"
                          }`}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}><Clock size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Horaires d'ouverture</p>
                    {(() => {
                      const h = structure.horaires_ouverture;
                      if (!h || typeof h !== 'object' || Object.keys(h).length === 0) {
                        return <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Non renseigné</p>;
                      }
                      const jours = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
                      const entries = jours.map(j => h[j] ? { jour: j, val: h[j] } : null).filter(Boolean);
                      if (entries.length === 0) {
                        return <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Non renseigné</p>;
                      }
                      return (
                        <div className="flex flex-col gap-1 mt-1">
                          {entries.map(({ jour, val }) => (
                            <div key={jour} className="flex items-center gap-2">
                              <span className="text-xs font-semibold capitalize w-24">{jour}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${val === "fermé" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {val === "fermé" ? "Fermé" : val}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">Services proposés</h3>
              {services.length === 0 ? (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun service listé.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((svc, i) => (
                    <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{svc}</span>
                    </div>
                  ))}
                </div>
              )}
              {(structure.equipements?.length > 0) && (
                <>
                  <h3 className="text-sm font-bold mt-4">Équipements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {structure.equipements.map((eq, i) => (
                      <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                        <Briefcase size={16} className="text-blue-500 flex-shrink-0" />
                        <span className="text-sm">{eq}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "professionnels" && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Rechercher par nom ou spécialité..."
                  className={`outline-none text-sm w-full ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : ""}`}
                  value={rechercheMedecin} onChange={(e) => setRechercheMedecin(e.target.value)} />
              </div>

              {medecinsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-blue-500" size={24} />
                </div>
              ) : medecinsFiltres.length === 0 ? (
                <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {medecins.length === 0 ? "Aucun médecin dans cette structure." : "Aucun résultat pour cette recherche."}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{medecinsFiltres.length} médecin(s)</p>
                  {medecinsFiltres.map((m) => (
                    <div key={m.id} onClick={() => navigate(`/medecin/${m.id}`)}
                      className={`rounded-xl p-4 cursor-pointer transition-all border ${darkMode ? "bg-gray-700 border-gray-600 hover:border-blue-500/50" : "bg-white border-gray-200 hover:border-blue-300"} hover:shadow-md`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${darkMode ? "bg-gray-600" : "bg-blue-50"}`}>
                          {m.photo_url ? (
                            <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-blue-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                            Dr. {m.nom_complet || `${m.prenom || ''} ${m.nom || ''}`.trim()}
                          </p>
                          <p className="text-xs text-blue-500 font-medium truncate">{m.specialite_principale || "Généraliste"}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {m.note_moyenne > 0 && (
                              <span className="flex items-center gap-0.5 text-[11px]">
                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{m.note_moyenne.toFixed(1)}</span>
                              </span>
                            )}
                            {m.annees_experience > 0 && (
                              <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{m.annees_experience} ans exp.</span>
                            )}
                            <span className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {Number(m.tarif_consultation).toLocaleString()} {m.devise}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.disponible_maintenant ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
                            {m.disponible_maintenant ? "Disponible" : "Indisponible"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "avis" && (
            <div className="space-y-5">
              {moyenne !== null && (
                <div className={`text-center p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <p className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-gray-800"}`}>{moyenne}</p>
                  <div className="flex items-center justify-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} className={s <= Math.round(moyenne) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{totalAvis} avis</p>
                </div>
              )}

              {role === "patient" && (
                <div className={`rounded-xl border p-4 ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                  <p className={`text-sm font-bold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Donnez votre avis</p>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setNewNote(s)} className="transition hover:scale-110">
                        <Star size={24} className={s <= newNote ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={newCommentaire} onChange={(e) => setNewCommentaire(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                    className={`w-full border rounded-xl p-3 text-sm outline-none focus:border-blue-400 resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
                  <button onClick={handleSubmitAvis} disabled={newNote === 0 || submitting}
                    className={`mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${newNote === 0 || submitting ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                    {submitting ? "Envoi..." : <><Send size={14} /> Publier</>}
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {avis.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun avis pour le moment.</p>
                ) : (
                  avis.map(a => (
                    <div key={a.id} className={`rounded-xl p-3 border ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Patient</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                          ))}
                        </div>
                      </div>
                      {a.commentaire && (
                        <p className={`text-xs mt-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{a.commentaire}</p>
                      )}
                      <p className={`text-[10px] mt-1.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {new Date(a.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {role === "patient" ? (
              <>
                <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                  <Calendar size={18} /> Prendre rendez-vous
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <Phone size={16} /> Appeler
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <MessageCircle size={16} /> Message
                  </button>
                </div>
              </>
            ) : (
              <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                <Phone size={18} /> Contacter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
