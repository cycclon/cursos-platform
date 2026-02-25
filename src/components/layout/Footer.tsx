import { Link } from 'react-router-dom';
import { Mail, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="Academia de Litigación"
                className="w-9 h-9 object-contain brightness-0 invert"
              />
              <div>
                <span className="font-display text-lg font-bold text-cream leading-tight">Academia de Litigación</span>
                <span className="text-xs text-cream-dark block -mt-0.5 tracking-wide">Dra. Flamini</span>
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
                <a href="mailto:contacto@academiadelitigacion.com.ar" className="flex items-center gap-2 text-sm text-cream-dark/70 hover:text-gold transition-colors">
                  <Mail className="w-4 h-4" />
                  contacto@academiadelitigacion.com.ar
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/gisela.flamini.jueza" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cream-dark/70 hover:text-gold transition-colors">
                  <Instagram className="w-4 h-4" />
                  @gisela.flamini.jueza
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@giselaflamini" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cream-dark/70 hover:text-gold transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.76 1.5V7.12a4.83 4.83 0 0 1-1-.43Z"/></svg>
                  @giselaflamini
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream-dark/10 flex flex-col items-center gap-2">
          <p className="text-xs text-cream-dark/40">
            &copy; {new Date().getFullYear()} Academia de Litigación — Dra. Flamini. Todos los derechos reservados.
          </p>
          <a
            href="https://kaspi.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-cream-dark/30 hover:text-gold/70 transition-colors"
          >
            Desarrollado por
            <span className="font-semibold tracking-wide">KASPI</span>
            <span className="text-cream-dark/20">—</span>
            <span className="italic">Sistemas inteligentes</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
