import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
import { useCallLogStore } from '../store/useCallLogStore';

import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import CallOverlay from '../components/CallOverlay';
import InviteModal from '../components/InviteModal';
import SettingsModal from '../components/SettingsModal';
import GroupModal from '../components/GroupModal';

const Home = () => {
  // ─────────────────────────────────────────────────────────────
  // Auth Store
  // ─────────────────────────────────────────────────────────────
  const { logout, authUser, updateProfile } = useAuthStore();

  // ─────────────────────────────────────────────────────────────
  // Chat Store
  // ─────────────────────────────────────────────────────────────
  const {
    users,
    getUsers,
    messages,
    getMessages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    onlineUsers,
    createGroup,
    deleteMessage,
    sendTypingStatus,
    typingUsers,
  } = useChatStore();

  // ─────────────────────────────────────────────────────────────
  // Call Store
  // ─────────────────────────────────────────────────────────────
  const {
    callState,
    callType,
    targetUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    setupSocketListeners,
  } = useCallStore();

  // ─────────────────────────────────────────────────────────────
  // Call Log Store
  // ─────────────────────────────────────────────────────────────
  const {
    callLogs,
    getCallLogs,
    isLoadingCallLogs,
    subscribeToCallLogs,
    unsubscribeFromCallLogs,
  } = useCallLogStore();

  // ─────────────────────────────────────────────────────────────
  // Socket
  // ─────────────────────────────────────────────────────────────
  const socket = useChatStore((state) => state.socket);

  // ─────────────────────────────────────────────────────────────
  // Refs
  // ─────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isTypingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // Sidebar
  // ─────────────────────────────────────────────────────────────
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'calls'>('chats');

  // ─────────────────────────────────────────────────────────────
  // Modal State
  // ─────────────────────────────────────────────────────────────
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Settings Form State
  // ─────────────────────────────────────────────────────────────
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsProfilePic, setSettingsProfilePic] = useState('');

  const [settingsLastSeenPrivacy, setSettingsLastSeenPrivacy] =
    useState<'everyone' | 'nobody'>('everyone');

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Group Form State
  // ─────────────────────────────────────────────────────────────
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Responsive State
  // ─────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Socket / Call Listeners
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (socket) {
      setupSocketListeners();
      subscribeToCallLogs();
    }

    return () => {
      unsubscribeFromCallLogs();
    };
  }, [
    socket,
    setupSocketListeners,
    subscribeToCallLogs,
    unsubscribeFromCallLogs,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Load Users
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // ─────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Auto Scroll Messages
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, typingUsers]);

  // ─────────────────────────────────────────────────────────────
  // Call Logs
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sidebarTab === 'calls') {
      getCallLogs();
    }
  }, [sidebarTab, getCallLogs]);

  // ─────────────────────────────────────────────────────────────
  // Typing
  // ─────────────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }, 2000);
  };

  // Reset typing state when changing chats
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    isTypingRef.current = false;
  }, [selectedUser]);

  // ─────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────
  const handleOpenSettings = () => {
    if (!authUser) {
      return;
    }

    setSettingsUsername(authUser.username || '');

    setSettingsBio(
      authUser.bio || 'Hey there! I am using SynDesk.',
    );

    setSettingsProfilePic(authUser.profilePic || '');

    setSettingsLastSeenPrivacy(
      authUser.lastSeenPrivacy || 'everyone',
    );

    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setIsSavingSettings(true);

    try {
      await updateProfile({
        username: settingsUsername,
        bio: settingsBio,
        profilePic: settingsProfilePic,
        lastSeenPrivacy: settingsLastSeenPrivacy,
      });

      await getUsers();

      setShowSettingsModal(false);
    } catch (err) {
      console.error(
        'Failed to update profile settings',
        err,
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Group Creation
  // ─────────────────────────────────────────────────────────────
  const handleCreateGroupSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!groupName.trim()) {
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member.');
      return;
    }

    setIsCreatingGroup(true);

    try {
      await createGroup(groupName, selectedMembers);

      setGroupName('');
      setSelectedMembers([]);
      setShowGroupModal(false);

      await getUsers();
    } catch (err) {
      console.error(
        'Failed to create group',
        err,
      );
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Toggle Group Member
  // ─────────────────────────────────────────────────────────────
  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Send Message
  // ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (payload: {
    text: string;
    image?: string;
    file?: string;
    fileType?: string;
  }) => {
    await sendMessage(payload);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    isTypingRef.current = false;

    sendTypingStatus(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Eligible Users For Groups
  // ─────────────────────────────────────────────────────────────
  const eligibleUsers = users.filter(
    (user) => !user.isGroup,
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* Sidebar — hides itself on mobile when a chat is open */}
      <Sidebar
        isMobile={isMobile}
        selectedUser={selectedUser}
        authUser={authUser}
        users={users}
        callLogs={callLogs}
        onlineUsers={onlineUsers}
        isLoadingCallLogs={isLoadingCallLogs}
        sidebarTab={sidebarTab}
        onTabChange={setSidebarTab}
        onSelectUser={setSelectedUser}
        onOpenSettings={handleOpenSettings}
        onOpenGroup={() => setShowGroupModal(true)}
        onOpenInvite={() => setShowInviteModal(true)}
        onLogout={logout}
        onInitiateCall={initiateCall}
      />

      {/* Chat area — hides on mobile when no chat selected */}
      <div className={`chat-area${isMobile && !selectedUser ? ' chat-area--hidden' : ''}`}>
        {selectedUser && authUser ? (
          <ChatArea
            isMobile={isMobile}
            selectedUser={selectedUser}
            authUser={authUser}
            messages={messages}
            users={users}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            messagesEndRef={messagesEndRef}
            onBack={() => setSelectedUser(null)}
            onSendMessage={handleSendMessage}
            onDeleteMessage={deleteMessage}
            onInitiateCall={initiateCall}
            onTyping={handleTyping}
            callState={callState}
            callType={callType}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            endCall={endCall}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
          />
        ) : (
          !isMobile && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: 'var(--text-secondary)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: 0.2 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontSize: '0.95rem', opacity: 0.45 }}>Select a conversation to start messaging</p>
            </div>
          )
        )}
      </div>

      {/* Call Overlay — rendered at root level so it covers the full screen on mobile */}
      {callState !== 'idle' && (
        <CallOverlay
          isMobile={isMobile}
          callState={callState as 'calling' | 'incoming' | 'connected'}
          callType={callType}
          targetUser={targetUser}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onlineUsers={onlineUsers}
          acceptCall={acceptCall}
          rejectCall={rejectCall}
          endCall={endCall}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
        />
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteModal isMobile={isMobile} onClose={() => setShowInviteModal(false)} />
      )}
      {showSettingsModal && (
        <SettingsModal
          isMobile={isMobile}
          onClose={() => setShowSettingsModal(false)}
          username={settingsUsername}
          bio={settingsBio}
          profilePic={settingsProfilePic}
          lastSeenPrivacy={settingsLastSeenPrivacy}
          isSaving={isSavingSettings}
          onUsernameChange={setSettingsUsername}
          onBioChange={setSettingsBio}
          onProfilePicChange={setSettingsProfilePic}
          onLastSeenPrivacyChange={setSettingsLastSeenPrivacy}
          onSave={handleSaveSettings}
        />
      )}
      {showGroupModal && (
        <GroupModal
          isMobile={isMobile}
          onClose={() => { setShowGroupModal(false); setSelectedMembers([]); setGroupName(''); }}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          eligibleUsers={eligibleUsers}
          selectedMembers={selectedMembers}
          onToggleMember={handleToggleMember}
          isCreating={isCreatingGroup}
          onSubmit={handleCreateGroupSubmit}
        />
      )}
    </div>
  );
};

export default Home;