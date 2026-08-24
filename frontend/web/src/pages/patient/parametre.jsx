import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, Shield,
  LogOut, FileText, ChevronRight, ChevronDown, ChevronUp,
  Activity, Heart, AlertCircle, History, CheckCircle2,
  Camera, Save, X, CheckCircle, Loader, Pencil, Phone, UserPlus,
  Briefcase, GraduationCap, Star, Stethoscope, DollarSign, Trash2, Plus, Calendar, Paperclip, Upload, Clock, Globe,
  KeyRound, QrCode,
} from 'lucide-react';
import { get, put, post, del } from '../../services/apiClient';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8100';
import { getStoredUser, logout, twofaSetup, twofaEnable, twofaDisable } from '../../services/auth';
import { validatePhone, phoneError } from '../../utils/validatePhone';

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'];

const LIENS_URGENCE = ['Conjoint(e)', 'Parent', 'Enfant', 'Frère/Sœur', 'Ami(e)', 'Voisin(e)', 'Collègue', 'Autre'];

const ACTES_PAR_SPECIALITE = {
  "Généraliste": ["Consultation générale", "Bilan de santé", "Prescription médicale", "Certificat médical", "Suivi chronique"],
  "Cardiologue": ["ECG", "Échocardiographie", "Test d'effort", "Consultation cardiologique", "Suivi HTA"],
  "Dentiste": ["Détartrage", "Soins dentaires", "Extraction", "Blanchiment", "Prothèse dentaire"],
  "Dermatologue": ["Consultation dermatologique", "Biopsie cutanée", "Traitement laser", "Dermoscopie", "Peeling"],
  "Gynécologue": ["Frottis cervico-vaginal", "Échographie pelvienne", "Consultation prénatale", "Suivi contraceptif", "Colposcopie"],
  "Neurologue": ["EEG", "Consultation neurologique", "Évaluation cognitive", "Traitement migraines", "EMG"],
  "Ophtalmologue": ["Consultation ophtalmologique", "Fundoscopie", "Tonometrie", "Prescription lunettes", "Traitement laser"],
  "Orthopédiste": ["Consultation orthopédique", "Radiographie", "Infiltration", "Plâtre", "Chirurgie minime"],
  "Pédiatre": ["Consultation pédiatrique", "Suivi croissance", "Vaccination", "Bilan néonatal", "Auscultation"],
  "Sage-femme": ["Consultation prénatale", "Suivi grossesse", "Échographie obstétricale", "Préparation accouchement", "Post-partum"],
  "Infirmier urgentiste": ["Premiers secours", "pansement", "Perfusion", "Prise de sang", "Surveillance vital"],
};

function formatIdentifiant(num) {
  if (!num) return '';
  const clean = num.replace(/\D/g, '');
  if (clean.length <= 13) {
    const p = clean.padStart(13, '0').slice(0, 13);
    return `${p[0]} ${p.slice(1, 3)} ${p.slice(3, 5)} ${p.slice(5, 7)} ${p.slice(7, 13)}`;
  }
  const p = clean.slice(0, 15).padStart(15, '0');
  return `${p[0]} ${p.slice(1, 3)} ${p.slice(3, 5)} ${p.slice(5, 7)} ${p.slice(7, 10)} ${p.slice(10, 13)} ${p.slice(13, 15)}`;
}

export default function Parametres({ darkMode }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isMedecin = user?.role === 'doctor';
  const sections = ["Profil", "Sécurité", "Confidentialités"];

  const initialSection = window.location.hash === "#confidentialites" ? "Confidentialités" : window.location.hash === "#securite" ? "Sécurité" : "Profil";
  const [section, setSection] = useState(initialSection);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessType, setAccessType] = useState("standard");
  const [partageAnonyme, setPartageAnonyme] = useState(true);
  const [professionnelsAutorises, setProfessionnelsAutorises] = useState([]);
  const [showProModal, setShowProModal] = useState(false);
  const [allMedecins, setAllMedecins] = useState([]);
  const [medecinSearch, setMedecinSearch] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [twofaActive, setTwofaActive] = useState(Boolean(user?.totp_actif));
  const [twofaSetupData, setTwofaSetupData] = useState(null);
  const [twofaCode, setTwofaCode] = useState('');
  const [twofaBusy, setTwofaBusy] = useState(false);
  const [twofaMsg, setTwofaMsg] = useState({ type: '', text: '' });
  const [previewDoc, setPreviewDoc] = useState(null); // { url, nom, mime }

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    date_naissance: '', sexe: '', profession: '', statut_matrimonial: '',
    couverture_assurance: '', numero_assurance: '',
    groupe_sanguin: '',
    taille_cm: '', poids_kg: '',
    photo_url: '', adresse: '',
    contact_urgence_nom: '', contact_urgence_tel: '', contact_urgence_lien: '',
    contact_urgence2_nom: '', contact_urgence2_tel: '', contact_urgence2_lien: '',
    proche_nom: '', proche_prenom: '', proche_age: '',
  });

  const [medecinForm, setMedecinForm] = useState({
    numero_ordre: '', presentation: '',
    tarif_consultation: '5000', devise: 'XAF',
    annees_experience: '0',
    expertises: [], actes: [],
    formations: [], certifications: [], experience: [],
    langues_parlees: [],
    structure_id: '',
  });
  const originalRef = useRef({ formations: [], certifications: [], experience: [] });
  const [tarifModification, setTarifModification] = useState(null);
  const [activeMonthPicker, setActiveMonthPicker] = useState(null);
  const monthPickerRef = useRef(null);

  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  useEffect(() => {
    if (!activeMonthPicker) return;
    const handleClickOutside = (e) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) setActiveMonthPicker(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMonthPicker]);

  const downloadFile = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur réseau");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur de téléchargement:", err);
    }
  };

  const handleProfileDocUpload = async (e, section, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await post(`/api/medecins/${user.id}/profile-docs/upload`, formData);
      const arr = [...medecinForm[section]];
      arr[index] = { ...arr[index], fichier: { nom: res.nom, url: res.url, taille: res.taille }, statut: 'en_attente' };
      handleMedecinChange(section, arr);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const computeAge = (dateNaissance) => {
    if (!dateNaissance) return '';
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : '';
  };

  const [specialites, setSpecialites] = useState([]);
  const [structures, setStructures] = useState([]);
  const [medecinSpecialites, setMedecinSpecialites] = useState([]);

  const [expandedSections, setExpandedSections] = useState({
    presentation: true, expertises: true, actes: true,
    tarif: true, formations: true, experience: true, certifications: true, langues: true,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const fetches = [
      get('/api/auth/me').then(me => {
        setForm(prev => ({
          ...prev,
          prenom: me.prenom || '', nom: me.nom || '',
          email: me.email || '', telephone: me.telephone || '',
          photo_url: me.photo_url || '', adresse: me.adresse || '',
          date_naissance: me.date_naissance || '',
        }));
      }).catch(() => {}),
    ];

    if (isMedecin) {
      fetches.push(
        get(`/api/medecins/${user.id}`).then(m => {
          const f = m.diplomes || [];
          const c = m.certifications || [];
          const e = m.experience_history || [];
          originalRef.current = {
            formations: JSON.parse(JSON.stringify(f)),
            certifications: JSON.parse(JSON.stringify(c)),
            experience: JSON.parse(JSON.stringify(e)),
          };
          setMedecinForm({
            numero_ordre: m.numero_ordre || '',
            presentation: m.biographie || m.presentation || '',
            tarif_consultation: String(m.tarif_consultation || '5000'),
            devise: m.devise || 'XAF',
            annees_experience: String(m.annees_experience || '0'),
            expertises: m.expertises || [],
            actes: m.actes || [],
            formations: f,
            certifications: c,
            experience: e,
            langues_parlees: m.langues_parlees || [],
            structure_id: m.structure_id || '',
          });
          setTarifModification(m.tarif_modification && m.tarif_modification.statut === 'en_attente' ? m.tarif_modification : null);
        }).catch(() => {}),
        get('/api/specialites').then(s => setSpecialites(s || [])).catch(() => {}),
        get('/api/structures').then(s => setStructures(s || [])).catch(() => {}),
        get(`/api/medecin_specialites?medecin_id=${user.id}`).then(ms => {
          const specIds = (ms || []).map(m => m.specialite_id);
          get('/api/specialites').then(allSpecs => {
            setMedecinSpecialites(allSpecs.filter(s => specIds.includes(s.id)).map(s => s.libelle_fr));
          }).catch(() => {});
        }).catch(() => {}),
      );
    } else {
      fetches.push(
        get(`/api/patients/${user.id}`).then(patient => {
          setPatientData(patient);
          if (patient?.acces_dossier) setAccessType(patient.acces_dossier);
          if (patient?.partage_anonyme !== undefined) setPartageAnonyme(patient.partage_anonyme);
          setForm(prev => ({
            ...prev,
            date_naissance: patient?.date_naissance || '',
            sexe: patient?.sexe || '',
            profession: patient?.profession || '',
            statut_matrimonial: patient?.statut_matrimonial || '',
            couverture_assurance: patient?.couverture_assurance || '',
            numero_assurance: patient?.numero_assurance || '',
            groupe_sanguin: patient?.groupe_sanguin || '',
            taille_cm: patient?.taille_cm || '',
            poids_kg: patient?.poids_kg || '',
            contact_urgence_nom: patient?.contact_urgence_nom || '',
            contact_urgence_tel: patient?.contact_urgence_tel || '',
            contact_urgence_lien: patient?.contact_urgence_lien || '',
            contact_urgence2_nom: patient?.contact_urgence2_nom || '',
            contact_urgence2_tel: patient?.contact_urgence2_tel || '',
            contact_urgence2_lien: patient?.contact_urgence2_lien || '',
            proche_nom: patient?.proche_nom || '',
            proche_prenom: patient?.proche_prenom || '',
            proche_age: patient?.proche_age || '',
          }));
        }).catch(() => {}),
        get('/api/confidentialite/professionnels-autorises').then(pros => setProfessionnelsAutorises(pros || [])).catch(() => {}),
        get('/api/confidentialite/medecins-rdv-history').then(meds => setAllMedecins(meds || [])).catch(() => {}),
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user?.id, isMedecin]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMedecinChange = (field, value) => {
    setMedecinForm(prev => ({ ...prev, [field]: value }));
  };

  const saveAccessType = async (newType) => {
    setAccessType(newType);
    try {
      await put(`/api/patients/${user.id}`, { acces_dossier: newType });
      setPatientData(prev => ({ ...prev, acces_dossier: newType }));
    } catch (err) {
      setAccessType(newType === "standard" ? "restreint" : "standard");
    }
  };

  const savePartageAnonyme = async (newVal) => {
    setPartageAnonyme(newVal);
    try {
      await put(`/api/patients/${user.id}`, { partage_anonyme: newVal });
      setPatientData(prev => ({ ...prev, partage_anonyme: newVal }));
    } catch (err) {
      setPartageAnonyme(!newVal);
    }
  };

  const handleAddPro = async (medecinId) => {
    try {
      await post('/api/confidentialite/professionnels-autorises', { medecin_id: medecinId });
      const pros = await get('/api/confidentialite/professionnels-autorises');
      setProfessionnelsAutorises(pros || []);
    } catch (err) {}
  };

  const handleRemovePro = async (medecinId) => {
    try {
      await del(`/api/confidentialite/professionnels-autorises/${medecinId}`);
      setProfessionnelsAutorises(prev => prev.filter(p => p.medecin_id !== medecinId));
    } catch (err) {}
  };

  const filteredMedecins = allMedecins.filter(m => {
    if (!medecinSearch.trim()) return true;
    const search = medecinSearch.toLowerCase();
    const userMatch = m.nom?.toLowerCase().includes(search) || m.prenom?.toLowerCase().includes(search);
    return userMatch;
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (form.telephone && !validatePhone(form.telephone)) {
        setSaveError(phoneError());
        setSaving(false);
        return;
      }
      const userPayload = {};
      if (form.prenom) userPayload.prenom = form.prenom;
      if (form.nom) userPayload.nom = form.nom;
      if (form.telephone) userPayload.telephone = form.telephone;
      if (form.photo_url) userPayload.photo_url = form.photo_url;
      if (form.adresse !== undefined) userPayload.adresse = form.adresse;
      await put('/api/auth/me', userPayload);

      if (isMedecin) {
        const markItems = (current, original) => {
          return current.map((item, i) => {
            const orig = original[i];
            if (!orig) return { ...item, statut: 'en_attente' };
            const changed = JSON.stringify({ ...item, statut: undefined, fichier: undefined }) !==
                            JSON.stringify({ ...orig, statut: undefined, fichier: undefined });
            if (changed) return { ...item, statut: 'en_attente' };
            return item;
          });
        };
        const formations = markItems(medecinForm.formations, originalRef.current.formations);
        const certifications = markItems(medecinForm.certifications, originalRef.current.certifications);
        const experience = markItems(medecinForm.experience, originalRef.current.experience);

        await put(`/api/medecins/${user.id}`, {
          numero_ordre: medecinForm.numero_ordre,
          presentation: medecinForm.presentation,
          biographie: medecinForm.presentation,
          tarif_consultation: Number(medecinForm.tarif_consultation),
          devise: medecinForm.devise,
          annees_experience: Number(medecinForm.annees_experience),
          expertises: medecinForm.expertises,
          actes: medecinForm.actes,
          diplomes: formations,
          certifications: certifications,
          experience_history: experience,
          langues_parlees: medecinForm.langues_parlees,
          structure_id: medecinForm.structure_id || null,
        });

        originalRef.current = {
          formations: JSON.parse(JSON.stringify(formations)),
          certifications: JSON.parse(JSON.stringify(certifications)),
          experience: JSON.parse(JSON.stringify(experience)),
        };
        setMedecinForm(prev => ({ ...prev, formations, certifications, experience }));
      } else {
        const patientPayload = {};
        if (form.date_naissance) patientPayload.date_naissance = form.date_naissance;
        if (form.groupe_sanguin) patientPayload.groupe_sanguin = form.groupe_sanguin;
        if (form.taille_cm) patientPayload.taille_cm = Number(form.taille_cm);
        if (form.poids_kg) patientPayload.poids_kg = Number(form.poids_kg);
        if (form.contact_urgence_nom) patientPayload.contact_urgence_nom = form.contact_urgence_nom;
        if (form.contact_urgence_tel) patientPayload.contact_urgence_tel = form.contact_urgence_tel;
        if (form.contact_urgence_lien) patientPayload.contact_urgence_lien = form.contact_urgence_lien;
        if (form.contact_urgence2_nom) patientPayload.contact_urgence2_nom = form.contact_urgence2_nom;
        if (form.contact_urgence2_tel) patientPayload.contact_urgence2_tel = form.contact_urgence2_tel;
        if (form.contact_urgence2_lien) patientPayload.contact_urgence2_lien = form.contact_urgence2_lien;
        if (form.proche_nom) patientPayload.proche_nom = form.proche_nom;
        if (form.proche_prenom) patientPayload.proche_prenom = form.proche_prenom;
        if (form.sexe) patientPayload.sexe = form.sexe;
        if (form.profession) patientPayload.profession = form.profession;
        if (form.statut_matrimonial) patientPayload.statut_matrimonial = form.statut_matrimonial;
        if (form.couverture_assurance) patientPayload.couverture_assurance = form.couverture_assurance;
        if (form.numero_assurance) patientPayload.numero_assurance = form.numero_assurance;
        const updatedPatient = await put(`/api/patients/${user.id}`, patientPayload);
        if (updatedPatient) setPatientData(updatedPatient);
      }

      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (form.prenom) stored.prenom = form.prenom;
      if (form.nom) stored.nom = form.nom;
      if (form.telephone) stored.telephone = form.telephone;
      localStorage.setItem('user', JSON.stringify(stored));

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!passwordForm.old) { setPasswordError('Veuillez saisir votre ancien mot de passe'); return; }
    if (!passwordForm.new) { setPasswordError('Veuillez saisir un nouveau mot de passe'); return; }
    if (passwordForm.new.length < 8) { setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('Les nouveaux mots de passe ne correspondent pas'); return; }
    setPasswordSaving(true);
    try {
      await put('/api/auth/me/password', { old_password: passwordForm.old, new_password: passwordForm.new });
      setPasswordForm({ old: '', new: '', confirm: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTwofaSetup = async () => {
    setTwofaBusy(true);
    setTwofaMsg({ type: '', text: '' });
    try {
      const data = await twofaSetup();
      setTwofaSetupData(data);
    } catch (err) {
      setTwofaMsg({ type: 'error', text: err.message || 'Impossible de générer le QR code' });
    } finally {
      setTwofaBusy(false);
    }
  };

  const handleTwofaEnable = async () => {
    if (!twofaCode.trim()) {
      setTwofaMsg({ type: 'error', text: 'Veuillez saisir le code de votre application d’authentification' });
      return;
    }
    setTwofaBusy(true);
    setTwofaMsg({ type: '', text: '' });
    try {
      await twofaEnable(twofaCode.trim());
      setTwofaActive(true);
      setTwofaSetupData(null);
      setTwofaCode('');
      setTwofaMsg({ type: 'success', text: 'Double authentification activée' });
    } catch (err) {
      setTwofaMsg({ type: 'error', text: err.message || 'Code incorrect' });
    } finally {
      setTwofaBusy(false);
    }
  };

  const handleTwofaDisable = async () => {
    if (!twofaCode.trim()) {
      setTwofaMsg({ type: 'error', text: 'Veuillez saisir le code actuel pour désactiver' });
      return;
    }
    setTwofaBusy(true);
    setTwofaMsg({ type: '', text: '' });
    try {
      await twofaDisable(twofaCode.trim());
      setTwofaActive(false);
      setTwofaSetupData(null);
      setTwofaCode('');
      setTwofaMsg({ type: 'success', text: 'Double authentification désactivée' });
    } catch (err) {
      setTwofaMsg({ type: 'error', text: err.message || 'Code incorrect' });
    } finally {
      setTwofaBusy(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX / w, MAX / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        handleChange('photo_url', dataUrl);
        try {
          await put('/api/auth/me', { photo_url: dataUrl });
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.photo_url = dataUrl;
          localStorage.setItem('user', JSON.stringify(stored));
        } catch (err) {
          setSaveError('Erreur lors de l\'envoi de la photo');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const inputClass = `w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`;
  const labelClass = "text-xs text-gray-400 mb-1 block";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const identifiant = isMedecin
    ? medecinForm.numero_ordre
    : formatIdentifiant(patientData?.nss || '');

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6] mb-6">Paramètres du compte</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {sections.map((s, index) => {
              const icons = [User, Lock, FileText];
              const Icon = icons[index];
              return (
                <button key={s} onClick={() => setSection(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                    ${index !== sections.length - 1 ? (darkMode ? "border-b border-gray-700" : "border-b border-gray-50") : ""}
                    ${section === s
                      ? (darkMode ? "bg-gray-700 text-blue-400 font-semibold border-r-2 border-blue-500" : "bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500")
                      : (darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-50")}`}>
                  <Icon size={16} />
                  {s}
                </button>
              );
            })}
          </div>
          <button onClick={handleLogout} className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border
            ${darkMode ? "bg-gray-800 border-red-900/30 text-red-400 hover:bg-red-950/20" : "bg-white border-red-100 text-red-500 hover:bg-red-50"}`}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>

        <div className="flex-1 space-y-6">

          {section === "Profil" && (
            <div className="flex flex-col gap-6">

              {/* HEADER PROFIL */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="relative flex-shrink-0">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                      {form.photo_url ? (
                        <img src={form.photo_url} alt="Photo profil" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-blue-300" />
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-600 transition">
                      <Camera size={14} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {form.prenom} {form.nom}
                    </p>
                    {identifiant && (
                      <p className="text-xs font-mono text-gray-400 mt-1">
                        {isMedecin ? `N° ${identifiant}` : `NSS : ${identifiant}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isMedecin && medecinSpecialites.length > 0 ? medecinSpecialites.join(', ') : (user?.role || 'Patient')} · {form.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* INFOS PERSONNELLES */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Informations personnelles
                  </h2>
                  {!editing ? (
                    <button onClick={() => { setEditing(true); setSaveError(null); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 transition">
                      <Pencil size={14} /> Modifier
                    </button>
                  ) : (
                    <button onClick={() => setEditing(false)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
                      <X size={14} /> Annuler
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Prénom", value: form.prenom },
                      { label: "Nom", value: form.nom },
                      { label: "Email", value: form.email },
                      { label: "Téléphone", value: form.telephone || '-' },
                      { label: "Adresse", value: form.adresse || '-' },
                      ...(isMedecin ? [
                        { label: "Date de naissance", value: form.date_naissance || '-' },
                        { label: "Spécialité", value: medecinSpecialites.join(', ') || '-' },
                        { label: "Numéro d'ordre", value: medecinForm.numero_ordre || '-' },
                        { label: "Structure", value: structures.find(s => s.id === medecinForm.structure_id)?.nom_etablissement || '-' },
                      ] : [
                        { label: "Date de naissance", value: form.date_naissance || '-' },
                        { label: "Sexe", value: form.sexe || '-' },
                        { label: "Profession", value: form.profession || '-' },
                        { label: "Situation matrimoniale", value: form.statut_matrimonial || '-' },
                      ]),
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value || '-'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Prénom</label>
                      <input type="text" value={form.prenom}
                        onChange={(e) => handleChange('prenom', e.target.value)}
                        disabled={isMedecin}
                        className={`${inputClass} ${isMedecin ? 'cursor-not-allowed' : ''}`} />
                    </div>
                    <div>
                      <label className={labelClass}>Nom</label>
                      <input type="text" value={form.nom}
                        onChange={(e) => handleChange('nom', e.target.value)}
                        disabled={isMedecin}
                        className={`${inputClass} ${isMedecin ? 'cursor-not-allowed' : ''}`} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={form.email} disabled
                        className={`${inputClass} cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={labelClass}>Téléphone</label>
                      <input type="tel" value={form.telephone}
                        onChange={(e) => handleChange('telephone', e.target.value)}
                        maxLength={9} pattern="6[0-9]{8}" placeholder="6XX XXX XXX"
                        className={inputClass} />
                    </div>
                    {isMedecin ? (
                      <>
                        <div>
                          <label className={labelClass}>Numéro d'ordre</label>
                          <input type="text" value={medecinForm.numero_ordre}
                            disabled
                            className={`${inputClass} cursor-not-allowed`} />
                        </div>
                        <div>
                          <label className={labelClass}>Spécialité</label>
                          <input type="text" value={medecinSpecialites.join(', ') || '-'}
                            disabled
                            className={`${inputClass} cursor-not-allowed`} />
                        </div>
                        <div>
                          <label className={labelClass}>Structure de santé</label>
                          <select value={medecinForm.structure_id}
                            onChange={(e) => handleMedecinChange('structure_id', e.target.value)}
                            className={inputClass}>
                            <option value="">— Aucune —</option>
                            {structures.map(s => (
                              <option key={s.id} value={s.id}>{s.nom_etablissement}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Adresse</label>
                          <input type="text" value={form.adresse || ''}
                            onChange={(e) => handleChange('adresse', e.target.value)}
                            placeholder="Votre adresse"
                            className={inputClass} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={labelClass}>Date de naissance</label>
                          <input type="date" value={form.date_naissance}
                            onChange={(e) => handleChange('date_naissance', e.target.value)}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Profession</label>
                          <input type="text" value={form.profession || ''}
                            onChange={(e) => handleChange('profession', e.target.value)}
                            placeholder="Ex: Ingénieur, Enseignant..."
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Sexe</label>
                          <select value={form.sexe || ''}
                            onChange={(e) => handleChange('sexe', e.target.value)}
                            className={`${inputClass} py-2.5`}>
                            <option value="">Sélectionner...</option>
                            <option value="M">Homme</option>
                            <option value="F">Femme</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Situation matrimoniale</label>
                          <select value={form.statut_matrimonial || ''}
                            onChange={(e) => handleChange('statut_matrimonial', e.target.value)}
                            className={`${inputClass} py-2.5`}>
                            <option value="">Sélectionner...</option>
                            <option value="Célibataire">Célibataire</option>
                            <option value="Marié(e)">Marié(e)</option>
                            <option value="Veuf(ve)">Veuf(ve)</option>
                            <option value="Divorcé(e)">Divorcé(e)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* === MEDECIN SECTIONS === */}
              {isMedecin && (
                <>
                  {/* PRÉSENTATION */}
                  <MedecinSection icon={FileText} title="Présentation" sectionKey="presentation"
                    expanded={expandedSections.presentation} toggle={toggleSection} darkMode={darkMode}>
                    {editing ? (
                      <textarea
                        className={`${inputClass} min-h-[120px]`}
                        value={medecinForm.presentation}
                        onChange={(e) => handleMedecinChange('presentation', e.target.value)}
                        placeholder="Décrivez votre parcours, votre approche médicale..."
                      />
                    ) : (
                      <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {medecinForm.presentation || 'Aucune présentation'}
                      </p>
                    )}
                  </MedecinSection>

                  {/* LANGUES PARLÉES */}
                  <MedecinSection icon={Globe} title="Langues parlées" sectionKey="langues"
                    expanded={expandedSections.langues} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.langues_parlees.length}>
                    {editing ? (
                      <>
                        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Sélectionnez les langues que vous parlez
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {["Français","Anglais","Allemand","Arabe","Espagnol","Portugais","Chinois","Italien","Bassa","Duala","Bamiléké","Fang","Ewondo","Haoussa","Peul"].map((lang) => {
                            const selected = medecinForm.langues_parlees.includes(lang);
                            return (
                              <button key={lang} onClick={() => {
                                handleMedecinChange('langues_parlees', selected
                                  ? medecinForm.langues_parlees.filter((l) => l !== lang)
                                  : [...medecinForm.langues_parlees, lang]);
                              }}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : darkMode ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-500"
                                }`}>
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {medecinForm.langues_parlees.length > 0 ? medecinForm.langues_parlees.map((l, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">{l}</span>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune langue renseignée</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>

                  {/* EXPERTISES */}
                  <MedecinSection icon={Star} title="Expertises" sectionKey="expertises"
                    expanded={expandedSections.expertises} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.expertises.length}>
                    {editing ? (
                      <>
                        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Sélectionnez vos spécialités d'expertise
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {specialites.map((spec) => {
                            const selected = medecinForm.expertises.some((e) => e.nom === spec.libelle_fr);
                            return (
                              <button key={spec.id} onClick={() => {
                                const exists = medecinForm.expertises.find((e) => e.nom === spec.libelle_fr);
                                if (exists) {
                                  handleMedecinChange('expertises', medecinForm.expertises.filter((e) => e.nom !== spec.libelle_fr));
                                  handleMedecinChange('actes', medecinForm.actes.filter((a) => !(ACTES_PAR_SPECIALITE[spec.libelle_fr] || []).includes(a)));
                                } else {
                                  handleMedecinChange('expertises', [...medecinForm.expertises, { nom: spec.libelle_fr, niveau: "standard" }]);
                                }
                              }}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : darkMode ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-500"
                                }`}>
                                {spec.libelle_fr}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {medecinForm.expertises.length > 0 ? medecinForm.expertises.map((e, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{e.nom}</span>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune expertise renseignée</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>

                  {/* ACTES MÉDICAUX */}
                  <MedecinSection icon={Stethoscope} title="Actes médicaux" sectionKey="actes"
                    expanded={expandedSections.actes} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.actes.length}>
                    {editing ? (
                      medecinForm.expertises.length === 0 ? (
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Sélectionnez d'abord des expertises
                        </p>
                      ) : (
                        medecinForm.expertises.map((exp) => (
                          <div key={exp.nom} className="mb-3">
                            <p className={`text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{exp.nom}</p>
                            <div className="flex flex-wrap gap-2">
                              {(ACTES_PAR_SPECIALITE[exp.nom] || []).map((acte) => (
                                <button key={acte} onClick={() => {
                                  handleMedecinChange('actes', medecinForm.actes.includes(acte)
                                    ? medecinForm.actes.filter((a) => a !== acte)
                                    : [...medecinForm.actes, acte]);
                                }}
                                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                                    medecinForm.actes.includes(acte)
                                      ? "bg-green-600 text-white border-green-600"
                                      : darkMode ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-green-500" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-500"
                                  }`}>
                                  {acte}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {medecinForm.actes.length > 0 ? medecinForm.actes.map((a, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{a}</span>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun acte renseigné</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>

                  {/* TARIF */}
                  <MedecinSection icon={DollarSign} title="Tarif de consultation" sectionKey="tarif"
                    expanded={expandedSections.tarif} toggle={toggleSection} darkMode={darkMode}>
                    {tarifModification && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          Modification en attente de validation admin :{" "}
                          <strong>{Number(tarifModification.tarif_consultation || medecinForm.tarif_consultation).toLocaleString()} {tarifModification.devise || medecinForm.devise}</strong>
                        </span>
                      </div>
                    )}
                    <div className={`p-3 rounded-xl mb-4 text-sm ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      Tarif actuel : <strong>{Number(medecinForm.tarif_consultation || 5000).toLocaleString()} {medecinForm.devise || "XAF"}</strong>
                    </div>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Nouveau tarif</label>
                          <input type="number" min="0" value={medecinForm.tarif_consultation}
                            onChange={(e) => handleMedecinChange('tarif_consultation', e.target.value)}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Devise</label>
                          <select value={medecinForm.devise}
                            onChange={(e) => handleMedecinChange('devise', e.target.value)}
                            className={`${inputClass} py-2.5`}>
                            {["XAF", "EUR", "USD", "GBP", "XOF"].map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Années d'expérience</label>
                          <input type="number" min="0" value={medecinForm.annees_experience}
                            onChange={(e) => handleMedecinChange('annees_experience', e.target.value)}
                            className={inputClass} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Tarif</p>
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{Number(medecinForm.tarif_consultation || 0).toLocaleString()} {medecinForm.devise || 'XAF'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Années d'expérience</p>
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{medecinForm.annees_experience || '0'} an(s)</p>
                        </div>
                      </div>
                    )}
                  </MedecinSection>

                  {/* FORMATIONS */}
                  <MedecinSection icon={GraduationCap} title="Formations" sectionKey="formations"
                    expanded={expandedSections.formations} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.formations.length}>
                    {editing ? (
                      <div className="space-y-3">
                        {medecinForm.formations.map((f, i) => (
                          <div key={i} className={`p-4 rounded-xl border space-y-3 ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Formation #{i + 1}</span>
                                {f.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                                {f.statut === 'valide' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Validé</span>}
                                {f.statut === 'rejete' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Rejeté</span>}
                              </div>
                              <button onClick={() => handleMedecinChange('formations', medecinForm.formations.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Date</label>
                                <div className="relative">
                                  <input readOnly value={f.date ? (() => { const [y, m] = f.date.split('-'); return `${MONTHS_FR[parseInt(m)-1] || ''} ${y}`; })() : ''} placeholder="Mois / Année" className={`${inputClass} pl-9 cursor-pointer`} onClick={() => setActiveMonthPicker(activeMonthPicker === `formations-${i}-date` ? null : `formations-${i}-date`)} />
                                  <button type="button" onClick={() => setActiveMonthPicker(activeMonthPicker === `formations-${i}-date` ? null : `formations-${i}-date`)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"><Calendar size={14} /></button>
                                  {activeMonthPicker === `formations-${i}-date` && (
                                    <MonthPickerDropdown value={f.date} onChange={(val) => { const arr = [...medecinForm.formations]; arr[i] = { ...arr[i], date: val, statut: 'en_attente' }; handleMedecinChange('formations', arr); }} onClose={() => setActiveMonthPicker(null)} darkMode={darkMode} innerRef={monthPickerRef} />
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Diplôme</label>
                                <input value={f.titre || ''} onChange={(e) => { const arr = [...medecinForm.formations]; arr[i] = { ...arr[i], titre: e.target.value, statut: 'en_attente' }; handleMedecinChange('formations', arr); }} placeholder="Ex: Doctorat en Médecine" className={inputClass} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelClass}>École / Institution</label>
                                <input value={f.ecole || ''} onChange={(e) => { const arr = [...medecinForm.formations]; arr[i] = { ...arr[i], ecole: e.target.value, statut: 'en_attente' }; handleMedecinChange('formations', arr); }} placeholder="Ex: Université de Yaoundé I" className={inputClass} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Document justificatif</label>
                                <div className="flex items-center gap-3">
                                  <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-200 text-gray-500 hover:border-blue-500"}`}>
                                    <Paperclip size={14} />
                                    <span className="text-xs truncate">{f.fichier?.nom || 'Choisir un fichier...'}</span>
                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleProfileDocUpload(e, 'formations', i)} />
                                  </label>
                                  {f.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: f.fichier.url.startsWith('http') ? f.fichier.url : `${API_BASE_URL}${f.fichier.url}`, nom: f.fichier.nom, mime: f.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">Voir</button>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => handleMedecinChange('formations', [...medecinForm.formations, { date: '', titre: '', ecole: '', statut: 'en_attente' }])}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-300 text-gray-500 hover:border-blue-500"}`}>
                          <Plus size={16} /> Ajouter une formation
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {medecinForm.formations.length > 0 ? medecinForm.formations.filter(f => f.statut !== 'rejete').map((f, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{f.titre || 'Formation'}</p>
                              {f.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                            </div>
                            <p className="text-xs text-gray-400">{[f.ecole, f.date].filter(Boolean).join(' · ')}</p>
                            {f.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: f.fichier.url.startsWith('http') ? f.fichier.url : `${API_BASE_URL}${f.fichier.url}`, nom: f.fichier.nom, mime: f.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">{f.fichier.nom}</button>}
                          </div>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune formation renseignée</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>

                  {/* CERTIFICATIONS */}
                  <MedecinSection icon={GraduationCap} title="Certifications" sectionKey="certifications"
                    expanded={expandedSections.certifications} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.certifications.length}>
                    {editing ? (
                      <div className="space-y-3">
                        {medecinForm.certifications.map((c, i) => (
                          <div key={i} className={`p-4 rounded-xl border space-y-3 ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Certification #{i + 1}</span>
                                {c.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                                {c.statut === 'valide' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Validé</span>}
                                {c.statut === 'rejete' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Rejeté</span>}
                              </div>
                              <button onClick={() => handleMedecinChange('certifications', medecinForm.certifications.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Date</label>
                                <div className="relative">
                                  <input readOnly value={c.date ? (() => { const [y, m] = c.date.split('-'); return `${MONTHS_FR[parseInt(m)-1] || ''} ${y}`; })() : ''} placeholder="Mois / Année" className={`${inputClass} pl-9 cursor-pointer`} onClick={() => setActiveMonthPicker(activeMonthPicker === `certifications-${i}-date` ? null : `certifications-${i}-date`)} />
                                  <button type="button" onClick={() => setActiveMonthPicker(activeMonthPicker === `certifications-${i}-date` ? null : `certifications-${i}-date`)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"><Calendar size={14} /></button>
                                  {activeMonthPicker === `certifications-${i}-date` && (
                                    <MonthPickerDropdown value={c.date} onChange={(val) => { const arr = [...medecinForm.certifications]; arr[i] = { ...arr[i], date: val, statut: 'en_attente' }; handleMedecinChange('certifications', arr); }} onClose={() => setActiveMonthPicker(null)} darkMode={darkMode} innerRef={monthPickerRef} />
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Certification</label>
                                <input value={c.titre || ''} onChange={(e) => { const arr = [...medecinForm.certifications]; arr[i] = { ...arr[i], titre: e.target.value, statut: 'en_attente' }; handleMedecinChange('certifications', arr); }} placeholder="Ex: Diplôme national" className={inputClass} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Organisme</label>
                                <input value={c.organisme || ''} onChange={(e) => { const arr = [...medecinForm.certifications]; arr[i] = { ...arr[i], organisme: e.target.value, statut: 'en_attente' }; handleMedecinChange('certifications', arr); }} placeholder="Ex: Ordre des Médecins" className={inputClass} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Document justificatif</label>
                                <div className="flex items-center gap-3">
                                  <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-200 text-gray-500 hover:border-blue-500"}`}>
                                    <Paperclip size={14} />
                                    <span className="text-xs truncate">{c.fichier?.nom || 'Choisir un fichier...'}</span>
                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleProfileDocUpload(e, 'certifications', i)} />
                                  </label>
                                  {c.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: c.fichier.url.startsWith('http') ? c.fichier.url : `${API_BASE_URL}${c.fichier.url}`, nom: c.fichier.nom, mime: c.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">Voir</button>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => handleMedecinChange('certifications', [...medecinForm.certifications, { date: '', titre: '', organisme: '', statut: 'en_attente' }])}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-300 text-gray-500 hover:border-blue-500"}`}>
                          <Plus size={16} /> Ajouter une certification
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {medecinForm.certifications.length > 0 ? medecinForm.certifications.filter(c => c.statut !== 'rejete').map((c, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{c.titre || 'Certification'}</p>
                              {c.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                            </div>
                            <p className="text-xs text-gray-400">{[c.organisme, c.date].filter(Boolean).join(' · ')}</p>
                            {c.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: c.fichier.url.startsWith('http') ? c.fichier.url : `${API_BASE_URL}${c.fichier.url}`, nom: c.fichier.nom, mime: c.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">{c.fichier.nom}</button>}
                          </div>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune certification renseignée</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>

                  {/* EXPÉRIENCE */}
                  <MedecinSection icon={Briefcase} title="Expérience" sectionKey="experience"
                    expanded={expandedSections.experience} toggle={toggleSection} darkMode={darkMode}
                    count={medecinForm.experience.length}>
                    {editing ? (
                      <div className="space-y-3">
                        {medecinForm.experience.map((exp, i) => (
                          <div key={i} className={`p-4 rounded-xl border space-y-3 ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Expérience #{i + 1}</span>
                                {exp.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                                {exp.statut === 'valide' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Validé</span>}
                                {exp.statut === 'rejete' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Rejeté</span>}
                              </div>
                              <button onClick={() => handleMedecinChange('experience', medecinForm.experience.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Date début</label>
                                <div className="relative">
                                  <input readOnly value={exp.date_debut ? (() => { const [y, m] = exp.date_debut.split('-'); return `${MONTHS_FR[parseInt(m)-1] || ''} ${y}`; })() : ''} placeholder="Mois / Année" className={`${inputClass} pl-9 cursor-pointer`} onClick={() => setActiveMonthPicker(activeMonthPicker === `experience-${i}-date_debut` ? null : `experience-${i}-date_debut`)} />
                                  <button type="button" onClick={() => setActiveMonthPicker(activeMonthPicker === `experience-${i}-date_debut` ? null : `experience-${i}-date_debut`)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"><Calendar size={14} /></button>
                                  {activeMonthPicker === `experience-${i}-date_debut` && (
                                    <MonthPickerDropdown value={exp.date_debut} onChange={(val) => { const arr = [...medecinForm.experience]; arr[i] = { ...arr[i], date_debut: val, statut: 'en_attente' }; handleMedecinChange('experience', arr); }} onClose={() => setActiveMonthPicker(null)} darkMode={darkMode} innerRef={monthPickerRef} />
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Date fin</label>
                                <div className="relative">
                                  <input readOnly value={exp.date_fin ? (() => { const [y, m] = exp.date_fin.split('-'); return `${MONTHS_FR[parseInt(m)-1] || ''} ${y}`; })() : ''} placeholder="Mois / Année" className={`${inputClass} pl-9 cursor-pointer`} onClick={() => setActiveMonthPicker(activeMonthPicker === `experience-${i}-date_fin` ? null : `experience-${i}-date_fin`)} />
                                  <button type="button" onClick={() => setActiveMonthPicker(activeMonthPicker === `experience-${i}-date_fin` ? null : `experience-${i}-date_fin`)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition"><Calendar size={14} /></button>
                                  {activeMonthPicker === `experience-${i}-date_fin` && (
                                    <MonthPickerDropdown value={exp.date_fin} onChange={(val) => { const arr = [...medecinForm.experience]; arr[i] = { ...arr[i], date_fin: val, statut: 'en_attente' }; handleMedecinChange('experience', arr); }} onClose={() => setActiveMonthPicker(null)} darkMode={darkMode} innerRef={monthPickerRef} />
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Entreprise / Structure</label>
                                <input value={exp.entreprise || ''} onChange={(e) => { const arr = [...medecinForm.experience]; arr[i] = { ...arr[i], entreprise: e.target.value, statut: 'en_attente' }; handleMedecinChange('experience', arr); }} placeholder="Ex: CHU de Yaoundé" className={inputClass} />
                              </div>
                              <div>
                                <label className={labelClass}>Poste</label>
                                <input value={exp.poste || ''} onChange={(e) => { const arr = [...medecinForm.experience]; arr[i] = { ...arr[i], poste: e.target.value, statut: 'en_attente' }; handleMedecinChange('experience', arr); }} placeholder="Ex: Cardiologue" className={inputClass} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelClass}>Document justificatif</label>
                                <div className="flex items-center gap-3">
                                  <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-200 text-gray-500 hover:border-blue-500"}`}>
                                    <Paperclip size={14} />
                                    <span className="text-xs truncate">{exp.fichier?.nom || 'Choisir un fichier...'}</span>
                                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleProfileDocUpload(e, 'experience', i)} />
                                  </label>
                                  {exp.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: exp.fichier.url.startsWith('http') ? exp.fichier.url : `${API_BASE_URL}${exp.fichier.url}`, nom: exp.fichier.nom, mime: exp.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">Voir</button>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => handleMedecinChange('experience', [...medecinForm.experience, { date_debut: '', date_fin: '', entreprise: '', poste: '', statut: 'en_attente' }])}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${darkMode ? "border-gray-600 text-gray-400 hover:border-blue-500" : "border-gray-300 text-gray-500 hover:border-blue-500"}`}>
                          <Plus size={16} /> Ajouter une expérience
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {medecinForm.experience.length > 0 ? medecinForm.experience.filter(exp => exp.statut !== 'rejete').map((exp, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{exp.poste || 'Expérience'}</p>
                              {exp.statut === 'en_attente' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">En attente</span>}
                            </div>
                            <p className="text-xs text-gray-400">{[exp.entreprise, exp.date_debut && exp.date_fin ? `${exp.date_debut} - ${exp.date_fin}` : exp.date_debut || ''].filter(Boolean).join(' · ')}</p>
                            {exp.fichier?.url && <button type="button" onClick={() => setPreviewDoc({ url: exp.fichier.url.startsWith('http') ? exp.fichier.url : `${API_BASE_URL}${exp.fichier.url}`, nom: exp.fichier.nom, mime: exp.fichier.type || '' })} className="text-xs text-blue-500 hover:underline">{exp.fichier.nom}</button>}
                          </div>
                        )) : (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune expérience renseignée</p>
                        )}
                      </div>
                    )}
                  </MedecinSection>
                </>
              )}

              {/* === PATIENT SECTIONS === */}
              {!isMedecin && (
                <>
                  {/* INFORMATIONS MÉDICALES */}
                  <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Informations médicales
                    </h2>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Groupe sanguin</label>
                      {!editing ? (
                        <div className={`flex items-center gap-2 p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                          <Heart size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {form.groupe_sanguin || 'Non renseigné'}
                          </span>
                        </div>
                      ) : (
                        <select value={form.groupe_sanguin}
                          onChange={(e) => handleChange('groupe_sanguin', e.target.value)}
                          className={`${inputClass} py-2.5`}>
                          <option value="">Sélectionner...</option>
                          {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Taille (cm)</label>
                        {!editing ? (
                          <div className={`flex items-center gap-2 p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                            <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {form.taille_cm || 'Non renseigné'}
                            </span>
                          </div>
                        ) : (
                          <input type="number" step="0.1" value={form.taille_cm || ''}
                            onChange={(e) => handleChange('taille_cm', e.target.value)}
                            placeholder="cm" className={inputClass} />
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Poids (kg)</label>
                        {!editing ? (
                          <div className={`flex items-center gap-2 p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                            <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {form.poids_kg || 'Non renseigné'}
                            </span>
                          </div>
                        ) : (
                          <input type="number" step="0.1" value={form.poids_kg || ''}
                            onChange={(e) => handleChange('poids_kg', e.target.value)}
                            placeholder="kg" className={inputClass} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ASSURANCE */}
                  <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Assurance
                    </h2>
                    {!editing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Assureur santé</p>
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{form.couverture_assurance || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Numéro d'assuré</p>
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{form.numero_assurance || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Assureur santé</label>
                          <input type="text" value={form.couverture_assurance || ''} onChange={(e) => handleChange('couverture_assurance', e.target.value)} placeholder="Nom de l'assureur" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Numéro d'assuré</label>
                          <input type="text" value={form.numero_assurance || ''} onChange={(e) => handleChange('numero_assurance', e.target.value)} placeholder="Numéro d'assurance" className={inputClass} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URGENCE */}
                  <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      <Phone size={14} className="text-blue-500" /> Personnes à contacter en cas d'urgence
                    </h2>
                    {[1, 2].map(num => {
                      const prefix = num === 1 ? '' : '2';
                      const nom = form[`contact_urgence${prefix}_nom`];
                      const tel = form[`contact_urgence${prefix}_tel`];
                      const lien = form[`contact_urgence${prefix}_lien`];
                      return (
                        <div key={num} className={`p-4 rounded-xl border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                          <p className={`text-xs font-semibold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Contact {num === 1 ? 'principal' : 'secondaire'}
                          </p>
                          {!editing ? (
                            <div className="space-y-1">
                              <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{nom || 'Non renseigné'}</p>
                              {tel && <p className="text-xs text-gray-400">{tel}</p>}
                              {lien && <p className="text-xs text-gray-400">{lien}</p>}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Nom complet</label>
                                <input type="text" value={nom || ''} onChange={(e) => handleChange(`contact_urgence${prefix}_nom`, e.target.value)} placeholder="Nom et prénom" className={inputClass} />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Téléphone</label>
                                <input type="tel" value={tel || ''} onChange={(e) => handleChange(`contact_urgence${prefix}_tel`, e.target.value)} placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}" className={inputClass} />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Lien</label>
                                <select value={lien || ''} onChange={(e) => handleChange(`contact_urgence${prefix}_lien`, e.target.value)} className={`${inputClass} py-2.5`}>
                                  <option value="">Sélectionner...</option>
                                  {LIENS_URGENCE.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* PROCHE(S) */}
                  <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h2 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      <UserPlus size={14} className="text-blue-500" /> Proches
                    </h2>
                    {Array.isArray(patientData?.proches) && patientData.proches.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {patientData.proches.map((pr, idx) => (
                          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                              {pr.prenom?.[0]?.toUpperCase() || pr.nom?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
                                {pr.prenom} {pr.nom}
                              </p>
                              <p className="text-xs text-gray-400">
                                {pr.age ? `${pr.age} ans` : ''} {pr.lien ? `• ${pr.lien}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !editing ? (
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-xs">
                          {form.proche_prenom?.[0]?.toUpperCase() || form.proche_nom?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
                            {form.proche_prenom && form.proche_nom ? `${form.proche_prenom} ${form.proche_nom}` : form.proche_prenom || form.proche_nom || 'Aucun proche'}
                          </p>
                          {form.proche_age && <p className="text-xs text-gray-400">{form.proche_age} ans</p>}
                        </div>
                      </div>
                    ) : null}

                    {editing && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block">Prénom</label>
                          <input type="text" value={form.proche_prenom || ''} onChange={(e) => handleChange('proche_prenom', e.target.value)} placeholder="Prénom" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block">Nom</label>
                          <input type="text" value={form.proche_nom || ''} onChange={(e) => handleChange('proche_nom', e.target.value)} placeholder="Nom" className={inputClass} />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block">Âge</label>
                          <input type="number" value={form.proche_age || ''} onChange={(e) => handleChange('proche_age', e.target.value)} placeholder="Âge" min="0" max="150" className={inputClass} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SAVE BUTTON */}
              {editing && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button onClick={handleSave} disabled={saving}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${saving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                      {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                      Sauvegarder
                    </button>
                    {saved && (
                      <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                        <CheckCircle size={16} /> Modifications enregistrées
                      </span>
                    )}
                  </div>
                  {saveError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {saveError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {section === "Sécurité" && (
            <>
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Mot de passe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Ancien mot de passe</label>
                  <input type={showPassword ? "text" : "password"} value={passwordForm.old}
                    onChange={(e) => setPasswordForm(p => ({ ...p, old: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nouveau mot de passe</label>
                  <input type={showPassword ? "text" : "password"} value={passwordForm.new}
                    onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Confirmer nouveau mot de passe</label>
                  <input type={showPassword ? "text" : "password"} value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleChangePassword} disabled={passwordSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${passwordSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                  {passwordSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  Changer le mot de passe
                </button>
                {passwordSuccess && (
                  <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                    <CheckCircle size={16} /> Mot de passe modifié
                  </span>
                )}
                {passwordError && (
                  <span className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle size={12} /> {passwordError}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPassword ? 'Masquer' : 'Afficher'} les mots de passe
                </button>
              </div>
            </div>

            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                <KeyRound size={16} className="text-blue-500" /> Double authentification (2FA)
              </h2>

              {twofaMsg.text && (
                <p className={`text-sm ${twofaMsg.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {twofaMsg.text}
                </p>
              )}

              {twofaActive ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                    <CheckCircle size={16} /> Activée
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    À chaque connexion, un code à 6 chiffres généré par votre application d'authentification sera requis en plus de votre mot de passe.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input value={twofaCode}
                      onChange={(e) => setTwofaCode(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      placeholder="Code à 6 chiffres"
                      className={inputClass} />
                    <button onClick={handleTwofaDisable} disabled={twofaBusy}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${twofaBusy ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                      {twofaBusy ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
                      Désactiver
                    </button>
                  </div>
                </div>
              ) : twofaSetupData ? (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy...), puis saisissez le code à 6 chiffres pour confirmer.
                  </p>
                  <div className="flex items-center gap-4 flex-col sm:flex-row">
                    {twofaSetupData.qr_code && (
                      <img src={twofaSetupData.qr_code} alt="QR code 2FA"
                        className={`rounded-xl border p-2 ${darkMode ? "bg-white border-gray-700" : "border-gray-200"}`} />
                    )}
                    <div className="flex flex-col gap-2">
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <QrCode size={14} className="inline mr-1" />
                        Clé secrète : <span className="font-mono">{twofaSetupData.secret}</span>
                      </p>
                      <input value={twofaCode}
                        onChange={(e) => setTwofaCode(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        placeholder="Code à 6 chiffres"
                        className={inputClass} />
                      <div className="flex gap-2">
                        <button onClick={handleTwofaEnable} disabled={twofaBusy}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${twofaBusy ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                          {twofaBusy ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
                          Activer
                        </button>
                        <button onClick={() => { setTwofaSetupData(null); setTwofaMsg({ type: '', text: '' }); }}
                          className="text-xs text-gray-400 hover:text-blue-500 underline">
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ajoutez une couche de sécurité supplémentaire à votre compte. Vous devrez fournir un code à 6 chiffres généré par une application d'authentification lors de chaque connexion.
                  </p>
                  <div>
                    <button onClick={handleTwofaSetup} disabled={twofaBusy}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${twofaBusy ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                      {twofaBusy ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
                      Activer la double authentification
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          )}

          {section === "Confidentialités" && (
            <div className="flex flex-col gap-6">
              {!isMedecin && (
                <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                    <Shield size={16} className="text-blue-500" /> Accès au dossier médical
                  </h2>
                  <div className="flex flex-col gap-4">
                    <div onClick={() => saveAccessType("standard")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${accessType === "standard" ? "border-blue-500 bg-blue-50/30" : (darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50")}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Tout professionnel habilité</p>
                        {accessType === "standard" && <CheckCircle2 size={18} className="text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">Par défaut, tout professionnel de santé intervenant dans votre suivi peut consulter vos informations pour garantir la continuité des soins.</p>
                    </div>
                    <div onClick={() => saveAccessType("restreint")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${accessType === "restreint" ? "border-blue-500 bg-blue-50/30" : (darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50")}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Accès restreint et spécifique</p>
                        {accessType === "restreint" && <CheckCircle2 size={18} className="text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">Restreindre l'accès à votre dossier uniquement aux professionnels que vous avez explicitement autorisés manuellement.</p>
                      {accessType === "restreint" && (
                        <div className="mt-3">
                          <button onClick={() => setShowProModal(true)} className="text-xs text-blue-500 font-bold underline">Gérer la liste des professionnels autorisés</button>
                          {professionnelsAutorises.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {professionnelsAutorises.map(p => (
                                <span key={p.medecin_id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  Dr. {p.medecin_prenom} {p.medecin_nom}
                                  <button onClick={(e) => { e.stopPropagation(); handleRemovePro(p.medecin_id); }} className="hover:text-red-500 ml-0.5">
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Mes préférences</h2>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Partage de données anonymes</p>
                    <p className="text-xs text-gray-400">Aider à l'amélioration du service</p>
                  </div>
                  <button
                    onClick={() => savePartageAnonyme(!partageAnonyme)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${partageAnonyme ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${partageAnonyme ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Informations légales</h2>
                {["CGU", "Mentions Légales", "Politique de données"].map((doc) => (
                  <button key={doc} className="flex items-center justify-between text-sm text-gray-400 hover:text-blue-500 py-1 transition-colors">
                    {doc} <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {showProModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowProModal(false)}>
              <div className={`relative max-w-lg w-full max-h-[80vh] rounded-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/30">
                  <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Professionnels autorisés</p>
                  <button onClick={() => setShowProModal(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    value={medecinSearch}
                    onChange={(e) => setMedecinSearch(e.target.value)}
                    placeholder="Rechercher un médecin..."
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
                  {filteredMedecins.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun médecin trouvé</p>
                  )}
                  {filteredMedecins.map(m => {
                    const isAuthorized = professionnelsAutorises.some(p => p.medecin_id === m.id);
                    return (
                      <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                            {m.prenom?.[0]}{m.nom?.[0]}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dr. {m.prenom} {m.nom}</p>
                            {m.code_medecin && <p className="text-xs text-gray-400">{m.code_medecin}</p>}
                          </div>
                        </div>
                        {isAuthorized ? (
                          <button
                            onClick={() => handleRemovePro(m.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >Retirer</button>
                        ) : (
                          <button
                            onClick={() => handleAddPro(m.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                          >Autoriser</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL APERÇU DOCUMENT MÉDECIN */}
      {previewDoc && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewDoc(null)}>
          <div className={`relative max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/30">
              <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{previewDoc.nom}</p>
              <button onClick={() => setPreviewDoc(null)} className="ml-3 text-gray-400 hover:text-gray-600 transition flex-shrink-0"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto flex items-start justify-center bg-gray-900/5">
              {previewDoc.mime?.startsWith('image/') ? (
                <img src={previewDoc.url} alt={previewDoc.nom} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
              ) : previewDoc.mime === 'application/pdf' || previewDoc.url?.toLowerCase().endsWith('.pdf') ? (
                <embed src={previewDoc.url} type="application/pdf" className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aperçu non disponible</p>
                  <p className="text-xs mt-1">Ce type de fichier ne peut pas être affiché directement.</p>
                  <button
                    type="button"
                    onClick={() => downloadFile(previewDoc.url, previewDoc.nom)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium">
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function MedecinSection({ icon: Icon, title, sectionKey, expanded, toggle, darkMode, count, children }) {
  return (
    <div className={`rounded-2xl shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <button onClick={() => toggle(sectionKey)}
        className={`w-full flex items-center justify-between p-4 transition ${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
            <Icon size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">{title}</h3>
            {count !== undefined && (
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{count} élément{count !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function MonthPickerDropdown({ value, onChange, onClose, darkMode, innerRef }) {
  const [year, setYear] = useState(() => {
    if (value) {
      const parts = value.split('-');
      return parseInt(parts[0]) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });

  const MONTHS = [
    { label: 'Jan', val: '01' }, { label: 'Fév', val: '02' }, { label: 'Mar', val: '03' },
    { label: 'Avr', val: '04' }, { label: 'Mai', val: '05' }, { label: 'Jun', val: '06' },
    { label: 'Jul', val: '07' }, { label: 'Aoû', val: '08' }, { label: 'Sep', val: '09' },
    { label: 'Oct', val: '10' }, { label: 'Nov', val: '11' }, { label: 'Déc', val: '12' },
  ];

  const selectedMonth = value ? value.split('-')[1] : null;

  return (
    <div ref={innerRef}
      className={`absolute z-50 mt-1 p-3 rounded-xl shadow-xl border w-64 ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setYear(y => y - 1)}
          className={`p-1 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
          <ChevronDown size={16} className="rotate-90" />
        </button>
        <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{year}</span>
        <button type="button" onClick={() => setYear(y => y + 1)}
          className={`p-1 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
          <ChevronUp size={16} className="rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((m) => (
          <button key={m.val} type="button"
            onClick={() => { onChange(`${year}-${m.val}`); onClose(); }}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition ${
              selectedMonth === m.val && value?.startsWith(String(year))
                ? "bg-blue-600 text-white"
                : darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
            }`}>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
