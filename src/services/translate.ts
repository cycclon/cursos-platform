import { api } from './api';

// Teacher-only machine-translation assist (Ollama server-side). Results are
// suggestions: they prefill the EN fields and the teacher reviews before saving.
export const translateService = {
  translate: (texts: string[], context?: string) =>
    api.post<{ translations: string[] }>('/translate', { texts, context }),
};
