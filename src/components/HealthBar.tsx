import { cn } from '@/utils/cn';

interface HealthBarProps {
  current: number;
  max: number;
  temp?: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HealthBar({ 
  current, 
  max, 
  temp = 0, 
  showNumbers = true, 
  size = 'md',
  className 
}: HealthBarProps) {
  const percentage = Math.min(100, (current / max) * 100);
  const tempPercentage = Math.min(100 - percentage, (temp / max) * 100);
  const isLow = percentage <= 25;
  const isCritical = percentage <= 10;
  const isDead = current <= 0;
  
  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };
  
  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'relative w-full rounded-sm overflow-hidden bg-gray-800',
        heights[size],
        isCritical && !isDead && 'animate-critical',
        temp > 0 && 'ring-1 ring-amber-500/50'
      )}>
        {/* Temp HP bar */}
        {temp > 0 && (
          <div 
            className="absolute top-0 h-full bg-amber-500/60 transition-all duration-300"
            style={{ left: `${percentage}%`, width: `${tempPercentage}%` }}
          />
        )}
        
        {/* Main HP bar */}
        <div 
          className={cn(
            'absolute top-0 left-0 h-full transition-all duration-300',
            isDead ? 'bg-gray-600' : 
            isCritical ? 'bg-red-600' : 
            isLow ? 'bg-orange-600' : 
            'bg-gradient-to-r from-red-700 to-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Numbers overlay */}
        {showNumbers && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'font-mono text-xs font-bold text-white drop-shadow-lg',
              size === 'lg' && 'text-sm'
            )}>
              {isDead ? '💀 МЁРТВ' : (
                <>
                  {current}/{max}
                  {temp > 0 && <span className="text-amber-300"> (+{temp})</span>}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
