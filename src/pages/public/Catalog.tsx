import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { coursesService } from '@/services/courses';
import CourseCard from '@/components/course/CourseCard';

// Sentinel for the "all categories" chip; category values themselves come
// from the (language-resolved) course data.
const ALL = '__all__';

type SortOrder = 'program' | 'newest' | 'oldest';

export default function Catalog() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  // Default to the curriculum sequence the teacher defined (course `order`); the
  // date-based options stay available as an opt-in re-sort.
  const [sortOrder, setSortOrder] = useState<SortOrder>('program');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const categories = useMemo(() => {
    return [...new Set(courses.map(c => c.category))];
  }, [courses]);

  const filtered = useMemo(() => {
    const result = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.summary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === ALL || c.category === category;
      return matchesSearch && matchesCategory;
    });
    // `filter` already returned a fresh array, so sorting in place doesn't
    // mutate the React Query cache. "Programa" follows the teacher-defined
    // sequence (course `order`, createdAt as tie-break); the other two sort by
    // publish date.
    result.sort((a, b) => {
      if (sortOrder === 'program') {
        return (a.order - b.order) ||
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === 'newest' ? diff : -diff;
    });
    return result;
  }, [courses, search, category, sortOrder]);

  return (
    <div>
      {/* Header */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">{t('catalog.badge')}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            {t('catalog.title')}
          </h1>
          <p className="text-ink-light max-w-xl">
            {t('catalog.subtitle')}
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
              placeholder={t('catalog.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[ALL, ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-chocolate text-cream shadow-warm'
                    : 'bg-parchment text-ink-light border border-chocolate-100/30 hover:border-chocolate/30 hover:text-chocolate'
                }`}
              >
                {cat === ALL ? t('catalog.allCategories') : cat}
              </button>
            ))}
          </div>

          {/* Sort by publish date */}
          <div className="flex items-center gap-3 sm:ml-auto shrink-0">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-light">
              {t('catalog.sortLabel')}
            </span>
            <div className="inline-flex rounded-full border border-primary-100/30 bg-surface-raised p-0.5">
              {([
                { value: 'program' as const, label: t('catalog.sortProgram') },
                { value: 'newest' as const, label: t('catalog.sortNewest') },
                { value: 'oldest' as const, label: t('catalog.sortOldest') },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortOrder(opt.value)}
                  aria-pressed={sortOrder === opt.value}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    sortOrder === opt.value
                      ? 'bg-primary text-surface shadow-warm'
                      : 'text-ink-light hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-parchment rounded-xl overflow-hidden">
                <div className="aspect-[16/10] bg-chocolate-50 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-chocolate-50 rounded animate-pulse w-1/4" />
                  <div className="h-5 bg-chocolate-50 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-chocolate-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-ink-light text-lg">{t('catalog.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
