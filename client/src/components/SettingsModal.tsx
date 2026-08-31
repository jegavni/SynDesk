
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
  isMobile,
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
  // We keep handleImageChange logic here since it only touches profilePic
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfilePicChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: isMobile ? '90%' : '450px',
          padding: isMobile ? '1.5rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Settings</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Profile Pic Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Preview"
                  style={{
                    width: '90px', height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary-color)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '90px', height: '90px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 'bold',
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="profile-pic-input"
                style={{
                  position: 'absolute',
                  bottom: 0, right: 0,
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'background-color 0.2s',
                }}
                title="Change Profile Picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </label>
              <input
                type="file"
                id="profile-pic-input"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Click the icon to upload new picture
            </span>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>About / Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Tell us about yourself"
              required
            />
          </div>

          {/* Last Seen Privacy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Who can see my Last Seen
            </label>
            <select
              value={lastSeenPrivacy}
              onChange={(e) => onLastSeenPrivacyChange(e.target.value as 'everyone' | 'nobody')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="everyone" style={{ backgroundColor: 'var(--surface-color)' }}>Everyone</option>
              <option value="nobody" style={{ backgroundColor: 'var(--surface-color)' }}>Nobody</option>
            </select>
          </div>

          <button type="submit" disabled={isSaving} style={{ width: '100%', marginTop: '0.5rem' }}>
            {isSaving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
