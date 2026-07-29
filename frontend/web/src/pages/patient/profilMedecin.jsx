import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, User, ArrowLeft, CheckCircle, Video, Stethoscope, Loader, Globe, Award, Briefcase, List, CalendarDays, GraduationCap, FileText, CreditCard, Smartphone, X, AlertTriangle } from 'lucide-react';
import { get, post, put } from '../../services/apiClient';
import { getStoredUser } from '../../services/auth';
import { validatePhone, phoneError } from '../../utils/validatePhone';
import { getUserTimezone, slotToUTCISO } from '../../utils/timezone';
import { toXAF, formatXAF } from '../../utils/currency';
import DemandeAvisModal from '../../components/doctors/DemandeAvisModal';



export default function ProfilMedecin({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescheduleRdvId = searchParams.get("reschedule");
  const isReschedule = !!rescheduleRdvId;

  const [medecin, setMedecin] = useState(null);
  const [user, setUser] = useState(null);
  const [specialites, setSpecialites] = useState([]);
  const [specialitesMap, setSpecialitesMap] = useState({});
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  const [etape, setEtape] = useState(null);
  const [pourQui, setPourQui] = useState(null);
  const [motif, setMotif] = useState("");
  const [mode, setMode] = useState(null);
  const [creneau, setCreneau] = useState(null);
  const [favori, setFavori] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [creneauxReels, setCreneauxReels] = useState([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [slotView, setSlotView] = useState("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const [avis, setAvis] = useState([]);
  const [rescheduleRdv, setRescheduleRdv] = useState(null);
  const currentUser = getStoredUser();

  const [newNote, setNewNote] = useState(0);
  const [newCommentaire, setNewCommentaire] = useState("");
  const [submittingAvis, setSubmittingAvis] = useState(false);
  const [avisRdvId, setAvisRdvId] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [rdvCreeId, setRdvCreeId] = useState(null);
  const [methodePaiement, setMethodePaiement] = useState("");
  const [telephonePaiement, setTelephonePaiement] = useState("");
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const [paiementReussi, setPaiementReussi] = useState(false);
  const [paiementErreur, setPaiementErreur] = useState(null);
  const [showAvisForm, setShowAvisForm] = useState(false);
  const [showDemandeAvisModal, setShowDemandeAvisModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      get(`/api/medecins/${id}`),
      get(`/api/users/${id}`),
      get(`/api/medecin_specialites?medecin_id=${id}`),
      get('/api/specialites'),
      get('/api/avis', { medecin_id: id }),
    ]).then(([medData, userData, specs, allSpecs, avisData]) => {
      setMedecin(medData);
      setUser(userData);
      setSpecialites(specs);
      setAvis(Array.isArray(avisData) ? avisData : []);
      const map = {};
      allSpecs.forEach(s => { map[s.id] = s; });
      setSpecialitesMap(map);
      if (medData.structure_id) {
        get(`/api/structures/${medData.structure_id}`).then(setStructure).catch(() => { });
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !currentUser || currentUser.role !== 'patient') return;
    get('/api/rendez_vous', { patient_id: currentUser.id, limit: 50 }).then((rdvs) => {
      const completed = (rdvs || []).filter(r => r.medecin_id === id && r.statut === 'termine');
      if (completed.length > 0) {
        const rdvIds = completed.map(r => r.id);
        get('/api/avis', { medecin_id: id }).then((existingAvis) => {
          const reviewedRdvIds = new Set((existingAvis || []).map(a => a.rdv_id));
          const unreviewed = completed.find(r => !reviewedRdvIds.has(r.id));
          if (unreviewed) {
            setAvisRdvId(unreviewed.id);
          } else {
            setHasReviewed(true);
          }
        }).catch(() => { });
      }
    }).catch(() => { });
  }, [id, currentUser?.id]);

  const handleSubmitAvis = async () => {
    if (newNote < 1 || newNote > 5 || !avisRdvId) return;
    setSubmittingAvis(true);
    try {
      await post('/api/avis', {
        patient_id: currentUser.id,
        medecin_id: id,
        rdv_id: avisRdvId,
        note: newNote,
        commentaire: newCommentaire.trim() || null,
      });
      setHasReviewed(true);
      setShowAvisForm(false);
      setNewNote(0);
      setNewCommentaire("");
      const avisData = await get('/api/avis', { medecin_id: id });
      setAvis(Array.isArray(avisData) ? avisData : []);
    } catch (err) {
      console.error('Erreur soumission avis:', err);
    } finally {
      setSubmittingAvis(false);
    }
  };

  useEffect(() => {
    if (!rescheduleRdvId) return;
    get(`/api/rendez_vous/${rescheduleRdvId}`).then((rdv) => {
      setRescheduleRdv(rdv);
      setMode(rdv.type === "video" ? "teleconsultation" : "presentiel");
      setMotif(rdv.motif_consultation || "");
      setEtape("creneau");
    }).catch(() => {
      navigate("/rendez-vous");
    });
  }, [rescheduleRdvId]);

  const fetchCreneaux = async () => {
    if (!id) return;
    setLoadingCreneaux(true);
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;
      const clientNow = `${y}-${m}-${d}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const fetches = [];
      for (let i = 0; i < 28; i++) {
        const dt = new Date(y, now.getMonth(), now.getDate() + i);
        const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        fetches.push(
          get(`/api/disponibilites/creneaux/${id}`, { date: ds, now: clientNow })
            .then((slots) => ({ date: ds, slots: Array.isArray(slots) ? slots : [] }))
            .catch(() => ({ date: ds, slots: [] }))
        );
      }
      const results = await Promise.all(fetches);
      const withSlots = results.filter((r) => r.slots.length > 0);
      setCreneauxReels(withSlots);
    } catch {
      setCreneauxReels([]);
    } finally {
      setLoadingCreneaux(false);
    }
  };

  const handleConfirmer = async () => {
    if (!creneau) return;
    const currentUser = getStoredUser();
    if (!currentUser) return;
    setSaving(true);
    setError(null);
    try {
      const doctorTz = user?.timezone || "Africa/Douala";
      const debutISO = slotToUTCISO(creneau.date, creneau.start, doctorTz);
      const finISO = slotToUTCISO(creneau.date, creneau.end, doctorTz);
      if (isReschedule) {
        await put(`/api/rendez_vous/${rescheduleRdvId}/reschedule`, {
          date_heure_debut: debutISO,
          date_heure_fin: finISO,
        });
        setConfirme(true);
        setEtape(null);
        setPourQui(null);
        setMotif("");
        setMode(null);
        setCreneau(null);
        setRescheduleRdv(null);
        setTimeout(() => {
          setConfirme(false);
          navigate("/rendez-vous");
        }, 4000);
      } else {
        const rdv = await post("/api/rendez_vous", {
          medecin_id: id,
          patient_id: currentUser.id,
          date_heure_debut: debutISO,
          date_heure_fin: finISO,
          type: mode === "teleconsultation" ? "video" : "presentiel",
          motif_consultation: motif || null,
        });
        setRdvCreeId(rdv.id);
        setEtape(null);
        setPourQui(null);
        setMotif("");
        setMode(null);
        setCreneau(null);
        if (tarif > 0) {
          setShowPaiementModal(true);
        } else {
          setConfirme(true);
          setTimeout(() => setConfirme(false), 4000);
        }
      }
    } catch (err) {
      setError(err?.message || "Erreur lors de la mise à jour du rendez-vous");
    } finally {
      setSaving(false);
    }
  };

  const handlePayer = async () => {
    if (!methodePaiement || !rdvCreeId) return;
    if ((methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && telephonePaiement && !validatePhone(telephonePaiement)) {
      setPaiementErreur(phoneError());
      return;
    }
    setPaiementEnCours(true);
    setPaiementErreur(null);
    try {
      await post(`/api/paiements/initier?rdv_id=${rdvCreeId}`, {
        methode: methodePaiement,
        telephone: telephonePaiement || null,
      });
      setPaiementReussi(true);
      setTimeout(() => {
        setShowPaiementModal(false);
        setPaiementReussi(false);
        setRdvCreeId(null);
        setMethodePaiement("");
        setTelephonePaiement("");
        navigate("/rendez-vous");
      }, 3000);
    } catch (err) {
      setPaiementErreur(err?.message || "Erreur lors du paiement");
    } finally {
      setPaiementEnCours(false);
    }
  };

  useEffect(() => {
    if (etape === "creneau") {
      fetchCreneaux();
    }
  }, [etape]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!medecin || !user) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
        <p className="font-bold text-lg">Médecin introuvable</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">Retour</button>
      </div>
    );
  }

  const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Médecin';
  const specialiteNoms = specialites
    .map(s => specialitesMap[s.specialite_id]?.libelle_fr)
    .filter(Boolean);
  const specialitePrincipale = specialiteNoms[0] || 'Médecin';
  const moyenne = parseFloat(medecin.note_moyenne || 0);
  const tarif = parseFloat(medecin.tarif_consultation || 0);

  const cardClass = `rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`;
  const btnSecondary = `w-full text-left px-4 py-3 border rounded-xl mb-2 text-sm font-medium transition-all`;
  const btnSelected = `border-blue-500 bg-blue-50 text-blue-600`;
  const btnNormal = darkMode
    ? "border-gray-600 text-gray-200 hover:bg-gray-700"
    : "border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    <div className={`p-4 md:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {confirme && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={18} />
          Rendez-vous confirmé !
        </div>
      )}

      {showPaiementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
            <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold">Paiement du rendez-vous</h2>
                <p className="text-sm text-gray-400 mt-0.5">{formatXAF(toXAF(tarif, medecin?.devise))}</p>
              </div>
              {!paiementReussi && (
                <button onClick={() => { setShowPaiementModal(false); setRdvCreeId(null); setMethodePaiement(""); setTelephonePaiement(""); }}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <X size={18} />
                </button>
              )}
            </div>

            {paiementReussi ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="font-bold text-lg">Paiement effectué !</p>
                <p className="text-sm text-gray-400 mt-1">Votre paiement est en cours de vérification par l'administrateur.</p>
                <p className="text-xs text-gray-500 mt-3">Vous serez notifié une fois le rendez-vous confirmé.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Choisissez votre mode de paiement :
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMethodePaiement("mtn_momo")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "mtn_momo"
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <Smartphone size={24} className="text-yellow-500" />
                    <span className="text-xs font-semibold">MTN MoMo</span>
                  </button>
                  <button onClick={() => setMethodePaiement("orange_money")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "orange_money"
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <Smartphone size={24} className="text-orange-500" />
                    <span className="text-xs font-semibold">Orange Money</span>
                  </button>
                  <button onClick={() => setMethodePaiement("carte_visa")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "carte_visa"
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <CreditCard size={24} className="text-blue-500" />
                    <span className="text-xs font-semibold">Visa</span>
                  </button>
                  <button onClick={() => setMethodePaiement("carte_mastercard")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "carte_mastercard"
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <CreditCard size={24} className="text-red-500" />
                    <span className="text-xs font-semibold">Mastercard</span>
                  </button>
                </div>

                {(methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && (
                  <div>
                    <label className="text-xs font-medium text-gray-400">Numéro de téléphone</label>
                    <input type="tel" value={telephonePaiement} onChange={e => setTelephonePaiement(e.target.value)}
                      placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}"
                      className={`w-full mt-1 p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-green-500 transition ${darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"
                        }`} />
                  </div>
                )}

                {paiementErreur && (
                  <p className="text-xs text-red-500 text-center">{paiementErreur}</p>
                )}

                <button onClick={handlePayer}
                  disabled={!methodePaiement || paiementEnCours || ((methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && !telephonePaiement)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${!methodePaiement || paiementEnCours
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    }`}>
                  {paiementEnCours ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Paiement en cours...</>
                  ) : (
                    <>Payer {formatXAF(toXAF(tarif, medecin?.devise))}</>
                  )}
                </button>

                <p className="text-[10px] text-center text-gray-400">
                  Paiement sécurisé · Vérification manuelle par l'administration
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 flex flex-col gap-6">

          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative flex-shrink-0">
                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User size={52} className="text-blue-300" />
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${medecin.disponible_maintenant ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                  {medecin.disponible_maintenant ? "Disponible" : "Indisponible"}
                </div>
                {user?.statut === "suspendu" && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">
                    Suspendu
                  </div>
                )}
                {user?.statut === "banni" && (
                  <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                    Banni
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      Dr. {nomComplet}
                    </h1>
                    <p className="text-blue-500 font-medium">{specialitePrincipale}</p>
                  </div>
                  <button onClick={() => setFavori(!favori)}>
                    <Heart size={22} className={favori ? "text-red-500 fill-red-500" : "text-gray-400"} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14}
                      className={s <= Math.round(moyenne) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                  ))}
                  <span className="text-sm font-semibold">{moyenne.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({medecin.nombre_avis} avis)</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-gray-400" />
                    <span className="text-sm">{medecin.annees_experience} ans d'expérience</span>
                  </div>
                  {structure && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm">{structure.nom_etablissement} • {structure.ville}</span>
                    </div>
                  )}
                </div>

                {medecin.langues_parlees && medecin.langues_parlees.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-sm">{medecin.langues_parlees.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {medecin.biographie && (
              <p className={`mt-4 text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{medecin.biographie}</p>
            )}

            {specialiteNoms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {specialiteNoms.map((s, i) => (
                  <span key={i} className={`text-xs px-3 py-1 rounded-full ${darkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(medecin.diplomes || []).filter(f => f.statut === 'valide' || !f.statut).length > 0 && (
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap size={20} className="text-blue-500" />
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Formations</h2>
              </div>
              <div className="space-y-3">
                {medecin.diplomes.filter(f => f.statut === 'valide' || !f.statut).map((f, i) => (
                  <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{f.titre || 'Formation'}</p>
                    <p className="text-xs text-gray-400">{[f.ecole, f.date].filter(Boolean).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(medecin.certifications || []).filter(c => c.statut === 'valide' || !c.statut).length > 0 && (
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-4">
                <Award size={20} className="text-green-500" />
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Certifications</h2>
              </div>
              <div className="space-y-3">
                {medecin.certifications.filter(c => c.statut === 'valide' || !c.statut).map((c, i) => (
                  <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{c.titre || 'Certification'}</p>
                    <p className="text-xs text-gray-400">{[c.organisme, c.date].filter(Boolean).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(medecin.experience_history || []).filter(e => e.statut === 'valide' || !e.statut).length > 0 && (
            <div className={cardClass}>
              <div className="flex items-center gap-3 mb-4">
                <Briefcase size={20} className="text-purple-500" />
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Expérience</h2>
              </div>
              <div className="space-y-3">
                {medecin.experience_history.filter(e => e.statut === 'valide' || !e.statut).map((exp, i) => (
                  <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{exp.poste || 'Expérience'}</p>
                    <p className="text-xs text-gray-400">{[exp.entreprise, exp.date_debut && exp.date_fin ? `${exp.date_debut} - ${exp.date_fin}` : exp.date_debut || ''].filter(Boolean).join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {avisRdvId && !hasReviewed && currentUser?.role === 'patient' && (
            <div className={cardClass}>
              {!showAvisForm ? (
                <div>
                  <h2 className={`font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Donnez votre avis</h2>
                  <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Votre expérience avec ce médecin peut aider d'autres patients.
                  </p>
                  <button
                    onClick={() => setShowAvisForm(true)}
                    className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-sm transition-all"
                  >
                    Laisser un avis
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Votre avis</h2>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setNewNote(s)}>
                        <Star size={24} className={s <= newNote ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                      </button>
                    ))}
                    {newNote > 0 && <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{newNote}/5</span>}
                  </div>
                  <textarea
                    value={newCommentaire}
                    onChange={(e) => setNewCommentaire(e.target.value)}
                    placeholder="Décrivez votre expérience (optionnel)..."
                    rows={3}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-yellow-400 mb-3 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAvisForm(false); setNewNote(0); setNewCommentaire(""); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm border font-medium ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmitAvis}
                      disabled={newNote < 1 || submittingAvis}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${newNote >= 1 && !submittingAvis
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                      {submittingAvis ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {avis.length > 0 && (
            <div className={cardClass}>
              <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Avis des patients</h2>
              {avis.map((a, i) => (
                <div key={i} className={`p-4 rounded-xl mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="flex justify-between mb-1">
                    <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {a.patient_prenom || "Patient anonyme"}
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={s <= a.note ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                  </div>
                  {a.commentaire && (
                    <p className={`text-xs mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{a.commentaire}</p>
                  )}
                  <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        <div className="flex flex-col gap-4">

          {currentUser?.role === 'doctor' ? (
            <>
              {String(currentUser?.id) === String(id) ? null : (
                <div className={cardClass}>
                  <h2 className={`font-bold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Avis médical</h2>
                  <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Demandez l'avis de ce médecin sur un cas médical.
                  </p>
                  <button
                    onClick={() => setShowDemandeAvisModal(true)}
                    disabled={!medecin.disponible_maintenant}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      medecin.disponible_maintenant
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Stethoscope size={16} /> Demander un avis médical
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {user?.statut === "suspendu" && (
                <div className={`rounded-xl border p-4 flex items-center gap-3 bg-orange-500/10 border-orange-500/30 text-orange-400`}>
                  <AlertTriangle size={20} />
                  <div>
                    <p className="font-semibold">Médecin indisponible</p>
                    <p className="text-sm opacity-80">Ce médecin est actuellement suspendu. La prise de rendez-vous est temporairement désactivée.</p>
                  </div>
                </div>
              )}
              {user?.statut === "banni" && (
                <div className={`rounded-xl border p-4 flex items-center gap-3 bg-red-500/10 border-red-500/30 text-red-400`}>
                  <AlertTriangle size={20} />
                  <div>
                    <p className="font-semibold">Médecin indisponible</p>
                    <p className="text-sm opacity-80">Ce médecin n'est plus disponible sur la plateforme.</p>
                  </div>
                </div>
              )}
              {!etape && (
                <div className={cardClass}>
                  <h2 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Prendre rendez-vous</h2>
                  <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Prix de la consultation : {' '}
                    <span className="font-bold text-blue-500">{formatXAF(toXAF(tarif, medecin?.devise))}</span>
                  </p>
                  <button
                    onClick={() => setEtape("pourQui")}
                    disabled={!medecin.disponible_maintenant || user?.statut === "suspendu" || user?.statut === "banni"}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${medecin.disponible_maintenant && user?.statut !== "suspendu" && user?.statut !== "banni"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    Réserver une consultation
                  </button>
                </div>
              )}

              {etape === "pourQui" && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Pour qui ?</h2>
                    <span className="text-xs text-gray-400">Étape 1/4</span>
                  </div>
                  {["Pour moi", "Pour un proche"].map((opt) => (
                    <button key={opt} onClick={() => { setPourQui(opt); setEtape("motif"); }}
                      className={`${btnSecondary} ${pourQui === opt ? btnSelected : btnNormal}`}>{opt}</button>
                  ))}
                  <button onClick={() => setEtape(null)} className="w-full text-center text-xs text-gray-400 mt-2 hover:underline">Annuler</button>
                </div>
              )}

              {etape === "motif" && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Motif de consultation</h2>
                    <span className="text-xs text-gray-400">Étape 2/4</span>
                  </div>
                  <textarea value={motif} onChange={(e) => setMotif(e.target.value)}
                    placeholder="Décrivez brièvement votre motif de consultation..."
                    rows={4}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`}
                  />
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setEtape("pourQui")}
                      className={`flex-1 py-2.5 rounded-xl text-sm border font-medium ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>Retour</button>
                    <button onClick={() => setEtape("mode")} disabled={!motif.trim()}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${motif.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Suivant</button>
                  </div>
                </div>
              )}

              {etape === "mode" && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Mode de consultation</h2>
                    <span className="text-xs text-gray-400">Étape 3/4</span>
                  </div>
                  {[
                    { val: "presentiel", label: "En présentiel", desc: "Consultation au cabinet", icon: Stethoscope },
                    { val: "teleconsultation", label: "Téléconsultation", desc: "Consultation en vidéo", icon: Video },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.val} onClick={() => { setMode(opt.val); setEtape("creneau"); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl mb-2 text-left transition-all ${mode === opt.val ? btnSelected : btnNormal}`}>
                        <Icon size={18} className={mode === opt.val ? "text-blue-500" : "text-gray-400"} />
                        <div>
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                  <button onClick={() => setEtape("motif")}
                    className={`w-full py-2.5 rounded-xl text-sm border font-medium mt-2 ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>Retour</button>
                </div>
              )}

              {etape === "creneau" && (
                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{isReschedule ? "Choisir un nouveau créneau" : "Choisir un créneau"}</h2>
                    <div className="flex items-center gap-1">
                      {!isReschedule && <span className="text-xs text-gray-400 mr-1">4/4</span>}
                      <button
                        onClick={() => setSlotView("list")}
                        className={`p-1.5 rounded-lg transition ${slotView === "list" ? "bg-blue-600 text-white" : darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"}`}
                        title="Vue liste"
                      ><List size={14} /></button>
                      <button
                        onClick={() => setSlotView("calendar")}
                        className={`p-1.5 rounded-lg transition ${slotView === "calendar" ? "bg-blue-600 text-white" : darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"}`}
                        title="Vue calendrier"
                      ><CalendarDays size={14} /></button>
                    </div>
                  </div>
                  {loadingCreneaux ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="animate-spin text-blue-500" size={24} />
                    </div>
                  ) : creneauxReels.length === 0 ? (
                    <div className={`text-center py-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <Clock size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Aucun créneau disponible pour les 4 prochaines semaines
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Le médecin n'a pas encore configuré ses disponibilités
                      </p>
                    </div>
                  ) : slotView === "list" ? (
                    /* ===== LIST VIEW ===== */
                    <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                      {creneauxReels.map((group) => {
                        const [gy, gm, gd] = group.date.split("-").map(Number);
                        const dt = new Date(gy, gm - 1, gd);
                        const jourSemaine = dt.toLocaleDateString("fr-FR", { weekday: "short", timeZone: getUserTimezone() });
                        const jourMois = dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: getUserTimezone() });
                        const labelDate = `${jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1)} ${jourMois}`;
                        const isExpanded = expandedDays[group.date];
                        const visibleSlots = isExpanded ? group.slots : group.slots.slice(0, 5);
                        const hasMore = group.slots.length > 5;
                        return (
                          <div key={group.date}>
                            <button
                              type="button"
                              onClick={() => setExpandedDays((prev) => ({ ...prev, [group.date]: !prev[group.date] }))}
                              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{labelDate}</p>
                                {hasMore && (
                                  <span className="text-[10px] text-blue-500 font-medium">
                                    {isExpanded ? "Moins" : `+${group.slots.length - 5} créneaux`}
                                  </span>
                                )}
                              </div>
                            </button>
                            <div className="flex flex-wrap gap-2">
                              {visibleSlots.map((slot) => {
                                const heure = slot.start.slice(0, 5);
                                return (
                                  <button
                                    key={`${group.date}-${heure}`}
                                    onClick={() => setCreneau({ date: group.date, heure, start: slot.start, end: slot.end })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${creneau?.date === group.date && creneau?.heure === heure
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                      }`}
                                  >
                                    {heure}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ===== CALENDAR VIEW ===== */
                    (() => {
                      const availableDates = new Set(creneauxReels.map((g) => g.date));
                      const cm = calendarMonth.getMonth();
                      const cy = calendarMonth.getFullYear();
                      const monthLabel = calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: getUserTimezone() });
                      const daysInMonth = new Date(cy, cm + 1, 0).getDate();
                      const firstDow = new Date(cy, cm, 1).getDay();
                      const startDow = firstDow === 0 ? 6 : firstDow - 1;
                      const dayNames = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
                      const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                      const pad = Array.from({ length: startDow });
                      const selectedGroup = selectedCalDay ? creneauxReels.find((g) => g.date === selectedCalDay) : null;

                      return (
                        <div>
                          {/* Month nav */}
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => setCalendarMonth(new Date(cy, cm - 1, 1))}
                              className={`text-xs px-2 py-1 rounded-lg transition ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
                            >&#8249;</button>
                            <p className={`text-xs font-semibold capitalize ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{monthLabel}</p>
                            <button
                              onClick={() => setCalendarMonth(new Date(cy, cm + 1, 1))}
                              className={`text-xs px-2 py-1 rounded-lg transition ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
                            >&#8250;</button>
                          </div>
                          {/* Day headers */}
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {dayNames.map((d) => (
                              <div key={d} className={`text-center text-[10px] font-semibold py-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{d}</div>
                            ))}
                          </div>
                          {/* Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {pad.map((_, i) => <div key={`p-${i}`} />)}
                            {calDays.map((d) => {
                              const ds = `${cy}-${String(cm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                              const hasSlots = availableDates.has(ds);
                              const isSelected = selectedCalDay === ds;
                              const isPast = new Date(cy, cm, d) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
                              return (
                                <button
                                  key={d}
                                  onClick={() => hasSlots && setSelectedCalDay(isSelected ? null : ds)}
                                  disabled={!hasSlots || isPast}
                                  className={`text-[11px] font-medium py-1.5 rounded-lg transition-all ${isSelected
                                    ? "bg-blue-600 text-white"
                                    : hasSlots && !isPast
                                      ? darkMode
                                        ? "bg-green-900/40 text-green-300 hover:bg-green-900/60 cursor-pointer"
                                        : "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                                      : isPast
                                        ? darkMode ? "text-gray-600" : "text-gray-300"
                                        : darkMode ? "text-gray-500" : "text-gray-400"
                                    }`}
                                >{d}</button>
                              );
                            })}
                          </div>
                          {/* Selected day slots */}
                          {selectedGroup && (
                            <div className={`mt-3 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                              <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {(() => {
                                  const [sy, sm, sd] = selectedGroup.date.split("-").map(Number);
                                  const sdt = new Date(sy, sm - 1, sd);
                                  return sdt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: getUserTimezone() });
                                })()}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {selectedGroup.slots.map((slot) => {
                                  const heure = slot.start.slice(0, 5);
                                  return (
                                    <button
                                      key={`cal-${selectedGroup.date}-${heure}`}
                                      onClick={() => setCreneau({ date: selectedGroup.date, heure, start: slot.start, end: slot.end })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${creneau?.date === selectedGroup.date && creneau?.heure === heure
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                      {heure}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                  {error && (
                    <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${darkMode ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"}`}>
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => isReschedule ? navigate("/rendez-vous") : setEtape("mode")} disabled={saving}
                      className={`flex-1 py-2.5 rounded-xl text-sm border font-medium ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}>Retour</button>
                    <button onClick={handleConfirmer} disabled={!creneau || saving}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${creneau && !saving ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      {saving && <Loader size={14} className="animate-spin" />}
                      {saving ? "Envoi..." : isReschedule ? "Confirmer la reprogrammation" : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}

              {creneau && etape === "creneau" && (
                <div className={`rounded-xl p-3 text-xs ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700"}`}>
                  <p className="font-semibold">Créneau sélectionné :</p>
                  <p>{creneau.heure} — {(() => { const [cy, cm, cd] = creneau.date.split("-").map(Number); return new Date(cy, cm - 1, cd).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: getUserTimezone() }); })()}</p>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {showDemandeAvisModal && (
        <DemandeAvisModal darkMode={darkMode} onClose={() => setShowDemandeAvisModal(false)} />
      )}
    </div>
  );
}
