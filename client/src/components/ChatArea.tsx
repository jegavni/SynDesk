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
}: ChatAreaProps) => (
  <>
    <ChatHeader
      isMobile={isMobile}
      selectedUser={selectedUser}
      onlineUsers={onlineUsers}
      onBack={onBack}
      onInitiateCall={onInitiateCall}
    />

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
