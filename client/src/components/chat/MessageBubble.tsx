import type { Message, AuthUser, SidebarItem } from '../../types';

interface MessageBubbleProps {
  msg: Message;
  authUser: AuthUser;
  selectedUser: SidebarItem;
  users: SidebarItem[];
  onDeleteMessage: (id: string) => void;
}

const MessageBubble = ({ msg, authUser, selectedUser, users, onDeleteMessage }: MessageBubbleProps) => {
  const isMine = msg.senderId === authUser._id;

  let senderName = '';
  if (selectedUser.isGroup && !isMine) {
    const senderUser = users.find(u => u._id === msg.senderId);
    senderName = senderUser ? senderUser.username : 'Group Member';
  }

  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
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

        {/* Attachment */}
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
              <audio src={msg.fileUrl} controls style={{ maxWidth: '100%', display: 'block' }} />
            ) : (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', filter: 'brightness(1.4)', textDecoration: 'underline', fontWeight: '500' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
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
                  onDeleteMessage(msg._id!);
                }
              }}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              title="Delete for everyone"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
