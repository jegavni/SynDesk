import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isSigningUp, showToast } = useAuthStore();

  const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
  const emailRegex = /^\S+@\S+\.\S+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameRegex.test(username)) {
      showToast("Username must be 3–20 characters and contain only letters, numbers, or underscores.", "error");
      return;
    }

    if (!emailRegex.test(email)) {
      showToast("Invalid email format.", "error");
      return;
    }

    if (!passwordRegex.test(password)) {
      showToast("Password must be at least 6 characters and contain both letters and numbers.", "error");
      return;
    }

    signup({ username, email, password });
  };

  return (
    <div className="flex items-center justify-center h-screen w-full" style={{ padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 className="text-center mb-4" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Create Account</h2>
        <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>Get started with SynDesk</p>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
            <input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={isSigningUp}>
            {isSigningUp ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
