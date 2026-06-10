import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { captureContext } from '@/utils/bugReports';
import type { BugReportContextInput } from '@/types';
import BugReportDrawer from './BugReportDrawer';

/**
 * Small, unobtrusive "Reportar un problema" launcher. Visible only to
 * signed-in users, on every page. Captures page context at the moment it's
 * opened so the form is pre-filled with where the user actually is.
 */
export default function BugReportWidget() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [context, setContext] = useState<BugReportContextInput | null>(null);

  if (!isAuthenticated) return null;

  const open = () => setContext(captureContext(location.pathname));

  return (
    <>
      {!context && (
        <button
          type="button"
          onClick={open}
          title="Reportar un problema"
          aria-label="Reportar un problema"
          className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center rounded-full bg-chocolate text-cream pl-3.5 pr-3.5 py-3.5 shadow-warm-lg border border-cream/10 hover:bg-chocolate-dark hover:pr-5 transition-all duration-300 ease-out"
        >
          <Bug className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
          {/* Label expands from 0 → auto width on hover via the grid-fr trick */}
          <span className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
            <span className="overflow-hidden whitespace-nowrap min-w-0 text-sm font-semibold group-hover:ml-2">
              Reportar un problema
            </span>
          </span>
        </button>
      )}

      {context && (
        <BugReportDrawer context={context} onClose={() => setContext(null)} />
      )}
    </>
  );
}
