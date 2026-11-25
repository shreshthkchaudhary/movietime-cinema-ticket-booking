import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects unauthenticated users to /login while waiting for auth check to finish
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
