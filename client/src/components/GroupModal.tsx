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
  isMobile,
  onClose,
  groupName,
  onGroupNameChange,
  eligibleUsers,
  selectedMembers,
  onToggleMember,
  isCreating,
  onSubmit,
}: GroupModalProps) => {
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
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Create New Group</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Group Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Members Select List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Select Members</label>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-color)',
                padding: '0.5rem',
              }}
            >
              {eligibleUsers.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>
                  No members available to add.
                </p>
              ) : (
                eligibleUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => onToggleMember(user._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedMembers.includes(user._id)
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => {}}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    {!user.isGroup && user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.username}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px', height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--border-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 'bold',
                        }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{user.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isCreating ? 'Creating Group...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;
