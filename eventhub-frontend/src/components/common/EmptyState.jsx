import { CalendarDays } from 'lucide-react';
export default function EmptyState({
  title = 'Nothing here yet.',
  description = 'Try adjusting your filters or create your first item.',
  children,
}) {
  return (
    <div className="empty">
      <CalendarDays size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
