import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function StarRating({ rating, max = 5, size = 'md', showValue = false }: StarRatingProps) {
  const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-5.5 h-5.5' };
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <div key={i} className="relative">
            <Star className={`${sizeMap[size]} text-chocolate-100`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${sizeMap[size]} text-gold fill-gold`} />
            </div>
          </div>
        );
      })}
      {showValue && (
        <span className={`${textSize[size]} font-semibold text-ink ml-1`}>{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
