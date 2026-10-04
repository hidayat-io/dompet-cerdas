// Pengganti services/firebaseRuntime.ts di harness.
export const resolveAttachmentUrl = async ({ url }: { url: string; path?: string }) => url;

export const callCloudFunction = async () => {
  throw new Error('harness: callCloudFunction tidak tersedia');
};
