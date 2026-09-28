import { NavLink, Link } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Ticket,
  LogOut,
  ArrowUpRight,
  X,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
export const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/participants', label: 'Participants', icon: Users },
  { to: '/registrations', label: 'Registrations', icon: Ticket },
  { to: '/users', label: 'Operators', icon: Users, adminOnly: true },
];
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">
            <CalendarDays size={23} />
          </span>
          eventhub<span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navItems
            .filter((item) => !item.adminOnly || user?.role?.toUpperCase() === 'ADMIN')
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} />
                {label}
                {label === 'Overview' && <span className="nav-dot" />}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✧</span>
            <h3>Make every event count.</h3>
            <p>Great experiences start with a little organisation.</p>
            <Link to="/events/new" onClick={onClose}>
              Create an event <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="user-profile">
            <span className="avatar">
              {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name || user?.email}</strong>
              <small>{user?.role?.toUpperCase()}</small>
            </div>
            <button className="icon-button" aria-label="Log out" title="Log out" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
