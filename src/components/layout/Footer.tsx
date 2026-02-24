import { Link } from 'react-router-dom';
import { BookOpen, Mail, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-chocolate rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cream" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-cream">Dra. Vidal</span>
                <span className="text-xs text-cream-dark block -mt-1 tracking-wide">Cursos de Derecho</span>
              </div>
            </Link>
            <p className="text-sm text-cream-dark/70 leading-relaxed">
              Formación jurídica de excelencia para profesionales del derecho.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-gold mb-4 tracking-wide uppercase">Navegación</h4>
            <ul className="space-y-2">
              {[
                { to: '/cursos', label: 'Cursos' },
                { to: '/sobre-mi', label: 'Sobre Mí' },
                { to: '/preguntas-frecuentes', label: 'Preguntas Frecuentes' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-dark/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-sm font-semibold text-gold mb-4 tracking-wide uppercase">Legal</h4>
            <ul className="space-y-2">
              {[
                { to: '/terminos-y-condiciones', label: 'Términos y Condiciones' },
                { to: '/politica-de-privacidad', label: 'Política de Privacidad' },
                { to: '/politica-de-reembolso', label: 'Política de Reembolso' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-dark/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold text-gold mb-4 tracking-wide uppercase">Contacto</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contacto@cursosderecho.com" className="flex items-center gap-2 text-sm text-cream-dark/70 hover:text-gold transition-colors">
                  <Mail className="w-4 h-4" />
                  contacto@cursosderecho.com
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-sm text-cream-dark/70 hover:text-gold transition-colors">
                  <Instagram className="w-4 h-4" />
                  @dra.vidal.cursos
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream-dark/10 text-center">
          <p className="text-xs text-cream-dark/40">
            &copy; {new Date().getFullYear()} Dra. Marcela Vidal — Cursos de Derecho. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
