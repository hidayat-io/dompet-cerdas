import { firebaseApp } from '../firebase';

type CloudFunctionPayload = Record<string, unknown> | void;

const normalizeCallableErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Terjadi kesalahan saat memanggil layanan.';
  }

  const rawMessage = error.message || 'Terjadi kesalahan saat memanggil layanan.';
  const strippedPrefix = rawMessage.replace(/^Firebase:\s*/i, '');
  const strippedSuffix = strippedPrefix.replace(/\s*\(functions\/[a-z-]+\)\.?$/i, '');
  return strippedSuffix || rawMessage;
};

export const callCloudFunction = async <TRequest extends CloudFunctionPayload, TResponse>(
  name: string,
  payload?: TRequest
): Promise<TResponse> => {
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const functions = getFunctions(firebaseApp, 'asia-southeast1');
  const callable = httpsCallable<TRequest, TResponse>(functions, name);
  try {
    const response = await callable(payload as TRequest);
    return response.data;
  } catch (error) {
    throw new Error(normalizeCallableErrorMessage(error));
  }
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

export const getLegacyStoragePathFromUrl = (url: string) => {
  const urlPattern = /\/o\/(.+?)\?/;
  const match = url.match(urlPattern);

  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
};
