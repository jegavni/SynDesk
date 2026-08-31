import { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (payload: { text: string; image?: string; file?: string; fileType?: string }) => Promise<void>;
  onTyping: () => void;
}

const MessageInput = ({ onSendMessage, onTyping }: MessageInputProps) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10 MB limit.');
      e.target.value = '';
      return;
    }
    setSelectedFileName(file.name);
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    setSelectedFileType(type);
    const reader = new FileReader();
    reader.onloadend = () => setSelectedFile(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSelectedFileName('');
    setSelectedFileType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onSendMessage(payload);
      setText('');
      clearFile();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="chat-input-bar">
      {/* File preview strip */}
      {selectedFile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.6rem',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          {selectedFileType === 'image' ? (
            <img
              src={selectedFile}
              alt="preview"
              style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFileName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.1rem' }}>
              {selectedFileType}
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)', borderRadius: '50%', width: '28px', height: '28px', minHeight: '28px', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        {/* Attach button */}
        <input type="file" id="chat-file-input" style={{ display: 'none' }} onChange={handleFileChange} />
        <label
          htmlFor="chat-file-input"
          style={{
            flexShrink: 0,
            width: '42px',
            height: '42px',
            minHeight: '42px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background 0.2s',
          }}
          title="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </label>

        {/* Text input */}
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          placeholder="Type a message…"
          style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            padding: '0.6rem 1rem',
            color: 'white',
            fontSize: '16px', /* prevent Android zoom */
            outline: 'none',
            height: '42px',
          }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isUploading}
          style={{
            flexShrink: 0,
            borderRadius: 'var(--radius-full)',
            padding: '0 1.1rem',
            height: '42px',
            minHeight: '42px',
            fontSize: '0.875rem',
          }}
        >
          {isUploading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
