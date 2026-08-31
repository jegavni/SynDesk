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
    <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!authUser ? <Register /> : <Navigate to="/" />} />
      </Routes>

      {/* Custom Toast Alert Component */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          backgroundColor: toast.type === 'error' ? 'var(--error-color)' : 'var(--success-color)',
          color: 'white',
          padding: '0.85rem 1.75rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          fontWeight: '500',
          animation: 'slideIn 0.2s ease-out',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span>{toast.message}</span>
          <button 
            onClick={clearToast} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '0 0.25rem', 
              fontWeight: 'bold',
              fontSize: '1rem',
              width: 'auto'
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
