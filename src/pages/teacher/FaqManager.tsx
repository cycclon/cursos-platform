import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Trash2, HelpCircle, X, Check, GripVertical, MessageCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { faqsService } from '@/services/faqs';
import type { FAQ } from '@/types';

const emptyForm = { question: '', answer: '' };

export default function FaqManager() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: faqsService.getFaqs,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const handleCreate = () => {
    setEditingFaq(null);
    setFormData(emptyForm);
    setIsEditing(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await faqsService.deleteFaq(id);
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('Pregunta eliminada.');
    } catch {
      toast.error('Error al eliminar la pregunta.');
    }
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Completá todos los campos.');
      return;
    }

    try {
      if (editingFaq) {
        await faqsService.updateFaq(editingFaq.id, formData);
        toast.success('Pregunta actualizada.');
      } else {
        await faqsService.createFaq(formData);
        toast.success('Pregunta creada.');
      }
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsEditing(false);
      setEditingFaq(null);
    } catch {
      toast.error('Error al guardar la pregunta.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingFaq(null);
  };

  /* ── Loading ──────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-parchment rounded animate-pulse w-52" />
            <div className="h-4 bg-parchment rounded animate-pulse w-72 mt-2" />
          </div>
          <div className="h-10 w-40 bg-parchment rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Form View ──────────────────────────────────── */
  if (isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {editingFaq ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h1>
          <p className="text-ink-light mt-1">
            {editingFaq ? 'Modificá la pregunta y su respuesta.' : 'Agregá una nueva pregunta frecuente.'}
          </p>
        </div>

        <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Pregunta</label>
            <input
              type="text"
              value={formData.question}
              onChange={e => setFormData({ ...formData, question: e.target.value })}
              placeholder="Ej: ¿Cómo accedo a los cursos?"
              className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Respuesta</label>
            <textarea
              value={formData.answer}
              onChange={e => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Escribí la respuesta detallada..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-chocolate-100/20">
            <button
              onClick={handleSave}
              disabled={!formData.question.trim() || !formData.answer.trim()}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Guardar
            </button>
            <button onClick={handleCancel} className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl">
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List View ──────────────────────────────────── */
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Preguntas Frecuentes</h1>
          <p className="text-ink-light mt-1">Gestioná las preguntas que ven los estudiantes en la sección FAQ.</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nueva Pregunta
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg mb-4">No hay preguntas frecuentes aún.</p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
            <Plus className="w-4 h-4" />
            Crear primera pregunta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden card-accent"
            >
              <div className="flex items-start gap-4 p-5">
                {/* Grip + number */}
                <div className="flex items-center gap-2 pt-0.5 shrink-0">
                  <GripVertical className="w-4 h-4 text-ink-light/40" />
                  <span className="text-xs font-bold text-gold bg-gold/10 w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <HelpCircle className="w-3.5 h-3.5 text-chocolate shrink-0" />
                    <h3 className="font-display text-sm font-bold text-ink truncate">{faq.question}</h3>
                  </div>
                  <p className="text-xs text-ink-light line-clamp-2 ml-5.5">
                    {faq.answer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(faq)}
                    className="p-2 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 rounded-lg text-ink-light hover:text-error hover:bg-error-light transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
