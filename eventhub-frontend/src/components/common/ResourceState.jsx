import Loader from './Loader';
import Button from './Button';
import { errorMessage } from '../../api/axios';
export default function ResourceState({ resource, children }) {
  if (resource.loading) return <Loader />;
  if (resource.error)
    return (
      <div className="error-state" role="alert">
        <h3>We couldn’t load this information</h3>
        <p>{errorMessage(resource.error)}</p>
        <Button variant="secondary" onClick={resource.refresh}>
          Try again
        </Button>
      </div>
    );
  return children;
}
