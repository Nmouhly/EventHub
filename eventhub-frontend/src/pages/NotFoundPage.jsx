import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
export default function NotFoundPage() {
  return (
    <EmptyState
      title="404 · This page is off the guest list."
      description="The page you’re looking for doesn’t exist."
    >
      <Link className="button primary" to="/dashboard">
        Back to overview
      </Link>
    </EmptyState>
  );
}
