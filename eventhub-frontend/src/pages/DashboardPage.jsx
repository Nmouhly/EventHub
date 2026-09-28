import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Radio,
  Ticket,
  Users,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
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
    icon: CalendarDays,
    note: 'Every experience, in one place',
    color: 'sage',
  },
  {
    key: 'publishedEvents',
    label: 'Published events',
    icon: Radio,
    note: 'Live and ready for participants',
    color: 'blue',
  },
  {
    key: 'todayRegistrations',
    label: 'Today’s registrations',
    icon: Ticket,
    note: 'New connections made today',
    color: 'orange',
  },
  {
    key: 'totalParticipants',
    label: 'Total participants',
    icon: Users,
    note: 'Your growing community',
    color: 'purple',
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
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋`}
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
              {stats.map(({ key, label, icon: Icon, note, color }) => (
                <section className="stat-card" key={key}>
                  <div className="stat-label">
                    {label}
                    <span className={`stat-icon ${color}`}>
                      <Icon size={19} />
                    </span>
                  </div>
                  <strong className="stat-number">{(data[key] || 0).toLocaleString()}</strong>
                  <small>{note}</small>
                </section>
              ))}
            </div>
            <div className="dashboard-middle">
              <section className="panel filled-panel">
                <div className="section-heading">
                  <div>
                    <h2>Popular events</h2>
                    <p>Top 5 most filled events</p>
                  </div>
                  <span className="subtle-icon">
                    <Ticket size={20} />
                  </span>
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
              <section className="feature-card">
                <div className="feature-top">
                  <span className="feature-label">
                    <span /> BUILT FOR CONNECTION
                  </span>
                  <Sparkles size={21} />
                </div>
                <h2>
                  Good plans.
                  <br />
                  Great experiences.
                </h2>
                <p>From the first invitation to the final applause. Keep every detail together.</p>
                <Link to="/events/new" className="feature-link">
                  Plan your next event <ArrowUpRight size={18} />
                </Link>
                <div className="abstract-art" aria-hidden="true">
                  <div className="art-ring ring-one" />
                  <div className="art-ring ring-two" />
                  <div className="art-ticket">
                    <Ticket size={28} />
                    <span>YOU’RE INVITED</span>
                    <i />
                  </div>
                  <div className="art-star">✳</div>
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
            <div className="dashboard-bottom">
              <span>
                <span className="green-dot" /> You’re all set. Let’s make something memorable.
              </span>
              <span>Made for people who bring people together.</span>
            </div>
          </>
        )}
      </ResourceState>
    </>
  );
}
