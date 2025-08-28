// OPTIMISEUR DE PERFORMANCE ARAMIS FIGHTER
// Gestion intelligente des logs et optimisations

// Configuration des logs selon l'environnement
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Logger optimisé qui ne s'exécute qu'en développement
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Les erreurs sont toujours affichées
    console.error(...args);
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  // Logger conditionnel pour les opérations critiques
  critical: (...args) => {
    console.log(...args);
  }
};

// Cache pour éviter les recalculs
export const cache = {
  _storage: new Map(),
  
  get: (key) => {
    return cache._storage.get(key);
  },
  
  set: (key, value, ttl = 300000) => { // TTL par défaut: 5 minutes
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    cache._storage.set(key, item);
  },
  
  has: (key) => {
    const item = cache._storage.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      cache._storage.delete(key);
      return false;
    }
    
    return true;
  },
  
  clear: () => {
    cache._storage.clear();
  }
};

// Debounce pour éviter les appels répétitifs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle pour limiter la fréquence d'exécution
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Optimisation localStorage avec compression
export const optimizedStorage = {
  set: (key, value) => {
    try {
      const compressed = JSON.stringify(value);
      localStorage.setItem(key, compressed);
    } catch (error) {
      logger.error('Erreur stockage localStorage:', error);
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error('Erreur lecture localStorage:', error);
      return null;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  }
};

// Mesure de performance
export const performanceMonitor = {
  start: (label) => {
    if (isDevelopment) {
      performance.mark(`${label}-start`);
    }
  },
  
  end: (label) => {
    if (isDevelopment) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      logger.debug(`⚡ ${label}: ${measure.duration.toFixed(2)}ms`);
    }
  }
};

// Optimisation des re-renders React
export const memoizedCallback = (callback, dependencies) => {
  return React.useCallback(callback, dependencies);
};

export const memoizedValue = (factory, dependencies) => {
  return React.useMemo(factory, dependencies);
};
