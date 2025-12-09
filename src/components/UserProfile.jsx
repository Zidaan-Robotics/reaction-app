import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

export default function UserProfile() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // If no user, don't render anything (shouldn't happen due to PrivateRoute, but safety check)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        {currentUser?.photoURL && (
          <img 
            src={currentUser.photoURL} 
            alt="Profile" 
            className="user-avatar"
          />
        )}
        <div className="user-details">
          <div className="user-name">
            {currentUser?.displayName || currentUser?.email || 'User'}
          </div>
          <div className="user-email">{currentUser?.email}</div>
        </div>
      </div>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}



