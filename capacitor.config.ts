import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meureddit.app',
  appName: 'Meu Reddit',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.14:3000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;


