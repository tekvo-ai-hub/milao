import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3d7ae364f75b4d5c8255c35d878a8594',
  appName: 'speechdoc',
  webDir: 'dist',
  server: {
    url: 'https://3d7ae364-f75b-4d5c-8255-c35d878a8594.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#hsl(var(--background))",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;