import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronUp } from 'lucide-react';
import type { UserRole } from '@/types';

const roles: { value: UserRole; label: string; color: string; redirect: string }[] = [
  { value: 'visitor', label: 'Visitante', color: 'bg-ink-light', redirect: '/' },
  { value: 'student', label: 'Estudiante', color: 'bg-chocolate', redirect: '/mi-panel' },
  { value: 'teacher', label: 'Docente', color: 'bg-gold', redirect: '/admin/panel' },
];

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { role, setRole } = useAuth();
  const navigate = useNavigate();

  const currentRole = roles.find(r => r.value === role)!;

  const handleSelect = (r: typeof roles[number]) => {
    setRole(r.value);
    setOpen(false);
    navigate(r.redirect);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print">
      {/* Expanded options */}
      {open && (
        <div className="mb-2 bg-ink rounded-xl shadow-warm-lg overflow-hidden animate-fade-in-up">
          {roles.map(r => (
            <button
              key={r.value}
              onClick={() => handleSelect(r)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                r.value === role
                  ? 'bg-cream-dark/10 text-cream'
                  : 'text-cream-dark/70 hover:bg-cream-dark/5 hover:text-cream'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-ink text-cream rounded-full shadow-warm-lg hover:bg-ink/90 transition-all text-sm font-medium"
      >
        <Users className="w-4 h-4" />
        <span className={`w-2 h-2 rounded-full ${currentRole.color}`} />
        {currentRole.label}
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}
