import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { getEvents, updateEventStatus } from '../api/eventsApi';
import { listData } from '../api/axios';
import useResource from '../hooks/useResource';
import useDebounce from '../hooks/useDebounce';
import PageHeader from '../components/common/PageHeader';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import ResourceState from '../components/common/ResourceState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EventTable from '../components/events/EventTable';
import { EVENT_STATUS } from '../utils/constants';
export default function EventsPage() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [publish, setPublish] = useState(null);
  const resource = useResource(
    () => getEvents({ search: query, status, date, page, limit: 8 }),
    [query, status, date, page],
  );
  const raw = listData(resource.data);
  const paginated = !Array.isArray(resource.data) && Number.isFinite(resource.data?.total);
  const rows = paginated ? raw : raw.slice((page - 1) * 8, page * 8);
  return (
    <>
      <PageHeader
        eyebrow="PLAN. CONNECT. CELEBRATE."
        title="Events"
        description="Meaningful experiences start with a good plan."
      >
        <Link className="button primary" to="/events/new">
          <Plus size={17} />
          Create event
        </Link>
      </PageHeader>
      <section className="panel">
        <div className="filter-bar">
          <div className="search-field">
            <Search size={17} />
            <Input
              aria-label="Search events"
              placeholder="Search events…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.values(EVENT_STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Filter by date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <ResourceState resource={resource}>
          <EventTable events={rows} onPublish={setPublish} />
          <Pagination
            page={page}
            total={paginated ? resource.data.total : raw.length}
            onChange={setPage}
          />
        </ResourceState>
      </section>
      {publish && (
        <ConfirmDialog
          title="Publish this event?"
          description={`“${publish.title}” will become available for registrations.`}
          onClose={() => setPublish(null)}
          onConfirm={async () => {
            await updateEventStatus(publish.id, EVENT_STATUS.PUBLISHED);
            resource.refresh();
          }}
        />
      )}
    </>
  );
}
