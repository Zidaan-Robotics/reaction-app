import { useAuth } from '../contexts/AuthContext';
import Auth from './Auth';

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        color: '#333',
        fontSize: '18px',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px' }}>Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated, otherwise show app
  return currentUser ? children : <Auth />;
}


