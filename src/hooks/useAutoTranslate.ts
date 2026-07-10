import { useState } from 'react';
import { translateService } from '@/services/translate';
import { ApiError } from '@/services/api';
import { useToast } from '@/context/ToastContext';

/**
 * Shared runner for the teacher editors' "Completar con IA" buttons.
 * Returns the translations (same order/length as `texts`) or null on failure
 * (after toasting a readable reason).
 */
export function useAutoTranslate() {
  const [translating, setTranslating] = useState(false);
  const toast = useToast();

  const runTranslate = async (texts: string[], context?: string): Promise<string[] | null> => {
    if (texts.length === 0) return [];
    setTranslating(true);
    try {
      const { translations } = await translateService.translate(texts, context);
      return translations;
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        toast.error('La traducción automática no está configurada en el servidor (OLLAMA_API_KEY).');
      } else {
        toast.error('No se pudo traducir automáticamente. Podés completar los campos a mano.');
      }
      return null;
    } finally {
      setTranslating(false);
    }
  };

  return { translating, runTranslate };
}
