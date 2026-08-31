import type { AuthUser, SidebarItem, SidebarUser, Message } from '../types';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';

interface ChatAreaProps {
  isMobile: boolean;
  selectedUser: SidebarItem;
  authUser: AuthUser;
  messages: Message[];
  users: SidebarItem[];
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onSendMessage: (payload: { text: string; image?: string; file?: string; fileType?: string }) => Promise<void>;
  onDeleteMessage: (id: string) => void;
  onInitiateCall: (user: SidebarUser, type: 'voice' | 'video') => void;
  onTyping: () => void;
  callState?: 'idle' | 'calling' | 'incoming' | 'connected';
  callType?: 'voice' | 'video' | null;
  isMuted?: boolean;
  isVideoOff?: boolean;
  endCall?: () => void;
  toggleMute?: () => void;
  toggleVideo?: () => void;
}

const ChatArea = ({
  isMobile,
  selectedUser,
  authUser,
  messages,
  users,
  onlineUsers,
  typingUsers,
  messagesEndRef,
  onBack,
  onSendMessage,
  onDeleteMessage,
  onInitiateCall,
  onTyping,
  callState,
  callType,
  isMuted,
  isVideoOff,
  endCall,
  toggleMute,
  toggleVideo,
}: ChatAreaProps) => (
  <>
    <ChatHeader
      isMobile={isMobile}
      selectedUser={selectedUser}
      onlineUsers={onlineUsers}
      onBack={onBack}
      onInitiateCall={onInitiateCall}
    />

    {/* Active call banner */}
    {callState && callState !== 'idle' && (
      <div className="chat-active-call-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ position: 'relative', display: 'inline-flex', width: '10px', height: '10px' }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#22c55e', opacity: 0.75,
              animation: 'pulse 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <span style={{ borderRadius: '50%', background: '#22c55e', width: '10px', height: '10px', display: 'block' }} />
          </span>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
              {callState === 'connected' ? 'Connected' : callState === 'incoming' ? 'Incoming…' : 'Calling…'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {callState === 'connected' && (
            <>
              {toggleMute && (
                <button type="button" onClick={toggleMute}
                  className={`chat-banner-btn${isMuted ? ' chat-banner-btn--active' : ''}`}>
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              )}
              {callType === 'video' && toggleVideo && (
                <button type="button" onClick={toggleVideo}
                  className={`chat-banner-btn${isVideoOff ? ' chat-banner-btn--active' : ''}`}>
                  {isVideoOff ? 'Cam Off' : 'Cam On'}
                </button>
              )}
            </>
          )}
          {endCall && (
            <button type="button" onClick={endCall} className="chat-banner-btn chat-banner-btn--danger">
              End
            </button>
          )}
        </div>
      </div>
    )}

    <MessageList
      messages={messages}
      authUser={authUser}
      selectedUser={selectedUser}
      users={users}
      typingUsers={typingUsers}
      messagesEndRef={messagesEndRef}
      onDeleteMessage={onDeleteMessage}
    />

    <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
  </>
);

export default ChatArea;
