import { cn } from '@/utils/cn';

interface ManaBarProps {
  current: number;
  max: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ManaBar({ 
  current, 
  max, 
  showNumbers = true, 
  size = 'md',
  className 
}: ManaBarProps) {
  const percentage = Math.min(100, (current / max) * 100);
  const isEmpty = current <= 0;
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };
  
  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'relative w-full rounded-sm overflow-hidden bg-gray-800',
        heights[size],
      )}>
        <div 
          className={cn(
            'absolute top-0 left-0 h-full transition-all duration-300',
            isEmpty ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-700 to-blue-400'
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {showNumbers && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'font-mono text-xs font-bold text-white drop-shadow-lg',
              size === 'lg' && 'text-sm'
            )}>
              {current}/{max}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
