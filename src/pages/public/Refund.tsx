import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Refund() {
  return (
    <div>
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Legal</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Política de Reembolso
          </h1>
          <p className="text-ink-light max-w-xl">
            Última actualización: febrero 2026
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-sm max-w-none text-ink-light leading-relaxed space-y-8">

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">1. Alcance</h2>
            <p>
              Esta Política de Reembolso aplica a todos los cursos y combos adquiridos a través
              de la plataforma de la Dra. Gisela Flamini. Al realizar una compra, el estudiante
              acepta las condiciones aquí detalladas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">2. Plazo para Solicitar un Reembolso</h2>
            <p>
              El estudiante podrá solicitar un reembolso dentro de los <strong className="text-ink">7 (siete) días corridos</strong> posteriores
              a la fecha de compra, siempre que se cumplan las condiciones establecidas en esta política.
            </p>
            <p className="mt-2">
              Este plazo se encuentra en conformidad con lo dispuesto por la Ley N° 24.240 de
              Defensa del Consumidor de la República Argentina respecto del derecho de
              revocación en contratos celebrados a distancia.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">3. Condiciones para el Reembolso</h2>
            <p>El reembolso será procedente cuando:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>La solicitud se realice dentro del plazo de 7 días desde la compra.</li>
              <li>El estudiante no haya completado más del <strong className="text-ink">30%</strong> del contenido del curso.</li>
              <li>No se haya emitido un certificado de finalización para dicho curso.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">4. Casos en los que No Procede el Reembolso</h2>
            <p>No se otorgará reembolso en los siguientes casos:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>La solicitud se presente fuera del plazo de 7 días.</li>
              <li>El estudiante haya consumido más del 30% del contenido.</li>
              <li>Se haya emitido un certificado de finalización.</li>
              <li>La cuenta del estudiante haya sido suspendida por incumplimiento de los{' '}
                <Link to="/terminos-y-condiciones" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                  Términos y Condiciones
                </Link>.
              </li>
              <li>El curso haya sido adquirido como parte de una promoción o descuento especial
                que indique expresamente la exclusión de reembolso.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">5. Reembolso en Combos</h2>
            <p>
              En el caso de combos (paquetes de cursos), el reembolso aplica sobre el combo
              completo y no sobre cursos individuales dentro del mismo. Se aplican las mismas
              condiciones: dentro de los 7 días y sin haber superado el 30% de avance en
              ninguno de los cursos incluidos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">6. Procedimiento</h2>
            <p>Para solicitar un reembolso:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>
                Enviá un correo electrónico a{' '}
                <a href="mailto:contacto@cursosderecho.com" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                  contacto@cursosderecho.com
                </a>{' '}
                con el asunto <strong className="text-ink">"Solicitud de reembolso"</strong>.
              </li>
              <li>Incluí tu nombre completo, el correo asociado a tu cuenta y el nombre del curso.</li>
              <li>Indicá brevemente el motivo de la solicitud.</li>
            </ol>
            <p className="mt-3">
              Evaluaremos tu solicitud y responderemos en un plazo máximo de
              <strong className="text-ink"> 5 (cinco) días hábiles</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">7. Forma de Devolución</h2>
            <p>
              Los reembolsos aprobados se procesarán a través de Mercado Pago, utilizando el
              mismo medio de pago con el que se realizó la compra original. El plazo de
              acreditación dependerá del medio de pago y de las políticas de Mercado Pago,
              pudiendo demorar entre <strong className="text-ink">5 y 15 días hábiles</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">8. Cursos Gratuitos</h2>
            <p>
              Los cursos ofrecidos de manera gratuita no están sujetos a esta política de
              reembolso, dado que no implican una transacción económica.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">9. Problemas Técnicos</h2>
            <p>
              Si experimentás problemas técnicos que impidan acceder al contenido de un curso,
              te pedimos que nos contactes antes de solicitar un reembolso. Haremos todo lo
              posible por resolver el inconveniente. Si el problema persiste y no podemos
              solucionarlo, el reembolso será procesado independientemente del plazo transcurrido.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">10. Contacto</h2>
            <p>
              Para solicitar un reembolso o resolver cualquier duda al respecto, escribinos a:
            </p>
          </section>
        </div>

        <div className="mt-8 text-center bg-parchment rounded-xl p-8 border border-chocolate-100/20 shadow-warm">
          <p className="font-display text-lg font-semibold text-ink mb-2">¿Necesitás solicitar un reembolso?</p>
          <p className="text-sm text-ink-light mb-4">Escribinos y te respondemos dentro de 5 días hábiles.</p>
          <a
            href="mailto:contacto@cursosderecho.com?subject=Solicitud%20de%20reembolso"
            className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
          >
            <Mail className="w-4 h-4" />
            Solicitar reembolso
          </a>
        </div>
      </div>
    </div>
  );
}
