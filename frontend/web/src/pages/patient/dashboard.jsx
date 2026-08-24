import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Pill, Video, Clock,
  ChevronRight, ShieldAlert, Megaphone, X, Link,
  Heart, Activity, Droplet, Weight, Loader,
  Stethoscope, Brain, Eye, Bone,
  Microscope, Syringe, Baby,
  CheckCircle, AlertTriangle, TrendingUp, FileText, RefreshCw,
} from 'lucide-react';
import { get, put } from '../../services/apiClient';
import { getStoredUser } from '../../services/auth';
import PatientCallScreen from '../../components/patient/PatientCallScreen';
import AccountStatusBanner from '../../components/ui/AccountStatusBanner';
import NotificationBanner from '../../components/ui/NotificationBanner';
import ProfileCompletionBanner from '../../components/ui/ProfileCompletionBanner';
import TwoFactorPromptBanner from '../../components/ui/TwoFactorPromptBanner';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { getUserTimezone } from '../../utils/timezone';

const SPEC_ICONS = {
  'Généraliste': { icon: Stethoscope, color: 'bg-blue-100 text-blue-500' },
  'Cardiologue': { icon: Heart, color: 'bg-red-100 text-red-500' },
  'Dermatologue': { icon: Activity, color: 'bg-purple-100 text-purple-500' },
  'Pédiatre': { icon: Baby, color: 'bg-pink-100 text-pink-500' },
  'Neurologue': { icon: Brain, color: 'bg-indigo-100 text-indigo-500' },
  'Ophtalmologue': { icon: Eye, color: 'bg-cyan-100 text-cyan-500' },
  'Dentiste': { icon: Stethoscope, color: 'bg-yellow-100 text-yellow-500' },
  'Orthopédiste': { icon: Bone, color: 'bg-orange-100 text-orange-500' },
  'Gynécologue': { icon: Syringe, color: 'bg-rose-100 text-rose-500' },
};

export default function Dashboard({ darkMode }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [loading, setLoading] = useState(true);
  const [specialites, setSpecialites] = useState([]);
  const [selectedMiseAJour, setSelectedMiseAJour] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prochainRdv, setProchainRdv] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [statsData, setStatsData] = useState({ rdv: 0, consultationsMois: 0, ordonnancesActives: 0 });
  const [patientData, setPatientData] = useState(null);
  const [notifVisible, setNotifVisible] = useState(true);
  const [voirToutesSpec, setVoirToutesSpec] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [medicamentsJour, setMedicamentsJour] = useState([]);
  const [resumeJour, setResumeJour] = useState(null);
  const [prescriptionsJour, setPrescriptionsJour] = useState([]);
  const [lastMedsUpdate, setLastMedsUpdate] = useState(null);
  const [misesAJour, setMisesAJour] = useState([]);
  const [actualites, setActualites] = useState([]);
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    if (actualites.length <= 1) return;
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % actualites.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [actualites.length]);

  const refreshMedicaments = async () => {
    try {
      const [medsRes, resumeRes, prescRes] = await Promise.allSettled([
        get('/api/dashboard/medicaments-du-jour'),
        get('/api/dashboard/resume-jour'),
        get('/api/dashboard/prescriptions-du-jour'),
      ]);
      if (medsRes.status === 'fulfilled') setMedicamentsJour(medsRes.value || []);
      if (resumeRes.status === 'fulfilled') setResumeJour(resumeRes.value);
      if (prescRes.status === 'fulfilled') setPrescriptionsJour(prescRes.value || []);
      setLastMedsUpdate(new Date());
    } catch {}
  };

  const togglePrise = async (prise) => {
    const newStatut = "PRIS";
    setMedicamentsJour(prev => prev.map(m =>
      m.prise_id === prise.prise_id ? { ...m, statut: newStatut } : m
    ));
    try {
      await put(`/api/prises/${prise.prise_id}/confirmer`);
      await refreshMedicaments();
    } catch {
      setMedicamentsJour(prev => prev.map(m =>
        m.prise_id === prise.prise_id ? { ...m, statut: prise.statut } : m
      ));
    }
  };

  const marquerOubli = async (prise) => {
    setMedicamentsJour(prev => prev.map(m =>
      m.prise_id === prise.prise_id ? { ...m, statut: "OUBLIE" } : m
    ));
    try {
      await put(`/api/prises/${prise.prise_id}/oublier`);
      await refreshMedicaments();
    } catch {
      setMedicamentsJour(prev => prev.map(m =>
        m.prise_id === prise.prise_id ? { ...m, statut: prise.statut } : m
      ));
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = user?.id;
        if (!userId) return;

        const [specRes, notifsRes, patientRes] = await Promise.allSettled([
          get('/api/specialites', { limit: 50 }),
          get('/api/notifications', { limit: 50 }),
          get(`/api/patients/${userId}`),
        ]);

        if (specRes.status === 'fulfilled') setSpecialites(specRes.value);
        if (patientRes.status === 'fulfilled') setPatientData(patientRes.value);

        if (notifsRes.status === 'fulfilled') {
          const notifs = notifsRes.value || [];
          setNotifCount(notifs.filter(n => n.statut !== 'lu').length);
        }

        const [consultRes, rdvRes, ordoRes, medsRes, resumeRes, prescRes, misesRes, actRes] = await Promise.allSettled([
          get('/api/consultations', { patient_id: userId, limit: 5 }),
          get('/api/rendez_vous', { limit: 20 }),
          get('/api/ordonnances', { statut: 'active', limit: 100 }),
          get('/api/dashboard/medicaments-du-jour'),
          get('/api/dashboard/resume-jour'),
          get('/api/dashboard/prescriptions-du-jour'),
          get('/api/mises_a_jour', { limit: 10 }),
          get('/api/actualites', { limit: 10 }),
        ]);

        if (consultRes.status === 'fulfilled') setConsultations(consultRes.value || []);
        if (rdvRes.status === 'fulfilled') {
          const rdvs = (rdvRes.value || []).filter(r => !['annule_patient', 'annule_medecin', 'annule_systeme'].includes(r.statut));
          const upcoming = rdvs
            .filter(r => new Date(new Date(r.date_heure_debut).getTime() + 2 * 60 * 60 * 1000) >= new Date() && r.statut !== "termine")
            .sort((a, b) => new Date(a.date_heure_debut) - new Date(b.date_heure_debut));
          if (upcoming.length > 0) {
            const next = upcoming[0];
            setProchainRdv(next);
            get(`/api/users/${next.medecin_id}`).then(u => {
              setProchainRdv(prev => prev ? { ...prev, medecin: u } : prev);
            }).catch(() => {});
          }
          setStatsData(prev => ({ ...prev, rdv: upcoming.length }));
        }
        if (ordoRes.status === 'fulfilled') {
          setStatsData(prev => ({ ...prev, ordonnancesActives: (ordoRes.value || []).length }));
        }
        if (medsRes.status === 'fulfilled') {
          setMedicamentsJour(medsRes.value || []);
        }
        if (resumeRes.status === 'fulfilled') {
          setResumeJour(resumeRes.value);
        }
        if (prescRes.status === 'fulfilled') {
          setPrescriptionsJour(prescRes.value || []);
        }
        if (misesRes.status === 'fulfilled') {
          setMisesAJour(misesRes.value || []);
        }
        if (actRes.status === 'fulfilled') {
          setActualites(actRes.value || []);
        }
        setLastMedsUpdate(new Date());

        if (consultRes.status === 'fulfilled') {
          const now = new Date();
          const ceMois = (consultRes.value || []).filter(c => {
            const d = new Date(c.date_heure_debut);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          setStatsData(prev => ({ ...prev, consultationsMois: ceMois.length }));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !prochainRdv || prochainRdv.statut === "en_cours") return;
    const poll = setInterval(() => {
      get("/api/rendez_vous", { patient_id: user.id, limit: 5 })
        .then((data) => {
          const now = new Date();
          const upcoming = (data || [])
            .filter(r => !["annule_patient", "annule_medecin", "annule_systeme", "termine"].includes(r.statut) && new Date(new Date(r.date_heure_debut).getTime() + 2 * 60 * 60 * 1000) >= now)
            .sort((a, b) => new Date(a.date_heure_debut) - new Date(b.date_heure_debut));
          if (upcoming.length > 0 && upcoming[0].statut === "en_cours") {
            setProchainRdv(prev => prev ? { ...prev, statut: "en_cours" } : prev);
          }
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(poll);
  }, [user?.id, prochainRdv?.id, prochainRdv?.statut]);

  useEffect(() => {
    if (!user?.id) return;
    const poll = setInterval(refreshMedicaments, 30000);
    return () => clearInterval(poll);
  }, [user?.id]);

  const handleNotifClick = () => {
    setNotifVisible(false);
    navigate('/notifications');
  };

  const handleSpecialiteClick = (spec) => {
    navigate(`/annuaire?specialite=${encodeURIComponent(spec.libelle_fr || spec.nom || '')}`);
  };

  const specialitesAffichees = voirToutesSpec ? specialites : specialites.slice(0, 6);
  const prenom = user?.prenom || 'Patient';

  const santeParams = [];
  if (patientData) {
    if (patientData.taille_cm && patientData.poids_kg) {
      const imc = (patientData.poids_kg / ((patientData.taille_cm / 100) ** 2)).toFixed(1);
      santeParams.push({ label: "IMC", value: imc, unit: "kg/m²", statut: imc < 25 ? "Normal" : "Élevé", color: "text-green-500", icon: Weight, iconColor: "text-indigo-400 bg-indigo-50" });
    }
    if (patientData.poids_kg) {
      santeParams.push({ label: "Poids", value: patientData.poids_kg, unit: "kg", statut: "Enregistré", color: "text-green-500", icon: Weight, iconColor: "text-purple-400 bg-purple-50" });
    }
    if (patientData.taille_cm) {
      santeParams.push({ label: "Taille", value: patientData.taille_cm, unit: "cm", statut: "Enregistré", color: "text-blue-500", icon: Activity, iconColor: "text-blue-400 bg-blue-50" });
    }
    if (patientData.groupe_sanguin && patientData.groupe_sanguin !== 'Inconnu') {
      santeParams.push({ label: "Groupe sanguin", value: patientData.groupe_sanguin, unit: "", statut: "Connu", color: "text-green-500", icon: Droplet, iconColor: "text-red-400 bg-red-50" });
    }
  }

  const getUserTz = () => getUserTimezone();

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('fr-FR', { timeZone: getUserTz(), day: 'numeric', month: 'short', year: 'numeric' });
    }
    catch { return '-'; }
  };

  const formatTime = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleTimeString('fr-FR', { timeZone: getUserTz(), hour: '2-digit', minute: '2-digit' });
    }
    catch { return ''; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6">
      <AccountStatusBanner 
        statut={user?.statut} 
        suspendMessage="Votre compte est suspendu. La prise de rendez-vous est temporairement désactivée." 
      />

      {patientData && <ProfileCompletionBanner percent={getProfileCompletion(user, patientData).percent} />}

      {user && !user.totp_actif && <TwoFactorPromptBanner />}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Bienvenue, {prenom} 👋</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Voici un aperçu de votre santé.
          </p>
        </div>

        {actualites.length > 0 ? (
          <a
            href={actualites[newsIndex]?.lien || '#'}
            target="_blank"
            rel="noreferrer"
            className={`lg:w-80 w-full p-4 rounded-2xl text-white shadow-lg transition-all duration-500 block no-underline ${actualites[newsIndex]?.couleur || 'bg-blue-500'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5 flex-shrink-0">{actualites[newsIndex]?.icon || "📢"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{actualites[newsIndex]?.titre}</p>
                <p className="text-xs opacity-90 line-clamp-2">{actualites[newsIndex]?.description}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 justify-center" onClick={e => e.preventDefault()}>
              {actualites.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setNewsIndex(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === newsIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`} />
              ))}
            </div>
          </a>
        ) : notifCount > 0 ? (
          <button onClick={handleNotifClick}
            className={`lg:w-80 w-full p-4 rounded-2xl text-white shadow-lg bg-blue-500 hover:bg-blue-600 transition text-left`}>
            <div className="flex items-start gap-3">
              <Megaphone size={18} className="mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{notifCount} notification{notifCount > 1 ? 's' : ''} non lue{notifCount > 1 ? 's' : ''}</p>
                <p className="text-xs opacity-90">Cliquez pour consulter</p>
              </div>
            </div>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Rendez-vous à venir", value: String(statsData.rdv), icon: Calendar, color: "bg-blue-100 text-blue-500", path: "/rendez-vous" },
          { label: "Consultations ce mois", value: String(statsData.consultationsMois), icon: Video, color: "bg-orange-100 text-orange-500", path: "/consultations" },
          { label: "Prescriptions actives", value: String(statsData.ordonnancesActives), icon: Pill, color: "bg-green-100 text-green-500", path: "/prescriptions" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} onClick={() => navigate(stat.path)}
              className={`rounded-2xl shadow p-5 min-h-[130px] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex justify-end">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}><Icon size={20} /></div>
              </div>
              <div className="-mt-7">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <NotificationBanner 
        notifCount={notifCount} 
        notifVisible={notifVisible} 
        onClose={() => setNotifVisible(false)} 
        onClick={handleNotifClick} 
        darkMode={darkMode} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {prochainRdv ? (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">À VENIR</span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{prochainRdv.type || 'Consultation'}</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl rounded-lg">RDV</div>
                  <div>
                    <p className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>Dr. {prochainRdv.medecin?.prenom || ''} {prochainRdv.medecin?.nom || 'Médecin'}</p>
                    <p className="text-sm text-blue-400">{prochainRdv.motif_consultation || 'Consultation'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{formatDate(prochainRdv.date_heure_debut)} à {formatTime(prochainRdv.date_heure_debut)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const hoursUntil = prochainRdv.date_heure_debut ? (new Date(prochainRdv.date_heure_debut) - new Date()) / (1000 * 60 * 60) : 0;
                    const canReschedule = hoursUntil >= 24 && ["confirme", "en_attente"].includes(prochainRdv.statut);
                    return canReschedule ? (
                      <button
                        onClick={() => navigate(`/medecin/${prochainRdv.medecin_id}?reschedule=${prochainRdv.id}`)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600"
                      >
                        Reprogrammer
                      </button>
                    ) : (
                      <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl text-sm cursor-not-allowed" title="Reprogrammation impossible moins de 24h avant le rendez-vous">
                        Reprogrammer
                      </button>
                    );
                  })()}
                  {prochainRdv.type !== "presentiel" && prochainRdv.statut === "en_cours" ? (
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
                    >
                      <Video size={16} /> Rejoindre
                    </button>
                  ) : prochainRdv.type !== "presentiel" ? (
                    <span className="flex items-center gap-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm cursor-not-allowed">
                      <Clock size={16} /> En attente du médecin
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <p className={`text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun rendez-vous à venir</p>
            </div>
          )}

          {specialites.length > 0 && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Explorer les spécialités</h2>
                {specialites.length > 6 && (
                  <button onClick={() => setVoirToutesSpec(!voirToutesSpec)} className="text-xs text-blue-500 hover:underline">
                    {voirToutesSpec ? "Voir moins" : "Voir tout"}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {specialitesAffichees.map((spec, index) => {
                  const nom = spec.libelle_fr || spec.nom || '';
                  const mapping = Object.entries(SPEC_ICONS).find(([key]) => nom.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(nom.toLowerCase()));
                  const Icon = mapping ? mapping[1].icon : Stethoscope;
                  const color = mapping ? mapping[1].color : 'bg-blue-100 text-blue-500';
                  return (
                    <button key={spec.id || index} onClick={() => handleSpecialiteClick(spec)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                      </div>
                      <p className={`text-xs text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{nom}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {consultations.length > 0 && (
              <div className={`rounded-2xl shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Consultations récentes</h2>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '260px' }}>
                  <table className="w-full text-sm">
                    <thead className={`sticky top-0 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                      <tr className={darkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                        {["Date", "Médecin", "Motif", "Statut"].map(h => (
                          <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.map((c, i) => (
                        <tr key={c.id || i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                          <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{formatDate(c.date_heure_debut)}</td>
                          <td className={`px-5 py-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                          <button onClick={() => navigate(`/medecin/${c.medecin_id}`)} className="hover:underline text-blue-500">
                            {c.medecin?.prenom ? `Dr. ${c.medecin.prenom} ${c.medecin.nom}` : 'Dr.'}
                          </button>
                        </td>
                          <td className={`px-5 py-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{c.motif || c.type || 'Consultation'}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              c.statut === 'termine' || c.statut === 'Terminé' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                            }`}>{c.statut || '-'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className={`rounded-2xl shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <h2 className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  <Megaphone size={18} className="text-blue-500" /> Mise à jour
                </h2>
              </div>
              {misesAJour.length === 0 ? (
                <p className={`text-center py-6 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune mise à jour pour le moment</p>
              ) : (
                <div style={{ overflowY: 'auto', maxHeight: '260px' }}>
                  {misesAJour.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMiseAJour(item)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"} transition-all hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <span className="text-xl mt-0.5">{item.icon || "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.contenu}</p>
                      </div>
                      <ChevronRight size={16} className={`mt-1 flex-shrink-0 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {resumeJour && (resumeJour.total_prises > 0 || resumeJour.prescriptions_actives > 0) && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <TrendingUp size={18} className="text-blue-500" /> Résumé du jour
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <p className="text-2xl font-bold text-blue-500">{resumeJour.taux_adherence_pct}%</p>
                  <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Adhérence</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-gray-700" : "bg-green-50"}`}>
                  <p className="text-2xl font-bold text-green-500">{resumeJour.prises_effectuees}/{resumeJour.total_prises}</p>
                  <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Prises</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-gray-700" : "bg-orange-50"}`}>
                  <p className="text-2xl font-bold text-orange-500">{resumeJour.prescriptions_actives}</p>
                  <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>En cours</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <p className="text-2xl font-bold text-gray-400">{resumeJour.prescriptions_terminees + resumeJour.prescriptions_arretees}</p>
                  <p className={`text-[10px] font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Terminées</p>
                </div>
              </div>
              {resumeJour.prises_manquees > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{resumeJour.prises_manquees} prise{resumeJour.prises_manquees > 1 ? 's' : ''} manquée{resumeJour.prises_manquees > 1 ? 's' : ''} aujourd'hui</p>
                </div>
              )}
            </div>
          )}

          {santeParams.length > 0 && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-1">
                <h2 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Résumé santé</h2>
              </div>
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                Mis à jour le {patientData?.updated_at ? formatDate(patientData.updated_at) : '-'}
              </p>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {santeParams.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className={`rounded-2xl p-3 flex flex-col gap-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.iconColor}`}><Icon size={14} /></div>
                        <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item.label}</p>
                      </div>
                      <div>
                        <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                          {item.value} <span className={`text-xs font-normal ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.unit}</span>
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${item.color}`}>{item.statut}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <Pill size={18} className="text-green-500" /> Médicaments du jour
                {medicamentsJour.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">{medicamentsJour.length}</span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {lastMedsUpdate && (
                  <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {lastMedsUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <button onClick={refreshMedicaments}
                  className={`p-1.5 rounded-lg transition-all ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                  title="Rafraîchir">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            {medicamentsJour.length === 0 ? (
              <p className={`text-center py-6 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun médicament prévu aujourd'hui.
              </p>
            ) : (
              <div className="space-y-3">
                {medicamentsJour.map((med, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                        med.statut === "PRIS" ? "bg-green-100 text-green-600" : med.statut === "OUBLIE" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                      }`}>
                        {med.moment_journee?.slice(0, 2)}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{med.medicament_nom} — {med.dosage}</p>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {med.quantite}
                          {med.ordonnance_numero && <span className="ml-2 opacity-60">· {med.ordonnance_numero}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{med.heure_prevue || '-'}</p>
                      {med.statut === "A_PRENDRE" ? (
                        <div className="mt-1 flex gap-1">
                          <button
                            onClick={() => togglePrise(med)}
                            className="text-[10px] font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-600 cursor-pointer transition-all"
                          >
                            Prendre
                          </button>
                          <button
                            onClick={() => marquerOubli(med)}
                            className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 cursor-pointer transition-all"
                          >
                            Oublié
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className={`mt-1 text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                            med.statut === "PRIS"
                              ? "bg-green-100 text-green-600 cursor-default"
                              : "bg-red-100 text-red-600 cursor-default"
                          }`}
                        >
                          {med.statut === "PRIS" ? "Pris ✓" : "Oublié"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {prescriptionsJour.length > 0 && (
            <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <FileText size={18} className="text-purple-500" /> Prescriptions du jour
              </h2>
              <div className="space-y-3">
                {prescriptionsJour.map((presc, i) => (
                  <div key={i} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          presc.statut_traitement === "EN_COURS" ? "bg-blue-100 text-blue-600"
                          : presc.statut_traitement === "TERMINE" ? "bg-green-100 text-green-600"
                          : presc.statut_traitement === "ARRETE" ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {presc.statut_traitement === "EN_COURS" ? "En cours"
                           : presc.statut_traitement === "TERMINE" ? "Terminé"
                           : presc.statut_traitement === "ARRETE" ? "Arrêté"
                           : "Non démarré"}
                        </span>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{presc.numero}</p>
                      </div>
                    </div>
                    {presc.medecin_nom && (
                      <p className={`text-xs mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Dr. {presc.medecin_nom}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1">
                        <div className={`h-1.5 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
                          <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${presc.progression_pct}%` }} />
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {presc.nb_prises_prises}/{presc.nb_prises_prevues}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {presc.nb_medicaments} médicament{presc.nb_medicaments > 1 ? 's' : ''}
                      {presc.nb_prises_oubliees > 0 && <span className="text-red-500 ml-1">· {presc.nb_prises_oubliees} oublié{presc.nb_prises_oubliees > 1 ? 's' : ''}</span>}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/prescriptions')}
                className={`w-full mt-3 text-center text-xs font-medium py-2 rounded-xl transition-all ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-500 hover:bg-blue-50"}`}>
                Voir toutes les prescriptions →
              </button>
            </div>
          )}
        </div>
      </div>

      {videoModalOpen && prochainRdv && (
        <PatientCallScreen
          darkMode={darkMode}
          rdv={prochainRdv}
          medecinName={`Dr. ${prochainRdv.medecin?.prenom || ""} ${prochainRdv.medecin?.nom || ""}`.trim()}
          onClose={() => setVideoModalOpen(false)}
        />
      )}

      {selectedMiseAJour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedMiseAJour(null)}>
          <div
            className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedMiseAJour.icon || "🔔"}</span>
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{selectedMiseAJour.titre}</h2>
              </div>
              <button onClick={() => setSelectedMiseAJour(null)} className={`p-1 rounded-lg ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {new Date(selectedMiseAJour.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: getUserTimezone() })}
              </p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selectedMiseAJour.contenu}</p>
              {selectedMiseAJour.lien && (
                <div className={`mt-4 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <a href={selectedMiseAJour.lien} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
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
