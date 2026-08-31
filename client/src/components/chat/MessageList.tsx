import type { Message, AuthUser, SidebarItem } from '../../types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  authUser: AuthUser;
  selectedUser: SidebarItem;
  users: SidebarItem[];
  typingUsers: Record<string, string[]>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onDeleteMessage: (id: string) => void;
}

const MessageList = ({
  messages,
  authUser,
  selectedUser,
  users,
  typingUsers,
  messagesEndRef,
  onDeleteMessage,
}: MessageListProps) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {messages.map((msg, index) => (
      <MessageBubble
        key={index}
        msg={msg}
        authUser={authUser}
        selectedUser={selectedUser}
        users={users}
        onDeleteMessage={onDeleteMessage}
      />
    ))}

    {/* Typing Indicator */}
    {typingUsers[selectedUser._id]?.length > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
        <span>
          {typingUsers[selectedUser._id].join(', ')}{' '}
          {typingUsers[selectedUser._id].length === 1 ? 'is' : 'are'} typing...
        </span>
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
