import type { SidebarItem } from '../types';

interface GroupModalProps {
  isMobile: boolean;
  onClose: () => void;
  groupName: string;
  onGroupNameChange: (v: string) => void;
  eligibleUsers: SidebarItem[];
  selectedMembers: string[];
  onToggleMember: (id: string) => void;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const GroupModal = ({
  onClose,
  groupName,
  onGroupNameChange,
  eligibleUsers,
  selectedMembers,
  onToggleMember,
  isCreating,
  onSubmit,
}: GroupModalProps) => (
  <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="glass-panel modal-card">
      <div className="modal-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Create New Group</h2>
        <button type="button" onClick={onClose} className="modal-close-btn">✕</button>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {/* Group Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
            placeholder="Enter group name"
            required
          />
        </div>

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Select Members
          </label>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-color)',
          }}>
            {eligibleUsers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.75rem 1rem' }}>
                No members available to add.
              </p>
            ) : (
              eligibleUsers.map((user) => {
                const checked = selectedMembers.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => onToggleMember(user._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.875rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: checked ? 'rgba(99,102,241,0.12)' : 'transparent',
                      transition: 'background 0.15s',
                      minHeight: '48px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    {!user.isGroup && user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.username}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'var(--border-color)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{user.username}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
          style={{ width: '100%' }}
        >
          {isCreating ? 'Creating Group…' : `Create Group${selectedMembers.length > 0 ? ` (${selectedMembers.length})` : ''}`}
        </button>
      </form>
    </div>
  </div>
);

export default GroupModal;
