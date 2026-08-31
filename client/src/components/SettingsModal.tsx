interface SettingsModalProps {
  isMobile: boolean;
  onClose: () => void;
  username: string;
  bio: string;
  profilePic: string;
  lastSeenPrivacy: 'everyone' | 'nobody';
  isSaving: boolean;
  onUsernameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onProfilePicChange: (v: string) => void;
  onLastSeenPrivacyChange: (v: 'everyone' | 'nobody') => void;
  onSave: (e: React.FormEvent) => void;
}

const SettingsModal = ({
  onClose,
  username,
  bio,
  profilePic,
  lastSeenPrivacy,
  isSaving,
  onUsernameChange,
  onBioChange,
  onProfilePicChange,
  onLastSeenPrivacyChange,
  onSave,
}: SettingsModalProps) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onProfilePicChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel modal-card">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Settings</h2>
          <button type="button" onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '88px', height: '88px' }}>
              {profilePic ? (
                <img src={profilePic} alt="Preview" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
              ) : (
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700' }}>
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="settings-pic-input"
                style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-color)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
                title="Change profile picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
              <input type="file" id="settings-pic-input" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tap camera to change photo</span>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Username</label>
            <input type="text" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Enter username" required />
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>About / Bio</label>
            <input type="text" value={bio} onChange={(e) => onBioChange(e.target.value)} placeholder="Tell us about yourself" />
          </div>

          {/* Last seen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Who can see my Last Seen</label>
            <select value={lastSeenPrivacy} onChange={(e) => onLastSeenPrivacyChange(e.target.value as 'everyone' | 'nobody')}>
              <option value="everyone" style={{ background: 'var(--surface-color)' }}>Everyone</option>
              <option value="nobody" style={{ background: 'var(--surface-color)' }}>Nobody</option>
            </select>
          </div>

          <button type="submit" disabled={isSaving} style={{ width: '100%', marginTop: '0.25rem' }}>
            {isSaving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
