// Role-based admin dashboard shell that renders tabs for superAdmin and theatreAdmin
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MoviesTab from '../components/admin/MoviesTab';
import TheatresTab from '../components/admin/TheatresTab';
import MyTheatresTab from '../components/admin/MyTheatresTab';
import AddShowTab from '../components/admin/AddShowTab';
import ReportsTab from '../components/admin/ReportsTab';

// Displays the role-appropriate tab buttons and renders the active admin tab
function AdminDashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superAdmin';

  // Default tab depends on role
  const [activeTab, setActiveTab] = useState(
    isSuperAdmin ? 'movies' : 'myTheatres'
  );

  const tabs = isSuperAdmin
    ? [
        { id: 'movies', label: 'Movies' },
        { id: 'theatres', label: 'Theatres' },
        { id: 'reports', label: 'Reports' },
      ]
    : [
        { id: 'myTheatres', label: 'My Theatres' },
        { id: 'addShow', label: 'Add Show' },
        { id: 'reports', label: 'Reports' },
      ];

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Admin Dashboard</h1>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${activeTab === tab.id ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isSuperAdmin && activeTab === 'movies' && <MoviesTab />}
      {isSuperAdmin && activeTab === 'theatres' && <TheatresTab />}
      {!isSuperAdmin && activeTab === 'myTheatres' && <MyTheatresTab />}
      {!isSuperAdmin && activeTab === 'addShow' && <AddShowTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
}

export default AdminDashboardPage;
