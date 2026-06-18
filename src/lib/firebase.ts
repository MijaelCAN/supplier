import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

interface FirebaseRuntimeConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
    measurementId?: string;
}

const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key] as string;
    }

    const viteKey = `VITE_${key}`;
    if (viteKey in import.meta.env && typeof import.meta.env[viteKey] === 'string') {
        return import.meta.env[viteKey] as string;
    }

    const reactKey = `REACT_APP_${key}`;
    if (reactKey in import.meta.env && typeof import.meta.env[reactKey] === 'string') {
        return import.meta.env[reactKey] as string;
    }

    return undefined;
};

/*const defaultFirebaseConfig: FirebaseRuntimeConfig & {
    storageBucket: string;
    messagingSenderId: string;
    measurementId: string;
} = {
    apiKey: 'AIzaSyAByyWLhxQ3-sBRM2HJZPuxPD2rWC9t9Tk',
    authDomain: 'portalproveedores-3a4a7.firebaseapp.com',
    projectId: 'portalproveedores-3a4a7',
    storageBucket: 'portalproveedores-3a4a7.firebasestorage.app',
    messagingSenderId: '142746526401',
    appId: '1:142746526401:web:ba8f61bf5d505f6947ea40',
    measurementId: 'G-797C9B2YV7',
};*/

const defaultFirebaseConfig: FirebaseRuntimeConfig & {
    storageBucket: string;
    messagingSenderId: string;
    measurementId: string;
} = {
    apiKey: "AIzaSyB17dBMXczPmFcvb3SMlvOb9B6FpwYWU4A",
    authDomain: "supplier-portal-63f43.firebaseapp.com",
    projectId: "supplier-portal-63f43",
    storageBucket: "supplier-portal-63f43.firebasestorage.app",
    messagingSenderId: "423560703858",
    appId: "1:423560703858:web:ff4b7d24445eb96b4f77eb",
    measurementId: "G-TL95VZV2EH"
};

const buildFirebaseConfig = (): FirebaseRuntimeConfig & {
    storageBucket?: string;
    messagingSenderId?: string;
    measurementId?: string;
} => {
    const config: Partial<FirebaseRuntimeConfig> & {
        storageBucket?: string;
        messagingSenderId?: string;
        measurementId?: string;
    } = {};

    const assignKey = <K extends keyof FirebaseRuntimeConfig>(key: K) => {
        config[key] = (resolveEnv(`FIREBASE_${key.toUpperCase()}`) ?? defaultFirebaseConfig[key]) as never;
    };

    assignKey('apiKey');
    assignKey('authDomain');
    assignKey('projectId');
    assignKey('appId');

    config.storageBucket = resolveEnv('FIREBASE_STORAGE_BUCKET') ?? defaultFirebaseConfig.storageBucket;
    config.messagingSenderId = resolveEnv('FIREBASE_MESSAGING_SENDER_ID') ?? defaultFirebaseConfig.messagingSenderId;
    config.measurementId = resolveEnv('FIREBASE_MEASUREMENT_ID') ?? defaultFirebaseConfig.measurementId;

    return config as FirebaseRuntimeConfig & {
        storageBucket?: string;
        messagingSenderId?: string;
        measurementId?: string;
    };
};

const firebaseConfig = buildFirebaseConfig();

const app = initializeApp(firebaseConfig);

let analytics: Analytics | undefined;

if (typeof window !== 'undefined' && 'measurementId' in firebaseConfig && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const firebaseAnalytics = analytics;
export { app as firebaseApp };

