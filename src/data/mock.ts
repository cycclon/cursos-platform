import type { Course, Module, Review, FAQ, Teacher, Enrollment, Certificate, SalesData, CourseStat, Question, Testimonial, User, Bundle } from '@/types';

// ── Users ─────────────────────────────────────────────
export const mockUsers: Record<string, User> = {
  student: {
    id: 'u1',
    name: 'Carolina Méndez',
    email: 'carolina@email.com',
    role: 'student',
  },
  teacher: {
    id: 'u2',
    name: 'Dra. Marcela Vidal',
    email: 'marcela@cursosderecho.com',
    role: 'teacher',
  },
  superuser: {
    id: 'u3',
    name: 'Administrador',
    email: 'admin@cursosderecho.com',
    role: 'superuser',
  },
};

// ── Teacher ───────────────────────────────────────────
export const teacher: Teacher = {
  name: 'Dra. Marcela Vidal',
  title: 'Jueza de Cámara · Docente Universitaria',
  bio: `Con más de 20 años de experiencia en el ámbito judicial y académico, la Dra. Marcela Vidal ha dedicado su carrera a la formación de profesionales del derecho. Actualmente se desempeña como Jueza de Cámara en lo Civil y Comercial, y es profesora titular de Derecho Procesal en la Universidad de Buenos Aires.

Su pasión por la enseñanza la llevó a crear esta plataforma con el objetivo de democratizar el acceso a formación jurídica de calidad, combinando la rigurosidad académica con un enfoque práctico basado en casos reales.

Ha publicado más de 30 artículos en revistas jurídicas especializadas y es autora de dos libros de referencia en materia procesal civil.`,
  photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=face',
  credentials: [
    'Jueza de Cámara en lo Civil y Comercial',
    'Profesora Titular, Universidad de Buenos Aires',
    'Doctora en Derecho (UBA)',
    'Autora de "Derecho Procesal Civil Contemporáneo"',
    'Miembro de la Asociación Argentina de Derecho Procesal',
    '+20 años de experiencia judicial',
    '+30 publicaciones en revistas especializadas',
  ],
};

// ── Courses ───────────────────────────────────────────
const createModules = (courseId: string, modules: Omit<Module, 'id' | 'courseId'>[]): Module[] =>
  modules.map((m, i) => ({ ...m, id: `${courseId}-m${i}`, courseId }));

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Derecho Penal Avanzado',
    slug: 'derecho-penal-avanzado',
    category: 'Derecho Penal',
    summary: 'Profundización en los conceptos fundamentales del derecho penal argentino, con análisis de jurisprudencia reciente y casos prácticos.',
    description: `<p>Este curso integral de Derecho Penal Avanzado está diseñado para abogados y estudiantes avanzados que deseen profundizar sus conocimientos en la materia penal argentina.</p>
<p>A lo largo de los módulos, analizaremos la teoría del delito desde una perspectiva contemporánea, revisaremos la jurisprudencia más reciente de la Corte Suprema y los tribunales federales, y trabajaremos con casos prácticos que reflejan los desafíos actuales del sistema penal.</p>
<p>El curso incluye material exclusivo con análisis de fallos, esquemas procesales y guías de práctica forense que serán de utilidad inmediata en el ejercicio profesional.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop',
    price: 35000,
    discountPrice: 27500,
    discountLabel: '21% OFF',
    duration: '24 horas',
    prerequisites: [
      'Título de abogado o estudiante avanzado de derecho',
      'Conocimientos básicos de derecho penal (parte general)',
      'Acceso a código penal argentino actualizado',
    ],
    tableOfContents: [
      'Introducción y marco normativo actual',
      'Teoría del delito: revisión contemporánea',
      'Autoría y participación criminal',
      'Concurso de delitos',
      'La pena: determinación y ejecución',
    ],
    availability: 'Acceso por 6 meses desde la inscripción',
    hasTest: true,
    testConfig: { totalQuestions: 20, timeLimit: 45, maxRetries: 3, passingScore: 70 },
    hasCertificate: true,
    moneyBackGuarantee: 'Garantía de devolución dentro de los primeros 7 días si el curso no cumple sus expectativas.',
    rating: 4.8,
    reviewCount: 47,
    studentCount: 186,
    createdAt: '2025-03-15',
    featured: true,
    modules: createModules('c1', [
      {
        number: 0,
        title: 'Introducción al curso',
        description: 'Presentación del curso, objetivos de aprendizaje y metodología. Vista general del programa.',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        videoDuration: '15:30',
        materials: [
          { id: 'c1-m0-1', name: 'Programa del curso', type: 'pdf', size: '245 KB' },
        ],
        isFree: true,
      },
      {
        number: 1,
        title: 'Teoría del delito contemporánea',
        description: 'Análisis actualizado de la estructura del delito: acción, tipicidad, antijuridicidad y culpabilidad.',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        videoDuration: '1:24:00',
        materials: [
          { id: 'c1-m1-1', name: 'Teoría del delito - Apuntes', type: 'pdf', size: '1.2 MB' },
          { id: 'c1-m1-2', name: 'Esquema de análisis', type: 'pdf', size: '340 KB' },
          { id: 'c1-m1-3', name: 'Jurisprudencia seleccionada', type: 'docx', size: '890 KB' },
        ],
        isFree: false,
      },
      {
        number: 2,
        title: 'Autoría y participación',
        description: 'Formas de intervención en el delito: autor directo, mediato, coautor, instigador, cómplice.',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        videoDuration: '1:18:00',
        materials: [
          { id: 'c1-m2-1', name: 'Autoría y participación', type: 'pdf', size: '1.5 MB' },
          { id: 'c1-m2-2', name: 'Casos prácticos', type: 'docx', size: '560 KB' },
        ],
        isFree: false,
      },
      {
        number: 3,
        title: 'Concurso de delitos',
        description: 'Concurso ideal, real y aparente. Delito continuado. Unificación de penas.',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        videoDuration: '1:05:00',
        materials: [
          { id: 'c1-m3-1', name: 'Concurso de delitos', type: 'pdf', size: '980 KB' },
          { id: 'c1-m3-2', name: 'Cuadro comparativo', type: 'xlsx', size: '120 KB' },
        ],
        isFree: false,
      },
      {
        number: 4,
        title: 'Determinación de la pena',
        description: 'Criterios de mensuración, agravantes, atenuantes y pautas jurisprudenciales.',
        videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        videoDuration: '1:32:00',
        materials: [
          { id: 'c1-m4-1', name: 'Determinación de la pena', type: 'pdf', size: '1.1 MB' },
          { id: 'c1-m4-2', name: 'Planilla de cálculo de penas', type: 'xlsx', size: '85 KB' },
          { id: 'c1-m4-3', name: 'Presentación - Clase magistral', type: 'pptx', size: '3.4 MB' },
        ],
        isFree: false,
      },
    ]),
  },
  {
    id: 'c2',
    title: 'Derecho Civil y Sucesiones',
    slug: 'derecho-civil-sucesiones',
    category: 'Derecho Civil',
    summary: 'Curso completo sobre derecho sucesorio argentino bajo el Código Civil y Comercial, con enfoque práctico y casos reales.',
    description: `<p>Este curso aborda de manera integral el derecho sucesorio argentino conforme al Código Civil y Comercial de la Nación. Está pensado para profesionales que necesiten actualizar sus conocimientos o profundizar en esta rama fundamental del derecho civil.</p>
<p>Cada módulo combina exposición teórica con el análisis de casos jurisprudenciales recientes, brindando herramientas concretas para la práctica profesional en sucesiones.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop',
    price: 42000,
    duration: '30 horas',
    prerequisites: [
      'Título de abogado o estudiante avanzado',
      'Conocimientos de derecho civil (parte general)',
    ],
    tableOfContents: [
      'Fundamentos del derecho sucesorio',
      'Sucesión intestada',
      'Sucesión testamentaria',
      'Partición y colación',
    ],
    availability: 'Acceso ilimitado',
    hasTest: true,
    testConfig: { totalQuestions: 25, timeLimit: 60, maxRetries: 2, passingScore: 75 },
    hasCertificate: true,
    rating: 4.9,
    reviewCount: 62,
    studentCount: 234,
    createdAt: '2025-01-10',
    featured: true,
    modules: createModules('c2', [
      {
        number: 0,
        title: 'Introducción al derecho sucesorio',
        description: 'Marco general, principios rectores y ubicación en el sistema jurídico argentino.',
        videoDuration: '18:00',
        materials: [{ id: 'c2-m0-1', name: 'Programa completo', type: 'pdf', size: '310 KB' }],
        isFree: true,
      },
      {
        number: 1,
        title: 'Sucesión intestada',
        description: 'Órdenes sucesorios, derecho de representación, legítima hereditaria.',
        videoDuration: '1:45:00',
        materials: [
          { id: 'c2-m1-1', name: 'Sucesión intestada - Manual', type: 'pdf', size: '2.1 MB' },
          { id: 'c2-m1-2', name: 'Esquema de órdenes sucesorios', type: 'pdf', size: '450 KB' },
        ],
        isFree: false,
      },
      {
        number: 2,
        title: 'Sucesión testamentaria',
        description: 'Tipos de testamento, formas, contenido, revocación e interpretación.',
        videoDuration: '1:30:00',
        materials: [
          { id: 'c2-m2-1', name: 'Sucesión testamentaria', type: 'pdf', size: '1.8 MB' },
          { id: 'c2-m2-2', name: 'Modelos de testamentos', type: 'docx', size: '340 KB' },
        ],
        isFree: false,
      },
      {
        number: 3,
        title: 'Partición y colación',
        description: 'Proceso de partición, bienes colacionables, valuación y adjudicación.',
        videoDuration: '1:20:00',
        materials: [
          { id: 'c2-m3-1', name: 'Partición hereditaria', type: 'pdf', size: '1.4 MB' },
          { id: 'c2-m3-2', name: 'Planilla de liquidación', type: 'xlsx', size: '95 KB' },
        ],
        isFree: false,
      },
    ]),
  },
  {
    id: 'c3',
    title: 'Derecho Laboral Actualizado',
    slug: 'derecho-laboral-actualizado',
    category: 'Derecho Laboral',
    summary: 'Las últimas reformas y tendencias en derecho laboral argentino. Análisis de la legislación vigente y jurisprudencia clave.',
    description: `<p>Un curso imprescindible para quienes ejercen o desean especializarse en derecho laboral. Analiza las reformas más recientes, la jurisprudencia actualizada y los desafíos que plantean las nuevas formas de trabajo.</p>
<p>Incluye análisis detallado de las últimas modificaciones legislativas y su impacto en la práctica profesional cotidiana.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=500&fit=crop',
    price: 28000,
    discountPrice: 22400,
    discountLabel: '20% OFF',
    duration: '18 horas',
    prerequisites: [
      'Conocimientos básicos de derecho del trabajo',
      'Ley de Contrato de Trabajo actualizada',
    ],
    tableOfContents: [
      'Panorama actual del derecho laboral',
      'Contrato de trabajo y modalidades',
      'Extinción de la relación laboral',
      'Nuevas formas de trabajo y plataformas digitales',
    ],
    availability: 'Acceso por 4 meses',
    hasTest: true,
    testConfig: { totalQuestions: 15, timeLimit: 30, maxRetries: 3, passingScore: 65 },
    hasCertificate: true,
    moneyBackGuarantee: 'Si no estás satisfecho, podés solicitar la devolución dentro de los primeros 5 días.',
    rating: 4.6,
    reviewCount: 31,
    studentCount: 142,
    createdAt: '2025-06-20',
    featured: false,
    modules: createModules('c3', [
      {
        number: 0,
        title: 'Panorama del derecho laboral hoy',
        description: 'Estado actual de la legislación laboral y principales debates.',
        videoDuration: '12:00',
        materials: [{ id: 'c3-m0-1', name: 'Introducción al curso', type: 'pdf', size: '200 KB' }],
        isFree: true,
      },
      {
        number: 1,
        title: 'Contrato de trabajo y modalidades',
        description: 'Tipos de contrato, período de prueba, jornada y descanso.',
        videoDuration: '1:20:00',
        materials: [
          { id: 'c3-m1-1', name: 'Contratos laborales', type: 'pdf', size: '1.6 MB' },
          { id: 'c3-m1-2', name: 'Cuadro de modalidades', type: 'xlsx', size: '78 KB' },
        ],
        isFree: false,
      },
      {
        number: 2,
        title: 'Extinción de la relación laboral',
        description: 'Despido, renuncia, indemnizaciones y cálculos de liquidación final.',
        videoDuration: '1:35:00',
        materials: [
          { id: 'c3-m2-1', name: 'Extinción laboral', type: 'pdf', size: '1.3 MB' },
          { id: 'c3-m2-2', name: 'Calculadora de indemnización', type: 'xlsx', size: '110 KB' },
        ],
        isFree: false,
      },
      {
        number: 3,
        title: 'Trabajo en plataformas digitales',
        description: 'El debate sobre la relación de dependencia en apps y plataformas.',
        videoDuration: '55:00',
        materials: [
          { id: 'c3-m3-1', name: 'Trabajo digital', type: 'pdf', size: '920 KB' },
        ],
        isFree: false,
      },
    ]),
  },
  {
    id: 'c4',
    title: 'Derecho de Familia',
    slug: 'derecho-de-familia',
    category: 'Derecho de Familia',
    summary: 'Matrimonio, divorcio, responsabilidad parental y adopción bajo el Código Civil y Comercial unificado.',
    description: `<p>Curso exhaustivo sobre derecho de familia que aborda las instituciones fundamentales tal como están reguladas por el Código Civil y Comercial de la Nación.</p>
<p>Se analizan los cambios introducidos por la unificación del código y su aplicación práctica en los tribunales de familia.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5f9cf1abc36c?w=800&h=500&fit=crop',
    price: 38000,
    duration: '26 horas',
    prerequisites: [
      'Título de abogado o estudiante avanzado',
      'Código Civil y Comercial de la Nación',
    ],
    tableOfContents: [
      'El derecho de familia en el CCyC',
      'Matrimonio y uniones convivenciales',
      'Divorcio y compensación económica',
      'Responsabilidad parental',
      'Adopción y técnicas de reproducción asistida',
    ],
    availability: 'Acceso ilimitado',
    hasTest: true,
    testConfig: { totalQuestions: 20, timeLimit: 40, maxRetries: 2, passingScore: 70 },
    hasCertificate: true,
    rating: 4.7,
    reviewCount: 38,
    studentCount: 167,
    createdAt: '2025-04-05',
    featured: true,
    modules: createModules('c4', [
      {
        number: 0,
        title: 'El derecho de familia hoy',
        description: 'Evolución y estado actual del derecho de familia en Argentina.',
        videoDuration: '20:00',
        materials: [{ id: 'c4-m0-1', name: 'Programa del curso', type: 'pdf', size: '280 KB' }],
        isFree: true,
      },
      {
        number: 1,
        title: 'Matrimonio y uniones convivenciales',
        description: 'Requisitos, efectos, régimen patrimonial y convenciones matrimoniales.',
        videoDuration: '1:40:00',
        materials: [
          { id: 'c4-m1-1', name: 'Matrimonio y uniones', type: 'pdf', size: '1.7 MB' },
        ],
        isFree: false,
      },
      {
        number: 2,
        title: 'Divorcio y compensación económica',
        description: 'Proceso de divorcio, propuesta reguladora, alimentos y compensación.',
        videoDuration: '1:25:00',
        materials: [
          { id: 'c4-m2-1', name: 'Divorcio - Guía práctica', type: 'pdf', size: '1.4 MB' },
          { id: 'c4-m2-2', name: 'Modelo de propuesta reguladora', type: 'docx', size: '280 KB' },
        ],
        isFree: false,
      },
      {
        number: 3,
        title: 'Responsabilidad parental',
        description: 'Ejercicio, delegación, plan de parentalidad y cuidado personal.',
        videoDuration: '1:15:00',
        materials: [
          { id: 'c4-m3-1', name: 'Responsabilidad parental', type: 'pdf', size: '1.2 MB' },
        ],
        isFree: false,
      },
      {
        number: 4,
        title: 'Adopción',
        description: 'Tipos de adopción, requisitos, procedimiento y efectos jurídicos.',
        videoDuration: '1:10:00',
        materials: [
          { id: 'c4-m4-1', name: 'Adopción en Argentina', type: 'pdf', size: '1.1 MB' },
          { id: 'c4-m4-2', name: 'Jurisprudencia comentada', type: 'docx', size: '650 KB' },
        ],
        isFree: false,
      },
    ]),
  },
  {
    id: 'c5',
    title: 'Oratoria Jurídica',
    slug: 'oratoria-juridica',
    category: 'Habilidades Profesionales',
    summary: 'Técnicas de oratoria y argumentación para audiencias judiciales, mediaciones y presentaciones profesionales.',
    description: `<p>Dominar la palabra es una herramienta fundamental para todo profesional del derecho. Este curso brinda técnicas concretas de oratoria, argumentación y comunicación persuasiva aplicadas al ámbito jurídico.</p>
<p>Desde la preparación de alegatos hasta la participación en audiencias orales, cada módulo ofrece ejercicios prácticos y retroalimentación.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop',
    price: 15000,
    duration: '12 horas',
    prerequisites: [
      'No se requieren conocimientos previos específicos',
      'Interés en mejorar habilidades de comunicación oral',
    ],
    tableOfContents: [
      'Fundamentos de la comunicación oral',
      'Estructura del discurso jurídico',
      'Técnicas de argumentación persuasiva',
      'Manejo de audiencias y nervios',
    ],
    availability: 'Acceso por 3 meses',
    hasTest: false,
    hasCertificate: true,
    rating: 4.5,
    reviewCount: 23,
    studentCount: 98,
    createdAt: '2025-08-01',
    featured: false,
    modules: createModules('c5', [
      {
        number: 0,
        title: 'Bienvenida y diagnóstico',
        description: 'Presentación del curso y autoevaluación de habilidades comunicativas.',
        videoDuration: '10:00',
        materials: [{ id: 'c5-m0-1', name: 'Guía de autoevaluación', type: 'pdf', size: '180 KB' }],
        isFree: true,
      },
      {
        number: 1,
        title: 'Estructura del discurso',
        description: 'Cómo organizar ideas, construir argumentos y estructurar presentaciones orales.',
        videoDuration: '1:00:00',
        materials: [
          { id: 'c5-m1-1', name: 'Estructura del discurso', type: 'pdf', size: '900 KB' },
          { id: 'c5-m1-2', name: 'Plantilla de alegato', type: 'docx', size: '220 KB' },
        ],
        isFree: false,
      },
      {
        number: 2,
        title: 'Argumentación persuasiva',
        description: 'Técnicas retóricas, uso de la voz, lenguaje corporal y manejo del espacio.',
        videoDuration: '1:15:00',
        materials: [
          { id: 'c5-m2-1', name: 'Argumentación persuasiva', type: 'pdf', size: '1.0 MB' },
          { id: 'c5-m2-2', name: 'Ejercicios prácticos', type: 'pdf', size: '340 KB' },
        ],
        isFree: false,
      },
      {
        number: 3,
        title: 'Audiencias y nervios',
        description: 'Preparación para audiencias judiciales, manejo del estrés y técnicas de improvisación.',
        videoDuration: '50:00',
        materials: [
          { id: 'c5-m3-1', name: 'Guía de audiencias', type: 'pdf', size: '750 KB' },
          { id: 'c5-m3-2', name: 'Checklist pre-audiencia', type: 'pdf', size: '120 KB' },
        ],
        isFree: false,
      },
    ]),
  },
];

// ── Reviews ───────────────────────────────────────────
export const reviews: Review[] = [
  {
    id: 'r1', courseId: 'c1', studentName: 'Martín Rodríguez',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 5, valorPrecio: 4 },
    comment: 'Excelente curso. La Dra. Vidal explica con una claridad impresionante conceptos que en la facultad me costaron mucho. El material de apoyo es de primera calidad.',
    date: '2025-09-12',
    teacherReply: 'Muchas gracias, Martín. Me alegra que el enfoque práctico te haya resultado útil. ¡Éxitos en tu carrera!',
    teacherReplyDate: '2025-09-13',
  },
  {
    id: 'r2', courseId: 'c1', studentName: 'Lucía Fernández',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 4, valorPrecio: 5 },
    comment: 'Los casos prácticos son lo mejor del curso. Pude aplicar directamente lo aprendido en un expediente que estaba llevando.',
    date: '2025-10-03',
  },
  {
    id: 'r3', courseId: 'c1', studentName: 'Diego Álvarez',
    rating: 4,
    categories: { contenido: 5, claridad: 4, material: 4, valorPrecio: 4 },
    comment: 'Muy buen curso. El módulo de concurso de delitos me sacó muchas dudas. Solo sugeriría más ejemplos en el tema de autoría mediata.',
    date: '2025-08-28',
    teacherReply: 'Gracias por la sugerencia, Diego. Estoy preparando material complementario sobre ese tema.',
    teacherReplyDate: '2025-08-30',
  },
  {
    id: 'r4', courseId: 'c2', studentName: 'Ana Schiavone',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 5, valorPrecio: 5 },
    comment: 'El mejor curso de sucesiones que encontré online. Muy completo y con excelente material descargable.',
    date: '2025-07-15',
    teacherReply: '¡Muchas gracias, Ana! Es un placer saber que el curso cumplió tus expectativas.',
    teacherReplyDate: '2025-07-16',
  },
  {
    id: 'r5', courseId: 'c2', studentName: 'Roberto Insúa',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 5, valorPrecio: 4 },
    comment: 'Impecable. Los modelos de testamentos y la planilla de liquidación son herramientas que uso en mi estudio todos los días.',
    date: '2025-11-02',
  },
  {
    id: 'r6', courseId: 'c2', studentName: 'Valentina Pereyra',
    rating: 4,
    categories: { contenido: 5, claridad: 4, material: 4, valorPrecio: 4 },
    comment: 'Muy bueno. El módulo de partición es particularmente claro. Me ayudó mucho con un caso complejo que tenía en el estudio.',
    date: '2025-09-20',
  },
  {
    id: 'r7', courseId: 'c3', studentName: 'Federico Blanco',
    rating: 4,
    categories: { contenido: 4, claridad: 5, material: 4, valorPrecio: 4 },
    comment: 'Actualizado y relevante. El módulo sobre trabajo en plataformas digitales era justo lo que necesitaba.',
    date: '2025-10-18',
    teacherReply: 'Gracias, Federico. Es un tema en constante evolución, así que voy actualizando el contenido periódicamente.',
    teacherReplyDate: '2025-10-19',
  },
  {
    id: 'r8', courseId: 'c3', studentName: 'Camila Ortiz',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 4, valorPrecio: 5 },
    comment: 'La calculadora de indemnización vale el precio del curso. Excelente contenido y muy bien explicado.',
    date: '2025-11-10',
  },
  {
    id: 'r9', courseId: 'c4', studentName: 'Paula Giménez',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 5, valorPrecio: 4 },
    comment: 'Extraordinario. El análisis del CCyC en materia de familia es el más completo que encontré. La Dra. Vidal es una docente excepcional.',
    date: '2025-06-22',
    teacherReply: 'Agradezco enormemente tus palabras, Paula. La docencia es mi pasión.',
    teacherReplyDate: '2025-06-23',
  },
  {
    id: 'r10', courseId: 'c4', studentName: 'Ignacio Méndez',
    rating: 4,
    categories: { contenido: 4, claridad: 4, material: 4, valorPrecio: 4 },
    comment: 'Buen curso. Completo y con buen material. El módulo de adopción podría ser un poco más extenso.',
    date: '2025-08-05',
  },
  {
    id: 'r11', courseId: 'c5', studentName: 'Sofía Castro',
    rating: 5,
    categories: { contenido: 5, claridad: 5, material: 4, valorPrecio: 5 },
    comment: 'Cambió mi forma de presentarme en audiencias. Los ejercicios prácticos son muy útiles. Lo recomiendo para cualquier abogado.',
    date: '2025-10-30',
    teacherReply: '¡Qué alegría leer esto, Sofía! La práctica constante es la clave.',
    teacherReplyDate: '2025-10-31',
  },
  {
    id: 'r12', courseId: 'c5', studentName: 'Tomás Herrera',
    rating: 4,
    categories: { contenido: 4, claridad: 4, material: 3, valorPrecio: 4 },
    comment: 'Muy práctico y aplicable. Me gustaría que incluyera alguna instancia de práctica grabada o feedback individual.',
    date: '2025-11-15',
  },
];

// ── FAQ ───────────────────────────────────────────────
export const faqs: FAQ[] = [
  {
    id: 'f1',
    question: '¿Cómo puedo inscribirme a un curso?',
    answer: 'Simplemente navegá al curso que te interese, hacé clic en "Inscribirme" y completá el proceso de pago a través de Mercado Pago. Una vez acreditado el pago, tendrás acceso inmediato al contenido.',
  },
  {
    id: 'f2',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos todos los medios de pago disponibles en Mercado Pago: tarjetas de crédito y débito, transferencia bancaria, efectivo en puntos de pago (Rapipago, Pago Fácil) y dinero en cuenta de Mercado Pago.',
  },
  {
    id: 'f3',
    question: '¿Los cursos tienen fecha de vencimiento?',
    answer: 'Depende de cada curso. Algunos tienen acceso ilimitado y otros tienen un período de disponibilidad (por ejemplo, 6 meses). Esta información está detallada en la descripción de cada curso.',
  },
  {
    id: 'f4',
    question: '¿Puedo descargar los videos?',
    answer: 'Los videos no están disponibles para descarga, pero podés verlos las veces que quieras mientras tengas acceso al curso. El material complementario (PDFs, documentos, planillas) sí es descargable.',
  },
  {
    id: 'f5',
    question: '¿Cómo obtengo mi certificado?',
    answer: 'Al completar todos los módulos del curso y, en caso de que el curso incluya un examen, al aprobarlo con la nota mínima requerida, se generará automáticamente tu certificado que podrás descargar e imprimir.',
  },
  {
    id: 'f6',
    question: '¿Puedo solicitar la devolución del dinero?',
    answer: 'Algunos cursos ofrecen garantía de devolución dentro de los primeros días. Consultá las condiciones específicas en la descripción de cada curso. Para solicitar la devolución, escribinos a soporte@cursosderecho.com.',
  },
  {
    id: 'f7',
    question: '¿Los exámenes tienen límite de intentos?',
    answer: 'Sí, cada curso define la cantidad máxima de intentos permitidos para el examen. Generalmente son entre 2 y 3 intentos. Podés ver esta información antes de comenzar el examen.',
  },
  {
    id: 'f8',
    question: '¿Necesito conocimientos previos?',
    answer: 'Cada curso detalla sus prerequisitos en la descripción. Algunos cursos avanzados requieren conocimientos básicos de la materia, mientras que otros no tienen requisitos especiales.',
  },
];

// ── Enrollments (student: Carolina) ───────────────────
export const enrollments: Enrollment[] = [
  {
    id: 'e1', courseId: 'c1', studentId: 'u1', progress: 80,
    completedModules: ['c1-m0', 'c1-m1', 'c1-m2', 'c1-m3'],
    enrolledAt: '2025-07-01',
  },
  {
    id: 'e2', courseId: 'c2', studentId: 'u1', progress: 100,
    completedModules: ['c2-m0', 'c2-m1', 'c2-m2', 'c2-m3'],
    enrolledAt: '2025-05-15',
    testPassed: true, testScore: 88, testAttempts: 1,
    certificateId: 'cert1',
  },
  {
    id: 'e3', courseId: 'c5', studentId: 'u1', progress: 25,
    completedModules: ['c5-m0'],
    enrolledAt: '2025-11-01',
  },
];

// ── Certificates ──────────────────────────────────────
export const certificates: Certificate[] = [
  {
    id: 'cert1',
    courseId: 'c2',
    studentId: 'u1',
    studentName: 'Carolina Méndez',
    courseTitle: 'Derecho Civil y Sucesiones',
    teacherName: 'Dra. Marcela Vidal',
    issuedAt: '2025-08-20',
    score: 88,
  },
];

// ── Sales Data (teacher stats) ────────────────────────
export const salesData: SalesData[] = [
  { month: 'Ene 2025', revenue: 420000, sales: 15, students: 12 },
  { month: 'Feb 2025', revenue: 385000, sales: 12, students: 10 },
  { month: 'Mar 2025', revenue: 560000, sales: 19, students: 16 },
  { month: 'Abr 2025', revenue: 612000, sales: 21, students: 18 },
  { month: 'May 2025', revenue: 490000, sales: 16, students: 14 },
  { month: 'Jun 2025', revenue: 735000, sales: 25, students: 22 },
  { month: 'Jul 2025', revenue: 680000, sales: 23, students: 19 },
  { month: 'Ago 2025', revenue: 820000, sales: 28, students: 25 },
  { month: 'Sep 2025', revenue: 910000, sales: 31, students: 27 },
  { month: 'Oct 2025', revenue: 875000, sales: 29, students: 26 },
  { month: 'Nov 2025', revenue: 1020000, sales: 35, students: 31 },
  { month: 'Dic 2025', revenue: 780000, sales: 26, students: 23 },
];

// ── Course Stats ──────────────────────────────────────
export const courseStats: CourseStat[] = [
  { courseId: 'c1', courseTitle: 'Derecho Penal Avanzado', views: 4520, enrollments: 186, revenue: 4650000, avgRating: 4.8 },
  { courseId: 'c2', courseTitle: 'Derecho Civil y Sucesiones', views: 5100, enrollments: 234, revenue: 9828000, avgRating: 4.9 },
  { courseId: 'c3', courseTitle: 'Derecho Laboral Actualizado', views: 3200, enrollments: 142, revenue: 3182400, avgRating: 4.6 },
  { courseId: 'c4', courseTitle: 'Derecho de Familia', views: 3800, enrollments: 167, revenue: 6346000, avgRating: 4.7 },
  { courseId: 'c5', courseTitle: 'Oratoria Jurídica', views: 2100, enrollments: 98, revenue: 1470000, avgRating: 4.5 },
];

// ── Test Questions (for Derecho Penal) ────────────────
export const testQuestions: Question[] = [
  {
    id: 'q1', courseId: 'c1', type: 'multiple-choice',
    text: '¿Cuál es el elemento subjetivo del tipo penal doloso?',
    options: ['La culpa', 'El dolo', 'La preterintención', 'La negligencia'],
    correctAnswer: 1,
  },
  {
    id: 'q2', courseId: 'c1', type: 'multiple-choice',
    text: 'En la autoría mediata, el autor:',
    options: [
      'Ejecuta directamente la acción típica',
      'Se vale de otro como instrumento para cometer el delito',
      'Presta una ayuda secundaria al autor',
      'Determina a otro a cometer el delito',
    ],
    correctAnswer: 1,
  },
  {
    id: 'q3', courseId: 'c1', type: 'true-false',
    text: 'El concurso ideal de delitos implica que un mismo hecho encuadra en más de un tipo penal.',
    options: ['Verdadero', 'Falso'],
    correctAnswer: 0,
  },
  {
    id: 'q4', courseId: 'c1', type: 'multiple-choice',
    text: '¿Cuál de las siguientes NO es una causa de justificación?',
    options: ['Legítima defensa', 'Estado de necesidad', 'Error de tipo', 'Cumplimiento de un deber'],
    correctAnswer: 2,
  },
  {
    id: 'q5', courseId: 'c1', type: 'multiple-choice',
    text: 'La tentativa se configura cuando:',
    options: [
      'El autor planifica el delito',
      'El autor comienza la ejecución del delito sin consumarlo',
      'El autor desiste voluntariamente',
      'El delito se consuma completamente',
    ],
    correctAnswer: 1,
  },
];

// ── Testimonials (for landing page) ───────────────────
export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Martín Rodríguez',
    text: 'Los cursos de la Dra. Vidal me dieron las herramientas que necesitaba para dar un salto en mi carrera profesional.',
    courseTitle: 'Derecho Penal Avanzado',
  },
  {
    id: 't2',
    name: 'Ana Schiavone',
    text: 'El mejor contenido jurídico online que encontré en Argentina. Riguroso, práctico y actualizado.',
    courseTitle: 'Derecho Civil y Sucesiones',
  },
  {
    id: 't3',
    name: 'Sofía Castro',
    text: 'Cambió mi forma de presentarme en audiencias. Una inversión que se paga sola en la primera causa.',
    courseTitle: 'Oratoria Jurídica',
  },
];

// ── Bundles ──────────────────────────────────────────
export const bundles: Bundle[] = [
  {
    id: 'b1',
    title: 'Formación Integral en Derecho',
    slug: 'formacion-integral-derecho',
    description: 'El paquete más completo: combiná Derecho Penal, Civil y de Familia en una formación integral con un descuento exclusivo. Ideal para quienes buscan una base sólida en las tres ramas fundamentales del derecho.',
    courseIds: ['c1', 'c2', 'c4'],
    originalPrice: 115000, // 35000 + 42000 + 38000
    price: 86250,
    discountLabel: '25% OFF',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
    featured: true,
  },
  {
    id: 'b2',
    title: 'Derecho Civil Completo',
    slug: 'derecho-civil-completo',
    description: 'Dominá el Derecho Civil y de Familia con este combo que cubre sucesiones, matrimonio, divorcio, responsabilidad parental y adopción bajo el Código Civil y Comercial unificado.',
    courseIds: ['c2', 'c4'],
    originalPrice: 80000, // 42000 + 38000
    price: 64000,
    discountLabel: '20% OFF',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=500&fit=crop',
    featured: true,
  },
  {
    id: 'b3',
    title: 'Pack Profesional',
    slug: 'pack-profesional',
    description: 'Potenciá tu práctica profesional combinando el dominio del Derecho Laboral actualizado con las técnicas de Oratoria Jurídica. El combo perfecto para destacarte en audiencias y negociaciones.',
    courseIds: ['c3', 'c5'],
    originalPrice: 43000, // 28000 + 15000
    price: 30100,
    discountLabel: '30% OFF',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',
    featured: false,
  },
];

// ── Helper functions ──────────────────────────────────
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getCourseBySlug = (slug: string) => courses.find(c => c.slug === slug);
export const getCourseReviews = (courseId: string) => reviews.filter(r => r.courseId === courseId);
export const getEnrollment = (courseId: string) => enrollments.find(e => e.courseId === courseId);
export const getCertificate = (id: string) => certificates.find(c => c.id === id);
export const getCategories = () => [...new Set(courses.map(c => c.category))];

export const getBundleBySlug = (slug: string) => bundles.find(b => b.slug === slug);
export const getBundleCourses = (bundle: Bundle) => bundle.courseIds.map(id => courses.find(c => c.id === id)!);

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
