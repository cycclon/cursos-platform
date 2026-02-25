import { useQuery } from '@tanstack/react-query';
import { teacherService } from '@/services/teacher';
import { CheckCircle2, BookOpen, Scale, GraduationCap } from 'lucide-react';

export default function About() {
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher'],
    queryFn: teacherService.getTeacher,
  });

  if (isLoading || !teacher) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <div className="aspect-[3/4] bg-parchment rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="h-8 bg-parchment rounded animate-pulse w-1/3" />
            <div className="h-4 bg-parchment rounded animate-pulse" />
            <div className="h-4 bg-parchment rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Conocé a tu docente</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2">
            Sobre Mí
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Photo side */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="relative rounded-2xl overflow-hidden shadow-warm-lg">
                <img
                  src="/aboutme.jpeg"
                  alt={teacher.name}
                  className="w-full aspect-[3/5] object-cover object-[center_15%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-display text-2xl font-bold text-cream">{teacher.name}</p>
                  <p className="text-sm text-cream-dark/80">{teacher.title}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Scale, label: 'Años en la justicia', value: '+15' },
                  { icon: BookOpen, label: 'Publicaciones', value: '+30' },
                  { icon: GraduationCap, label: 'Alumnos formados', value: '+800' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-parchment rounded-xl p-4 text-center border border-chocolate-100/20 shadow-warm">
                      <Icon className="w-5 h-5 mx-auto mb-2 text-gold" />
                      <p className="font-display text-xl font-bold text-ink">{stat.value}</p>
                      <p className="text-[10px] text-ink-light mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bio side */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Mi Trayectoria</h2>
              <div className="mt-6 space-y-4">
                {teacher.bio.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-ink-light leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Credenciales</h2>
              <ul className="mt-6 space-y-3">
                {teacher.credentials.map((cred, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span className="text-ink-light">{cred}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Welcome video */}
            {teacher.videoUrl && (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Mensaje de bienvenida</h2>
                <div className="mt-6 aspect-video rounded-xl overflow-hidden border border-chocolate-100/20">
                  <video
                    src={teacher.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster=""
                  />
                </div>
              </div>
            )}

            {/* Philosophy */}
            <div className="bg-chocolate-50 rounded-2xl p-8 border border-chocolate-100/30">
              <p className="font-display text-xl italic text-ink leading-relaxed text-balance">
                &ldquo;La verdadera formación jurídica no se limita a memorizar normas, sino a comprender los principios que les dan sentido y saber aplicarlos con criterio en cada caso concreto.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-0.5 h-8 bg-gold" />
                <div>
                  <p className="text-sm font-semibold text-chocolate">{teacher.name}</p>
                  <p className="text-xs text-ink-light">{teacher.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
