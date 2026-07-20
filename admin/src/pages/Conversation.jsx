import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Send,
  Search,
  Flag,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Ban,
  X,
  Eye,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";

// ✅ Import des fonctions du service API
import {
  fetchConversations,
  fetchConversationDetails,
  sendAdminMessage,
  updateConversationStatus,
  banUser,
} from "../services/ConversationService";

/* ================= UTILS ================= */
export const getMessageStyle = (msg, darkMode) => {
  if (msg?.flagged) return "border-l-4 border-red-500 pl-3 bg-red-500/5";
  if (msg?.from === "admin") return "border-l-4 border-purple-500 pl-3 bg-purple-500/5";
  if (msg?.from === "doctor" || msg?.from === "medecin") return "border-l-4 border-blue-500 pl-3 bg-blue-500/5";
  return darkMode ? "bg-slate-800/50" : "bg-gray-50";
};

export const getSenderLabel = (from) => {
  const labels = { patient: "👤 Patient", doctor: "🩺 Médecin", medecin: "🩺 Médecin", admin: "🛡️ Admin" };
  return labels[from] || from;
};

export const getStatusBadge = (status) => {
  const styles = {
    "Normal": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Signalé": "bg-red-500/10 text-red-500 border-red-500/20",
    "Résolu": "bg-green-500/10 text-green-500 border-green-500/20",
  };
  return (
    <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border whitespace-nowrap ${styles[status] || styles["Normal"]}`}>
      {status}
    </span>
  );
};

export const getRiskBadge = (risk) => {
  const styles = {
    "Faible": "bg-green-500/10 text-green-500",
    "Moyen": "bg-yellow-500/10 text-yellow-500",
    "Élevé": "bg-red-500/10 text-red-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${styles[risk] || styles["Faible"]}`}>
      {risk}
    </span>
  );
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/* ================= COMPONENT PRINCIPAL ================= */
export default function ConversationsPage({ darkMode }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [riskFilter, setRiskFilter] = useState("Tous");
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [banTarget, setBanTarget] = useState(null);
  
  const [adminMessage, setAdminMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  /* ================= CHARGEMENT DES DONNÉES ================= */
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchConversations({ 
        search, 
        status: statusFilter === "Tous" ? null : statusFilter,
        risk: riskFilter === "Tous" ? null : riskFilter
      });
      
      const rawList = Array.isArray(response) ? response : (response?.conversations || response?.data || []);
      
      const mapped = rawList.map(c => ({
        id: c.id,
        patient_id: c.patient_id, // Nécessaire pour la fonction de ban
        medecin_id: c.medecin_id, // Nécessaire pour la fonction de ban
        patient: c.patient_nom || "Patient",
        patientEmail: c.patient_email || "",
        professional: c.medecin_nom || "Médecin",
        professionalEmail: c.medecin_email || "",
        role: "Patient ↔ Médecin",
        reason: c.motif || "Consultation",
        reportReason: c.motif_signalement || null,
        status: c.statut || "Normal",
        riskLevel: c.niveau_risque || "Faible",
        createdAt: c.created_at || "",
        lastMessage: c.last_message_at || "",
        messages: c.messages || [],
        adminMessages: c.admin_messages || [],
      }));
      
      setConversations(mapped);
    } catch (err) {
      toast.error("❌ Erreur lors du chargement des conversations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, riskFilter]);

  useEffect(() => {
    const delay = setTimeout(loadConversations, 300);
    return () => clearTimeout(delay);
  }, [loadConversations]);

  /* ================= FILTRES & PAGINATION ================= */
  const filteredConversations = useMemo(() => conversations, [conversations]);

  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConversations.slice(start, start + itemsPerPage);
  }, [filteredConversations, currentPage]);

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage) || 1;

  const stats = useMemo(() => ({
    total: conversations.length,
    flagged: conversations.filter(c => c.status === "Signalé").length,
    resolved: conversations.filter(c => c.status === "Résolu").length,
    highRisk: conversations.filter(c => c.riskLevel === "Élevé").length,
  }), [conversations]);

  /* ================= ACTIONS API ================= */
  const handleViewDetails = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailsModal(true);
    
    try {
      const details = await fetchConversationDetails(conversation.id);
      if (details) {
        setSelectedConversation(prev => ({
          ...prev,
          messages: details.messages || prev.messages,
          adminMessages: details.admin_messages || prev.adminMessages,
        }));
      }
    } catch (err) {
      console.error("Erreur détail conversation", err);
    }
    
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!adminMessage.trim() || !selectedConversation) return;
    
    setIsSending(true);
    try {
      await sendAdminMessage(selectedConversation.id, adminMessage.trim());
      
      const newMsg = {
        id: Date.now(),
        from: "admin",
        text: adminMessage.trim(),
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      
      setSelectedConversation(prev => prev ? {
        ...prev,
        adminMessages: [...prev.adminMessages, newMsg],
        lastMessage: new Date().toISOString(),
      } : null);
      
      setAdminMessage("");
      toast.success("✅ Message envoyé");
      loadConversations();
    } catch (err) {
      toast.error(err.message || "❌ Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  }, [adminMessage, selectedConversation, loadConversations]);

  const handleFlagConversation = useCallback(async (id) => {
    try {
      await updateConversationStatus(id, "Signalé");
      toast.info("🚩 Conversation signalée");
      loadConversations();
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, status: "Signalé", riskLevel: "Moyen" } : null);
      }
    } catch (err) {
      toast.error("❌ Erreur lors du signalement");
    }
  }, [selectedConversation, loadConversations]);

  const handleResolveConversation = useCallback(async (id) => {
    try {
      await updateConversationStatus(id, "Résolu");
      toast.success("✅ Conversation marquée comme résolue");
      loadConversations();
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, status: "Résolu" } : null);
      }
    } catch (err) {
      toast.error("❌ Erreur lors de la résolution");
    }
  }, [selectedConversation, loadConversations]);

  const handleBanUser = useCallback(async (userId, userType, reason) => {
    if (!userId) {
      toast.error("❌ ID utilisateur introuvable");
      return;
    }
    try {
      await banUser(userId, userType, reason);
      toast.success(`🔒 ${userType === "patient" ? "Patient" : "Professionnel"} suspendu`);
      setShowBanModal(false);
      setBanTarget(null);
    } catch (err) {
      toast.error("❌ Erreur lors de la suspension");
    }
  }, []);

  const handleCopyConversation = useCallback((conversation) => {
    const allMsgs = [...conversation.messages, ...conversation.adminMessages.map(m => ({ ...m, from: "admin" }))];
    const text = allMsgs.map(m => `[${m.time}] ${getSenderLabel(m.from)}: ${m.text}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("📋 Conversation copiée");
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("Tous");
    setRiskFilter("Tous");
    setCurrentPage(1);
    toast.info("🔄 Filtres réinitialisés");
  }, []);

  const closeModal = useCallback(() => {
    setShowDetailsModal(false);
    setShowBanModal(false);
    setSelectedConversation(null);
    setBanTarget(null);
    setAdminMessage("");
  }, []);

  useEffect(() => {
    if (showDetailsModal && selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.adminMessages, showDetailsModal]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 transition-all overflow-x-hidden ${bg}`}>
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
            <MessageSquare className="text-blue-500 flex-shrink-0" size={28} />
            <span className="break-words">Monitoring Conversations</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Analyse et modération des échanges patients/médecins
          </p>
        </div>

        <div className="flex w-full sm:w-auto gap-2">
          <button 
            onClick={() => toast.info("💡 Export global disponible dans les paramètres")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 text-sm ${
              darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ================= LOADING STATE ================= */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ================= STATS ================= */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { title: "Total conversations", value: stats.total, icon: MessageSquare, color: "blue" },
              { title: "Signalées", value: stats.flagged, icon: Flag, color: "red" },
              { title: "Résolues", value: stats.resolved, icon: CheckCircle2, color: "green" },
              { title: "Risque élevé", value: stats.highRisk, icon: AlertTriangle, color: "orange" },
            ].map((item, i) => {
              const Icon = item.icon;
              const colorClasses = {
                blue: "bg-blue-500/10 text-blue-500",
                red: "bg-red-500/10 text-red-500",
                green: "bg-green-500/10 text-green-500",
                orange: "bg-orange-500/10 text-orange-500",
              };

              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 md:p-5 border transition hover:shadow-lg min-w-0 ${
                    darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-400 truncate">{item.title}</p>
                      <h2 className="text-2xl md:text-3xl font-bold mt-1">{item.value}</h2>
                    </div>

                    <div className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= FILTERS ================= */}
          <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col xl:flex-row gap-3 ${card}`}>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border bg-transparent min-w-0 overflow-hidden">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher patient, médecin, motif..."
                className="w-full min-w-0 bg-transparent outline-none text-sm"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full xl:w-auto">
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm border bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}
              >
                <option value="Tous">Tous statuts</option>
                <option value="Normal">Normal</option>
                <option value="Signalé">Signalé</option>
                <option value="Résolu">Résolu</option>
              </select>
              
              <select 
                value={riskFilter} 
                onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm border bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}
              >
                <option value="Tous">Tous risques</option>
                <option value="Faible">Faible</option>
                <option value="Moyen">Moyen</option>
                <option value="Élevé">Élevé</option>
              </select>
              
              <button 
                onClick={resetFilters}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
                title="Réinitialiser"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* ================= CONVERSATIONS GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
            {paginatedConversations.length > 0 ? (
              paginatedConversations.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  darkMode={darkMode}
                  cardClass={card}
                  onView={() => handleViewDetails(c)}
                  onFlag={() => handleFlagConversation(c.id)}
                  onResolve={() => handleResolveConversation(c.id)}
                />
              ))
            ) : (
              <div className={`col-span-full p-8 sm:p-12 rounded-2xl border text-center ${card}`}>
                <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400 text-sm sm:text-base">Aucune conversation trouvée</p>
                <button onClick={resetFilters} className="mt-3 text-blue-500 hover:underline text-sm">
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>

          {/* ================= PAGINATION ================= */}
          {totalPages > 1 && (
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border ${card}`}>
              <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                Page {currentPage} sur {totalPages} • {filteredConversations.length} résultats
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= DETAILS MODAL ================= */}
      {showDetailsModal && selectedConversation && (
        <ConversationDetailsModal
          darkMode={darkMode}
          conversation={selectedConversation}
          onClose={closeModal}
          onSendMessage={handleSendMessage}
          adminMessage={adminMessage}
          setAdminMessage={setAdminMessage}
          isSending={isSending}
          onFlag={() => handleFlagConversation(selectedConversation.id)}
          onResolve={() => handleResolveConversation(selectedConversation.id)}
          onBan={(userType) => { 
            const targetId = userType === "patient" ? selectedConversation.patient_id : selectedConversation.medecin_id;
            setBanTarget({ id: targetId, userType }); 
            setShowBanModal(true); 
          }}
          onCopy={() => handleCopyConversation(selectedConversation)}
          messagesEndRef={messagesEndRef}
          handleKeyDown={handleKeyDown}
        />
      )}

      {/* ================= BAN CONFIRMATION MODAL ================= */}
      {showBanModal && banTarget && (
        <BanConfirmModal
          darkMode={darkMode}
          userType={banTarget.userType}
          onConfirm={(reason) => handleBanUser(banTarget.id, banTarget.userType, reason)}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}

/* ================= SOUS-COMPOSANT : CONVERSATION CARD ================= */
function ConversationCard({ conversation, darkMode, cardClass, onView, onFlag, onResolve }) {
  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const hasFlagged = conversation.messages.some(m => m.flagged);
  
  return (
    <div 
      onClick={onView}
      className={`p-4 sm:p-5 rounded-3xl border space-y-4 cursor-pointer transition hover:shadow-lg min-w-0 overflow-hidden ${cardClass} ${
        darkMode ? "hover:border-slate-700" : "hover:border-gray-300"
      } ${hasFlagged ? "ring-2 ring-red-500/30" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {getStatusBadge(conversation.status)}
          {getRiskBadge(conversation.riskLevel)}
        </div>

        <span className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Clock size={12} /> {formatDateTime(conversation.lastMessage)}
        </span>
      </div>

      {/* Participants */}
      <div className="min-w-0">
        <h2 className="font-bold text-base sm:text-lg truncate">{conversation.patient}</h2>
        <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 truncate">
          <span>↔</span> {conversation.professional}
        </p>
      </div>

      {/* Context */}
      <div className="text-sm space-y-2 min-w-0">
        <p className="text-gray-400 break-words">
          <span className="font-medium">Motif:</span> {conversation.reason}
        </p>

        {conversation.reportReason && (
          <p className="text-red-400 text-xs flex items-start gap-1 break-words">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            {conversation.reportReason}
          </p>
        )}
      </div>

      {/* Last Message Preview */}
      {lastMsg && (
        <div className={`p-3 rounded-xl text-sm overflow-hidden ${getMessageStyle(lastMsg, darkMode)}`}>
          <p className="text-xs text-gray-400 mb-1">
            {getSenderLabel(lastMsg.from)} • {lastMsg.time}
          </p>

          <p className={`line-clamp-2 break-words ${lastMsg.flagged ? "text-red-400 font-medium" : ""}`}>
            {lastMsg.text}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex flex-col sm:flex-row gap-2 pt-2 border-t dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onView}
          className={`w-full py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
            darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
          }`}
        >
          <Eye size={14} /> Voir
        </button>

        {conversation.status !== "Signalé" && (
          <button
            onClick={onFlag}
            className="w-full py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center gap-1.5"
          >
            <Flag size={14} /> Signaler
          </button>
        )}

        {conversation.status === "Signalé" && (
          <button
            onClick={onResolve}
            className="w-full py-2 rounded-xl text-sm font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Résoudre
          </button>
        )}
      </div>
    </div>
  );
}

/* ================= SOUS-COMPOSANT : CONVERSATION DETAILS MODAL ================= */
function ConversationDetailsModal({ 
  darkMode, conversation, onClose, onSendMessage, adminMessage, setAdminMessage, isSending,
  onFlag, onResolve, onBan, onCopy, messagesEndRef, handleKeyDown 
}) {
  const allMessages = [...conversation.messages, ...conversation.adminMessages.map(m => ({ ...m, from: "admin" }))];
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className={`w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {conversation.patient.charAt(0)}
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base truncate">
                {conversation.patient} ↔ {conversation.professional}
              </h2>

              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {conversation.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(conversation.status)}
            {getRiskBadge(conversation.riskLevel)}

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Messages Panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {allMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl break-words ${getMessageStyle(msg, darkMode)}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-gray-400">
                      {getSenderLabel(msg.from)}
                    </span>

                    <span className="text-xs text-gray-400">
                      {msg.time}
                    </span>
                  </div>

                  <p className={`text-sm break-words whitespace-pre-wrap ${msg.flagged ? "text-red-400 font-medium" : ""}`}>
                    {msg.text}
                  </p>

                  {msg.flagged && msg.flagReason && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1 break-words">
                      <AlertTriangle size={10} /> {msg.flagReason}
                    </p>
                  )}
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Admin Input */}
            <div className={`p-3 sm:p-4 border-t dark:border-slate-700 ${darkMode ? "bg-slate-900/50" : "bg-gray-50"}`}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message d'admin (Entrée pour envoyer)..."
                  className={`flex-1 w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition text-sm ${
                    darkMode ? "border-slate-700" : "border-gray-300"
                  }`}
                  disabled={isSending}
                />

                <button
                  onClick={onSendMessage}
                  disabled={!adminMessage.trim() || isSending}
                  className="w-full sm:w-auto px-4 py-3 sm:py-0 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`w-full lg:w-60 border-t lg:border-t-0 lg:border-l dark:border-slate-700 p-3 sm:p-4 space-y-2 flex-shrink-0 overflow-y-auto ${
            darkMode ? "bg-slate-900/50" : "bg-gray-50"
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                onClick={onCopy}
                className={`w-full py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <Copy size={14} /> Copier
              </button>

              <button
                onClick={() => {
                   const report = { conversationId: conversation.id, generatedAt: new Date().toISOString() };
                   const data = JSON.stringify(report, null, 2);
                   const blob = new Blob([data], { type: "application/json" });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement("a");
                   a.href = url;
                   a.download = `rapport_conversation_${conversation.id}.json`;
                   document.body.appendChild(a);
                   a.click();
                   document.body.removeChild(a);
                   URL.revokeObjectURL(url);
                   toast.success("📥 Rapport exporté");
                }}
                className={`w-full py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                  darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <Download size={14} /> Exporter
              </button>
            </div>
            
            <div className={`my-3 border-t dark:border-slate-700`} />
            
            {conversation.status === "Normal" && (
              <button
                onClick={onFlag}
                className="w-full py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
              >
                <Flag size={14} /> Signaler
              </button>
            )}

            {conversation.status === "Signalé" && (
              <button
                onClick={onResolve}
                className="w-full py-2 rounded-xl text-sm font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Résoudre
              </button>
            )}
            
            <div className={`my-3 border-t dark:border-slate-700`} />
            
            <button
              onClick={() => onBan("patient")}
              className="w-full py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
            >
              <Ban size={14} /> Suspendre patient
            </button>

            <button
              onClick={() => onBan("professional")}
              className="w-full py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
            >
              <Ban size={14} /> Suspendre médecin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SOUS-COMPOSANT : BAN CONFIRMATION MODAL ================= */
function BanConfirmModal({ darkMode, userType, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("❌ Veuillez fournir un motif");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onConfirm(reason);
    } catch (err) {
      toast.error("❌ Erreur lors de la suspension");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const userLabel = userType === "patient" ? "le patient" : "le professionnel";
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Ban size={28} className="text-red-500" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold mb-2">
            Suspendre {userLabel} ?
          </h3>

          <p className="text-sm sm:text-base text-gray-400 mb-4">
            Cette action limitera l'accès de {userLabel} à la plateforme.
          </p>
          
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif de la suspension..."
            rows={3}
            className={`w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-red-500 transition mb-4 text-sm resize-none ${
              darkMode ? "border-slate-700" : "border-gray-300"
            }`}
          />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border font-medium transition ${
                darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? "..." : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}