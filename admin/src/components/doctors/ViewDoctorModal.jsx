import { useState } from "react";
import {
  X, Building2, Phone, Mail, MapPin, FileText, CheckCircle, XCircle,
  Edit2, Trash2, Eye, Ban, PauseCircle, PlayCircle, Briefcase,
  Award, GraduationCap, Clock, CheckSquare, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";

// Resolve backend-relative paths like /uploads/... to full URL
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url}`;
};

export default function ViewDoctorModal({
  darkMode,
  doctor,
  pendingChanges = [],
  onClose,
  onVerify,
  onReject,
  onStatusChange,
  onViewDocs,
  onEdit,
  onDelete,
  onBan,
  onSuspend,
  onActivate,
  onValidateChange,
}) {
  const isVerificationPending = doctor.status === "En attente";
  const isSuspended = doctor.userStatut === "suspendu";
  const isBanned = doctor.userStatut === "banni";

  // Filter pending changes specific to this doctor
  const doctorPending = pendingChanges.filter(
    (pc) => String(pc.medecin_id) === String(doctor.id)
  );

  const [openSection, setOpenSection] = useState("certifications");
  const [previewDoc, setPreviewDoc] = useState(null); // { url, nom, mime }

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

  const statusBadge = () => {
    const map = {
      "Vérifié": "bg-green-500/10 text-green-500 border-green-500/20",
      "En attente": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "Suspendu": "bg-orange-500/10 text-orange-500 border-orange-500/20",
      "Banni": "bg-red-600/10 text-red-600 border-red-600/20",
      "Actif": "bg-green-500/10 text-green-500 border-green-500/20",
      "Inactif": "bg-gray-500/10 text-gray-500 border-gray-500/20",
      "Rejeté": "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return map[doctor.status] || "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  const ItemStatusBadge = ({ statut }) => {
    if (!statut || statut === "en_attente") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500 border border-amber-500/25">
          <Clock size={10} /> En attente
        </span>
      );
    }
    if (statut === "valide") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-500 border border-green-500/25">
          <CheckSquare size={10} /> Validé
        </span>
      );
    }
    if (statut === "rejete") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/25">
          <XCircle size={10} /> Rejeté
        </span>
      );
    }
    return null;
  };

  const ProfileSection = ({ title, icon: Icon, field, items = [], color = "blue" }) => {
    const isOpen = openSection === field;
    const colorMap = {
      blue: "text-blue-400 bg-blue-500/10",
      purple: "text-purple-400 bg-purple-500/10",
      teal: "text-teal-400 bg-teal-500/10",
    };
    const pendingCount = (items || []).filter(
      (it) => !it.statut || it.statut === "en_attente"
    ).length;

    return (
      <div className={"rounded-xl border overflow-hidden " + (darkMode ? "border-slate-700" : "border-gray-200")}>
        <button
          onClick={() => setOpenSection(isOpen ? null : field)}
          className={"w-full flex items-center justify-between px-4 py-3 text-left transition " + (darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-50 hover:bg-gray-100")}
        >
          <div className="flex items-center gap-3">
            <div className={"p-1.5 rounded-lg " + colorMap[color]}>
              <Icon size={14} />
            </div>
            <span className="font-semibold text-sm">{title}</span>
            <span className={"text-xs px-2 py-0.5 rounded-full " + (darkMode ? "bg-slate-700 text-gray-400" : "bg-gray-200 text-gray-500")}>
              {(items || []).length}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-medium">
                {pendingCount} en attente
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {isOpen && (
          <div className={"divide-y " + (darkMode ? "divide-slate-700" : "divide-gray-100")}>
            {(items || []).length === 0 ? (
              <p className={"px-4 py-3 text-sm " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                Aucun élément
              </p>
            ) : (
              (items || []).map((item, i) => {
                const isPending = !item.statut || item.statut === "en_attente";
                const pendingEntry = doctorPending.find(
                  (pc) => pc.field === field && pc.index === i
                );

                return (
                  <div
                    key={i}
                    className={"px-4 py-3 " + (isPending ? (darkMode ? "bg-amber-900/10" : "bg-amber-50/60") : "")}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">
                            {item.titre || item.poste || item.organisme || item.etablissement || "—"}
                          </p>
                          <ItemStatusBadge statut={item.statut} />
                        </div>
                        {(item.etablissement || item.lieu) && field !== "certifications" && (
                          <p className={"text-xs " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                            {item.etablissement || item.lieu}
                          </p>
                        )}
                        {(item.date_debut || item.annee || item.date_obtention) && (
                          <p className={"text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                            {item.date_debut || item.annee || item.date_obtention}
                            {item.date_fin ? " → " + item.date_fin : item.en_cours ? " → En cours" : ""}
                          </p>
                        )}
                        {item.description && (
                          <p className={"text-xs italic " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                            {item.description}
                          </p>
                        )}
                        {item.fichier && item.fichier.url && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ url: resolveUrl(item.fichier.url), nom: item.fichier.nom || 'Document', mime: item.fichier.type || '' })}
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                          >
                            <Eye size={11} /> Voir le document
                          </button>
                        )}
                      </div>

                      {isPending && pendingEntry && onValidateChange && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() =>
                              onValidateChange(pendingEntry.medecin_id, pendingEntry.field, pendingEntry.index, "approve")
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition"
                          >
                            <CheckCircle size={12} /> Approuver
                          </button>
                          <button
                            onClick={() =>
                              onValidateChange(pendingEntry.medecin_id, pendingEntry.field, pendingEntry.index, "reject")
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition"
                          >
                            <XCircle size={12} /> Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={"w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] " + (darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900")}
      >
        {/* Header */}
        <div className={"flex items-center justify-between px-5 py-4 border-b flex-shrink-0 " + (darkMode ? "border-slate-700" : "border-gray-200")}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {doctor.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{doctor.name}</h2>
                {doctorPending.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    <AlertCircle size={11} /> {doctorPending.length} en attente
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">
                ID: #{String(doctor.id).slice(0, 8)}… • {doctor.specialty}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={"p-2 rounded-lg transition flex-shrink-0 " + (darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={"px-4 py-1.5 rounded-full text-sm font-medium border " + statusBadge()}>
              {doctor.status}
            </span>
            <span className={"text-sm " + (darkMode ? "text-gray-400" : "text-gray-500")}>
              Ajouté le {doctor.createdAt}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoItem icon={Building2} label="Hôpital" value={doctor.hospital} darkMode={darkMode} />
            <InfoItem icon={Phone} label="Téléphone" value={doctor.phone} darkMode={darkMode} />
            <InfoItem icon={Mail} label="Email" value={doctor.email} darkMode={darkMode} />
            <InfoItem icon={MapPin} label="Adresse" value={doctor.address} darkMode={darkMode} />
            <InfoItem icon={FileText} label="N° Ordre" value={doctor.numero_ordre} darkMode={darkMode} />
            <InfoItem
              icon={Briefcase}
              label="Années d'expérience"
              value={doctor.annees_experience ? doctor.annees_experience + " an(s)" : null}
              darkMode={darkMode}
            />
          </div>

          {/* PROFIL PROFESSIONNEL */}
          <div>
            <h3 className={"text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
              <Award size={13} /> Profil professionnel
            </h3>
            <div className="space-y-2">
              <ProfileSection
                title="Formations / Diplômes"
                icon={GraduationCap}
                field="diplomes"
                items={doctor.diplomes}
                color="blue"
              />
              <ProfileSection
                title="Certifications"
                icon={Award}
                field="certifications"
                items={doctor.certifications}
                color="purple"
              />
              <ProfileSection
                title="Expériences professionnelles"
                icon={Briefcase}
                field="experience_history"
                items={doctor.experience_history}
                color="teal"
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <FileText size={14} className="text-blue-500" />
              Documents ({doctor.documents ? doctor.documents.length : 0})
            </h3>
            {doctor.documents && doctor.documents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {doctor.documents.slice(0, 4).map((doc, i) => {
                  const url = doc.url ? resolveUrl(doc.url) : null;
                  return url ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewDoc({ url, nom: doc.nom || doc.name || 'Document', mime: doc.mime_type || doc.type || '' })}
                      className={"px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:ring-2 hover:ring-blue-500/40 transition " + (darkMode ? "bg-slate-800 text-blue-400" : "bg-gray-100 text-blue-600")}
                    >
                      <Eye size={11} /> {doc.nom || doc.name}
                    </button>
                  ) : (
                    <span
                      key={i}
                      className={"px-3 py-1.5 rounded-lg text-xs " + (darkMode ? "bg-slate-800" : "bg-gray-100")}
                    >
                      {doc.nom || doc.name}
                    </span>
                  );
                })}
                {doctor.documents.length > 4 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-gray-400">
                    +{doctor.documents.length - 4} autres
                  </span>
                )}
              </div>
            ) : (
              <p className={"text-sm " + (darkMode ? "text-gray-500" : "text-gray-400")}>Aucun document</p>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className={"px-5 py-4 border-t flex-shrink-0 space-y-3 " + (darkMode ? "bg-slate-900/80 border-slate-700" : "bg-gray-50 border-gray-200")}>
          {isVerificationPending && (
            <div className="flex gap-3">
              <button
                onClick={() => onStatusChange("Vérifié")}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Vérifier le compte
              </button>
              <button
                onClick={() => onStatusChange("Rejeté")}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Rejeter
              </button>
            </div>
          )}

          {!isVerificationPending && (
            <div className="flex gap-2">
              {isBanned ? (
                <button
                  onClick={() => onActivate && onActivate()}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <PlayCircle size={16} /> Activer
                </button>
              ) : isSuspended ? (
                <>
                  <button
                    onClick={() => onActivate && onActivate()}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={16} /> Activer
                  </button>
                  <button
                    onClick={() => onBan && onBan()}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <Ban size={16} /> Bannir
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSuspend && onSuspend()}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <PauseCircle size={16} /> Suspendre
                  </button>
                  <button
                    onClick={() => onBan && onBan()}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2"
                  >
                    <Ban size={16} /> Bannir
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onViewDocs}
              className={"flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 text-sm " + (darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100")}
            >
              <Eye size={15} /> Documents
            </button>
            <button
              onClick={onEdit}
              className={"flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 text-sm " + (darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100")}
            >
              <Edit2 size={15} /> Modifier
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL APERÇU DOCUMENT */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className={"relative max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl " + (darkMode ? "bg-slate-900" : "bg-white")}
            onClick={e => e.stopPropagation()}
          >
            <div className={"flex items-center justify-between px-5 py-3 border-b " + (darkMode ? "border-slate-700" : "border-gray-200")}>
              <p className={"font-semibold text-sm truncate " + (darkMode ? "text-white" : "text-gray-800")}>{previewDoc.nom}</p>
              <button onClick={() => setPreviewDoc(null)} className="ml-3 text-gray-400 hover:text-gray-200 transition flex-shrink-0"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto flex items-start justify-center bg-black/5">
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
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 font-medium">
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

function InfoItem({ icon: Icon, label, value, darkMode }) {
  return (
    <div className={"p-3 rounded-xl " + (darkMode ? "bg-slate-800" : "bg-gray-50")}>
      <p className={"text-xs mb-1 flex items-center gap-1.5 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
        <Icon size={11} /> {label}
      </p>
      <p className="font-medium text-sm truncate">{value || "—"}</p>
    </div>
  );
}
