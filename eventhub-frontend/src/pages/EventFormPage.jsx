import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { getEventById, createEvent, updateEvent } from '../api/eventsApi';
import useResource from '../hooks/useResource';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { validateEvent } from '../utils/validation';
import { errorMessage } from '../api/axios';
import { toLocalInput } from '../utils/date';
function EventForm({ initial, id }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description || '',
          location: initial.location,
          eventDate: toLocalInput(initial.eventDate),
          maxParticipants: initial.maxParticipants,
        }
      : { title: '', description: '', location: '', eventDate: '', maxParticipants: '' },
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (name) => ({
    value: values[name],
    onChange: (e) => setValues({ ...values, [name]: e.target.value }),
    error: errors[name],
  });
  async function submit(e) {
    e.preventDefault();
    const validation = validateEvent(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...values,
        maxParticipants: Number(values.maxParticipants),
        eventDate: new Date(values.eventDate).toISOString(),
      };
      const result = id ? await updateEvent(id, payload) : await createEvent(payload);
      navigate(`/events/${result.id || id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel form-panel" onSubmit={submit} noValidate>
      <div className="section-heading">
        <div>
          <h2>Event information</h2>
          <p>The details that bring your event to life.</p>
        </div>
      </div>
      <div className="form-body">
        <Input
          label="Event title"
          placeholder="Give your event a name"
          {...bind('title')}
          required
        />
        <div className="field">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            rows="5"
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            aria-invalid={Boolean(errors.description)}
            placeholder="What can participants look forward to?"
          />
          {errors.description && <small className="field-error">{errors.description}</small>}
        </div>
        <Input
          label="Location"
          placeholder="Venue or online meeting location"
          {...bind('location')}
          required
        />
        <div className="form-grid">
          <Input label="Event date & time" type="datetime-local" {...bind('eventDate')} required />
          <Input
            label="Maximum participants"
            type="number"
            min="1"
            step="1"
            placeholder="50"
            {...bind('maxParticipants')}
            required
          />
        </div>
        {!id && (
          <p className="form-hint">
            Your event will be saved as a draft. Publish it when you’re ready to welcome
            participants.
          </p>
        )}
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <Link className="button secondary" to={id ? `/events/${id}` : '/events'}>
            Cancel
          </Link>
          <Button disabled={busy} type="submit">
            <Save size={16} />
            {busy ? 'Saving…' : 'Save event'}
          </Button>
        </div>
      </div>
    </form>
  );
}
export default function EventFormPage() {
  const { id } = useParams();
  const resource = useResource(() => (id ? getEventById(id) : Promise.resolve(null)), [id]);
  return (
    <>
      <Link className="back-link" to="/events">
        <ArrowLeft size={15} />
        Back to events
      </Link>
      <PageHeader
        title={id ? 'Edit event' : 'Create an event'}
        description="A few details. A world of possibilities."
      />
      <ResourceState resource={resource}>
        <EventForm key={id || 'new'} id={id} initial={resource.data} />
      </ResourceState>
    </>
  );
}
