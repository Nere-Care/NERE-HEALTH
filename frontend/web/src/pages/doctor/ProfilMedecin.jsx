import { useState, useEffect, useRef } from "react";
import {
  User, Save, Camera, Loader, CheckCircle, AlertCircle,
  Plus, Trash2, FileText, Briefcase, GraduationCap, Star,
  Stethoscope, DollarSign, ChevronDown, ChevronUp, Clock, Globe,
} from "lucide-react";
import { get, put } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { validatePhone, phoneError } from "../../utils/validatePhone";

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

export default function ProfilMedecin({ darkMode }) {
  const stored = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [medecin, setMedecin] = useState(null);
  const [specialites, setSpecialites] = useState([]);
  const [tarifModification, setTarifModification] = useState(null);

  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", telephone: "",
    numero_ordre: "", presentation: "",
    tarif_consultation: "5000", devise: "XAF",
    expertises: [], actes: [],
    formations: [], certifications: [],
    experience: [],
    annees_experience: "0",
    photo_url: "",
    langues_parlees: [],
  });

  const [expandedSections, setExpandedSections] = useState({
    presentation: true, expertises: true, actes: true,
    tarif: true, formations: true, experience: true,
    documents: true,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!stored?.id) return;
    Promise.all([
      get(`/api/users/${stored.id}`),
      get(`/api/medecins/${stored.id}`),
      get("/api/specialites"),
    ])
      .then(([u, m, specs]) => {
        setUser(u);
        setMedecin(m);
        setSpecialites(specs || []);
        setTarifModification(m.tarif_modification && m.tarif_modification.statut === "en_attente" ? m.tarif_modification : null);
        setForm({
          prenom: u.prenom || "",
          nom: u.nom || "",
          email: u.email || "",
          telephone: u.telephone || "",
          numero_ordre: m.numero_ordre || "",
          presentation: m.presentation || m.biographie || "",
          tarif_consultation: String(m.tarif_consultation || "5000"),
          devise: m.devise || "XAF",
          expertises: m.expertises || [],
          actes: m.actes || [],
          formations: m.diplomes || [],
          certifications: m.certifications || [],
          experience: m.experience_history || [],
          annees_experience: String(m.annees_experience || "0"),
          photo_url: u.photo_url || "",
          langues_parlees: m.langues_parlees || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [stored?.id]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (form.telephone && !validatePhone(form.telephone)) {
      setToast({ type: "error", msg: phoneError() });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSaving(true);
    try {
      await put("/api/auth/me", {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        photo_url: form.photo_url,
      });
      await put(`/api/medecins/${stored.id}`, {
        numero_ordre: form.numero_ordre,
        presentation: form.presentation,
        biographie: form.presentation,
        tarif_consultation: Number(form.tarif_consultation),
        devise: form.devise,
        expertises: form.expertises,
        actes: form.actes,
        diplomes: form.formations,
        certifications: form.certifications,
        experience_history: form.experience,
        annees_experience: Number(form.annees_experience),
        langues_parlees: form.langues_parlees,
      });
      setToast({ type: "success", msg: "Profil mis à jour avec succès" });
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Erreur de sauvegarde" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const addFormation = () =>
    set("formations", [...form.formations, { date: "", titre: "", ecole: "", fichier: "" }]);
  const removeFormation = (i) =>
    set("formations", form.formations.filter((_, j) => j !== i));
  const updateFormation = (i, key, val) => {
    const arr = [...form.formations];
    arr[i] = { ...arr[i], [key]: val };
    set("formations", arr);
  };

  const addCertification = () =>
    set("certifications", [...form.certifications, { date: "", titre: "", organisme: "" }]);
  const removeCertification = (i) =>
    set("certifications", form.certifications.filter((_, j) => j !== i));
  const updateCertification = (i, key, val) => {
    const arr = [...form.certifications];
    arr[i] = { ...arr[i], [key]: val };
    set("certifications", arr);
  };

  const addExperience = () =>
    set("experience", [...form.experience, { date_debut: "", date_fin: "", entreprise: "", poste: "" }]);
  const removeExperience = (i) =>
    set("experience", form.experience.filter((_, j) => j !== i));
  const updateExperience = (i, key, val) => {
    const arr = [...form.experience];
    arr[i] = { ...arr[i], [key]: val };
    set("experience", arr);
  };

  const toggleExpertise = (spec) => {
    const exists = form.expertises.find((e) => e.nom === spec);
    if (exists) {
      set("expertises", form.expertises.filter((e) => e.nom !== spec));
      set("actes", form.actes.filter((a) => !ACTES_PAR_SPECIALITE[spec]?.includes(a)));
    } else {
      set("expertises", [...form.expertises, { nom: spec, niveau: "standard" }]);
    }
  };

  const toggleActe = (acte) => {
    set("actes", form.actes.includes(acte) ? form.actes.filter((a) => a !== acte) : [...form.actes, acte]);
  };

  const linkedSpecialites = form.expertises.map((e) => e.nom);
  const availableActes = linkedSpecialites.flatMap((s) => ACTES_PAR_SPECIALITE[s] || []);

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm transition outline-none ${
    darkMode
      ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
  }`;
  const labelClass = `block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  const SectionHeader = ({ icon: Icon, title, sectionKey, count }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition ${
        darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
        }`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-sm">{title}</h3>
          {count !== undefined && (
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {count} élément{count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in
          ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4">
        {/* HEADER */}
        <div className={`rounded-2xl border p-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden ${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              }`}>
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400">{form.prenom?.[0]}{form.nom?.[0]}</span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{form.prenom} {form.nom}</h1>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {form.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
                }`}>
                  N° {form.numero_ordre || "—"}
                </span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </div>

        {/* INFORMATIONS PERSONNELLES */}
        <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
            }`}>
              <User size={20} />
            </div>
            <h3 className="font-semibold">Informations personnelles</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prénom</label>
              <input className={inputClass} value={form.prenom} onChange={(e) => set("prenom", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input className={inputClass} value={form.nom} onChange={(e) => set("nom", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input className={inputClass} type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} maxLength={9} pattern="6[0-9]{8}" placeholder="6XX XXX XXX" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Numéro d'ordre</label>
              <input className={inputClass} value={form.numero_ordre} onChange={(e) => set("numero_ordre", e.target.value)} placeholder="Ex: ORD-2024-001" />
            </div>
          </div>
        </div>

        {/* PRÉSENTATION */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={FileText} title="Présentation" sectionKey="presentation" />
          {expandedSections.presentation && (
            <div className="px-5 pb-5">
              <textarea
                className={`${inputClass} min-h-[120px]`}
                value={form.presentation}
                onChange={(e) => set("presentation", e.target.value)}
                placeholder="Décrivez votre parcours, votre approche médicale, vos domaines d'intérêt..."
              />
            </div>
          )}
        </div>

        {/* LANGUES PARLÉES */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
              }`}>
                <Globe size={20} />
              </div>
              <h3 className="font-semibold text-sm">Langues parlées</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Français","Anglais","Allemand","Arabe","Espagnol","Portugais","Chinois","Italien","Bassa","Duala","Bamiléké","Fang","Ewondo","Haoussa","Peul"].map((lang) => {
                const selected = form.langues_parlees.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() =>
                      set("langues_parlees", selected
                        ? form.langues_parlees.filter((l) => l !== lang)
                        : [...form.langues_parlees, lang]
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-500"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* EXPERTISES */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={Star} title="Expertises" sectionKey="expertises" count={form.expertises.length} />
          {expandedSections.expertises && (
            <div className="px-5 pb-5">
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Sélectionnez vos spécialités d'expertise (lié à votre profession)
              </p>
              <div className="flex flex-wrap gap-2">
                {specialites.map((spec) => {
                  const selected = form.expertises.some((e) => e.nom === spec.libelle_fr);
                  return (
                    <button
                      key={spec.id}
                      onClick={() => toggleExpertise(spec.libelle_fr)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-500"
                      }`}
                    >
                      {spec.libelle_fr}
                    </button>
                  );
                })}
              </div>
              {form.expertises.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.expertises.map((e, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      {e.nom}
                      <button onClick={() => toggleExpertise(e.nom)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACTES */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={Stethoscope} title="Actes médicaux" sectionKey="actes" count={form.actes.length} />
          {expandedSections.actes && (
            <div className="px-5 pb-5">
              {linkedSpecialites.length === 0 ? (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Sélectionnez d'abord des expertises pour voir les actes disponibles
                </p>
              ) : (
                <>
                  <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Actes liés à vos spécialités sélectionnées
                  </p>
                  {linkedSpecialites.map((spec) => (
                    <div key={spec} className="mb-3">
                      <p className={`text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {spec}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(ACTES_PAR_SPECIALITE[spec] || []).map((acte) => (
                          <button
                            key={acte}
                            onClick={() => toggleActe(acte)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                              form.actes.includes(acte)
                                ? "bg-green-600 text-white border-green-600"
                                : darkMode
                                ? "bg-gray-700 text-gray-300 border-gray-600 hover:border-green-500"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-500"
                            }`}
                          >
                            {acte}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* TARIF */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={DollarSign} title="Tarif de consultation" sectionKey="tarif" />
          {expandedSections.tarif && (
            <div className="px-5 pb-5">
              {tarifModification && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm flex items-center gap-2">
                  <Clock size={16} />
                  <span>
                    Modification en attente de validation admin :{" "}
                    <strong>{Number(tarifModification.tarif_consultation || medecin.tarif_consultation).toLocaleString()} {tarifModification.devise || medecin.devise}</strong>
                  </span>
                </div>
              )}
              <div className={`p-3 rounded-xl mb-4 text-sm ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                Tarif actuel : <strong>{Number(medecin.tarif_consultation || 5000).toLocaleString()} {medecin.devise || "XAF"}</strong>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nouveau tarif</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={form.tarif_consultation}
                    onChange={(e) => set("tarif_consultation", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Devise</label>
                  <select className={inputClass} value={form.devise} onChange={(e) => set("devise", e.target.value)}>
                    {["XAF", "EUR", "USD", "GBP", "XOF"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Années d'expérience</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={form.annees_experience}
                    onChange={(e) => set("annees_experience", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FORMATIONS */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={GraduationCap} title="Formations" sectionKey="formations" count={form.formations.length} />
          {expandedSections.formations && (
            <div className="px-5 pb-5 space-y-3">
              {form.formations.map((f, i) => (
                <div key={i} className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Formation #{i + 1}
                    </span>
                    <button onClick={() => removeFormation(i)} className="text-red-500 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Date</label>
                      <input className={inputClass} type="month" value={f.date || ""}
                        onChange={(e) => updateFormation(i, "date", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Diplôme / Certificat</label>
                      <input className={inputClass} value={f.titre || ""}
                        onChange={(e) => updateFormation(i, "titre", e.target.value)}
                        placeholder="Ex: Doctorat en Médecine" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>École / Institution</label>
                      <input className={inputClass} value={f.ecole || ""}
                        onChange={(e) => updateFormation(i, "ecole", e.target.value)}
                        placeholder="Ex: Université de Yaoundé I" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Justificatif (URL du fichier)</label>
                      <input className={inputClass} value={f.fichier || ""}
                        onChange={(e) => updateFormation(i, "fichier", e.target.value)}
                        placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addFormation}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${
                  darkMode
                    ? "border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                    : "border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                <Plus size={16} />
                Ajouter une formation
              </button>
            </div>
          )}
        </div>

        {/* CERTIFICATIONS */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={GraduationCap} title="Certifications" sectionKey="certifications" count={form.certifications.length} />
          {expandedSections.certifications && (
            <div className="px-5 pb-5 space-y-3">
              {form.certifications.map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Certification #{i + 1}
                    </span>
                    <button onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Date</label>
                      <input className={inputClass} type="month" value={c.date || ""}
                        onChange={(e) => updateCertification(i, "date", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Certification</label>
                      <input className={inputClass} value={c.titre || ""}
                        onChange={(e) => updateCertification(i, "titre", e.target.value)}
                        placeholder="Ex: Diplôme national" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Organisme</label>
                      <input className={inputClass} value={c.organisme || ""}
                        onChange={(e) => updateCertification(i, "organisme", e.target.value)}
                        placeholder="Ex: Ordre des Médecins du Cameroun" />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addCertification}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${
                  darkMode
                    ? "border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                    : "border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                <Plus size={16} />
                Ajouter une certification
              </button>
            </div>
          )}
        </div>

        {/* EXPÉRIENCE */}
        <div className={`rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <SectionHeader icon={Briefcase} title="Expérience" sectionKey="experience" count={form.experience.length} />
          {expandedSections.experience && (
            <div className="px-5 pb-5 space-y-3">
              {form.experience.map((exp, i) => (
                <div key={i} className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Expérience #{i + 1}
                    </span>
                    <button onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Date début</label>
                      <input className={inputClass} type="month" value={exp.date_debut || ""}
                        onChange={(e) => updateExperience(i, "date_debut", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Date fin</label>
                      <input className={inputClass} type="month" value={exp.date_fin || ""}
                        onChange={(e) => updateExperience(i, "date_fin", e.target.value)}
                        placeholder="Présent" />
                    </div>
                    <div>
                      <label className={labelClass}>Entreprise / Structure</label>
                      <input className={inputClass} value={exp.entreprise || ""}
                        onChange={(e) => updateExperience(i, "entreprise", e.target.value)}
                        placeholder="Ex: CHU de Yaoundé" />
                    </div>
                    <div>
                      <label className={labelClass}>Poste</label>
                      <input className={inputClass} value={exp.poste || ""}
                        onChange={(e) => updateExperience(i, "poste", e.target.value)}
                        placeholder="Ex: Cardiologue" />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addExperience}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition ${
                  darkMode
                    ? "border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                    : "border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                <Plus size={16} />
                Ajouter une expérience
              </button>
            </div>
          )}
        </div>

        {/* SAVE BUTTON (bottom) */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer le profil
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
