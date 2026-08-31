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
  <div className="chat-messages">
    {messages.length === 0 && (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
        opacity: 0.5,
        padding: '2rem 0',
      }}>
        No messages yet. Say hello! 👋
      </div>
    )}

    {messages.map((msg, index) => (
      <MessageBubble
        key={msg._id ?? index}
        msg={msg}
        authUser={authUser}
        selectedUser={selectedUser}
        users={users}
        onDeleteMessage={onDeleteMessage}
      />
    ))}

    {/* Typing indicator */}
    {typingUsers[selectedUser._id]?.length > 0 && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        fontStyle: 'italic',
        padding: '0.25rem 0',
      }}>
        <span>
          {typingUsers[selectedUser._id].join(', ')}{' '}
          {typingUsers[selectedUser._id].length === 1 ? 'is' : 'are'} typing…
        </span>
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
