import { cn } from "@/lib/utils"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Gelişmiş animasyonlar ve daha estetik görüntüye sahip iskelet bileşeni
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/10 dark:bg-primary/5",
        className
      )}
      {...props}
    />
  )
}

// Text skeleton for smaller text with variants
export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  width?: 'full' | 'sm' | 'md' | 'lg' | string;
  height?: 'xs' | 'sm' | 'md' | 'lg' | string;
}

export function SkeletonText({ 
  lines = 1, 
  width = 'full', 
  height = 'md',
  className,
  ...props 
}: SkeletonTextProps) {
  const getWidth = () => {
    if (width === 'full') return 'w-full';
    if (width === 'sm') return 'w-24';
    if (width === 'md') return 'w-40';
    if (width === 'lg') return 'w-60';
    return width; // custom width
  };
  
  const getHeight = () => {
    if (height === 'xs') return 'h-3';
    if (height === 'sm') return 'h-4';
    if (height === 'md') return 'h-5';
    if (height === 'lg') return 'h-6';
    return height; // custom height
  };
  
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            getHeight(),
            getWidth(),
            // Vary the width slightly for multi-line text
            lines > 1 && i === lines - 1 && "w-[85%]",
            lines > 1 && i === lines - 2 && i !== 0 && "w-[92%]"
          )}
        />
      ))}
    </div>
  );
}

// Table skeleton with header and rows
export function TableSkeleton({ 
  rows = 5, 
  columns = 5,
  showHeader = true,
  withCheckbox = true,
  className
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  withCheckbox?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full border border-border rounded-lg overflow-hidden", className)}>
      <Table>
        {showHeader && (
          <TableHeader className="bg-muted/30">
            <TableRow>
              {withCheckbox && (
                <TableHead className="w-[50px]">
                  <Skeleton className="h-5 w-5 rounded-md" />
                </TableHead>
              )}
              
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className={i === 0 ? 'w-[80px]' : ''}>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {withCheckbox && (
                <TableCell>
                  <Skeleton className="h-5 w-5 rounded-md" />
                </TableCell>
              )}
              
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {colIndex === 0 && (
                    <Skeleton className="h-5 w-16" />
                  )}
                  {colIndex === 1 && (
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  )}
                  {colIndex === 2 && (
                    <div className="space-y-1 max-w-[300px]">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-[80%]" />
                    </div>
                  )}
                  {colIndex === 3 && (
                    <div className="flex justify-center">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  )}
                  {colIndex === 4 && (
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Kelime kartları için iskelet bileşeni
export function WordCardSkeleton() {
  return (
    <div className="w-full mx-auto h-[360px] p-4 border border-border rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-10 w-40 mb-4 mx-auto" />
      <Skeleton className="h-4 w-24 mb-2 mx-auto" />
      <Skeleton className="h-0.5 w-full my-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-[90%] mb-2" />
      <Skeleton className="h-5 w-[80%] mb-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-[85%] mb-6" />
      <div className="mt-auto">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  )
}

// Kelime listesi için iskelet bileşeni
export function WordListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center p-3 border border-border rounded-lg">
          <div className="flex-1">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Konu listesi için iskelet bileşeni
export function TopicListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 w-full rounded-lg border p-3">
      <Skeleton className="h-7 w-40 mb-3" />
      <Skeleton className="h-4 w-full mb-4" />
      
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex p-2 rounded-md hover:bg-accent/50">
            <Skeleton className="h-8 w-8 rounded-full mr-3" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// İçerik görüntüleyici için iskelet bileşeni
export function ContentViewerSkeleton() {
  return (
    <div className="p-4 rounded-lg border">
      <Skeleton className="h-8 w-60 mb-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-[95%] mb-2" />
      <Skeleton className="h-5 w-[90%] mb-4" />
      
      <div className="my-6">
        <Skeleton className="h-28 w-full mb-4 rounded-md" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-[92%] mb-2" />
        <Skeleton className="h-5 w-[88%] mb-6" />
      </div>
      
      <div className="my-6">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-[94%] mb-2" />
        <Skeleton className="h-5 w-[89%] mb-6" />
      </div>
      
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}