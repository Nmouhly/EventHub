import { Menu, ChevronRight, CircleHelp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DEMO } from '../../utils/constants';
import { useState } from 'react';
import Modal from '../common/Modal';
export default function Navbar({ onMenu }) {
  const { pathname } = useLocation();
  const [help, setHelp] = useState(false);
  return (
    <header className="navbar">
      <div className="breadcrumb">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation">
          <Menu />
        </button>
        <span>Workspace</span>
        <ChevronRight size={14} />
        <strong>
          {pathname.split('/')[1] === 'dashboard' ? 'Overview' : pathname.split('/')[1]}
        </strong>
      </div>
      <div className="navbar-right">
        {DEMO && <span className="demo-label">Demo workspace</span>}
        <span className="workspace-status">
          <i /> All in one place
        </span>
        <button className="icon-button" onClick={() => setHelp(true)} aria-label="Workspace guide">
          <CircleHelp size={19} />
        </button>
      </div>
      {help && (
        <Modal title="Your workspace, simply explained" onClose={() => setHelp(false)}>
          <p>
            Create an event and publish it when the details are ready. Add people to Participants,
            then connect them to a published event through Registrations.
          </p>
          <p>
            Confirm pending registrations or cancel confirmed ones from the event details or the
            Registrations page. Your overview keeps track of the bigger picture.
          </p>
        </Modal>
      )}
    </header>
  );
}
