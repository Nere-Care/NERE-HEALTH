import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, CreditCard, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchMesFactures } from '../../services/factureService';

// =====================================================================
// PALETTE DE COULEURS MÉDICALES PROFESSIONNELLES
// =====================================================================
const COLORS = {
  // Bleu médical principal
  primaryBlue: [16, 120, 168],      // #1078A8 - Bleu médical profond
  lightBlue: [224, 242, 254],       // #E0F2FE - Bleu très clair
  accentBlue: [14, 165, 233],       // #0EA5E9 - Bleu accent
  
  // Vert santé
  primaryGreen: [16, 185, 129],     // #10B981 - Vert émeraude
  lightGreen: [209, 250, 229],      // #D1FAE5 - Vert très clair
  accentGreen: [5, 150, 105],       // #059669 - Vert foncé
  
  // Neutres
  darkGray: [31, 41, 55],           // #1F2937 - Texte principal
  mediumGray: [107, 114, 128],      // #6B7280 - Texte secondaire
  lightGray: [243, 244, 246],       // #F3F4F6 - Fond léger
  borderGray: [209, 213, 219],      // #D1D5DB - Bordures
  
  // Statuts
  success: [16, 185, 129],          // Vert - Payé
  warning: [245, 158, 11],          // Orange - En attente
  danger: [239, 68, 68],            // Rouge - Annulé
};

// =====================================================================
// FONCTIONS UTILITAIRES
// =====================================================================
const getStatutColor = (statut) => {
  if (statut === "Payé") return COLORS.success;
  if (statut === "En attente") return COLORS.warning;
  return COLORS.danger;
};

const getStatutIcon = (statut) => {
  if (statut === "Payé") return "✓";
  if (statut === "En attente") return "⏳";
  return "✕";
};

// =====================================================================
// DESSINER L'EN-TÊTE PROFESSIONNEL MÉDICAL
// =====================================================================
const dessinerEnTete = (doc, startY = 15) => {
  // Bandeau supérieur bleu médical
  doc.setFillColor(...COLORS.primaryBlue);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Logo et nom de l'entreprise (en blanc sur fond bleu)
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Néré Health", 20, 22);
  
  // Sous-titre
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Plateforme de santé numérique", 20, 30);
  
  // Coordonnées de l'entreprise (à droite, en blanc)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const rightX = 190;
  doc.text("Néré Health SARL", rightX, 15, { align: "right" });
  doc.text("Douala, Cameroun", rightX, 20, { align: "right" });
  doc.text("contact@nerehealth.com", rightX, 25, { align: "right" });
  doc.text("+237 6XX XXX XXX", rightX, 30, { align: "right" });
  
  // Ligne verte fine sous le bandeau bleu
  doc.setDrawColor(...COLORS.primaryGreen);
  doc.setLineWidth(2);
  doc.line(0, 35, 210, 35);
  
  return 45;
};

// =====================================================================
// DESSINER LES INFOS FACTURE + PATIENT
// =====================================================================
const dessinerInfosFacture = (doc, f, startY) => {
  // Titre "FACTURE" avec fond bleu clair
  doc.setFillColor(...COLORS.lightBlue);
  doc.roundedRect(20, startY, 80, 12, 2, 2, 'F');
  
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primaryBlue);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", 25, startY + 8);
  
  // Numéro de facture (à droite)
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${f.reference}`, 190, startY + 8, { align: "right" });
  
  // Date de facture
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.mediumGray);
  doc.text(`Date d'émission : ${f.date}`, 190, startY + 15, { align: "right" });
  
  // Date d'échéance (si en attente)
  if (f.statut === "En attente") {
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);
    doc.setTextColor(...COLORS.warning);
    doc.setFont("helvetica", "bold");
    doc.text(`Échéance : ${dateEcheance.toLocaleDateString('fr-FR')}`, 190, startY + 22, { align: "right" });
  }
  
  // Encadré coordonnées du patient
  const boxY = startY + 30;
  doc.setFillColor(...COLORS.lightGray);
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, boxY, 170, 35, 3, 3, 'FD');
  
  // Titre "Facturé à" avec icône
  doc.setFillColor(...COLORS.primaryGreen);
  doc.circle(25, boxY + 7, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primaryGreen);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT", 30, boxY + 8);
  
  // Infos patient
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "normal");
  
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    doc.setFont("helvetica", "bold");
    doc.text(`${user.prenom} ${user.nom}`, 25, boxY + 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mediumGray);
    if (user.email) doc.text(user.email, 25, boxY + 24);
    if (user.telephone) doc.text(user.telephone, 25, boxY + 30);
  } else {
    doc.text("Patient", 25, boxY + 18);
  }
  
  return boxY + 45;
};

// =====================================================================
// DESSINER LE TABLEAU DÉTAILLÉ
// =====================================================================
const dessinerTableauFacture = (doc, f, startY) => {
  const acteDetails = f.acte.split(' — ');
  const typeConsultation = acteDetails[0] || "Consultation";
  const methode = acteDetails[1] || "Présentiel";
  
  autoTable(doc, {
    startY: startY,
    head: [["Description", "Quantité", "Prix unitaire", "Total"]],
    body: [
      [
        `${typeConsultation}\nMéthode : ${methode}`,
        "1",
        `${f.montant.toLocaleString()} ${f.devise}`,
        `${f.montant.toLocaleString()} ${f.devise}`
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: COLORS.primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 8,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 8,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: "normal" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right", fontStyle: "bold", textColor: COLORS.primaryBlue },
    },
    margin: { left: 20, right: 20 },
    didDrawPage: function(data) {
      // Bordure verte en bas du tableau
      doc.setDrawColor(...COLORS.primaryGreen);
      doc.setLineWidth(1);
      doc.line(20, data.cursor.y, 190, data.cursor.y);
    },
  });
  
  return doc.lastAutoTable.finalY;
};

// =====================================================================
// DESSINER LE TOTAL AVEC DESIGN MÉDICAL
// =====================================================================
const dessinerTotal = (doc, f, startY) => {
  const totalY = startY + 5;
  
  // Encadré total avec fond bleu très clair
  doc.setFillColor(...COLORS.lightBlue);
  doc.setDrawColor(...COLORS.primaryBlue);
  doc.setLineWidth(1.5);
  doc.roundedRect(115, totalY, 75, 45, 3, 3, 'FD');
  
  // Sous-total
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.mediumGray);
  doc.setFont("helvetica", "normal");
  doc.text("Sous-total :", 120, totalY + 10);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`${f.montant.toLocaleString()} ${f.devise}`, 185, totalY + 10, { align: "right" });
  
  // TVA
  doc.setTextColor(...COLORS.mediumGray);
  doc.text("TVA (0%) :", 120, totalY + 20);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`0 ${f.devise}`, 185, totalY + 20, { align: "right" });
  
  // Ligne de séparation
  doc.setDrawColor(...COLORS.primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(120, totalY + 25, 185, totalY + 25);
  
  // TOTAL avec accent vert
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primaryGreen);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", 120, totalY + 38);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`${f.montant.toLocaleString()} ${f.devise}`, 185, totalY + 38, { align: "right" });
  
  return totalY + 55;
};

// =====================================================================
// DESSINER LE STATUT DE PAIEMENT AVEC DESIGN MODERNE
// =====================================================================
const dessinerStatutPaiement = (doc, f, startY) => {
  const statutColor = getStatutColor(f.statut);
  const statutIcon = getStatutIcon(f.statut);
  
  // Badge statut avec design pill
  const badgeWidth = 60;
  const badgeX = 20;
  
  doc.setFillColor(...statutColor);
  doc.roundedRect(badgeX, startY, badgeWidth, 12, 6, 6, 'F');
  
  // Texte du statut
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${statutIcon} ${f.statut.toUpperCase()}`, badgeX + badgeWidth / 2, startY + 8, { align: "center" });
  
  // Informations de paiement dans un encadré
  const infoY = startY + 20;
  doc.setFillColor(...COLORS.lightGray);
  doc.setDrawColor(...COLORS.borderGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, infoY, 170, 25, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "normal");
  
  if (f.statut === "Payé") {
    doc.setFillColor(...COLORS.lightGreen);
    doc.circle(25, infoY + 7, 2, 'F');
    doc.setTextColor(...COLORS.primaryGreen);
    doc.setFont("helvetica", "bold");
    doc.text("Paiement confirmé", 30, infoY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mediumGray);
    doc.text(`Payé via ${f.methode?.replace("_", " ").toUpperCase() || "Mobile Money"}`, 25, infoY + 16);
    doc.text(`Référence : ${f.reference}`, 25, infoY + 22);
  } else if (f.statut === "En attente") {
    doc.setFillColor(...COLORS.warning);
    doc.circle(25, infoY + 7, 2, 'F');
    doc.setTextColor(...COLORS.warning);
    doc.setFont("helvetica", "bold");
    doc.text("Paiement en attente", 30, infoY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.mediumGray);
    doc.text("Veuillez effectuer le paiement sous 30 jours", 25, infoY + 16);
  } else {
    doc.setFillColor(...COLORS.danger);
    doc.circle(25, infoY + 7, 2, 'F');
    doc.setTextColor(...COLORS.danger);
    doc.setFont("helvetica", "bold");
    doc.text("Facture annulée", 30, infoY + 8);
  }
  
  return infoY + 35;
};

// =====================================================================
// DESSINER LE PIED DE PAGE MÉDICAL
// =====================================================================
const dessinerPiedPage = (doc, pageHeight) => {
  const footerY = pageHeight - 30;
  
  // Bandeau vert en bas
  doc.setFillColor(...COLORS.primaryGreen);
  doc.rect(0, footerY, 210, 30, 'F');
  
  // Texte de remerciement
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Merci pour votre confiance !", 105, footerY + 8, { align: "center" });
  
  // Informations légales
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Néré Health SARL — Douala, Cameroun — contact@nerehealth.com", 105, footerY + 15, { align: "center" });
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, footerY + 21, { align: "center" });
};

// =====================================================================
// TÉLÉCHARGER UNE FACTURE INDIVIDUELLE
// =====================================================================
const telechargerFacture = (f) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let currentY = dessinerEnTete(doc, 15);
  currentY = dessinerInfosFacture(doc, f, currentY);
  currentY = dessinerTableauFacture(doc, f, currentY);
  currentY = dessinerTotal(doc, f, currentY);
  currentY = dessinerStatutPaiement(doc, f, currentY);
  dessinerPiedPage(doc, pageHeight);
  
  doc.save(`facture-${f.reference}.pdf`);
};

// =====================================================================
// TÉLÉCHARGER TOUTES LES FACTURES (RÉCAPITULATIF)
// =====================================================================
const telechargerToutesFactures = (factures) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let currentY = dessinerEnTete(doc, 20);
  
  // Titre récapitulatif
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primaryBlue);
  doc.setFont("helvetica", "bold");
  doc.text("RÉCAPITULATIF DES FACTURES", 20, currentY + 5);
  
  currentY += 20;
  
  // Statistiques globales
  const totalPaye = factures.filter(f => f.statut === "Payé").reduce((acc, f) => acc + f.montant, 0);
  const totalEnAttente = factures.filter(f => f.statut === "En attente").reduce((acc, f) => acc + f.montant, 0);
  
  // Encadré des statistiques avec design médical
  doc.setFillColor(...COLORS.lightBlue);
  doc.setDrawColor(...COLORS.primaryBlue);
  doc.setLineWidth(1);
  doc.roundedRect(20, currentY, 170, 50, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primaryBlue);
  doc.setFont("helvetica", "bold");
  doc.text("STATISTIQUES GLOBALES", 25, currentY + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`Nombre total de factures :`, 25, currentY + 22);
  doc.setFont("helvetica", "bold");
  doc.text(`${factures.length}`, 185, currentY + 22, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.text(`Total payé :`, 25, currentY + 32);
  doc.setTextColor(...COLORS.primaryGreen);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalPaye.toLocaleString()} XAF`, 185, currentY + 32, { align: "right" });
  
  doc.setTextColor(...COLORS.darkGray);
  doc.setFont("helvetica", "normal");
  doc.text(`En attente :`, 25, currentY + 42);
  doc.setTextColor(...COLORS.warning);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalEnAttente.toLocaleString()} XAF`, 185, currentY + 42, { align: "right" });
  
  currentY += 60;
  
  // Date d'export
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.mediumGray);
  doc.setFont("helvetica", "normal");
  doc.text(`Export généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, currentY);
  
  currentY += 10;
  
  // Tableau récapitulatif
  autoTable(doc, {
    startY: currentY,
    head: [["Référence", "Date", "Médecin", "Montant", "Statut"]],
    body: factures.map(f => [
      f.reference,
      f.date,
      f.medecin,
      `${f.montant.toLocaleString()} ${f.devise}`,
      f.statut
    ]),
    theme: "plain",
    headStyles: {
      fillColor: COLORS.primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: "bold", textColor: COLORS.primaryBlue },
      1: { cellWidth: 25 },
      2: { cellWidth: 50 },
      3: { cellWidth: 35, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 25, halign: "center", fontStyle: "bold" },
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      if (data.section === "body" && data.column.index === 4) {
        const statut = data.cell.raw;
        const color = getStatutColor(statut);
        data.cell.styles.textColor = color;
      }
    },
  });
  
  dessinerPiedPage(doc, pageHeight);
  
  doc.save("recapitulatif-factures.pdf");
};

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================
export default function Factures({ darkMode }) {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState("Tous");
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [factureVue, setFactureVue] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        setErreur(null);
        const data = await fetchMesFactures(filtre);
        setFactures(data);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [filtre]);

  const total = factures.filter(f => f.statut === "Payé").reduce((acc, f) => acc + f.montant, 0);
  const enAttente = factures.filter(f => f.statut === "En attente").reduce((acc, f) => acc + f.montant, 0);

  const filtres = [
    { label: "Tous", val: "Tous" },
    { label: "Payé", val: "Payé" },
    { label: "En attente", val: "En attente" },
    { label: "Annulé", val: "Annulé" },
  ];

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Mes Factures</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Historique de vos paiements et factures
          </p>
        </div>
        <button
          onClick={() => telechargerToutesFactures(factures)}
          disabled={factures.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow"
        >
          <Download size={16} />
          Tout télécharger
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total payé", value: `${total.toLocaleString()} XAF`, icon: CheckCircle, color: "bg-green-100 text-green-500" },
          { label: "En attente", value: `${enAttente.toLocaleString()} XAF`, icon: Clock, color: "bg-orange-100 text-orange-500" },
          { label: "Factures totales", value: factures.length, icon: CreditCard, color: "bg-blue-100 text-blue-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl shadow p-4 flex items-center gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {filtres.map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium
              ${filtre === f.val
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-600"
                  : "bg-white text-gray-600 border border-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur */}
      {!loading && erreur && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl mb-4
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <XCircle size={18} className="flex-shrink-0" />
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* Tableau */}
      {!loading && !erreur && (
        <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {factures.length === 0 ? (
            <div className={`text-center py-16 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Aucune facture trouvée.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Référence", "Date", "Médecin", "Acte", "Montant", "Statut", "Actions"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                      ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className={`border-t transition-all
                    ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                    <td className="px-5 py-4 font-medium text-blue-500">{f.reference}</td>
                    <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.date}</td>
                    <td className={`px-5 py-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{f.medecin}</td>
                    <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.acte}</td>
                    <td className={`px-5 py-4 font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {f.montant.toLocaleString()} {f.devise}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold w-fit
                        ${f.statut === "Payé"
                          ? "bg-green-100 text-green-600"
                          : f.statut === "En attente"
                            ? "bg-orange-100 text-orange-500"
                            : "bg-red-100 text-red-500"}`}>
                        {f.statut === "Payé" && <CheckCircle size={10} />}
                        {f.statut === "En attente" && <Clock size={10} />}
                        {f.statut === "Annulé" && <XCircle size={10} />}
                        {f.statut}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFactureVue(f)}
                          className={`p-1.5 rounded-lg transition-all
                            ${darkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => telechargerFacture(f)}
                          className={`p-1.5 rounded-lg transition-all
                            ${darkMode ? "bg-blue-900 hover:bg-blue-800 text-blue-400" : "bg-blue-50 hover:bg-blue-100 text-blue-500"}`}>
                          <Download size={14} />
                        </button>
                        {f.statut === "En attente" && (
                          <button
                            onClick={() => navigate('/paiement', { state: { facture: f } })}
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600">
                            Payer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal voir facture */}
      {factureVue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-6
            ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-blue-500">{factureVue.reference}</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {factureVue.date}
                </p>
              </div>
              <button
                onClick={() => setFactureVue(null)}
                className={`p-2 rounded-xl ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                <X size={18} />
              </button>
            </div>

            <div className={`rounded-2xl p-4 flex flex-col gap-3 mb-6
              ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              {[
                { label: "Médecin", value: factureVue.medecin },
                { label: "Acte médical", value: factureVue.acte },
                { label: "Date", value: factureVue.date },
                { label: "Méthode", value: factureVue.methode?.replace("_", " ").toUpperCase() || "-" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.label}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Montant</span>
                <span className="text-xl font-bold text-green-500">
                  {factureVue.montant.toLocaleString()} {factureVue.devise}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1
                  ${factureVue.statut === "Payé" ? "bg-green-100 text-green-600"
                    : factureVue.statut === "En attente" ? "bg-orange-100 text-orange-500"
                    : "bg-red-100 text-red-500"}`}>
                  {factureVue.statut === "Payé" && <CheckCircle size={11} />}
                  {factureVue.statut === "En attente" && <Clock size={11} />}
                  {factureVue.statut === "Annulé" && <XCircle size={11} />}
                  {factureVue.statut}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { telechargerFacture(factureVue); setFactureVue(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold">
                <Download size={15} />
                Télécharger
              </button>
              {factureVue.statut === "En attente" && (
                <button
                  onClick={() => { navigate('/paiement', { state: { facture: factureVue } }); setFactureVue(null); }}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-semibold">
                  Payer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}