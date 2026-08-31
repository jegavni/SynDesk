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

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
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
      setSelectedFile(null);
      setSelectedFileName('');
      setSelectedFileType('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
      {/* File Preview */}
      {selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', marginBottom: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
          {selectedFileType === 'image' ? (
            <img src={selectedFile} alt="preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {selectedFileName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {selectedFileType.toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '0.25rem 0.5rem', width: 'auto', borderRadius: 'var(--radius-sm)' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input type="file" id="chat-file-input" style={{ display: 'none' }} onChange={handleChatFileChange} />
        <label
          htmlFor="chat-file-input"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
          title="Attach a file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: 'var(--bg-color)', color: 'white', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isUploading}
          style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 1.5rem' }}
        >
          {isUploading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
