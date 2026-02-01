// Brain Grain Platform - Configuration
// Centralized configuration for easy customization

window.BrainGrainConfig = {
  // Application Info
  app: {
    name: 'Brain Grain',
    version: '2.0.0',
    tagline: 'Cognition Intelligence for Human Potential',
    environment: 'production' // 'development' | 'staging' | 'production'
  },

  // Feature Flags
  features: {
    cloudSync: true,
    autoBackup: true,
    analytics: true,
    aiIntegration: true,
    podPlanning: true,
    assessments: true,
    debugMode: false
  },

  // UI Settings
  ui: {
    theme: 'light', // 'light' | 'dark'
    animationsEnabled: true,
    toastDuration: 3000, // milliseconds
    autoSaveInterval: 30000, // 30 seconds
    debounceDelay: 300 // milliseconds for search/filter
  },

  // Validation Rules
  validation: {
    minNameLength: 2,
    maxNameLength: 50,
    phonePattern: /^[0-9]{10}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minAge: 5,
    maxAge: 18,
    requiredFields: ['firstName', 'lastName', 'phone', 'grade', 'school']
  },

  // Academic Settings
  academic: {
    subjects: ['english', 'maths', 'tamil', 'science', 'social'],
    defaultMaxMarks: 60,
    passingPercentage: 40,
    grades: {
      A: { min: 90, max: 100, label: 'Outstanding' },
      B: { min: 75, max: 89, label: 'Excellent' },
      C: { min: 60, max: 74, label: 'Good' },
      D: { min: 40, max: 59, label: 'Average' },
      F: { min: 0, max: 39, label: 'Needs Improvement' }
    }
  },

  // Assessment Settings
  assessment: {
    categories: {
      sel: { name: 'SEL', weight: 0.4, maxScore: 40 },
      criticalThinking: { name: 'Critical Thinking', weight: 0.3, maxScore: 30 },
      leadership: { name: 'Leadership', weight: 0.3, maxScore: 30 }
    },
    totalMaxScore: 100,
    passingScore: 50,
    excellentScore: 80
  },

  // Pod Settings
  pods: {
    minStudents: 2,
    maxStudents: 12,
    optimalSize: 8,
    sessionTypes: {
      cognition: { 
        name: 'Cognition Intelligence', 
        color: '#0b66d0',
        emoji: '🧠',
        duration: 60
      },
      academic: { 
        name: 'Academic Support', 
        color: '#22c55e',
        emoji: '📚',
        duration: 90
      },
      sel: { 
        name: 'Social-Emotional Learning', 
        color: '#f59e0b',
        emoji: '❤️',
        duration: 45
      },
      leadership: { 
        name: 'Leadership Development', 
        color: '#8b5cf6',
        emoji: '⭐',
        duration: 60
      }
    }
  },

  // Analytics Thresholds
  analytics: {
    engagement: {
      high: 80,
      medium: 60,
      low: 0
    },
    performance: {
      excellent: 90,
      good: 75,
      average: 60,
      needsSupport: 0
    },
    attendance: {
      regular: 90,
      moderate: 75,
      irregular: 0
    }
  },

  // Cloud Sync Settings
  cloud: {
    autoSyncEnabled: true,
    syncIntervalMinutes: 30,
    maxRetries: 3,
    retryDelayMs: 2000,
    compressionEnabled: true,
    encryptionEnabled: false // Set to true in production with proper keys
  },

  // Storage Keys
  storage: {
    students: 'braingrain_students_v2',
    pods: 'braingrain_pods_v2',
    podMetadata: 'braingrain_pods_metadata_v2',
    podPlans: 'braingrain_pods_plans_v2',
    cloudBackup: 'braingrain_cloud_backup',
    lastSync: 'braingrain_last_sync',
    userPreferences: 'braingrain_preferences'
  },

  // Performance Settings
  performance: {
    enableVirtualScroll: true, // For large student lists
    lazyLoadThreshold: 50, // Load images when 50px from viewport
    chunkSize: 100, // Process items in chunks
    maxCacheSize: 1000, // Maximum items in memory cache
    debounceMs: 300 // Default debounce delay
  },

  // Error Messages
  messages: {
    errors: {
      required: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      invalidPhone: 'Please enter a valid 10-digit phone number',
      invalidName: 'Name must be at least 2 characters',
      syncFailed: 'Cloud sync failed. Your data is saved locally.',
      loadFailed: 'Failed to load data. Please refresh the page.',
      saveFailed: 'Failed to save data. Please try again.',
      networkError: 'Network error. Please check your connection.',
      unknownError: 'An unexpected error occurred. Please try again.'
    },
    success: {
      studentAdded: 'Student added successfully!',
      studentUpdated: 'Student updated successfully!',
      studentDeleted: 'Student deleted successfully!',
      podCreated: 'Pod created successfully!',
      podUpdated: 'Pod updated successfully!',
      podDeleted: 'Pod deleted successfully!',
      syncComplete: 'Cloud sync completed successfully!',
      dataSaved: 'Data saved successfully!'
    },
    warnings: {
      unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
      deleteConfirm: 'Are you sure you want to delete this item?',
      clearData: 'This will clear all data. This action cannot be undone.',
      offlineMode: 'You are offline. Changes will sync when connection is restored.'
    }
  },

  // API Endpoints (if backend is added)
  api: {
    baseUrl: '/api/v1',
    timeout: 10000, // 10 seconds
    endpoints: {
      students: '/students',
      pods: '/pods',
      assessments: '/assessments',
      analytics: '/analytics',
      sync: '/sync',
      backup: '/backup'
    }
  },

  // Date/Time Formats
  formats: {
    date: 'dd MMM yyyy', // e.g., "15 Jan 2025"
    time: 'HH:mm', // 24-hour format
    datetime: 'dd MMM yyyy, HH:mm',
    locale: 'en-IN' // Indian English
  },

  // Accessibility
  accessibility: {
    enableKeyboardShortcuts: true,
    highContrastMode: false,
    fontSize: 'medium', // 'small' | 'medium' | 'large'
    reducedMotion: false,
    screenReaderAnnouncements: true
  },

  // Development/Debug
  debug: {
    logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
    showPerformanceMetrics: false,
    enableSourceMaps: true,
    mockCloudSync: false,
    verboseLogging: false
  },

  // Helper Methods
  isDevelopment() {
    return this.app.environment === 'development';
  },

  isProduction() {
    return this.app.environment === 'production';
  },

  isFeatureEnabled(feature) {
    return this.features[feature] === true;
  },

  getGrade(percentage) {
    for (const [grade, range] of Object.entries(this.academic.grades)) {
      if (percentage >= range.min && percentage <= range.max) {
        return grade;
      }
    }
    return 'F';
  },

  getGradeLabel(percentage) {
    for (const range of Object.values(this.academic.grades)) {
      if (percentage >= range.min && percentage <= range.max) {
        return range.label;
      }
    }
    return 'Needs Improvement';
  },

  getSessionType(type) {
    return this.pods.sessionTypes[type] || null;
  },

  getMessage(category, key) {
    return this.messages[category]?.[key] || this.messages.errors.unknownError;
  },

  // Update configuration at runtime
  updateConfig(path, value) {
    const keys = path.split('.');
    let obj = this;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    console.log(`Config updated: ${path} = ${value}`);
  }
};

// Freeze configuration in production to prevent accidental modification
if (window.BrainGrainConfig.isProduction()) {
  Object.freeze(window.BrainGrainConfig);
}

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.BrainGrainConfig;
}

console.log('✓ Brain Grain Config loaded:', window.BrainGrainConfig.app.name, 'v' + window.BrainGrainConfig.app.version);
