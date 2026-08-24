import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
import { useCallLogStore } from '../store/useCallLogStore';
import type { SidebarItem } from '../types';

const Home = () => {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { 
    users, getUsers, 
    messages, getMessages, 
    selectedUser, setSelectedUser,
    sendMessage, subscribeToMessages, unsubscribeFromMessages,
    onlineUsers, createGroup, deleteMessage
  } = useChatStore();

  const {
    callState, callType, targetUser, localStream, remoteStream,
    isMuted, isVideoOff, initiateCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleVideo, setupSocketListeners
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { callLogs, getCallLogs, isLoadingCallLogs, subscribeToCallLogs, unsubscribeFromCallLogs } = useCallLogStore();

  const socket = useChatStore((state) => state.socket);
  useEffect(() => {
    if (socket) {
      setupSocketListeners();
      subscribeToCallLogs();
    }
    return () => unsubscribeFromCallLogs();
  }, [socket, setupSocketListeners, subscribeToCallLogs, unsubscribeFromCallLogs]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  const [text, setText] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [sidebarTab, setSidebarTab] = useState<'chats' | 'calls'>('chats');

  useEffect(() => {
    if (sidebarTab === 'calls') {
      getCallLogs();
    }
  }, [sidebarTab, getCallLogs]);
  
  // Chat attachment states
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsBio, setSettingsBio] = useState('');
  const [settingsProfilePic, setSettingsProfilePic] = useState('');
  const [settingsLastSeenPrivacy, setSettingsLastSeenPrivacy] = useState<'everyone' | 'nobody'>('everyone');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Group Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync settings modal fields when opening
  useEffect(() => {
    if (authUser) {
      setSettingsUsername(authUser.username || '');
      setSettingsBio(authUser.bio || 'Hey there! I am using SynDesk.');
      setSettingsProfilePic(authUser.profilePic || '');
      setSettingsLastSeenPrivacy(authUser.lastSeenPrivacy || 'everyone');
    }
  }, [authUser, showSettingsModal]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;
    setIsUploading(true);
    try {
      const payload: { text: string; image?: string; file?: string; fileType?: string } = { text };
      if (selectedFile) {
        if (selectedFileType === 'image') {
          payload.image = selectedFile;
        } else {
          payload.file = selectedFile;
          payload.fileType = selectedFileType;
        }
      }
      await sendMessage(payload);
      setText('');
      setSelectedFile(null);
      setSelectedFileName('');
      setSelectedFileType('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFileName(file.name);
      
      let type = 'file';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }
      setSelectedFileType(type);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
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
      console.error('Failed to update profile settings', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
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
      console.error('Failed to create group', err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const renderLastSeen = (user: SidebarItem) => {
    if (user.isGroup) {
      return 'Group Chat';
    }
    if (onlineUsers.includes(user._id)) {
      return 'Online';
    }
    if (user.lastSeenPrivacy === 'nobody') {
      return 'Offline';
    }
    if (user.lastSeen) {
      return `Last seen ${new Date(user.lastSeen).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`;
    }
    return 'Offline';
  };

  // Only display normal users (excluding existing groups) when choosing members for new group
  const eligibleUsers = users.filter(u => !u.isGroup);

  return (
    <div className="flex h-screen" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <div 
        className="glass-panel" 
        style={{ 
          width: '320px', 
          borderRight: '1px solid var(--border-color)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-color)'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Chat Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>SynDesk</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {/* Create Group Button */}
            <button 
              onClick={() => setShowGroupModal(true)}
              style={{
                padding: '0.4rem', 
                backgroundColor: 'var(--border-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}
              title="New Group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </button>

            {/* Settings Button */}
            <button 
              onClick={() => setShowSettingsModal(true)}
              style={{
                padding: '0.4rem', 
                backgroundColor: 'var(--border-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            
            <button 
              onClick={() => setShowInviteModal(true)}
              style={{ 
                padding: '0.4rem 0.75rem', 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                backgroundColor: 'var(--border-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)'
              }}
              title="Invite friends to SynDesk"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Invite
            </button>
          </div>
        </div>

        {/* Sidebar Tab Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setSidebarTab('chats')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: sidebarTab === 'chats' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: sidebarTab === 'chats' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: sidebarTab === 'chats' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              borderRadius: 0,
            }}
          >
            Chats
          </button>
          <button
            onClick={() => setSidebarTab('calls')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: sidebarTab === 'calls' ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: sidebarTab === 'calls' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: sidebarTab === 'calls' ? '2px solid var(--primary-color)' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              borderRadius: 0,
            }}
          >
            Call Logs
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sidebarTab === 'chats' ? (
            users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>No contacts yet.</p>
            ) : (
              users.map((user) => (
                <div 
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: selectedUser?._id === user._id ? 'var(--primary-color)' : 'transparent',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {user.isGroup ? (
                    /* Group Icon */
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                  ) : user.profilePic ? (
                    <img src={user.profilePic} alt={user.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.username}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: user.isGroup ? 'var(--text-secondary)' : (onlineUsers.includes(user._id) ? 'var(--success-color)' : 'var(--text-secondary)') }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {user.isGroup ? 'Group Chat' : (onlineUsers.includes(user._id) ? 'Online' : renderLastSeen(user))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Call Logs Rendering */
            isLoadingCallLogs ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>Loading logs...</p>
            ) : callLogs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>No call logs yet.</p>
            ) : (
              callLogs.map((log) => {
                if(!authUser) return null;
                const isCaller = log.caller._id === authUser._id;
                const peerUser = isCaller ? log.receiver : log.caller;
                return (
                  <div
                    key={log._id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {peerUser.profilePic ? (
                      <img src={peerUser.profilePic} alt={peerUser.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {peerUser.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{peerUser.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Audio/Video Icon */}
                        {log.type === 'video' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 7l-7 5 7 5V7z"></path>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        )}
                        
                        {/* Status Icon */}
                        {log.status === 'missed' ? (
                          <span style={{ color: 'var(--error-color)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 10 10 16 4 10"></polyline><line x1="10" y1="16" x2="10" y2="4"></line></svg>
                            Missed
                          </span>
                        ) : log.status === 'rejected' ? (
                          <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Rejected
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success-color)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            {isCaller ? (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 14 14 8 20 14"></polyline><line x1="14" y1="8" x2="14" y2="20"></line></svg> Outgoing</>
                            ) : (
                              <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 10 10 16 4 10"></polyline><line x1="10" y1="16" x2="10" y2="4"></line></svg> Incoming</>
                            )}
                          </span>
                        )}
                        
                        {/* Duration */}
                        {log.duration > 0 && (
                          <span style={{ marginLeft: '0.2rem' }}>
                            • {Math.floor(log.duration / 60)}:{(log.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
        
        {/* Current user profile info & logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {authUser?.profilePic ? (
              <img src={authUser.profilePic} alt={authUser.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {authUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{authUser?.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={authUser?.bio}>{authUser?.bio || 'Hey there! I am using SynDesk.'}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Welcome to SynDesk!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Select a contact or group from the sidebar to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {selectedUser.isGroup ? (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5c-2.2 0-4 1.8-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              ) : selectedUser.profilePic ? (
                <img src={selectedUser.profilePic} alt={selectedUser.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 'bold' }}>{selectedUser.username}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: selectedUser.isGroup ? 'var(--text-secondary)' : (onlineUsers.includes(selectedUser._id) ? 'var(--success-color)' : 'var(--text-secondary)') }}>
                    {selectedUser.isGroup ? `${selectedUser.members?.length || 0} members` : renderLastSeen(selectedUser)}
                  </span>
                  {!selectedUser.isGroup && (
                    <>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={selectedUser.bio}>
                        {selectedUser.bio || 'Hey there! I am using SynDesk.'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {!selectedUser.isGroup && (() => {
                const user = selectedUser;
                return (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Voice Call Button */}
                    <button
                      onClick={() => initiateCall(user, 'voice')}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}
                      title="Voice Call"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </button>
                    {/* Video Call Button */}
                    <button
                      onClick={() => initiateCall(user, 'video')}
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}
                      title="Video Call"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 7l-7 5 7 5V7z"></path>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, index) => {
                const isMine = msg.senderId === authUser!._id;
                // For group chats, let's identify the sender name
                let senderName = '';
                if (selectedUser.isGroup && !isMine) {
                  const senderUser = users.find(u => u._id === msg.senderId);
                  senderName = senderUser ? senderUser.username : 'Group Member';
                }

                return (
                  <div key={index} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: isMine ? 'var(--primary-color)' : 'var(--surface-color)',
                      color: 'white',
                      borderBottomRightRadius: isMine ? 0 : 'var(--radius-lg)',
                      borderBottomLeftRadius: !isMine ? 0 : 'var(--radius-lg)',
                    }}>
                      {senderName && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', filter: 'brightness(1.3)', marginBottom: '0.25rem' }}>
                          {senderName}
                        </div>
                      )}
                      {msg.text && <div style={{ marginBottom: '0.5rem' }}>{msg.text}</div>}
                      
                      {/* Render Media Attachments */}
                      {(msg.fileUrl || msg.image) && (
                        <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                          {(!msg.fileType || msg.fileType === 'image' || msg.image) ? (
                            <img 
                              src={msg.fileUrl || msg.image} 
                              alt="attachment" 
                              style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 'var(--radius-md)', objectFit: 'contain', display: 'block' }} 
                            />
                          ) : msg.fileType === 'video' ? (
                            <video 
                              src={msg.fileUrl} 
                              controls 
                              style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 'var(--radius-md)', display: 'block' }} 
                            />
                          ) : msg.fileType === 'audio' ? (
                            <audio 
                              src={msg.fileUrl} 
                              controls 
                              style={{ maxWidth: '100%', display: 'block' }} 
                            />
                          ) : (
                            <a 
                              href={msg.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', filter: 'brightness(1.4)', textDecoration: 'underline', fontWeight: '500' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                              <span style={{ fontSize: '0.85rem' }}>Download Attachment</span>
                            </a>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <div style={{ fontSize: '0.7rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {isMine && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this message for everyone?')) {
                                deleteMessage(msg._id!);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255,255,255,0.7)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete for everyone"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', marginBottom: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                  {selectedFileType === 'image' ? (
                    <img src={selectedFile} alt="preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedFileName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedFileType.toUpperCase()}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedFile(null); setSelectedFileName(''); setSelectedFileType(''); }} 
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '0.25rem 0.5rem', width: 'auto', borderRadius: 'var(--radius-sm)' }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  id="chat-file-input" 
                  style={{ display: 'none' }} 
                  onChange={handleChatFileChange}
                />
                <label 
                  htmlFor="chat-file-input" 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                  title="Attach a file"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </label>
                <input 
                  type="text" 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..." 
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: 'var(--bg-color)', color: 'white', outline: 'none' }}
                />
                <button type="submit" disabled={(!text.trim() && !selectedFile) || isUploading} style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 1.5rem' }}>
                  {isUploading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Invite friends</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Send an email invitation to join SynDesk.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inviteEmail.trim()) {
                const subject = encodeURIComponent("Join me on SynDesk!");
                const body = encodeURIComponent(`Hey!\n\nI'm using SynDesk to chat. Join me by signing up at ${window.location.origin}`);
                window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
                setShowInviteModal(false);
                setInviteEmail('');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Friend's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
              <button type="submit" style={{ width: '100%' }}>Send Invite via Email</button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Pic Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                  {settingsProfilePic ? (
                    <img 
                      src={settingsProfilePic} 
                      alt="Preview" 
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} 
                    />
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                      {settingsUsername.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label 
                    htmlFor="profile-pic-input" 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      transition: 'background-color 0.2s'
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click the icon to upload new picture</span>
              </div>

              {/* Username Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Username</label>
                <input 
                  type="text" 
                  value={settingsUsername}
                  onChange={(e) => setSettingsUsername(e.target.value)}
                  placeholder="Enter username" 
                  required
                />
              </div>

              {/* Bio Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>About / Bio</label>
                <input 
                  type="text" 
                  value={settingsBio}
                  onChange={(e) => setSettingsBio(e.target.value)}
                  placeholder="Tell us about yourself" 
                  required
                />
              </div>

              {/* Last Seen Privacy Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Who can see my Last Seen</label>
                <select 
                  value={settingsLastSeenPrivacy}
                  onChange={(e) => setSettingsLastSeenPrivacy(e.target.value as 'everyone' | 'nobody')}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="everyone" style={{ backgroundColor: 'var(--surface-color)' }}>Everyone</option>
                  <option value="nobody" style={{ backgroundColor: 'var(--surface-color)' }}>Nobody</option>
                </select>
              </div>

              {/* Save Button */}
              <button type="submit" disabled={isSavingSettings} style={{ width: '100%', marginTop: '0.5rem' }}>
                {isSavingSettings ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Create New Group</h3>
              <button onClick={() => { setShowGroupModal(false); setSelectedMembers([]); setGroupName(''); }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '0.5rem', width: 'auto' }}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateGroupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Group Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Group Name</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name" 
                  required
                />
              </div>

              {/* Members Select List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Select Members</label>
                <div style={{ 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.5rem'
                }}>
                  {eligibleUsers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>No members available to add.</p>
                  ) : (
                    eligibleUsers.map((user) => (
                      <div 
                        key={user._id} 
                        onClick={() => handleToggleMember(user._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: selectedMembers.includes(user._id) ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => {}} // toggled by parent div click
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontSize: '0.9rem', color: 'white' }}>{user.username}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={isCreatingGroup || !groupName.trim() || selectedMembers.length === 0} style={{ width: '100%', marginTop: '0.5rem' }}>
                {isCreatingGroup ? 'Creating Group...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Calling Overlay / Modal */}
      {callState !== 'idle' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 10, 12, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          color: 'white',
        }}>
          {/* Main Call Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: callType === 'video' ? '100%' : '800px',
            height: callType === 'video' ? '100%' : '800px',
            maxHeight: callType === 'video' ? '100%' : '85vh',
            backgroundColor: '#18181b',
            borderRadius: callType === 'video' ? '0' : 'var(--radius-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: callType === 'video' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: callType === 'video' ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            {/* Video Streams Section */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {callType === 'video' ? (
                <>
                  {/* Remote Video Stream */}
                  {remoteStream && callState === 'connected' ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      {targetUser?.profilePic ? (
                        <img src={targetUser.profilePic} alt={targetUser.username} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }} />
                      ) : (
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold' }}>
                          {targetUser?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{targetUser?.username}</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {callState === 'calling' 
                          ? (targetUser && onlineUsers.includes(targetUser._id) ? 'Ringing...' : 'Calling...') 
                          : callState === 'incoming' 
                            ? 'Incoming Video Call...' 
                            : 'Connecting...'}
                      </p>
                    </div>
                  )}

                  {/* Local Video Stream (Miniature PIP) */}
                  {localStream && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        width: '180px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        transform: 'scaleX(-1)', // mirror local video
                        display: isVideoOff ? 'none' : 'block'
                      }}
                    />
                  )}
                </>
              ) : (
                /* Voice Call Avatar Display */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    {targetUser?.profilePic ? (
                      <img src={targetUser.profilePic} alt={targetUser.username} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary-color)' }} />
                    ) : (
                      <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem', fontWeight: 'bold' }}>
                        {targetUser?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {callState === 'connected' && (
                      <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--success-color)',
                        border: '3px solid #18181b',
                      }} />
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{targetUser?.username}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {callState === 'calling' 
                      ? (targetUser && onlineUsers.includes(targetUser._id) ? 'Ringing...' : 'Calling...') 
                      : callState === 'incoming' 
                        ? 'Incoming Voice Call...' 
                        : 'Connected'}
                  </p>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div style={{
              padding: '2rem',
              backgroundColor: '#18181b',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              {callState === 'incoming' ? (
                /* Incoming Call Accept/Decline Controls */
                <>
                  <button
                    onClick={acceptCall}
                    style={{
                      backgroundColor: 'var(--success-color)',
                      color: 'white',
                      padding: '1rem 2.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: 'auto',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Accept
                  </button>
                  <button
                    onClick={rejectCall}
                    style={{
                      backgroundColor: 'var(--error-color)',
                      color: 'white',
                      padding: '1rem 2.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: 'auto',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7-2.81 2 2 0 0 1-.45-2.11L5.09 3.91a2 2 0 0 0-2.83 0L1 5.17a2 2 0 0 0 0 2.83l9.68 9.31z"></path>
                    </svg>
                    Decline
                  </button>
                </>
              ) : (
                /* Connected/Outgoing Call Controls */
                <>
                  {/* Mute Button */}
                  <button
                    onClick={toggleMute}
                    style={{
                      backgroundColor: isMuted ? 'var(--error-color)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '56px',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    )}
                  </button>

                  {/* Video Toggle Button (only for video calls) */}
                  {callType === 'video' && (
                    <button
                      onClick={toggleVideo}
                      style={{
                        backgroundColor: isVideoOff ? 'var(--error-color)' : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s',
                      }}
                      title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                      {isVideoOff ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10l-3.5-2.5"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 7l-7 5 7 5V7z"></path>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                      )}
                    </button>
                  )}

                  {/* End Call Button */}
                  <button
                    onClick={endCall}
                    style={{
                      backgroundColor: 'var(--error-color)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '56px',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    title="End Call"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
