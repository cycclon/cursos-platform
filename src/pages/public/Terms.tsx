import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div>
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Legal</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-ink-light max-w-xl">
            Última actualización: febrero 2026
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-sm max-w-none text-ink-light leading-relaxed space-y-8">

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">1. Información General</h2>
            <p>
              El presente sitio web es operado por la Dra. Marcela Vidal (en adelante, "la Plataforma"),
              con domicilio en la República Argentina. Al acceder, registrarse o utilizar cualquier
              servicio ofrecido en esta plataforma, el usuario acepta de manera expresa estos Términos
              y Condiciones en su totalidad.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">2. Definiciones</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-ink">Usuario:</strong> toda persona que acceda a la plataforma, ya sea como visitante, estudiante registrado o docente.</li>
              <li><strong className="text-ink">Estudiante:</strong> usuario registrado que adquiere acceso a uno o más cursos.</li>
              <li><strong className="text-ink">Curso:</strong> contenido educativo digital compuesto por módulos, materiales complementarios, evaluaciones y/o certificaciones.</li>
              <li><strong className="text-ink">Combo:</strong> agrupación de dos o más cursos ofrecidos a un precio diferencial.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">3. Registro y Cuenta</h2>
            <p>
              Para acceder a los cursos, el usuario debe crear una cuenta mediante autenticación con Google.
              El usuario es responsable de mantener la seguridad de su cuenta y de toda actividad
              que ocurra bajo la misma. Queda prohibido compartir credenciales de acceso con terceros.
            </p>
            <p className="mt-2">
              La Plataforma se reserva el derecho de suspender o cancelar cuentas que incumplan
              estos términos, sin previo aviso y sin obligación de reembolso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">4. Contenido y Propiedad Intelectual</h2>
            <p>
              Todo el contenido disponible en la plataforma —incluyendo pero no limitado a videos,
              presentaciones, documentos, evaluaciones, imágenes y textos— es propiedad exclusiva
              de la Dra. Marcela Vidal y está protegido por las leyes argentinas de propiedad intelectual
              (Ley 11.723) y tratados internacionales aplicables.
            </p>
            <p className="mt-2">
              Queda expresamente prohibido:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Reproducir, distribuir o compartir el contenido de los cursos, total o parcialmente.</li>
              <li>Grabar, capturar pantalla o descargar el material audiovisual sin autorización.</li>
              <li>Utilizar el contenido con fines comerciales o para la creación de obras derivadas.</li>
              <li>Compartir o revender el acceso a los cursos con terceros.</li>
            </ul>
            <p className="mt-2">
              El incumplimiento de estas disposiciones podrá dar lugar a acciones legales y a la
              cancelación inmediata de la cuenta sin derecho a reembolso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">5. Pagos y Facturación</h2>
            <p>
              Los pagos se procesan a través de Mercado Pago. Los precios están expresados en
              pesos argentinos (ARS) e incluyen IVA cuando corresponda. La Plataforma se reserva
              el derecho de modificar los precios de los cursos en cualquier momento, sin que esto
              afecte a los cursos ya adquiridos por el estudiante.
            </p>
            <p className="mt-2">
              Las condiciones de reembolso se detallan en nuestra{' '}
              <Link to="/politica-de-reembolso" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                Política de Reembolso
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">6. Acceso a los Cursos</h2>
            <p>
              Una vez adquirido, el acceso al curso es personal e intransferible. El estudiante
              podrá acceder al contenido de manera ilimitada en el tiempo, salvo que se indique
              expresamente lo contrario en la descripción del curso.
            </p>
            <p className="mt-2">
              La Plataforma no garantiza la disponibilidad ininterrumpida del servicio y podrá
              realizar tareas de mantenimiento que impliquen la suspensión temporal del acceso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">7. Certificaciones</h2>
            <p>
              Los certificados emitidos por la plataforma acreditan la finalización del curso y,
              en su caso, la aprobación de la evaluación correspondiente. Estos certificados son
              de carácter privado y no constituyen títulos habilitantes ni reemplazan la formación
              académica oficial.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">8. Opiniones y Comentarios</h2>
            <p>
              Los estudiantes que hayan completado un curso podrán dejar una valoración y un
              comentario. La Plataforma se reserva el derecho de moderar o eliminar comentarios
              que resulten ofensivos, difamatorios, contengan información falsa o violen estos
              términos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">9. Limitación de Responsabilidad</h2>
            <p>
              La Plataforma ofrece contenido educativo de carácter informativo y formativo. En
              ningún caso sustituye el asesoramiento legal profesional. La Dra. Marcela Vidal no
              será responsable por decisiones tomadas por los usuarios en base al contenido de los cursos.
            </p>
            <p className="mt-2">
              La Plataforma no garantiza resultados específicos derivados de la realización de los cursos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">10. Modificaciones</h2>
            <p>
              La Plataforma se reserva el derecho de modificar estos Términos y Condiciones en
              cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el
              sitio. El uso continuado de la plataforma tras la publicación de cambios implica
              la aceptación de los mismos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">11. Legislación Aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina.
              Cualquier controversia será sometida a los Tribunales Ordinarios de la jurisdicción
              correspondiente al domicilio de la Plataforma, con renuncia expresa a cualquier otro
              fuero que pudiera corresponder.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">12. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos Términos y Condiciones, podés
              escribirnos a{' '}
              <a href="mailto:contacto@cursosderecho.com" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                contacto@cursosderecho.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
