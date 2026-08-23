import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'react-hot-toast';
import logoPng from '../../assets/moonlight_logo.png';

function MobileTopbar() {
  return (
    <div className="mobile-topbar">
      <div className="mobile-topbar-brand">
        <img src={logoPng} alt="Moon Light Resort" className="mobile-topbar-logo" />
        <div>
          <div className="mobile-topbar-name">Moon Light Resort</div>
          <div className="mobile-topbar-sub">Billing Management</div>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <MobileTopbar />
      <div className="app-content">
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#111827',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '10px 16px'
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
        }}
      />
    </div>
  );
}
