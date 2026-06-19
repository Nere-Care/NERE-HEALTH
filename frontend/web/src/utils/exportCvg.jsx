// utils/exportCSV.js

export const exportToCSV = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // En-têtes du CSV
  const headers = ['Matricule', 'Patient', 'Service', 'Date', 'Amount', 'Method', 'Status'];
  
  // Lignes de données
  const rows = data.map((p) => [
    p.matricule || `PAT-${String(p.id).padStart(4, '0')}`,
    p.patient,
    p.service,
    p.date,
    p.amount,
    p.method,
    p.status,
  ]);

  // Formatage CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Échapper les virgules et guillemets
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ),
  ].join('\n');

  // Téléchargement
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};