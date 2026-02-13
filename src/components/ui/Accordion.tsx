import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map(item => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`rounded-xl border transition-all duration-300 ${
              isOpen
                ? 'border-chocolate/20 shadow-warm bg-parchment'
                : 'border-chocolate-100/30 bg-parchment/50 hover:border-chocolate-100/60'
            }`}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className={`font-display text-base font-semibold transition-colors ${isOpen ? 'text-chocolate' : 'text-ink'}`}>
                {item.title}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-chocolate-light transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-5 text-sm text-ink-light leading-relaxed">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
