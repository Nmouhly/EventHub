import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { getEvents } from '../api/eventsApi';
import { getParticipants } from '../api/participantsApi';
import { createRegistration } from '../api/registrationsApi';
import { listData, errorMessage } from '../api/axios';
import useResource from '../hooks/useResource';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { EVENT_STATUS } from '../utils/constants';
import { formatDate } from '../utils/date';
export default function NewRegistrationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState(params.get('eventId') || '');
  const [participantId, setParticipantId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const resource = useResource(async () => {
    const [events, participants] = await Promise.all([
      getEvents({ status: EVENT_STATUS.PUBLISHED }),
      getParticipants(),
    ]);
    return {
      events: listData(events).filter(
        (e) =>
          e.status === EVENT_STATUS.PUBLISHED &&
          new Date(e.eventDate) >= new Date() &&
          e.registeredParticipants < e.maxParticipants,
      ),
      participants: listData(participants),
    };
  });
  const selected = resource.data?.events.find((e) => String(e.id) === eventId);
  async function submit(e) {
    e.preventDefault();
    if (!selected || !participantId) {
      setError('Please select an available event and a participant.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createRegistration({ eventId, participantId });
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/registrations">
        <ArrowLeft size={15} />
        Back to registrations
      </Link>
      <PageHeader
        title="New registration"
        description="Bring one more person into the experience."
      />
      <ResourceState resource={resource}>
        {resource.data && (
          <form className="panel form-panel" onSubmit={submit}>
            <div className="section-heading">
              <div>
                <h2>Make a connection</h2>
                <p>Choose an event and the person joining it.</p>
              </div>
              <Ticket size={25} />
            </div>
            <div className="form-body">
              {!resource.data.events.length ? (
                <EmptyState
                  title="No available events."
                  description="Publish an upcoming event with available capacity to accept registrations."
                >
                  <Link className="text-link" to="/events">
                    Manage events
                  </Link>
                </EmptyState>
              ) : (
                <>
                  <Select
                    label="Event"
                    required
                    value={selected ? eventId : ''}
                    onChange={(e) => setEventId(e.target.value)}
                  >
                    <option value="">Select an event</option>
                    {resource.data.events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} · {formatDate(event.eventDate)} ·{' '}
                        {event.maxParticipants - event.registeredParticipants} places available
                      </option>
                    ))}
                  </Select>
                  {selected && (
                    <div className="selection-summary">
                      <strong>{selected.title}</strong>
                      <span>
                        {selected.location} · {formatDate(selected.eventDate)}
                      </span>
                      <small>
                        {selected.maxParticipants - selected.registeredParticipants} places
                        available
                      </small>
                    </div>
                  )}
                </>
              )}
              {!resource.data.participants.length ? (
                <EmptyState
                  title="No participants yet."
                  description="Add a participant before creating a registration."
                >
                  <Link className="text-link" to="/participants">
                    Add a participant
                  </Link>
                </EmptyState>
              ) : (
                <Select
                  label="Participant"
                  required
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                >
                  <option value="">Select a participant</option>
                  {resource.data.participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} · {p.email}
                    </option>
                  ))}
                </Select>
              )}
              {error && (
                <p className="alert" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <Link className="button secondary" to="/registrations">
                  Cancel
                </Link>
                <Button disabled={busy || !selected || !participantId}>
                  {busy ? 'Registering…' : 'Register participant'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </ResourceState>
    </>
  );
}
