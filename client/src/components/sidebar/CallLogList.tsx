import type { AuthUser, CallLog } from '../../types';
import UserAvatar from '../shared/UserAvatar';

interface CallLogListProps {
  callLogs: CallLog[];
  authUser: AuthUser | null;
  isLoading: boolean;
}

const CallLogList = ({ callLogs, authUser, isLoading }: CallLogListProps) => {
  if (isLoading) {
    return <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>Loading logs...</p>;
  }

  if (callLogs.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.9rem' }}>No call logs yet.</p>;
  }

  return (
    <>
      {callLogs.map((log) => {
        if (!authUser) return null;
        const isCaller = log.caller._id === authUser._id;
        const peerUser = isCaller ? log.receiver : log.caller;

        return (
          <div
            key={log._id}
            style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <UserAvatar user={{ username: peerUser.username, profilePic: peerUser.profilePic }} size={40} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {peerUser.username}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {/* Call type icon */}
                {log.type === 'video' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                )}

                {/* Status badge */}
                {log.status === 'missed' ? (
                  <span style={{ color: 'var(--error-color)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 10 10 16 4 10" /><line x1="10" y1="16" x2="10" y2="4" />
                    </svg>
                    Missed
                  </span>
                ) : log.status === 'rejected' ? (
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Rejected
                  </span>
                ) : (
                  <span style={{ color: 'var(--success-color)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {isCaller ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="8 14 14 8 20 14" /><line x1="14" y1="8" x2="14" y2="20" />
                        </svg>
                        Outgoing
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 10 10 16 4 10" /><line x1="10" y1="16" x2="10" y2="4" />
                        </svg>
                        Incoming
                      </>
                    )}
                  </span>
                )}

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
      })}
    </>
  );
};

export default CallLogList;
