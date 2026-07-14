// ============================================
// VALIDATIONS RÉUTILISABLES
// ============================================

export const VALIDATIONS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+237)?[6][0-9]{8}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  FILE_MAX_SIZE_MB: 5,
  FILE_ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  MIN_AGE: 16,
};

// ============================================
// VALIDATEURS INDIVIDUELS
// ============================================

export const validateEmail = (email) => {
  if (!email) return "L'email est requis";
  if (!VALIDATIONS.EMAIL_REGEX.test(email)) return "Email invalide";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Le mot de passe est requis";
  if (password.length < VALIDATIONS.PASSWORD_MIN_LENGTH) {
    return `Minimum ${VALIDATIONS.PASSWORD_MIN_LENGTH} caractères`;
  }
  if (!/[A-Z]/.test(password)) return "Au moins une majuscule";
  if (!/[0-9]/.test(password)) return "Au moins un chiffre";
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Confirmation requise";
  if (password !== confirmPassword) return "Les mots de passe ne correspondent pas";
  return null;
};

export const validateName = (name, fieldName = "Nom") => {
  if (!name || !name.trim()) return `${fieldName} requis`;
  if (name.trim().length < VALIDATIONS.NAME_MIN_LENGTH) {
    return `${fieldName} trop court (min ${VALIDATIONS.NAME_MIN_LENGTH})`;
  }
  if (name.trim().length > VALIDATIONS.NAME_MAX_LENGTH) {
    return `${fieldName} trop long (max ${VALIDATIONS.NAME_MAX_LENGTH})`;
  }
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
    return `${fieldName} contient des caractères invalides`;
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null; // optionnel
  const clean = phone.replace(/\s/g, "").replace("+", "");
  if (!VALIDATIONS.PHONE_REGEX.test(clean)) return "Numéro invalide (ex: 6XXXXXXXX)";
  return null;
};

export const validateAge = (dob) => {
  if (!dob) return "Date de naissance requise";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  
  if (age < VALIDATIONS.MIN_AGE) return `Âge minimum: ${VALIDATIONS.MIN_AGE} ans`;
  if (age > 120) return "Date de naissance invalide";
  return null;
};

export const validateFiles = (files) => {
  if (!files || files.length === 0) return null; // optionnel
  
  for (const file of files) {
    if (!VALIDATIONS.FILE_ALLOWED_TYPES.includes(file.type)) {
      return `Type non autorisé: ${file.name} (PDF, JPG, PNG uniquement)`;
    }
    if (file.size > VALIDATIONS.FILE_MAX_SIZE_MB * 1024 * 1024) {
      return `Fichier trop volumineux: ${file.name} (max ${VALIDATIONS.FILE_MAX_SIZE_MB} MB)`;
    }
  }
  return null;
};

export const validateRegistrationNumber = (num) => {
  if (!num || !num.trim()) return "Numéro d'inscription requis";
  if (num.trim().length < 3) return "Numéro trop court";
  return null;
};

// ============================================
// CALCULATEUR DE FORCE DU MOT DE PASSE
// ============================================

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "gray" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 1) return { score: 1, label: "Faible", color: "red" };
  if (score <= 2) return { score: 2, label: "Moyen", color: "orange" };
  if (score <= 3) return { score: 3, label: "Bon", color: "yellow" };
  if (score <= 4) return { score: 4, label: "Fort", color: "green" };
  return { score: 5, label: "Très fort", color: "emerald" };
};

// ============================================
// VALIDATEURS COMPLETS PAR ÉTAPE
// ============================================

export const validateLogin = (email, password) => {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Mot de passe requis";
  return errors;
};

export const validateSignupStep1 = (formData) => {
  const errors = {};
  
  if (!formData.role) errors.role = "Choisissez un rôle";
  
  const firstNameError = validateName(formData.firstName, "Prénom");
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateName(formData.lastName, "Nom");
  if (lastNameError) errors.lastName = lastNameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  return errors;
};

export const validateSignupStep2 = (formData) => {
  const errors = {};
  
  if (!formData.city) errors.city = "Ville requise";
  if (!formData.district) errors.district = "District requis";
  
  const dobError = validateAge(formData.dob);
  if (dobError) errors.dob = dobError;
  
  if ((formData.role === "doctor" || formData.role === "nurse") && !formData.speciality) {
    errors.speciality = "Spécialité requise";
  }
  
  return errors;
};

export const validateSignupStep3 = (formData) => {
  const errors = {};
  
  if (!formData.hospital) errors.hospital = "Structure de santé requise";
  
  const regError = validateRegistrationNumber(formData.registrationNumber);
  if (regError) errors.registrationNumber = regError;
  
  if (!formData.experience || formData.experience < 0) {
    errors.experience = "Expérience invalide";
  }
  
  const filesError = validateFiles(formData.files);
  if (filesError) errors.files = filesError;
  
  return errors;
};