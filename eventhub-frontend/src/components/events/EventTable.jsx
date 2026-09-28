import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Capacity from '../common/Capacity';
import EmptyState from '../common/EmptyState';
import { formatDate, formatTime } from '../../utils/date';
import { EVENT_STATUS } from '../../utils/constants';
export default function EventTable({ events, onPublish, compact = false }) {
  if (!events.length) return <EmptyState title="No events found." />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Event name</th>
            <th>Date & time</th>
            <th>Capacity</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={event.id}>
              <td>
                <div className="event-cell">
                  <div className={`event-tile tile-${i % 4}`}>
                    <span>{event.title.slice(0, 1)}</span>
                  </div>
                  <div>
                    <Link className="table-title" to={`/events/${event.id}`}>
                      {event.title}
                    </Link>
                    <small>
                      <MapPin size={12} />
                      {event.location}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                {formatDate(event.eventDate)}
                <small>{formatTime(event.eventDate)}</small>
              </td>
              <td>
                <Capacity event={event} />
              </td>
              <td>
                <StatusBadge status={event.status} />
              </td>
              <td>
                <div className="row-actions">
                  <Link aria-label={`View ${event.title}`} to={`/events/${event.id}`}>
                    {compact ? <ArrowUpRight size={18} /> : 'View'}
                  </Link>
                  {!compact && <Link to={`/events/${event.id}/edit`}>Edit</Link>}
                  {!compact && event.status === EVENT_STATUS.DRAFT && (
                    <button onClick={() => onPublish(event)}>Publish</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
