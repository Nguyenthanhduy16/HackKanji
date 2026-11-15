import {Skeleton} from '@/components/ui';
export default function Loading(){return <div className="space-y-6" aria-busy="true"><Skeleton className="h-9 w-60"/><Skeleton className="h-5 w-80 max-w-full"/><Skeleton className="h-48 w-full"/><Skeleton className="h-28 w-full"/><div className="grid grid-cols-1 gap-5 md:grid-cols-3">{[1,2,3].map(i=><Skeleton key={i} className="h-56"/>)}</div></div>;}
