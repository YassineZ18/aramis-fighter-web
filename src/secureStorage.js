// Utilitaire de stockage sécurisé avec chiffrement
import CryptoJS from 'crypto-js';

// Clé de chiffrement dérivée de l'ID utilisateur et d'un salt
const getEncryptionKey = (userId) => {
  const salt = 'aramis_fighter_secure_salt_2024';
  return CryptoJS.PBKDF2(userId || 'anonymous', salt, { keySize: 256/32 }).toString();
};

// Chiffrer les données avant stockage
export const setSecureItem = (key, data, userId = null) => {
  try {
    const dataString = JSON.stringify(data);
    const encryptionKey = getEncryptionKey(userId);
    const encrypted = CryptoJS.AES.encrypt(dataString, encryptionKey).toString();
    localStorage.setItem(key, encrypted);
    return true;
  } catch (error) {
    console.error('Erreur chiffrement:', error);
    return false;
  }
};

// Déchiffrer les données après récupération
export const getSecureItem = (key, userId = null) => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const encryptionKey = getEncryptionKey(userId);
    const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey);
    const dataString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!dataString) return null;
    return JSON.parse(dataString);
  } catch (error) {
    console.error('Erreur déchiffrement:', error);
    return null;
  }
};

// Supprimer un élément sécurisé
export const removeSecureItem = (key) => {
  localStorage.removeItem(key);
};

// Validation et sanitisation des données
export const validateAndSanitize = {
  // Validation email (plus permissive)
  email: (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },
  
  // Validation mot de passe
  password: (password) => {
    return password && password.length >= 8;
  },
  
  // Sanitisation texte (protection XSS basique)
  text: (text) => {
    if (!text) return '';
    return text.replace(/[<>]/g, '').trim();
  },
  
  // Validation nom/prénom
  name: (name) => {
    if (!name || name.length < 2 || name.length > 50) return false;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    return nameRegex.test(name);
  }
};

// Validation des rôles utilisateur
export const validateUserRole = (role) => {
  const validRoles = ['escrimeur', 'entraineur', 'admin'];
  return validRoles.includes(role);
};

// Génération d'ID sécurisé
export const generateSecureId = () => {
  return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Export par défaut de l'objet secureStorage
export const secureStorage = {
  setItem: setSecureItem,
  getItem: getSecureItem,
  removeItem: removeSecureItem,
  validate: validateAndSanitize,
  validateRole: validateUserRole,
  generateId: generateSecureId
};
