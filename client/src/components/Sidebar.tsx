import type { AuthUser, SidebarItem, CallLog, SidebarUser } from '../types';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarTabs from './sidebar/SidebarTabs';
import ChatList from './sidebar/ChatList';
import CallLogList from './sidebar/CallLogList';
import SidebarFooter from './sidebar/SidebarFooter';

interface SidebarProps {
  isMobile: boolean;
  selectedUser: SidebarItem | null;
  authUser: AuthUser | null;
  users: SidebarItem[];
  callLogs: CallLog[];
  onlineUsers: string[];
  isLoadingCallLogs: boolean;
  sidebarTab: 'chats' | 'calls';
  onTabChange: (tab: 'chats' | 'calls') => void;
  onSelectUser: (user: SidebarItem) => void;
  onOpenSettings: () => void;
  onOpenGroup: () => void;
  onOpenInvite: () => void;
  onLogout: () => void;
  onInitiateCall: (user: SidebarUser, type: 'voice' | 'video') => void;
}

const Sidebar = ({
  isMobile,
  selectedUser,
  authUser,
  users,
  callLogs,
  onlineUsers,
  isLoadingCallLogs,
  sidebarTab,
  onTabChange,
  onSelectUser,
  onOpenSettings,
  onOpenGroup,
  onOpenInvite,
  onLogout,
  onInitiateCall,
}: SidebarProps) => (
  <div
    className="glass-panel"
    style={{
      width: isMobile ? '100%' : '320px',
      display: isMobile && !!selectedUser ? 'none' : 'flex',
      borderRight: '1px solid var(--border-color)',
      borderRadius: 0,
      flexDirection: 'column',
      backgroundColor: 'var(--surface-color)',
    }}
  >
    <SidebarHeader
      onOpenGroup={onOpenGroup}
      onOpenSettings={onOpenSettings}
      onOpenInvite={onOpenInvite}
    />

    <SidebarTabs activeTab={sidebarTab} onTabChange={onTabChange} />

    <div style={{ flex: 1, overflowY: 'auto' }}>
      {sidebarTab === 'chats' ? (
        <ChatList
          users={users}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          onSelectUser={onSelectUser}
        />
      ) : (
        <CallLogList
          callLogs={callLogs}
          authUser={authUser}
          isLoading={isLoadingCallLogs}
          onInitiateCall={onInitiateCall}
        />
      )}
    </div>

    <SidebarFooter authUser={authUser} onLogout={onLogout} />
  </div>
);

export default Sidebar;
