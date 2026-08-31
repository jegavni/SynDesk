import { useState } from 'react';

interface InviteModalProps {
  isMobile: boolean;
  onClose: () => void;
}

const InviteModal = ({ onClose }: InviteModalProps) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const subject = encodeURIComponent('Join me on SynDesk!');
    const body = encodeURIComponent(
      `Hey!\n\nI'm using SynDesk to chat. Join me by signing up at ${window.location.origin}`
    );
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    onClose();
    setInviteEmail('');
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel modal-card">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Invite Friends</h2>
          <button type="button" onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '-0.25rem' }}>
          Send an email invitation to join SynDesk.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Friend's email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
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
