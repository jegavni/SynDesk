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

    {/* In-Chat Active Call Banner */}
    {callState && callState !== 'idle' && (
      <div className="chat-active-call-banner">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <div>
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
              {callType === 'video' ? 'Video Call In Progress' : 'Voice Call In Progress'}
            </span>
            <span className="text-[11px] text-gray-300">
              {callState === 'connected' ? 'Connected' : callState === 'incoming' ? 'Incoming call...' : 'Calling...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callState === 'connected' && (
            <>
              {toggleMute && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`chat-banner-btn ${isMuted ? 'chat-banner-btn--active' : ''}`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              )}
              {callType === 'video' && toggleVideo && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`chat-banner-btn ${isVideoOff ? 'chat-banner-btn--active' : ''}`}
                >
                  {isVideoOff ? 'Camera Off' : 'Camera On'}
                </button>
              )}
            </>
          )}
          {endCall && (
            <button
              type="button"
              onClick={endCall}
              className="chat-banner-btn chat-banner-btn--danger"
            >
              End Call
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

    <MessageInput
      onSendMessage={onSendMessage}
      onTyping={onTyping}
    />
  </>
);

export default ChatArea;
