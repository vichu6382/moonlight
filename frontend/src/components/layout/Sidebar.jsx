import { useState, createContext, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus2, History, Users, BarChart3,
  Settings, Menu, ChevronLeft, X, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import logoPng from '../../assets/moonlight_logo.png';

const SidebarContext = createContext();

export function useSidebar() {
  return useContext(SidebarContext);
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/create-bill', label: 'Create Bill', icon: FilePlus2 },
  { to: '/history', label: 'Billing History', icon: History },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <img src={logoPng} alt="Moon Light Resort" className="sidebar-brand-logo" />
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">Moon Light Resort</span>
                <span className="sidebar-brand-sub">Billing System</span>
              </div>
            </div>
          )}
          {collapsed && (
            <img src={logoPng} alt="Logo" className="sidebar-brand-logo-collapsed" />
          )}
          <div className="sidebar-header-actions">
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <button
              className="sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            style={{ width: collapsed ? '36px' : '100%' }}
          >
            {isDark ? <Sun size={16} className="theme-toggle-icon" /> : <Moon size={16} className="theme-toggle-icon" />}
            {!collapsed && <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name || user.email}</span>
                <span className="sidebar-user-role">Administrator</span>
              </div>
            </div>
          )}
          <button
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
          {!collapsed && (
            <div className="sidebar-footer-text">
              <span>Moon Light Resort v3.0</span>
            </div>
          )}
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}
