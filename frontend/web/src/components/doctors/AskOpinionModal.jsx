import {
  X,
  Stethoscope,
  AlertCircle,
  Paperclip,
  Loader,
  Send,
  Wallet,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  Lock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { get, post } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

const PAYMENT_METHODS = [
  {
    id: "portefeuille_nere",
    label: "Portefeuille Nere Health",
    subLabel: "Débit instantané de votre solde",
    icon: Wallet,
    iconColor: "text-blue-500",
    gradient: "from-blue-600 to-indigo-600",
    badge: "Instantané",
    badgeColor: "bg-blue-100 text-blue-700",
    needsPhone: false,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    subLabel: "Paiement via Orange Money",
    iconEmoji: "🟠",
    iconColor: "text-orange-500",
    gradient: "from-orange-500 to-orange-600",
    badge: "Mobile Money",
    badgeColor: "bg-orange-100 text-orange-700",
    needsPhone: true,
    phonePlaceholder: "Ex: 6 90 00 00 00",
  },
  {
    id: "mtn_momo",
    label: "MTN MoMo",
    subLabel: "Paiement via MTN Mobile Money",
    iconEmoji: "🟡",
    iconColor: "text-yellow-500",
    gradient: "from-yellow-500 to-yellow-600",
    badge: "Mobile Money",
    badgeColor: "bg-yellow-100 text-yellow-700",
    needsPhone: true,
    phonePlaceholder: "Ex: 6 70 00 00 00",
  },
  {
    id: "carte_visa",
    label: "Carte Visa / Mastercard",
    subLabel: "Paiement sécurisé par carte bancaire",
    icon: CreditCard,
    iconColor: "text-purple-500",
    gradient: "from-purple-600 to-purple-700",
    badge: "Carte bancaire",
    badgeColor: "bg-purple-100 text-purple-700",
    needsPhone: false,
  },
];

export default function AskOpinionModal({ darkMode, doctor, onClose }) {
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [doctorSpecialites, setDoctorSpecialites] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [specialiteId, setSpecialiteId] = useState("");
  const [motif, setMotif] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [contexte, setContexte] = useState("");
  const [question, setQuestion] = useState("");
  const [examens, setExamens] = useState("");
  const [payeurType, setPayeurType] = useState("medecin");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState("form");
  const [createdDemande, setCreatedDemande] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState("portefeuille_nere");
  const [telephone, setTelephone] = useState("");
  const [solde, setSolde] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    get("/api/patients", { mine: true, limit: 200 }).then(setPatients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!doctor?.id) return;
    get("/api/medecin_specialites", { medecin_id: doctor.id })
      .then(async (specs) => {
        const enriched = await Promise.all(
          specs.map(async (s) => {
            try {
              const sp = await get("/api/specialites/" + s.specialite_id);
              return { id: s.specialite_id, label: sp.libelle_fr || sp.libelle_en || "—" };
            } catch {
              return { id: s.specialite_id, label: s.specialite_id };
            }
          })
        );
        setDoctorSpecialites(enriched);
        if (enriched.length === 1) setSpecialiteId(enriched[0].id);
        else if (doctor.specialiteId) setSpecialiteId(doctor.specialiteId);
      })
      .catch(() => {
        if (doctor.specialiteId) setSpecialiteId(doctor.specialiteId);
      });
  }, [doctor?.id]);

  useEffect(() => {
    if (!patientId) {
      setConsultations([]);
      setDossiers([]);
      setConsultationId("");
      setDossierId("");
      return;
    }
    Promise.all([
      get("/api/consultations", { patient_id: patientId }).catch(() => []),
      get("/api/dossiers_medicaux", { patient_id: patientId }).catch(() => []),
    ]).then(([cons, doss]) => {
      setConsultations(cons);
      setDossiers(doss);
      setConsultationId("");
      setDossierId("");
    });
  }, [patientId]);

  useEffect(() => {
    if (step === "payment") {
      get("/api/retraits/solde")
        .then((data) => setSolde(data?.a_retirer ?? null))
        .catch(() => setSolde(null));
    }
  }, [step]);

  if (!doctor) return null;

  const caution = doctor.tarif_consultation || 5000;
  const commission = Math.round(caution * 0.10);
  const netExpert = caution - commission;

  const motifs = [
    "Confirmation diagnostique",
    "Aide à la décision thérapeutique",
    "Interprétation d'examens complémentaires",
    "Deuxième avis médical",
    "Avis spécialisé pluridisciplinaire",
    "Suivi de pathologie complexe",
    "Autre",
  ];

  const urgences = [
    { value: "non_urgent", label: "Non urgent", color: "bg-gray-100 text-gray-700 border-gray-300", active: "bg-gray-200 border-gray-500" },
    { value: "normal", label: "Sous 48h", color: "bg-blue-50 text-blue-700 border-blue-300", active: "bg-blue-100 border-blue-500" },
    { value: "urgent", label: "Urgent", color: "bg-orange-50 text-orange-700 border-orange-300", active: "bg-orange-100 border-orange-500" },
    { value: "tres_urgent", label: "Très urgent", color: "bg-red-50 text-red-700 border-red-300", active: "bg-red-100 border-red-500" },
  ];

  const inputClass = "w-full px-4 py-2.5 rounded-xl border outline-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500");
  const textareaClass = "w-full p-3 rounded-xl border outline-none resize-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500" : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500");
  const cardBase = darkMode ? "bg-gray-900" : "bg-white";
  const borderBase = darkMode ? "border-gray-700" : "border-gray-100";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";

  const validate = () => {
    const newErrors = {};
    if (!specialiteId) newErrors.specialite = "Veuillez sélectionner la spécialité concernée";
    if (!patientId) newErrors.patientId = "Le patient est requis";
    if (!motif) newErrors.motif = "Veuillez sélectionner un motif";
    if (!contexte.trim()) newErrors.contexte = "Le contexte clinique est requis";
    if (!question.trim()) newErrors.question = "Veuillez formuler votre question";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = await post("/api/demandes-avis", {
        patient_id: patientId,
        specialite_id: specialiteId,
        portee: "cameroun",
        consultation_id: consultationId || null,
        dossier_medical_id: dossierId || null,
        motif,
        message: [
          "Urgence: " + urgence,
          "Contexte: " + contexte.trim(),
          "Question: " + question.trim(),
          examens.trim() ? "Examens: " + examens.trim() : null,
        ].filter(Boolean).join("\n\n"),
        confidentiel: true,
        medecin_cible_id: doctor.id,
        payeur_type: payeurType,
      });

      setCreatedDemande(data);
      if (payeurType === "medecin") {
        setStep("payment");
      } else {
        setStep("success");
      }
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!createdDemande?.id) return;
    const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
    if (method?.needsPhone && !telephone.trim()) {
      setErrors({ phone: "Veuillez saisir votre numéro de téléphone" });
      return;
    }
    setPaymentLoading(true);
    setErrors({});
    try {
      await post("/api/demandes-avis/" + createdDemande.id + "/payer-sequestre", {
        methode: selectedMethod,
        telephone: telephone || null,
      });
      setStep("success");
    } catch (err) {
      setErrors({ payment: err.message || "Erreur lors du paiement" });
    } finally {
      setPaymentLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto z-[9999] p-4 sm:p-6 md:p-10">
      <div className={"w-full max-w-2xl my-auto rounded-2xl shadow-2xl relative " + cardBase + " " + (darkMode ? "text-white" : "text-gray-800")}>

        {/* HEADER */}
        <div className={"sticky top-0 z-10 flex items-start justify-between p-5 border-b " + cardBase + " " + borderBase}>
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {doctor.name?.charAt(0) || "D"}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {step === "payment" ? "Paiement du séquestre" : "Demande d'avis médical"}
              </h2>
              <p className={"text-sm " + textMuted}>
                {step === "payment" ? "Choisissez votre mode de paiement" : "Adressée au Dr. " + doctor.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={"p-2 rounded-lg transition " + (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
            <X size={20} />
          </button>
        </div>

        {/* STEP: FORM */}
        {step === "form" && (
          <>
            <div className="p-5 flex flex-col gap-5">
              {/* Info */}
              <div className={"flex items-start gap-3 p-3 rounded-xl text-xs " + (darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700")}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p>Votre demande sera envoyée sous forme de notification. Le praticien pourra l'accepter ou la refuser.</p>
              </div>

              {/* Spécialité */}
              {doctorSpecialites.length > 1 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Spécialité concernée <span className="text-red-500">*</span></label>
                  <select value={specialiteId} onChange={(e) => setSpecialiteId(e.target.value)} className={inputClass + (errors.specialite ? " border-red-500" : "")}>
                    <option value="">— Sélectionnez la spécialité —</option>
                    {doctorSpecialites.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  {errors.specialite && <p className="text-xs text-red-500 mt-1">{errors.specialite}</p>}
                </div>
              )}
              {doctorSpecialites.length === 1 && (
                <div className={"flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm " + (darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200")}>
                  <Stethoscope size={15} className="text-blue-500 flex-shrink-0" />
                  <span className={textMuted}>Spécialité demandée :</span>
                  <span className="font-semibold">{doctorSpecialites[0].label}</span>
                </div>
              )}

              {/* Patient */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Patient concerné <span className="text-red-500">*</span></label>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={inputClass + (errors.patientId ? " border-red-500" : "")}>
                  <option value="">— Sélectionnez un patient —</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
                {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>}
              </div>

              {/* Payeur */}
              <div>
                <label className="text-sm font-semibold mb-1 block">Prise en charge du séquestre <span className="text-red-500">*</span></label>
                <p className={"text-xs mb-2.5 " + textMuted}>
                  La plateforme séquestre <strong>{caution.toLocaleString("fr-FR")} FCFA</strong> à la création et ajuste/rembourse à la clôture.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPayeurType("medecin")} className={"p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition " + (payeurType === "medecin" ? (darkMode ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-700") : (darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"))}>
                    <span>🩺 Médecin demandeur</span>
                    <span className="text-[10px] font-normal opacity-80">Je règle le séquestre maintenant</span>
                  </button>
                  <button type="button" onClick={() => setPayeurType("patient")} className={"p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition " + (payeurType === "patient" ? (darkMode ? "bg-purple-600/20 border-purple-500 text-purple-400" : "bg-purple-50 border-purple-300 text-purple-700") : (darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"))}>
                    <span>👤 Transférer au Patient</span>
                    <span className="text-[10px] font-normal opacity-80">Le patient valide le séquestre</span>
                  </button>
                </div>
              </div>

              {/* Consultation */}
              {patientId && consultations.length > 0 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Consultation liée <span className={"text-xs font-normal ml-2 " + textMuted}>(optionnel)</span></label>
                  <select value={consultationId} onChange={(e) => setConsultationId(e.target.value)} className={inputClass}>
                    <option value="">— Aucune consultation —</option>
                    {consultations.map((c) => <option key={c.id} value={c.id}>{c.numero_consultation || c.id?.slice(0, 8)} — {new Date(c.created_at).toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })}</option>)}
                  </select>
                </div>
              )}

              {/* Dossier */}
              {patientId && dossiers.length > 0 && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Dossier médical <span className={"text-xs font-normal ml-2 " + textMuted}>(optionnel)</span></label>
                  <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} className={inputClass}>
                    <option value="">— Aucun dossier —</option>
                    {dossiers.map((d) => <option key={d.id} value={d.id}>Dossier {d.numero_dossier || d.id?.slice(0, 8)}</option>)}
                  </select>
                </div>
              )}

              {/* Motif */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Motif de la demande <span className="text-red-500">*</span></label>
                <select value={motif} onChange={(e) => setMotif(e.target.value)} className={inputClass + (errors.motif ? " border-red-500" : "")}>
                  <option value="">— Sélectionnez un motif —</option>
                  {motifs.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.motif && <p className="text-xs text-red-500 mt-1">{errors.motif}</p>}
              </div>

              {/* Urgence */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Niveau d'urgence</label>
                <div className="grid grid-cols-4 gap-2">
                  {urgences.map((u) => (
                    <button key={u.value} type="button" onClick={() => setUrgence(u.value)} className={"px-2 py-2 rounded-xl border text-xs font-semibold transition " + (urgence === u.value ? u.active : u.color)}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contexte */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Contexte clinique <span className="text-red-500">*</span></label>
                <textarea rows={4} value={contexte} onChange={(e) => setContexte(e.target.value)} placeholder="Décrivez le tableau clinique du patient, ses antécédents pertinents, les traitements en cours..." className={textareaClass + (errors.contexte ? " border-red-500" : "")} />
                {errors.contexte && <p className="text-xs text-red-500 mt-1">{errors.contexte}</p>}
              </div>

              {/* Question */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Question posée au spécialiste <span className="text-red-500">*</span></label>
                <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Formulez précisément votre question..." className={textareaClass + (errors.question ? " border-red-500" : "")} />
                {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
              </div>

              {/* Examens */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Examens complémentaires <span className={"text-xs font-normal ml-2 " + textMuted}>(optionnel)</span></label>
                <textarea rows={2} value={examens} onChange={(e) => setExamens(e.target.value)} placeholder="Résultats d'examens, bilans, imageries disponibles..." className={textareaClass} />
              </div>

              {/* Documents */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Documents joints <span className={"text-xs font-normal ml-2 " + textMuted}>(optionnel)</span></label>
                <label className={"flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition " + (darkMode ? "border-gray-700 hover:border-gray-600 text-gray-400" : "border-gray-300 hover:border-blue-400 text-gray-500")}>
                  <Paperclip size={18} />
                  <span className="text-sm">Cliquez pour ajouter des documents</span>
                  <input type="file" multiple className="hidden" />
                </label>
              </div>
            </div>

            {/* Footer form */}
            <div className={"sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t " + cardBase + " " + borderBase}>
              {errors.submit && <p className="text-xs text-red-500 mr-auto">{errors.submit}</p>}
              <button onClick={onClose} className={"px-5 py-2.5 rounded-xl text-sm font-semibold transition " + (darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader size={16} className="animate-spin" /> : <Stethoscope size={16} />}
                {payeurType === "medecin" ? "Suivant — Payer le séquestre" : "Envoyer la demande"}
              </button>
            </div>
          </>
        )}

        {/* STEP: PAYMENT METHOD */}
        {step === "payment" && (
          <>
            <div className="p-5 flex flex-col gap-5">
              {/* Escrow summary */}
              <div className={"rounded-2xl p-4 border " + (darkMode ? "bg-gradient-to-br from-blue-900/40 to-indigo-900/30 border-blue-700/50" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200")}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={18} className="text-blue-500" />
                  <span className="font-bold text-sm">Récapitulatif du séquestre</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={textMuted}>Caution retenue par Nere Health</span>
                    <span className="font-bold">{caution.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textMuted}>Commission plateforme (10%)</span>
                    <span className="font-semibold text-orange-500">−{commission.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className={"flex justify-between pt-2 border-t " + borderBase}>
                    <span className={textMuted}>Reversé au médecin expert (90%)</span>
                    <span className="font-bold text-green-500">{netExpert.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
                <p className={"text-xs mt-3 " + textMuted}>
                  🔒 Si le médecin facture moins, le surplus vous est remboursé automatiquement à la clôture.
                </p>
              </div>

              {/* Wallet balance */}
              {solde !== null && (
                <div className={"flex items-center gap-3 p-3 rounded-xl text-sm " + (darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200")}>
                  <Wallet size={16} className="text-blue-500 flex-shrink-0" />
                  <span className={textMuted}>Solde Nere Health :</span>
                  <span className={"font-bold ml-auto " + (solde >= caution ? "text-green-500" : "text-red-500")}>
                    {Number(solde).toLocaleString("fr-FR")} FCFA
                  </span>
                  {solde < caution && <span className="text-xs text-red-400 ml-1">(insuffisant)</span>}
                </div>
              )}

              {/* Methods */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">Mode de paiement</label>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedMethod === method.id;
                  const isDisabled = method.comingSoon || (method.id === "portefeuille_nere" && solde !== null && solde < caution);
                  const IconComp = method.icon;

                  return (
                    <div key={method.id}>
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => { if (!isDisabled) { setSelectedMethod(method.id); setErrors({}); } }}
                        className={"w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left " + (
                          isDisabled ? "opacity-40 cursor-not-allowed " + (darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")
                          : isSelected ? (darkMode ? "border-blue-500 bg-blue-900/20" : "border-blue-400 bg-blue-50")
                          : darkMode ? "border-gray-700 bg-gray-800 hover:border-gray-600" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        )}
                      >
                        <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + (isSelected ? "bg-gradient-to-br " + method.gradient + " text-white" : darkMode ? "bg-gray-700" : "bg-gray-100")}>
                          {method.iconEmoji ? <span className="text-xl">{method.iconEmoji}</span> : IconComp ? <IconComp size={18} className={isSelected ? "text-white" : method.iconColor} /> : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{method.label}</span>
                            <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-medium " + method.badgeColor}>
                              {method.comingSoon ? "Bientôt" : method.badge}
                            </span>
                          </div>
                          <p className={"text-xs mt-0.5 " + textMuted}>{method.subLabel}</p>
                        </div>
                        {!isDisabled && (
                          <div className={"w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center " + (isSelected ? "border-blue-500 bg-blue-500" : darkMode ? "border-gray-600" : "border-gray-300")}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        )}
                      </button>

                      {/* Phone field */}
                      {isSelected && method.needsPhone && (
                        <div className="mt-2 ml-1">
                          <label className="text-xs font-medium mb-1.5 block">
                            Numéro {method.id === "orange_money" ? "Orange" : "MTN"}
                          </label>
                          <div className="flex gap-2">
                            <div className={"flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold " + (darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-600")}>
                              <Smartphone size={14} />
                              <span>+237</span>
                            </div>
                            <input
                              type="tel"
                              value={telephone}
                              onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ""))}
                              placeholder={method.phonePlaceholder}
                              maxLength={9}
                              className={inputClass + " flex-1 " + (errors.phone ? "border-red-500" : "")}
                            />
                          </div>
                          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.payment && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{errors.payment}</div>
              )}
            </div>

            {/* Footer payment */}
            <div className={"sticky bottom-0 flex items-center gap-3 p-5 border-t " + cardBase + " " + borderBase}>
              <button onClick={() => setStep("form")} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition " + (darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}>
                <ArrowLeft size={16} />
                Retour
              </button>
              <button onClick={handlePay} disabled={paymentLoading} className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                {paymentLoading ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
                Confirmer · {caution.toLocaleString("fr-FR")} FCFA
              </button>
            </div>
          </>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {payeurType === "medecin" ? "Séquestre encaissé ✓" : "Demande envoyée ✓"}
            </h3>
            <p className={"text-sm mb-5 " + textMuted}>
              {payeurType === "medecin"
                ? caution.toLocaleString("fr-FR") + " FCFA retenus par Nere Health en garantie. Dr. " + doctor.name + " a été notifié."
                : "Dr. " + doctor.name + " a été notifié. La facture du séquestre sera envoyée au patient."}
            </p>

            {payeurType === "medecin" && (
              <div className={"rounded-xl p-4 text-sm text-left mb-5 " + (darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200")}>
                <p className="font-semibold mb-2">À la clôture de l'avis :</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className={textMuted}>Si le médecin facture <strong>{caution.toLocaleString("fr-FR")} FCFA</strong> : aucun remboursement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className={textMuted}>S'il facture moins : le surplus vous est remboursé automatiquement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className={textMuted}>S'il ne facture pas (gratuit) : remboursement total de <strong>{caution.toLocaleString("fr-FR")} FCFA</strong></span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={onClose} className="px-8 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
