import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  Stethoscope,
  History,
  Info,
  UserPlus,
  Baby,
  Lock,
  Send,
  Loader,
  CheckCircle,
  Plus,
  ChevronDown,
  Pill,
  FlaskConical,
  ScanLine,
} from "lucide-react";

import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";

import PatientListCard from "../../components/doctors/patient/PatientListCard";
import PatientConsultationCard from "../../components/doctors/patient/PatientConsultationCard";

import PatientHistory from "../../components/doctors/patient/PatientHistory";
import PatientInfo from "../../components/doctors/patient/PatientInfo";
import { getStoredUser } from "../../services/auth";
import NewConsultationForm from "../../components/doctors/consultation/NewConsultationForm";
import DocumentUploadModal from "../../components/doctors/patient/DocumentUploadModal";
import NewOrdonnanceBiologieModal from "../../components/doctors/patient/NewOrdonnanceBiologieModal";
import NewOrdonnanceMedicamentModal from "../../components/doctors/patient/NewOrdonnanceMedicamentModal";
import NewOrdonnanceImagerieModal from "../../components/doctors/patient/NewOrdonnanceImagerieModal";
import PaymentModal from "../../components/doctors/patient/PaymentModal";
import NewPatientModal from "../../components/doctors/patient/NewPatientModal";
import VerifyPatientModal from "../../components/doctors/teleconsultation/VerifyPatientModal";

import PatientConsultationDetails from "../../components/doctors/patient/PatientConsultationDetails";
import SuiviGynecoMedecin from "../../components/doctors/patient/SuiviGynecoMedecin";

import { get, post, API_BASE_URL } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

function resolveDocUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url}`;
}

function computeAge(dateNaissance) {
  if (!dateNaissance) return null;
  const today = new Date();
  const birth = new Date(dateNaissance);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function mapGender(sexe) {
  if (sexe === "M") return "Male";
  if (sexe === "F") return "Female";
  return "Autre";
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: getUserTimezone() });
}

export default function Patients({ darkMode }) {
  const location = useLocation();
  const navigatePatientId = location.state?.patientId;

  const [patients, setPatients] = useState([]);
  const [consultationsMap, setConsultationsMap] = useState({});
  const [rdvsMap, setRdvsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTab, setPatientTab] = useState("Consultation");

  const [search, setSearch] = useState("");
  const [patientIdSearch, setPatientIdSearch] = useState("");
  const [consultationSearch, setConsultationSearch] = useState("");

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isNewConsultation, setIsNewConsultation] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showOrdonnanceMenu, setShowOrdonnanceMenu] = useState(false);
  const [showOrdonnanceBiologie, setShowOrdonnanceBiologie] = useState(false);
  const [showOrdonnanceMedicament, setShowOrdonnanceMedicament] = useState(false);
  const [showOrdonnanceImagerie, setShowOrdonnanceImagerie] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [accessRequestSent, setAccessRequestSent] = useState(false);
  const [accessRequestLoading, setAccessRequestLoading] = useState(false);
  const [medecinTarif, setMedecinTarif] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.id) {
      get(`/api/medecins/${user.id}`).then((m) => {
        setMedecinTarif(m.tarif_consultation || null);
      }).catch(() => {});
    }
  }, []);

  const handleRequestAccess = async () => {
    if (!selectedPatient?.dossier) return;
    setAccessRequestLoading(true);
    try {
      const res = await post(`/api/dossiers_medicaux/${selectedPatient.dossier.id}/request-access`);
      if (res?.already_authorized) {
        window.location.reload();
      } else {
        setAccessRequestSent(true);
      }
    } catch {
    } finally {
      setAccessRequestLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const rdvs = await get("/api/rendez_vous?limit=200");
        const allowedRdvStatuses = new Set(["confirme", "en_cours", "termine"]);
        const rdvsValidated = rdvs.filter(r => allowedRdvStatuses.has(r.statut));
        const patientIds = [...new Set(rdvsValidated.map((r) => r.patient_id).filter(Boolean))];

        const patientResults = await Promise.all(
          patientIds.map((pid) =>
            get(`/api/patients/${pid}`).catch(() => null)
          )
        );

        const cMap = {};
        const oMap = {};
        const dMap = {};
        const dosMap = {};
        await Promise.all(
          patientIds.map(async (pid) => {
            try {
              const cs = await get(`/api/consultations?patient_id=${pid}&limit=50`);
              cMap[pid] = cs;
            } catch {
              cMap[pid] = [];
            }
            try {
              const os = await get(`/api/ordonnances?patient_id=${pid}&limit=50`);
              oMap[pid] = os;
            } catch {
              oMap[pid] = [];
            }
            try {
              const ds = await get(`/api/documents_medicaux?patient_id=${pid}&limit=50`);
              dMap[pid] = ds;
            } catch {
              dMap[pid] = [];
            }
            try {
              const dos = await get(`/api/dossiers_medicaux?patient_id=${pid}&limit=5`);
              dosMap[pid] = dos;
            } catch {
              dosMap[pid] = [];
            }
          })
        );

        if (cancelled) return;

        const mapped = patientResults.filter(Boolean).map((p) => {
          const age = computeAge(p.date_naissance);
          const patientConsultations = (cMap[p.id] || []).map((c) => ({
            id: c.id,
            reason: c.motif || "Consultation",
            doctor: c.medecin?.full_name || (c.medecin ? `Dr. ${c.medecin.prenom || ''} ${c.medecin.nom || ''}`.trim() : ""),
            diagnosis: c.diagnostic_principal || "",
            treatment: c.plan_traitement || "",
            date: formatDate(c.date_heure_debut),
            dateRaw: c.date_heure_debut || "",
            time: formatTime(c.date_heure_debut),
            notes: c.observations || "",
            anamnese: c.anamnese || "",
            examen_clinique: c.examen_clinique || "",
            code_cim10: c.code_cim10 || "",
            demandes_labo: c.demandes_labo || "",
            suivi_necessaire: c.suivi_necessaire || false,
            date_prochain_rdv: c.date_prochain_rdv || "",
            instructions_patient: c.instructions_patient || "",
            statut: c.statut || "",
            medecin_id: c.medecin_id || null,
            prescriptions: [],
            labResults: [],
          }));

          const ords = (oMap[p.id] || []).map((o) => ({
            id: o.id,
            numero: o.numero,
            date: o.date_emission,
            statut: o.statut,
            motif: o.motif || "",
            type_consultation: o.type_consultation || "",
            type_ordonnance: o.type_ordonnance || "",
            consultation_id: o.consultation_id || null,
            medecin_id: o.medecin_id || null,
            medecin_nom_libre: o.medecin_nom_libre || "",
            notes: o.notes_medecin || "",
            lignes: (o.lignes || []).map((l) => ({
              medicament_nom: l.medicament_nom,
              dosage: l.dosage,
              forme: l.forme,
              posologie: l.posologie,
              duree_jours: l.duree_jours,
              quantite: l.quantite,
            })),
          }));

          const docs = (dMap[p.id] || []).map((d) => ({
            id: d.id,
            type: d.type_document,
            nom: d.nom_fichier_original,
            url: resolveDocUrl(d.url_stockage),
            date: d.date_document || d.created_at?.slice(0, 10) || "",
            description: d.description || "",
            laboratoire: d.laboratoire_nom || "",
            prescripteur: d.prescripteur_nom || "",
          }));
          const dos = (dosMap[p.id] || [])[0] || {};
          const dossierRestricted = dos?.acces_restricted === true || p?.acces_restricted === true;

          const antecedents = [];
          if (dos.antecedents_personnels) {
            try {
              const parsed = JSON.parse(dos.antecedents_personnels);
              if (Array.isArray(parsed)) {
                parsed.forEach((item, i) => {
                  antecedents.push({ id: 100 + i, type: "Personnel", nom: item.nom || item, date: item.date_diagnostic || "", statut: item.etat || "actif" });
                });
              } else {
                antecedents.push({ id: 1, type: "Personnel", nom: dos.antecedents_personnels, date: "", statut: "actif" });
              }
            } catch {
              antecedents.push({ id: 1, type: "Personnel", nom: dos.antecedents_personnels, date: "", statut: "actif" });
            }
          }

          return {
            id: p.id,
            medecin_id: getStoredUser()?.id || null,
            patientId: p.code_patient || p.numero_patient || p.id,
            name: `${p.prenom || ""} ${p.nom || ""}`.trim() || "Patient",
            age,
            gender: mapGender(p.sexe),
            bloodType: p.groupe_sanguin || "Inconnu",
            image: p.photo_url || "",
            lastVisit: patientConsultations.length > 0 ? patientConsultations[0].date : "",
            isPregnant: false,
            dossierRestricted,
            consultations: patientConsultations,
            ordonnances: ords,
            documents: docs,
            antecedentsFamiliaux: (() => {
              const parseFamiliaux = (raw) => {
                if (!raw) return "";
                let arr = raw;
                if (typeof raw === "string") {
                  try { arr = JSON.parse(raw); } catch { return raw; }
                }
                if (!Array.isArray(arr)) return String(arr);
                return arr.map(item => {
                  const nom = item.nom || "";
                  const membres = Array.isArray(item.membres) ? item.membres.map(m => {
                    const label = m.nom || "";
                    const age = m.age ? ` ${m.age} ans` : "";
                    return label + age;
                  }).filter(Boolean).join(", ") : "";
                  return membres ? `${nom} (${membres})` : nom;
                }).filter(Boolean).join("; ");
              };
              return parseFamiliaux(dos.antecedents_familiaux);
            })(),
            antecedents,
            habitudes: {
              alimentation: "",
              tabac: "",
              alcool: "",
              activitePhysique: "",
              sommeil: "",
              allergies: (() => {
                const raw = dos.antecedents_allergiques;
                if (!raw) return [];
                try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.map(a => a.nom || a).filter(Boolean); } catch {}
                if (typeof raw === "string") return raw.split(",").map(s => s.trim()).filter(Boolean);
                return [];
              })(),
            },
          vaccins: (() => {
            const raw = dos.vaccinations;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch { return []; }
          })(),
          operations: (() => {
            const raw = dos.antecedents_chirurgicaux;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
          })(),
          traitements_chroniques: (() => {
            const raw = dos.traitements_chroniques;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch { return []; }
          })(),
          suiviGrossesse: null,
          dossier: dos,
        };
      });

      setPatients(mapped);
      setConsultationsMap(cMap);

        const rMap = {};
        rdvsValidated.forEach((r) => {
          if (!r.patient_id) return;
          if (!rMap[r.patient_id]) rMap[r.patient_id] = [];
          rMap[r.patient_id].push(r);
        });
        setRdvsMap(rMap);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refreshPatients = useCallback(async () => {
    try {
      const rdvs = await get("/api/rendez_vous?limit=200");
      const allowedRdvStatuses = new Set(["confirme", "en_cours", "termine"]);
      const rdvsValidated = rdvs.filter(r => allowedRdvStatuses.has(r.statut));
      const patientIds = [...new Set(rdvsValidated.map((r) => r.patient_id).filter(Boolean))];
      const patientResults = await Promise.all(
        patientIds.map((pid) => get(`/api/patients/${pid}`).catch(() => null))
      );
      const cMap = {}, oMap = {}, dMap = {}, dosMap = {};
      await Promise.all(
        patientIds.map(async (pid) => {
          try { cMap[pid] = await get(`/api/consultations?patient_id=${pid}&limit=50`); } catch { cMap[pid] = []; }
          try { oMap[pid] = await get(`/api/ordonnances?patient_id=${pid}&limit=50`); } catch { oMap[pid] = []; }
          try { dMap[pid] = await get(`/api/documents_medicaux?patient_id=${pid}&limit=50`); } catch { dMap[pid] = []; }
          try { dosMap[pid] = await get(`/api/dossiers_medicaux?patient_id=${pid}&limit=5`); } catch { dosMap[pid] = []; }
        })
      );
      const mapped = patientResults.filter(Boolean).map((p) => {
        const age = computeAge(p.date_naissance);
        const patientConsultations = (cMap[p.id] || []).map((c) => ({
          id: c.id, reason: c.motif || "Consultation",
          doctor: c.medecin?.full_name || (c.medecin ? `Dr. ${c.medecin.prenom || ''} ${c.medecin.nom || ''}`.trim() : ""),
          diagnosis: c.diagnostic_principal || "", treatment: c.plan_traitement || "",
          date: formatDate(c.date_heure_debut), dateRaw: c.date_heure_debut || "",
          time: formatTime(c.date_heure_debut),
          notes: c.observations || "",
          anamnese: c.anamnese || "", examen_clinique: c.examen_clinique || "",
          code_cim10: c.code_cim10 || "", demandes_labo: c.demandes_labo || "",
          suivi_necessaire: c.suivi_necessaire || false,
          date_prochain_rdv: c.date_prochain_rdv || "",
          instructions_patient: c.instructions_patient || "",
          statut: c.statut || "", medecin_id: c.medecin_id || null,
          prescriptions: [], labResults: [],
        }));
        const ords = (oMap[p.id] || []).map((o) => ({
          id: o.id, numero: o.numero, date: o.date_emission, statut: o.statut,
          motif: o.motif || "", type_consultation: o.type_consultation || "",
          type_ordonnance: o.type_ordonnance || "",
          consultation_id: o.consultation_id || null,
          medecin_id: o.medecin_id || null, medecin_nom_libre: o.medecin_nom_libre || "",
          notes: o.notes_medecin || "",
          lignes: (o.lignes || []).map((l) => ({
            medicament_nom: l.medicament_nom, dosage: l.dosage, forme: l.forme,
            posologie: l.posologie, duree_jours: l.duree_jours, quantite: l.quantite,
          })),
        }));
        const docs = (dMap[p.id] || []).map((d) => ({
          id: d.id, type: d.type_document, nom: d.nom_fichier_original, url: resolveDocUrl(d.url_stockage),
          date: d.date_document || d.created_at?.slice(0, 10) || "", description: d.description || "",
          laboratoire: d.laboratoire_nom || "", prescripteur: d.prescripteur_nom || "",
        }));
        const dos = (dosMap[p.id] || [])[0] || {};
        const dossierRestricted = dos?.acces_restricted === true || p?.acces_restricted === true;
        const antecedents = [];
        const parseAntecedents = (raw, type, startId) => {
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((item, i) => {
                antecedents.push({ id: startId + i, type: item.type || type, nom: item.nom || item, date: "", statut: item.severite || "actif" });
              });
            } else {
              antecedents.push({ id: startId, type, nom: raw, date: "", statut: "actif" });
            }
          } catch {
            antecedents.push({ id: startId, type, nom: raw, date: "", statut: "actif" });
          }
        };
        parseAntecedents(dos.antecedents_personnels, "Personnel", 1);
        return {
          id: p.id, medecin_id: getStoredUser()?.id || null,
          patientId: p.code_patient || p.numero_patient || p.id,
          name: `${p.prenom || ""} ${p.nom || ""}`.trim() || "Patient",
          age, gender: mapGender(p.sexe), bloodType: p.groupe_sanguin || "Inconnu",
          image: p.photo_url || "",
          lastVisit: patientConsultations.length > 0 ? patientConsultations[0].date : "",
          isPregnant: false, dossierRestricted, consultations: patientConsultations, ordonnances: ords, documents: docs,
          antecedentsFamiliaux: (() => {
            const parseFamiliaux = (raw) => {
              if (!raw) return "";
              let arr = raw;
              if (typeof raw === "string") {
                try { arr = JSON.parse(raw); } catch { return raw; }
              }
              if (!Array.isArray(arr)) return String(arr);
              return arr.map(item => {
                const nom = item.nom || "";
                const membres = Array.isArray(item.membres) ? item.membres.map(m => m.nom).filter(Boolean).join(", ") : "";
                return membres ? `${nom} (${membres})` : nom;
              }).filter(Boolean).join("; ");
            };
            return parseFamiliaux(dos.antecedents_familiaux);
          })(),
          antecedents,
          habitudes: { alimentation: "", tabac: "", alcool: "", activitePhysique: "", sommeil: "", allergies: (() => {
            const raw = dos.antecedents_allergiques;
            if (!raw) return [];
            try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.map(a => a.nom || a).filter(Boolean); } catch {}
            if (typeof raw === "string") return raw.split(",").map(s => s.trim()).filter(Boolean);
            return [];
          })() },
          vaccins: (() => {
            const raw = dos.vaccinations;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch { return []; }
          })(),
          operations: (() => {
            const raw = dos.antecedents_chirurgicaux;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
          })(),
          traitements_chroniques: (() => {
            const raw = dos.traitements_chroniques;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            try { return JSON.parse(raw); } catch { return []; }
          })(),
          suiviGrossesse: null,
          dossier: dos,
        };
      });
      setPatients(mapped);
      setConsultationsMap(cMap);
      const rMap = {};
      rdvsValidated.forEach((r) => {
        if (!r.patient_id) return;
        if (!rMap[r.patient_id]) rMap[r.patient_id] = [];
        rMap[r.patient_id].push(r);
      });
      setRdvsMap(rMap);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (navigatePatientId && patients.length > 0) {
      const found = patients.find(
        (p) => p.patientId === navigatePatientId || p.id === navigatePatientId
      );
      if (found) {
        setSelectedPatient(found);
        setPatientTab("Consultation");
      }
    }
  }, [navigatePatientId, patients]);

  const filteredPatients = patients.filter((patient) => {
    const keyword = search.toLowerCase();
    const idKeyword = patientIdSearch.toLowerCase();
    const name = patient?.name?.toLowerCase() || "";
    const id = patient?.patientId?.toLowerCase() || "";
    const matchName = name.includes(keyword);
    const matchId = id.includes(idKeyword);
    const matchesGlobal = matchName || id.includes(keyword);
    if (activeTab === "Male") return matchesGlobal && patient?.gender === "Male" && matchId;
    if (activeTab === "Female") return matchesGlobal && patient?.gender === "Female" && matchId;
    return matchesGlobal && matchId;
  });

  const filteredConsultations = (selectedPatient?.consultations ?? []).filter((item) => {
    const keyword = consultationSearch.toLowerCase();
    const reason = item?.reason?.toLowerCase() || "";
    const diagnosis = item?.diagnosis?.toLowerCase() || "";
    const doctor = item?.doctor?.toLowerCase() || "";
    return reason.includes(keyword) || diagnosis.includes(keyword) || doctor.includes(keyword);
  });

  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap
    ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const patientTabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap
    ${
      patientTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const consultations = selectedPatient?.consultations || [];

  const patientRdvs = selectedPatient ? (rdvsMap[selectedPatient.id] || []) : [];
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const hasActiveRdv = patientRdvs.some((r) => {
    const end = new Date(r.date_heure_fin).getTime();
    return Date.now() <= end + TWO_HOURS_MS;
  });

  const expiredRdv = !hasActiveRdv && patientRdvs.length > 0 ? patientRdvs[0] : null;

  return (
    <div className="min-h-screen mt-6 sm:mt-4">
      <div>
        <div
          className={`shadow-sm p-3 sm:p-4 md:p-6
          ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
        >
          {!selectedPatient && (
            <>
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
                    Patients
                  </h1>
                  <p
                    className={`text-sm sm:text-base mt-1 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {loading ? "Chargement..." : "Gérez vos patients et historiques de consultations."}
                  </p>
                </div>
              </div>

              <div
                className={`h-[1px] my-6
                ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
              />

              <div className="flex gap-3 overflow-x-auto pb-1 mb-6">
                {["All", "Male", "Female"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={tabClass(tab)}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-col xl:flex-row xl:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${darkMode ? "bg-green-900" : "bg-green-100"}`}
                  >
                    <Users className="w-4 h-4 text-[#27772B]" />
                  </div>
                  <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Tous les patients
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <SearchBar
                    placeholder="Rechercher un patient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <SearchBar
                    placeholder="Rechercher par ID..."
                    value={patientIdSearch}
                    onChange={(e) => setPatientIdSearch(e.target.value)}
                  />
                  <FilterButton />
                  <button
                    onClick={() => setShowNewPatient(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    Nouveau patient
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Chargement des patients...
                  </p>
                ) : filteredPatients.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Aucun patient trouvé.
                  </p>
                ) : (
                  filteredPatients.map((patient) => (
                    <PatientListCard
                      key={patient.id}
                      patient={patient}
                      darkMode={darkMode}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientTab("Consultation");
                        setConsultationSearch("");
                        setSelectedConsultation(null);
                        setAccessRequestSent(false);
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {showNewPatient && !selectedPatient && (
            <NewPatientModal
              darkMode={darkMode}
              onClose={() => setShowNewPatient(false)}
              onCreated={refreshPatients}
            />
          )}

          {selectedPatient && (
            <>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSearch("");
                  setConsultationSearch("");
                  setSelectedConsultation(null);
                  setIsNewConsultation(false);
                  setShowPayment(false);
                  setPatientTab("Consultation");
                }}
                className="text-sm text-blue-600 font-medium mb-5"
              >
                ← Retour aux patients
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPatient?.image}
                    className="w-12 h-12 rounded-xl object-cover"
                    alt={selectedPatient?.name}
                  />
                  <div>
                    <h2 className={`font-semibold ${darkMode ? "text-white" : ""}`}>
                      {selectedPatient?.name}
                    </h2>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {selectedPatient?.patientId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative">
                  <div className="relative">
                    <button
                      onClick={() => setShowOrdonnanceMenu(!showOrdonnanceMenu)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Nouvelle ordonnance
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showOrdonnanceMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowOrdonnanceMenu(false)}
                        />
                        <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50 border overflow-hidden ${
                          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}>
                          <button
                            onClick={() => {
                              setShowOrdonnanceMenu(false);
                              setShowOrdonnanceMedicament(true);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                              darkMode
                                ? "hover:bg-gray-700 text-gray-200"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <Pill className="w-4 h-4 text-blue-500" />
                            <div className="text-left">
                              <p className="font-medium">Médicaments</p>
                              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ordonnance de médicaments</p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowOrdonnanceMenu(false);
                              setShowUploadDoc(false);
                              setShowOrdonnanceBiologie(true);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                              darkMode
                                ? "hover:bg-gray-700 text-gray-200"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <FlaskConical className="w-4 h-4 text-purple-500" />
                            <div className="text-left">
                              <p className="font-medium">Biologie</p>
                              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ordonnance d'examens biologiques</p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowOrdonnanceMenu(false);
                              setShowOrdonnanceImagerie(true);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                              darkMode
                                ? "hover:bg-gray-700 text-gray-200"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <ScanLine className="w-4 h-4 text-cyan-500" />
                            <div className="text-left">
                              <p className="font-medium">Imagerie</p>
                              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Scanner, radio, mammographie, echo, IRM</p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => hasActiveRdv ? setShowVerify(true) : setShowPayment(true)}
                    className="px-4 py-2 rounded-xl text-sm transition bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + Nouvelle consultation
                  </button>
                </div>
              </div>

              {isNewConsultation && (
                <NewConsultationForm
                  selectedPatient={selectedPatient}
                  setIsNewConsultation={setIsNewConsultation}
                  rdvId={patientRdvs.find(r => {
                    const end = new Date(r.date_heure_fin).getTime();
                    return Date.now() <= end + TWO_HOURS_MS && r.type === "presentiel" && r.code_verification;
                  })?.id}
                  patientId={selectedPatient?.patientId || selectedPatient?.id}
                />
              )}

              {showVerify && (
                <VerifyPatientModal
                  darkMode={darkMode}
                  rdv={{
                    rdvId: patientRdvs.find(r => {
                      const end = new Date(r.date_heure_fin).getTime();
                      return Date.now() <= end + TWO_HOURS_MS && r.type === "presentiel" && r.code_verification;
                    })?.id,
                    patientName: selectedPatient?.name || "Patient",
                  }}
                  onVerified={() => { setShowVerify(false); setIsNewConsultation(true); }}
                  onCancel={() => setShowVerify(false)}
                />
              )}

              {showUploadDoc && (
                <DocumentUploadModal
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  darkMode={darkMode}
                  onClose={() => setShowUploadDoc(false)}
                  onUploaded={refreshPatients}
                />
              )}

              {showPayment && (
                <PaymentModal
                  darkMode={darkMode}
                  patientName={selectedPatient.name}
                  tarif={medecinTarif}
                  rdvInfo={expiredRdv ? {
                    motif: expiredRdv.motif_consultation || "Consultation",
                    date: formatDate(expiredRdv.date_heure_debut),
                    time: formatTime(expiredRdv.date_heure_debut),
                  } : null}
                  onClose={() => setShowPayment(false)}
                  onPaid={() => setIsNewConsultation(true)}
                />
              )}

              {showOrdonnanceBiologie && (
                <NewOrdonnanceBiologieModal
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  medecinId={selectedPatient.medecin_id}
                  consultations={consultations}
                  darkMode={darkMode}
                  onClose={() => setShowOrdonnanceBiologie(false)}
                  onCreated={refreshPatients}
                />
              )}

              {showOrdonnanceMedicament && (
                <NewOrdonnanceMedicamentModal
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  medecinId={selectedPatient.medecin_id}
                  consultations={consultations}
                  darkMode={darkMode}
                  onClose={() => setShowOrdonnanceMedicament(false)}
                  onCreated={refreshPatients}
                />
              )}

              {showOrdonnanceImagerie && (
                <NewOrdonnanceImagerieModal
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  medecinId={selectedPatient.medecin_id}
                  consultations={consultations}
                  darkMode={darkMode}
                  onClose={() => setShowOrdonnanceImagerie(false)}
                  onCreated={refreshPatients}
                />
              )}

              <div
                className={`h-[1px] my-6
                ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
              />

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setPatientTab("Consultation")} className={patientTabClass("Consultation")}>
                    <Stethoscope className="w-4 h-4 inline mr-2" />
                    Consultation
                  </button>
                  <button onClick={() => setPatientTab("Historique")} className={patientTabClass("Historique")}>
                    <History className="w-4 h-4 inline mr-2" />
                    Historique
                  </button>
                  <button onClick={() => setPatientTab("Information")} className={patientTabClass("Information")}>
                    <Info className="w-4 h-4 inline mr-2" />
                    Information
                  </button>
                  {selectedPatient?.gender === "Female" && (
                    <button onClick={() => setPatientTab("Gynécologie")} className={patientTabClass("Gynécologie")}>
                      <Baby className="w-4 h-4 inline mr-2" />
                      Gynécologie
                    </button>
                  )}
                </div>

                <div className="w-full md:w-64 lg:w-80">
                  <SearchBar
                    placeholder="Rechercher une consultation..."
                    value={consultationSearch}
                    onChange={(e) => setConsultationSearch(e.target.value)}
                  />
                </div>
              </div>

              {patientTab === "Consultation" && (
                <div className="flex flex-col mt-6 md:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredConsultations.length > 0 ? (
                        filteredConsultations.map((consultation) => (
                          <div
                            key={consultation.id}
                            onClick={() =>
                              setSelectedConsultation({
                                ...consultation,
                                prescriptions: consultation.prescriptions || [],
                                labResults: consultation.labResults || [],
                              })
                            }
                            className="cursor-pointer"
                          >
                            <PatientConsultationCard consultation={consultation} darkMode={darkMode} />
                          </div>
                        ))
                      ) : (
                        <p className={`text-sm col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Aucune consultation trouvée.
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedConsultation && (
                    <div className="w-full md:w-[380px]">
                      <PatientConsultationDetails
                        consultation={selectedConsultation}
                        onClose={() => setSelectedConsultation(null)}
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                </div>
              )}

              {patientTab === "Historique" && (
                <PatientHistory
                  selectedPatient={selectedPatient}
                  consultations={consultations}
                  darkMode={darkMode}
                />
              )}

              {patientTab === "Information" && (
                selectedPatient?.dossierRestricted ? (
                  <div className={`mt-6 rounded-2xl p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                      <Lock className={`w-8 h-8 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                      Accès restreint
                    </h3>
                    <p className={`text-sm mb-6 max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Ce patient a restreint l'accès à son dossier médical. Vous devez obtenir son autorisation pour consulter ses informations médicales.
                    </p>
                    {accessRequestSent ? (
                      <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
                        <CheckCircle className="w-4 h-4" />
                        Demande envoyée. En attente de la réponse du patient.
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestAccess}
                        disabled={accessRequestLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {accessRequestLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Demander l'autorisation au patient
                      </button>
                    )}
                  </div>
                ) : (
                  <PatientInfo
                    selectedPatient={selectedPatient}
                    darkMode={darkMode}
                    onOrdonnanceCreated={refreshPatients}
                  />
                )
              )}

              {patientTab === "Gynécologie" && (
                selectedPatient?.dossierRestricted ? (
                  <div className={`mt-6 rounded-2xl p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? "bg-yellow-900/30" : "bg-yellow-100"}`}>
                      <Lock className={`w-8 h-8 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                      Accès restreint
                    </h3>
                    <p className={`text-sm mb-6 max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Ce patient a restreint l'accès à son dossier médical. Vous devez obtenir son autorisation pour consulter son dossier gynécologique.
                    </p>
                    {accessRequestSent ? (
                      <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}>
                        <CheckCircle className="w-4 h-4" />
                        Demande envoyée. En attente de la réponse du patient.
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestAccess}
                        disabled={accessRequestLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {accessRequestLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Demander l'autorisation au patient
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-6">
                    <SuiviGynecoMedecin
                      dossier={selectedPatient.dossier}
                      patientId={selectedPatient.id}
                      onDossierUpdate={(updated) => {
                        setSelectedPatient((prev) => prev ? { ...prev, dossier: updated } : prev);
                      }}
                      darkMode={darkMode}
                    />
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
