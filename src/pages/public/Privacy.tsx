export default function Privacy() {
  return (
    <div>
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Legal</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Política de Privacidad
          </h1>
          <p className="text-ink-light max-w-xl">
            Última actualización: febrero 2026
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-sm max-w-none text-ink-light leading-relaxed space-y-8">

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">1. Responsable del Tratamiento</h2>
            <p>
              La responsable del tratamiento de los datos personales es la Dra. Gisela Flamini,
              con domicilio en la República Argentina y correo electrónico de contacto:{' '}
              <a href="mailto:contacto@cursosderecho.com" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                contacto@cursosderecho.com
              </a>.
            </p>
            <p className="mt-2">
              Esta política se enmarca en lo dispuesto por la Ley N° 25.326 de Protección de Datos
              Personales de la República Argentina y su normativa complementaria.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">2. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes datos personales:</p>

            <h3 className="font-display text-base font-semibold text-ink mt-4 mb-2">Datos proporcionados por el usuario</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nombre completo y dirección de correo electrónico (obtenidos mediante la autenticación con Google).</li>
              <li>Fotografía de perfil de la cuenta de Google (si está disponible).</li>
            </ul>

            <h3 className="font-display text-base font-semibold text-ink mt-4 mb-2">Datos generados por el uso de la plataforma</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Historial de cursos adquiridos e inscripciones.</li>
              <li>Progreso en cada curso y módulo.</li>
              <li>Resultados de evaluaciones y certificados emitidos.</li>
              <li>Opiniones, valoraciones y comentarios publicados.</li>
              <li>Datos de transacciones de pago (procesados por Mercado Pago; no almacenamos datos de tarjetas).</li>
            </ul>

            <h3 className="font-display text-base font-semibold text-ink mt-4 mb-2">Datos técnicos</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dirección IP, tipo de navegador y sistema operativo.</li>
              <li>Cookies esenciales para el funcionamiento del servicio (autenticación y sesión).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">3. Finalidad del Tratamiento</h2>
            <p>Los datos personales se utilizan exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Gestionar el registro y la autenticación del usuario.</li>
              <li>Proveer acceso a los cursos adquiridos y hacer seguimiento del progreso.</li>
              <li>Emitir certificados de finalización.</li>
              <li>Procesar pagos a través de Mercado Pago.</li>
              <li>Enviar comunicaciones relacionadas con los cursos (actualizaciones, novedades).</li>
              <li>Mejorar la experiencia del usuario y la calidad de los contenidos.</li>
              <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">4. Base Legal</h2>
            <p>
              El tratamiento de datos se basa en el consentimiento del usuario al registrarse en
              la plataforma, la ejecución del contrato de prestación de servicios educativos y el
              cumplimiento de obligaciones legales vigentes en la República Argentina.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">5. Compartición de Datos</h2>
            <p>
              No vendemos, alquilamos ni compartimos datos personales con terceros, salvo en los
              siguientes casos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-ink">Mercado Pago:</strong> para el procesamiento de pagos. Mercado Pago opera bajo su propia política de privacidad.</li>
              <li><strong className="text-ink">Google:</strong> la autenticación se realiza a través de Google OAuth. Google procesa los datos de autenticación bajo su propia política de privacidad.</li>
              <li><strong className="text-ink">Obligaciones legales:</strong> cuando sea requerido por autoridad judicial o administrativa competente.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">6. Almacenamiento y Seguridad</h2>
            <p>
              Los datos se almacenan en servidores seguros con medidas de protección técnicas y
              organizativas apropiadas, incluyendo cifrado de comunicaciones (HTTPS), control de
              acceso y copias de seguridad periódicas.
            </p>
            <p className="mt-2">
              Los datos se conservarán mientras la cuenta del usuario permanezca activa y durante
              el plazo necesario para cumplir con las finalidades descritas y las obligaciones
              legales aplicables.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">7. Derechos del Usuario</h2>
            <p>
              De conformidad con la Ley N° 25.326, el usuario tiene derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-ink">Acceso:</strong> solicitar información sobre los datos personales almacenados.</li>
              <li><strong className="text-ink">Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
              <li><strong className="text-ink">Supresión:</strong> solicitar la eliminación de datos cuando ya no sean necesarios.</li>
              <li><strong className="text-ink">Oposición:</strong> oponerse al tratamiento de sus datos en ciertos supuestos.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, escribí a{' '}
              <a href="mailto:contacto@cursosderecho.com" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                contacto@cursosderecho.com
              </a>{' '}
              indicando tu nombre completo y el derecho que deseás ejercer. Responderemos en un
              plazo máximo de 10 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">8. Cookies</h2>
            <p>
              La plataforma utiliza cookies estrictamente necesarias para el funcionamiento del
              servicio (autenticación y mantenimiento de sesión). No utilizamos cookies de
              seguimiento, analíticas o publicitarias de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">9. Menores de Edad</h2>
            <p>
              La plataforma está dirigida a personas mayores de 18 años. No recopilamos
              intencionadamente datos de menores. Si detectamos que un menor se ha registrado,
              procederemos a eliminar su cuenta y datos asociados.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">10. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad. Cualquier
              cambio será publicado en esta página con la fecha de última actualización. El uso
              continuado de la plataforma implica la aceptación de la política vigente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-3">11. Contacto</h2>
            <p>
              Para consultas sobre esta política o el tratamiento de tus datos personales,
              escribinos a{' '}
              <a href="mailto:contacto@cursosderecho.com" className="text-chocolate font-medium hover:text-chocolate-dark transition-colors">
                contacto@cursosderecho.com
              </a>.
            </p>
            <p className="mt-2 text-xs">
              La Dirección Nacional de Protección de Datos Personales (DNPDP), en su carácter de
              órgano de control de la Ley N° 25.326, tiene la atribución de atender las denuncias
              y reclamos que interpongan quienes resulten afectados en sus derechos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
