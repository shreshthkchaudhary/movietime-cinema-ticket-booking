import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Top navigation bar whose links change based on login status and user role
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isAdmin =
    user && (user.role === 'theatreAdmin' || user.role === 'superAdmin');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          MovieTime
        </Link>

        <div className="nav-links">
          <Link to="/">Movies</Link>

          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-sm">
                Register
              </Link>
            </>
          ) : (
            <>
              <Link to="/my-bookings">My Bookings</Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              <span className="nav-user">
                {user.name} ({user.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
