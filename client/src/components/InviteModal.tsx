import { useState } from 'react';

interface InviteModalProps {
  isMobile: boolean;
  onClose: () => void;
}

const InviteModal = ({ isMobile, onClose }: InviteModalProps) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      const subject = encodeURIComponent('Join me on SynDesk!');
      const body = encodeURIComponent(
        `Hey!\n\nI'm using SynDesk to chat. Join me by signing up at ${window.location.origin}`
      );
      window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
      onClose();
      setInviteEmail('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: isMobile ? '90%' : '400px',
          padding: isMobile ? '1.5rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Invite friends</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Send an email invitation to join SynDesk.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Friend's email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
          <button type="submit" style={{ width: '100%' }}>
            Send Invite via Email
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
