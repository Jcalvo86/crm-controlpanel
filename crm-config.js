// Configuration file for ControlPanel CRM
window.CRM_CONFIG = {
  // 1. Data Source Provider Configuration
  provider: "firebase", // 'firebase' | 'supabase' | 'localStorage'
  
  firebase: {
    apiKey: "AIzaSyD8-SBI4FjoVl1VSyIGlk52UQYdwERmKaI",
    authDomain: "suenotravel.firebaseapp.com",
    projectId: "suenotravel",
    storageBucket: "suenotravel.firebasestorage.app",
    messagingSenderId: "230218304034",
    appId: "1:230218304034:web:fd2bc439b076a9e222187b",
    measurementId: "G-PNRQETN3D1"
  },

  // 2. Active Modules for this project
  activeModules: ["blog", "products"], // Choose from: 'terms', 'blog', 'products'

  // 3. Project Branding Customizations
  branding: {
    appName: "Sueño Travel",
    logoUrl: "../Imagenes/logo.png", // Path or URL to the logo
    backUrl: "../index.html"          // Path or URL to go back
  }
};

// Fallback registry for backward compatibility
window.GLOSAURIO_DEFAULT_CONFIG = window.CRM_CONFIG;

