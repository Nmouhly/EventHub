import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { getDashboard } from '../api/dashboardApi';
import PageHeader from '../components/common/PageHeader';
import ResourceState from '../components/common/ResourceState';
import Capacity from '../components/common/Capacity';
import EmptyState from '../components/common/EmptyState';
import EventTable from '../components/events/EventTable';
const stats = [
  {
    key: 'totalEvents',
    label: 'Total events',
    note: 'Every experience, in one place',
  },
  {
    key: 'publishedEvents',
    label: 'Published events',
    note: 'Live and ready for participants',
  },
  {
    key: 'todayRegistrations',
    label: 'Today’s registrations',
    note: 'New connections made today',
  },
  {
    key: 'totalParticipants',
    label: 'Total participants',
    note: 'Your growing community',
  },
];
export default function DashboardPage() {
  const { user } = useAuth();
  const resource = useResource(getDashboard);
  const data = resource.data;
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE AT A GLANCE"
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Here’s what’s happening with your events today."
      >
        <Link className="button primary" to="/events/new">
          <Plus size={17} />
          Create event
        </Link>
      </PageHeader>
      <ResourceState resource={resource}>
        {data && (
          <>
            <div className="stats-grid">
              {stats.map(({ key, label, note }) => (
                <section className="stat-card" key={key}>
                  <div className="stat-label">
                    {label}
                  </div>
                  <strong className="stat-number">{(data[key] || 0).toLocaleString()}</strong>
                  <small>{note}</small>
                </section>
              ))}
            </div>
            <div className="dashboard-middle dashboard-middle-simple">
              <section className="panel filled-panel">
                <div className="section-heading">
                  <div>
                    <h2>Popular events</h2>
                    <p>Top 5 most filled events</p>
                  </div>
                </div>
                <div className="popular-list">
                  {data.topEvents?.length ? (
                    data.topEvents.slice(0, 5).map((event, i) => (
                      <div className="popular-row" key={event.id}>
                        <span className="rank">0{i + 1}</span>
                        <div>
                          <Link to={`/events/${event.id}`}>{event.title}</Link>
                          <Capacity event={event} detailed />
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="Your next success starts here." />
                  )}
                </div>
              </section>
            </div>
            <section className="panel upcoming-panel">
              <div className="section-heading">
                <div>
                  <h2>Upcoming events</h2>
                  <p>A look at what’s next on your calendar</p>
                </div>
                <Link className="text-link" to="/events">
                  View all events
                  <ArrowRight size={16} />
                </Link>
              </div>
              <EventTable events={data.upcomingEvents || []} compact />
            </section>
          </>
        )}
      </ResourceState>
    </>
  );
}
