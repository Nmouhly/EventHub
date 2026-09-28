import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';
import { updateRegistrationStatus } from '../../api/registrationsApi';
import { REGISTRATION_STATUS as STATUS, EVENT_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/date';
export default function RegistrationTable({ registrations, onUpdate, eventView = false }) {
  const [change, setChange] = useState(null);
  return (
    <>
      {registrations.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>{eventView ? 'Email' : 'Event'}</th>
                <th>Status</th>
                <th>Registered at</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="person-cell">
                      <span className="avatar small" aria-hidden="true">
                        {(row.participant?.fullName || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <strong>{row.participant?.fullName || 'Unknown participant'}</strong>
                    </div>
                  </td>
                  <td>
                    {eventView ? (
                      row.participant?.email
                    ) : (
                      <Link to={`/events/${row.eventId}`}>{row.event?.title || 'View event'}</Link>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {row.status === STATUS.PENDING && (
                        <button onClick={() => setChange({ row, status: STATUS.CONFIRMED })}>
                          Confirm
                        </button>
                      )}
                      {[STATUS.PENDING, STATUS.CONFIRMED].includes(row.status) && (
                        <button
                          className="danger-text"
                          onClick={() => setChange({ row, status: STATUS.CANCELLED })}
                        >
                          Cancel
                        </button>
                      )}
                      {row.status === STATUS.CANCELLED &&
                        row.event?.status === EVENT_STATUS.PUBLISHED && (
                          <button onClick={() => setChange({ row, status: STATUS.PENDING })}>
                            Reactivate
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No registrations found." />
      )}
      {change && (
        <ConfirmDialog
          title={
            change.status === STATUS.CANCELLED
              ? 'Cancel registration?'
              : change.status === STATUS.PENDING
                ? 'Reactivate registration?'
                : 'Confirm registration?'
          }
          description={`Update the registration for ${change.row.participant?.fullName} to ${change.status}.`}
          onClose={() => setChange(null)}
          onConfirm={async () => {
            await updateRegistrationStatus(change.row.id, change.status);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
