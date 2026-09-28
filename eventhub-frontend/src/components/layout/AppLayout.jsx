import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main-shell">
        <Navbar onMenu={() => setOpen(true)} />
        <main id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
