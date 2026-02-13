import { faqs } from '@/data/mock';
import Accordion from '@/components/ui/Accordion';
import { Mail } from 'lucide-react';

export default function Faq() {
  const items = faqs.map(f => ({ id: f.id, title: f.question, content: f.answer }));

  return (
    <div>
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Ayuda</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Preguntas Frecuentes
          </h1>
          <p className="text-ink-light max-w-xl">
            Encontrá respuestas a las consultas más habituales sobre nuestros cursos, pagos y certificaciones.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Accordion items={items} />

        <div className="mt-12 text-center bg-parchment rounded-xl p-8 border border-chocolate-100/20 shadow-warm">
          <p className="font-display text-lg font-semibold text-ink mb-2">¿No encontraste lo que buscabas?</p>
          <p className="text-sm text-ink-light mb-4">Escribinos y te respondemos a la brevedad.</p>
          <a
            href="mailto:contacto@cursosderecho.com"
            className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
          >
            <Mail className="w-4 h-4" />
            Contactar
          </a>
        </div>
      </div>
    </div>
  );
}
