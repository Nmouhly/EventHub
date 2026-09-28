import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarDays, User, Pencil, Plus } from 'lucide-react';
import { getEventById, updateEventStatus } from '../api/eventsApi';
import { getRegistrations } from '../api/registrationsApi';
import { listData } from '../api/axios';
import useResource from '../hooks/useResource';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Capacity from '../components/common/Capacity';
import StatusBadge from '../components/common/StatusBadge';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RegistrationTable from '../components/registrations/RegistrationTable';
import { EVENT_STATUS, REGISTRATION_STATUS } from '../utils/constants';
import { formatDate, formatTime } from '../utils/date';
export default function EventDetailsPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('');
  const [publish, setPublish] = useState(false);
  const [cancel, setCancel] = useState(false);
  const eventResource = useResource(() => getEventById(id), [id]);
  const registrations = useResource(() => getRegistrations({ eventId: id, status }), [id, status]);
  const event = eventResource.data;
  function refresh() {
    eventResource.refresh();
    registrations.refresh();
  }
  return (
    <>
      <Link className="back-link" to="/events">
        <ArrowLeft size={15} />
        Back to events
      </Link>
      <ResourceState resource={eventResource}>
        {event && (
          <>
            <PageHeader
              eyebrow="EVENT DETAILS"
              title={event.title}
              description="Everything you need for a great experience."
            >
              <Link className="button secondary" to={`/events/${id}/edit`}>
                <Pencil size={16} />
                Edit event
              </Link>
              {event.status === EVENT_STATUS.DRAFT && (
                <Button onClick={() => setPublish(true)}>Publish event</Button>
              )}
              {event.status !== EVENT_STATUS.CANCELLED && (
                <Button variant="secondary" onClick={() => setCancel(true)}>
                  Cancel event
                </Button>
              )}
            </PageHeader>
            <div className="details-grid">
              <section className="panel detail-content">
                <StatusBadge status={event.status} />
                <h2>About this event</h2>
                <p className="description">{event.description}</p>
                <div className="detail-meta">
                  <span>
                    <MapPin size={18} />
                    {event.location}
                  </span>
                  <span>
                    <CalendarDays size={18} />
                    {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
                  </span>
                  <span>
                    <User size={18} />
                    Created by {event.createdBy?.name || event.createdBy?.email || 'your team'}
                  </span>
                </div>
              </section>
              <section className="panel detail-content">
                <span className="eyebrow">BRINGING PEOPLE TOGETHER</span>
                <h2>Event capacity</h2>
                <Capacity event={event} detailed />
                <p className="muted">
                  {Math.max(0, event.maxParticipants - (event.registeredParticipants || 0))} places
                  available
                </p>
                <Link className="button primary" to={`/registrations/new?eventId=${id}`}>
                  <Plus size={16} />
                  Add participant
                </Link>
              </section>
            </div>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Registrations</h2>
                  <p>The people who make your event.</p>
                </div>
                <Select
                  aria-label="Registration status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {Object.values(REGISTRATION_STATUS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <ResourceState resource={registrations}>
                <RegistrationTable
                  eventView
                  registrations={listData(registrations.data)}
                  onUpdate={refresh}
                />
              </ResourceState>
            </section>
            {publish && (
              <ConfirmDialog
                title="Publish this event?"
                description="Participants will be able to register for this event."
                onClose={() => setPublish(false)}
                onConfirm={async () => {
                  await updateEventStatus(id, EVENT_STATUS.PUBLISHED);
                  refresh();
                }}
              />
            )}
            {cancel && (
              <ConfirmDialog
                title="Cancel this event?"
                description="This permanently cancels the event and all of its registrations."
                onClose={() => setCancel(false)}
                onConfirm={async () => {
                  await updateEventStatus(id, EVENT_STATUS.CANCELLED);
                  refresh();
                }}
              />
            )}
          </>
        )}
      </ResourceState>
    </>
  );
}
