import { useState } from 'react';
import { Plus, Search, Pencil } from 'lucide-react';
import { getParticipants, deleteParticipant } from '../api/participantsApi';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { listData } from '../api/axios';
import useResource from '../hooks/useResource';
import useDebounce from '../hooks/useDebounce';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import ParticipantForm from '../components/participants/ParticipantForm';
import { formatDate } from '../utils/date';
export default function ParticipantsPage() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const resource = useResource(
    () => getParticipants({ search: query, page, limit: 8 }),
    [query, page],
  );
  const raw = listData(resource.data);
  const paginated = !Array.isArray(resource.data) && Number.isFinite(resource.data?.total);
  const rows = paginated ? raw : raw.slice((page - 1) * 8, page * 8);
  return (
    <>
      <PageHeader
        eyebrow="PEOPLE MAKE IT POSSIBLE"
        title="Participants"
        description="Your community, thoughtfully organised."
      >
        <Button onClick={() => setEditing({})}>
          <Plus size={17} />
          Add participant
        </Button>
      </PageHeader>
      <section className="panel">
        <div className="filter-bar">
          <div className="search-field">
            <Search size={17} />
            <Input
              aria-label="Search participants"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <ResourceState resource={resource}>
          {rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Created at</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="person-cell">
                          <span className="avatar small" aria-hidden="true">
                            {p.fullName.slice(0, 2).toUpperCase()}
                          </span>
                          <strong>{p.fullName}</strong>
                        </div>
                      </td>
                      <td>{p.email}</td>
                      <td>{p.phone || '—'}</td>
                      <td>{formatDate(p.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setEditing(p)}>
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button className="danger-text" onClick={() => setDeleting(p)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No participants found." />
          )}
          <Pagination
            page={page}
            total={paginated ? resource.data.total : raw.length}
            onChange={setPage}
          />
        </ResourceState>
      </section>
      {editing && (
        <ParticipantForm
          participant={editing}
          onClose={() => setEditing(null)}
          onSaved={resource.refresh}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete participant?"
          description={`Permanently delete ${deleting.fullName}? Participants with registrations cannot be deleted.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteParticipant(deleting.id);
            if (rows.length === 1 && page > 1) setPage(page - 1);
            else resource.refresh();
          }}
        />
      )}
    </>
  );
}
