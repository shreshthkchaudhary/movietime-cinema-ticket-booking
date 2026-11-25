import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Allows access only if the logged-in user's role is in allowedRoles
function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="container">
        <div className="card">
          <h2>Not allowed</h2>
          <p className="muted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}

export default RoleRoute;
