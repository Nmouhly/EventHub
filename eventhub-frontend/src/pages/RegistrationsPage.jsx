import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getRegistrations } from '../api/registrationsApi';
import { getEvents } from '../api/eventsApi';
import { listData } from '../api/axios';
import useResource from '../hooks/useResource';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import RegistrationTable from '../components/registrations/RegistrationTable';
import { REGISTRATION_STATUS } from '../utils/constants';
export default function RegistrationsPage() {
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const events = useResource(getEvents);
  const resource = useResource(
    () => getRegistrations({ eventId, status, page, limit: 8 }),
    [eventId, status, page],
  );
  const raw = listData(resource.data);
  const paginated = !Array.isArray(resource.data) && Number.isFinite(resource.data?.total);
  return (
    <>
      <PageHeader
        eyebrow="A PLACE FOR EVERY PARTICIPANT"
        title="Registrations"
        description="Keep track of every connection, from invitation to confirmation."
      >
        <Link className="button primary" to="/registrations/new">
          <Plus size={17} />
          New registration
        </Link>
      </PageHeader>
      <section className="panel">
        <div className="filter-bar">
          <ResourceState resource={events}>
            <Select
              aria-label="Filter by event"
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All events</option>
              {listData(events.data).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>
          </ResourceState>
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.values(REGISTRATION_STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <ResourceState resource={resource}>
          <RegistrationTable
            registrations={paginated ? raw : raw.slice((page - 1) * 8, page * 8)}
            onUpdate={resource.refresh}
          />
          <Pagination
            page={page}
            total={paginated ? resource.data.total : raw.length}
            onChange={setPage}
          />
        </ResourceState>
      </section>
    </>
  );
}
