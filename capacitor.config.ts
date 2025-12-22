import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.tsl.app',
	appName: 'TSL App',
	webDir: 'dist',   // 👈 THIS IS THE FIX
	bundledWebRuntime: false
};

export default config;
