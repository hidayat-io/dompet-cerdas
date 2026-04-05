/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_URL?: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string;
  readonly VITE_E2E_TEST_EMAIL?: string;
  readonly VITE_E2E_TEST_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
