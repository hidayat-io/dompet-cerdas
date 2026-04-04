export const sanitizeAccountNameForFilename = (name: string) => (
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
);
