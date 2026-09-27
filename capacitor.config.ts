import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kasirsparepart.app',
  appName: 'Kasir',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {},
};

export default config;
