import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';

function App() {
  const { authUser, isCheckingAuth, toast, clearToast } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  useEffect(() => {
    if (authUser) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [authUser, connectSocket, disconnectSocket]);

  if (isCheckingAuth && !authUser) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      Loading…
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!authUser ? <Register /> : <Navigate to="/" />} />
      </Routes>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 'calc(1.25rem + env(safe-area-inset-top, 0px))',
          right: '1rem',
          left: '1rem',
          maxWidth: '420px',
          marginLeft: 'auto',
          backgroundColor: toast.type === 'error' ? 'var(--error-color)' : 'var(--success-color)',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          animation: 'slideIn 0.2s ease-out',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={clearToast}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.2rem 0.4rem',
              fontWeight: '700',
              fontSize: '1rem',
              width: 'auto',
              minHeight: 'auto',
              lineHeight: 1,
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export default App;
