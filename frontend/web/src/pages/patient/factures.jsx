import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, CreditCard, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const factures = [
  { id: "FAC-001", date: "12/03/2026", medecin: "Dr. Ngassa Pierre", acte: "Consultation dentaire", montant: 15000, statut: "Payé" },
  { id: "FAC-002", date: "05/03/2026", medecin: "Dr. Kamdem Marie", acte: "Consultation cardiologie", montant: 25000, statut: "Payé" },
  { id: "FAC-003", date: "28/02/2026", medecin: "Dr. Bello Ahmed", acte: "Consultation générale", montant: 10000, statut: "En attente" },
  { id: "FAC-004", date: "15/02/2026", medecin: "Dr. Ngo Sophie", acte: "Consultation pédiatrie", montant: 20000, statut: "Payé" },
  { id: "FAC-005", date: "01/02/2026", medecin: "Dr. Essomba Paul", acte: "Consultation dermatologie", montant: 18000, statut: "Annulé" },
];

const dessinerFacture = (doc, f, startY) => {
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, startY, 190, startY);

  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text(`Facture ${f.id}`, 20, startY + 12);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Date : ${f.date}`, 20, startY + 22);

  autoTable(doc, {
    startY: startY + 28,
    head: [["Champ", "Détail"]],
    body: [
      ["Médecin", f.medecin],
      ["Acte médical", f.acte],
      ["Montant", `${f.montant.toLocaleString()} FCFA`],
      ["Statut", f.statut],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 20, right: 20 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;
  if (f.statut === "Payé") {
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(10);
    doc.text("✓ Facture payée", 20, finalY);
  } else if (f.statut === "En attente") {
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(10);
    doc.text("⏳ Paiement en attente", 20, finalY);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(10);
    doc.text("✕ Facture annulée", 20, finalY);
  }

  return doc.lastAutoTable.finalY + 20;
};

const telechargerFacture = (f) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246);
  doc.text("Néré Health", 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Plateforme de santé numérique", 20, 28);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(20, 33, 190, 33);
  dessinerFacture(doc, f, 40);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Néré Health`, 20, 285);
  doc.save(`facture-${f.id}.pdf`);
};

const telechargerToutesFactures = () => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(26);
  doc.setTextColor(59, 130, 246);
  doc.text("Néré Health", 20, 30);
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("Récapitulatif complet de vos factures", 20, 42);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(20, 48, 190, 48);
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Nombre de factures : ${factures.length}`, 20, 62);

  const totalPaye = factures
    .filter(f => f.statut === "Payé")
    .reduce((acc, f) => acc + f.montant, 0);

  doc.text(`Total payé : ${totalPaye.toLocaleString()} FCFA`, 20, 74);
  doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR')}`, 20, 86);

  factures.forEach((f) => {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text("Néré Health", 20, 18);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Plateforme de santé numérique", 20, 25);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 29, 190, 29);
    dessinerFacture(doc, f, 36);
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text(
      `Néré Health — Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
      20, pageHeight - 10
    );
  });

  doc.save("toutes-mes-factures.pdf");
};

const StatutBadge = ({ statut, size = 10 }) => (
  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold w-fit
    ${statut === "Payé" ? "bg-green-100 text-green-600"
      : statut === "En attente" ? "bg-orange-100 text-orange-500"
      : "bg-red-100 text-red-500"}`}>
    {statut === "Payé" && <CheckCircle size={size} />}
    {statut === "En attente" && <Clock size={size} />}
    {statut === "Annulé" && <XCircle size={size} />}
    {statut}
  </span>
);

export default function Factures({ darkMode }) {
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState("Tous");
  const [factureVue, setFactureVue] = useState(null);

  const filtres = [
    { label: "Tous", val: "Tous" },
    { label: "Payé", val: "Payé" },
    { label: "En attente", val: "En attente" },
    { label: "Annulé", val: "Annulé" },
  ];

  const facturesFiltrees = filtre === "Tous" ? factures : factures.filter(f => f.statut === filtre);
  const total = factures.filter(f => f.statut === "Payé").reduce((acc, f) => acc + f.montant, 0);
  const enAttente = factures.filter(f => f.statut === "En attente").reduce((acc, f) => acc + f.montant, 0);

  return (
    <div className={`p-4 md:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Titre + Tout télécharger */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-blue-500">Mes Factures</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Historique de vos paiements
          </p>
        </div>
        <button
          onClick={telechargerToutesFactures}
          className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Tout télécharger</span>
          <span className="sm:hidden">Exporter</span>
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total payé", value: `${total.toLocaleString()} FCFA`, icon: CheckCircle, color: "bg-green-100 text-green-500" },
          { label: "En attente", value: `${enAttente.toLocaleString()} FCFA`, icon: Clock, color: "bg-orange-100 text-orange-500" },
          { label: "Factures", value: factures.length, icon: CreditCard, color: "bg-blue-100 text-blue-500" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-3 md:p-4 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div className="text-center md:text-left">
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-sm md:text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
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
            className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all
              ${filtre === f.val
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── MOBILE : cartes ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {facturesFiltrees.map((f) => (
          <div key={f.id} className={`rounded-2xl shadow p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-blue-500">{f.id}</p>
                <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.date}</p>
              </div>
              <StatutBadge statut={f.statut} />
            </div>
            <p className={`text-sm font-semibold mb-0.5 ${darkMode ? "text-white" : "text-gray-800"}`}>{f.medecin}</p>
            <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.acte}</p>
            <div className="flex items-center justify-between">
              <p className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {f.montant.toLocaleString()} FCFA
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFactureVue(f)}
                  className={`p-2 rounded-xl ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => telechargerFacture(f)}
                  className={`p-2 rounded-xl ${darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-50 text-blue-500"}`}>
                  <Download size={15} />
                </button>
                {f.statut === "En attente" && (
                  <button
                    onClick={() => navigate('/paiement', { state: { facture: f } })}
                    className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-xl hover:bg-green-600">
                    Payer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP : tableau ── */}
      <div className={`hidden md:block rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {["N° Facture", "Date", "Médecin", "Acte", "Montant", "Statut", "Actions"].map((h) => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-semibold
                  ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturesFiltrees.map((f) => (
              <tr key={f.id} className={`border-t transition-all
                ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                <td className="px-5 py-4 font-medium text-blue-500">{f.id}</td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.date}</td>
                <td className={`px-5 py-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{f.medecin}</td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.acte}</td>
                <td className={`px-5 py-4 font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {f.montant.toLocaleString()} FCFA
                </td>
                <td className="px-5 py-4">
                  <StatutBadge statut={f.statut} />
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
      </div>

      {/* MODAL */}
      {factureVue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-6
            ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-blue-500">{factureVue.id}</h2>
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
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.label}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Montant</span>
                <span className="text-xl font-bold text-green-500">
                  {factureVue.montant.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</span>
                <StatutBadge statut={factureVue.statut} size={11} />
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