import { useState } from 'react';
import { getUsers } from '../api/usersApi';
import { listData } from '../api/axios';
import useResource from '../hooks/useResource';
import useDebounce from '../hooks/useDebounce';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import UserForm from '../components/users/UserForm';
export default function UsersPage() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const resource = useResource(() => getUsers({ search: query, page, limit: 8 }), [query, page]);
  const rows = listData(resource.data);
  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Operators"
        description="Manage your internal team and their access."
      >
        <Button onClick={() => setEditing({})}>Add operator</Button>
      </PageHeader>
      <section className="panel">
        <div className="filter-bar">
          <Input
            aria-label="Search operators"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <ResourceState resource={resource}>
          {rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((operator) => (
                    <tr key={operator.id}>
                      <td>{operator.fullName}</td>
                      <td>{operator.email}</td>
                      <td>{operator.role}</td>
                      <td>{operator.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setEditing(operator)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No operators found." />
          )}
          <Pagination page={page} total={resource.data?.total || 0} onChange={setPage} />
        </ResourceState>
      </section>
      {editing && (
        <UserForm operator={editing} onClose={() => setEditing(null)} onSaved={resource.refresh} />
      )}
    </>
  );
}
