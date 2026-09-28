import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import EventsPage from '../pages/EventsPage';
import EventFormPage from '../pages/EventFormPage';
import EventDetailsPage from '../pages/EventDetailsPage';
import ParticipantsPage from '../pages/ParticipantsPage';
import RegistrationsPage from '../pages/RegistrationsPage';
import NewRegistrationPage from '../pages/NewRegistrationPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import UsersPage from '../pages/UsersPage';
import PublicEventsPage from '../pages/PublicEventsPage';
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicEventsPage />} />
      <Route path="/public/events" element={<PublicEventsPage />} />
      <Route path="/public/events/:id" element={<PublicEventsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN', 'STAFF']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventFormPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/edit" element={<EventFormPage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/registrations" element={<RegistrationsPage />} />
            <Route path="/registrations/new" element={<NewRegistrationPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
