import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
export default function UnauthorizedPage() {
  return (
    <EmptyState
      title="Accès non autorisé"
      description="Your account does not have permission to access this page."
    >
      <Link className="button primary" to="/dashboard">
        Back to overview
      </Link>
    </EmptyState>
  );
}
