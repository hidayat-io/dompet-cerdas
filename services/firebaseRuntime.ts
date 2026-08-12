import { firebaseApp } from '../firebase';

type CloudFunctionPayload = Record<string, unknown> | void;

/**
 * Base URL Go API, mis. https://api.example.com/api/v1.
 *
 * Wajib diisi. Firebase Cloud Functions sudah dipensiunkan, jadi tidak ada lagi
 * jalur cadangan bila variabel ini kosong — build tanpa nilai ini akan gagal
 * saat pertama kali memanggil backend, bukan diam-diam jatuh ke Firebase.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

interface ApiRoute {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
}

/**
 * Pemetaan nama operasi ke endpoint Go API.
 *
 * Nama kuncinya masih memakai nama callable lama supaya call site tidak perlu
 * diubah serentak; ini murni alias, bukan indikasi Firebase masih dipakai.
 */
const API_ROUTES: Record<string, ApiRoute> = {
  linkTelegram: { method: 'POST', path: '/telegram/link' },
  notifyLinkSuccess: { method: 'POST', path: '/telegram/notify-success' },
  refreshCategoryCache: { method: 'POST', path: '/categories/refresh-cache' },
  analyzeFinancialData: { method: 'POST', path: '/advisor/analyze' },
  createSharedAccount: { method: 'POST', path: '/shared-accounts' },
  shareExistingAccount: { method: 'POST', path: '/shared-accounts/convert' },
  deleteSharedAccountAccess: { method: 'DELETE', path: '/shared-accounts/:id/access' },
  createSharedInviteCode: { method: 'POST', path: '/shared-accounts/:id/invite-code' },
  joinSharedAccountByCode: { method: 'POST', path: '/shared-accounts/join' },
  scanReceipt: { method: 'POST', path: '/transactions/scan-receipt' },
};

/** Isi placeholder `:id` dari payload. Return null bila id tidak tersedia. */
const resolveApiPath = (route: ApiRoute, payload: Record<string, unknown>) => {
  if (!route.path.includes(':id')) return route.path;

  const rawId = payload.accountId ?? payload.id;
  if (typeof rawId !== 'string' || !rawId.trim()) return null;

  return route.path.replace(':id', encodeURIComponent(rawId.trim()));
};

/**
 * Panggil Go API dengan Firebase ID token sebagai kredensial.
 *
 * Firestore dan Firebase Auth tetap dipakai aplikasi ini; yang dipensiunkan
 * hanya Cloud Functions. Karena itu token tetap diambil dari Firebase Auth.
 */
export const callCloudFunction = async <TRequest extends CloudFunctionPayload, TResponse>(
  name: string,
  payload?: TRequest
): Promise<TResponse> => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL belum diatur, aplikasi tidak bisa menghubungi server.');
  }

  const route = API_ROUTES[name];
  if (!route) {
    throw new Error(`Operasi "${name}" tidak dikenali.`);
  }

  const { getAuth } = await import('firebase/auth');
  const user = getAuth(firebaseApp).currentUser;
  if (!user) {
    throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
  }

  const idToken = await user.getIdToken();
  const reqPayload = (payload ?? {}) as Record<string, unknown>;

  const urlPath = resolveApiPath(route, reqPayload);
  if (!urlPath) {
    throw new Error(`Permintaan "${name}" tidak menyertakan id akun.`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${urlPath}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      ...(route.method === 'GET' ? {} : { body: JSON.stringify(reqPayload) }),
    });
  } catch (error) {
    console.error(`[API] ${name} gagal terhubung:`, error);
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet kamu.');
  }

  // Body kosong (mis. 204) bukan error; hanya berarti tidak ada data balik.
  const body = await response
    .json()
    .catch(() => null as { success?: boolean; message?: string; data?: unknown; error?: { message?: string } } | null);

  if (!response.ok || body?.success === false) {
    const message =
      body?.message || body?.error?.message || `Server mengembalikan status ${response.status}.`;
    console.error(`[API] ${name} gagal:`, message);
    throw new Error(message);
  }

  return body?.data as TResponse;
};

export const uploadFileToStorage = async (path: string, file: File) => {
  const { getStorage, getDownloadURL, ref, uploadBytes } = await import('firebase/storage');
  const storage = getStorage(firebaseApp);
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    path: snapshot.ref.fullPath,
  };
};

export const deleteFileFromStorage = async (path: string) => {
  const { deleteObject, getStorage, ref } = await import('firebase/storage');
  const storage = getStorage(firebaseApp);
  await deleteObject(ref(storage, path));
};

/**
 * Ambil URL tampilan sebuah lampiran.
 *
 * Lampiran baru (mis. struk dari bot Telegram) disimpan privat tanpa URL —
 * hanya path Storage — jadi URL di-resolve di sisi klien lewat getDownloadURL
 * yang tahan lama dan terproteksi aturan akses. Bila path tidak ada atau
 * ditolak (dokumen lama dengan path di luar aturan), jatuh kembali ke url yang
 * tersimpan.
 */
export const resolveAttachmentUrl = async (attachment: {
  url?: string | null;
  path?: string | null;
}): Promise<string> => {
  if (attachment.path) {
    try {
      const { getStorage, getDownloadURL, ref } = await import('firebase/storage');
      const storage = getStorage(firebaseApp);
      return await getDownloadURL(ref(storage, attachment.path));
    } catch (error) {
      console.warn('[STORAGE] gagal resolve URL lampiran dari path, pakai url tersimpan:', error);
    }
  }
  return attachment.url ?? '';
};

export const getLegacyStoragePathFromUrl = (url: string) => {
  const urlPattern = /\/o\/(.+?)\?/;
  const match = url.match(urlPattern);

  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
};
