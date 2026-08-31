import type { AuthUser } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface SidebarFooterProps {
  authUser: AuthUser | null;
  onLogout: () => void;
}

const SidebarFooter = ({ authUser, onLogout }: SidebarFooterProps) => (
  <div className="sidebar-footer">
    <div className="sidebar-footer-user">
      {authUser && <UserAvatar user={authUser} size={38} />}
      <div className="sidebar-footer-meta">
        <div className="sidebar-footer-meta-name">{authUser?.username}</div>
        <div className="sidebar-footer-meta-bio" title={authUser?.bio}>
          {authUser?.bio || 'Hey there! I am using SynDesk.'}
        </div>
      </div>
    </div>
    <button onClick={onLogout} className="logout-btn">
      Logout
    </button>
  </div>
);

export default SidebarFooter;
