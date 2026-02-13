import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { courses, getCategories } from '@/data/mock';
import CourseCard from '@/components/course/CourseCard';

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const categories = ['Todos', ...getCategories()];

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.summary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Todos' || c.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div>
      {/* Header */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Catálogo</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Nuestros Cursos
          </h1>
          <p className="text-ink-light max-w-xl">
            Explorá nuestra oferta de cursos jurídicos y encontrá el que mejor se adapte a tus necesidades profesionales.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-light" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-chocolate text-cream shadow-warm'
                    : 'bg-parchment text-ink-light border border-chocolate-100/30 hover:border-chocolate/30 hover:text-chocolate'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-ink-light text-lg">No se encontraron cursos con esos criterios.</p>
          </div>
        )}
      </div>
    </div>
  );
}
