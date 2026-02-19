import { BookOpen } from 'lucide-react';

interface CourseImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function CourseImage({ src, alt, className = '' }: CourseImageProps) {
  if (src) {
    return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />;
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br from-chocolate-50 to-cream-dark flex flex-col items-center justify-center gap-2 ${className}`}>
      <BookOpen className="w-10 h-10 text-chocolate/30" />
      <span className="text-xs text-chocolate/40 font-medium">Sin imagen</span>
    </div>
  );
}
