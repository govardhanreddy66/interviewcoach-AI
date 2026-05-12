import { Outlet, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ProtectedRoute from './ProtectedRoute';
import IdleTimeoutModal from './IdleTimeoutModal';
import { useAuth } from '../contexts/AuthContext';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

const SupportBot = lazy(() => import('./SupportBot'));

function AuthenticatedShell() {
  const { logout } = useAuth();
  const location = useLocation();
  const isOnInterviewPage = location.pathname === '/interview';

  const { showWarning, timeRemaining, resetTimer } = useIdleTimeout(
    isOnInterviewPage ? null : 1440,
    30
  );

  // Proactively verify session on navigation to ensure logout on invalid tokens
  useEffect(() => {
    const verifySession = async () => {
      try {
        // This will trigger the global fetch interceptor if the token is invalid
        const { apiGet } = await import('../api');
        await apiGet('/api/me');
      } catch (err) {
        // Interceptor handles redirect, so we don't need to do anything here
      }
    };
    
    if (!isOnInterviewPage) {
      verifySession();
    }
  }, [location.pathname, isOnInterviewPage]);

  const handleIdleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <>
        <Outlet />
        {!isOnInterviewPage && (
          <Suspense fallback={null}>
            <SupportBot />
          </Suspense>
        )}
        {!isOnInterviewPage && (
          <IdleTimeoutModal
            isOpen={showWarning}
            timeRemaining={timeRemaining}
            onStayLoggedIn={resetTimer}
            onLogout={handleIdleLogout}
          />
        )}
      </>
    </ProtectedRoute>
  );
}

export default AuthenticatedShell;
