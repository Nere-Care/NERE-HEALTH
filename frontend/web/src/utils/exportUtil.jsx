/**
 * Utils d'export pour les dashboards observateurs
 * Toutes les données sont anonymisées avant export
 */

export const anonymizeData = (data, fields = []) => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => anonymizeData(item, fields));
  }
  
  if (typeof data === "object") {
    const anonymized = { ...data };
    
    // Mask identifiable fields
    const sensitiveFields = ["name", "email", "phone", "address", "id", "reference"];
    sensitiveFields.forEach(field => {
      if (anonymized[field] && (fields.length === 0 || fields.includes(field))) {
        if (typeof anonymized[field] === "string") {
          // Partial mask: keep first char, mask rest
          anonymized[field] = anonymized[field].charAt(0) + "***";
        } else if (typeof anonymized[field] === "number") {
          // Add noise to numbers for aggregation
          const noise = Math.random() * 0.1 - 0.05; // ±5%
          anonymized[field] = Math.round(anonymized[field] * (1 + noise));
        }
      }
    });
    
    return anonymized;
  }
  
  return data;
};

export const generateExportFilename = (dashboard, format) => {
  const date = new Date().toISOString().split("T")[0];
  return `observatoire_${dashboard}_${date}.${format}`;
};

export const validateExportCompliance = (data) => {
  // Check for PII (Personally Identifiable Information)
  const piiPatterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
    /\+?[\d\s\-()]{8,}/, // Phone
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Card numbers
  ];
  
  const jsonData = JSON.stringify(data).toLowerCase();
  
  for (const pattern of piiPatterns) {
    if (pattern.test(jsonData)) {
      return {
        compliant: false,
        error: "Données personnelles détectées - Export bloqué",
      };
    }
  }
  
  return {
    compliant: true,
    message: "Export conforme RGPD",
  };
};