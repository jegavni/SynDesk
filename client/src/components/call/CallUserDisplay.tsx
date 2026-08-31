import './call.css';

interface CallUserDisplayProps {
  username?: string;
  profilePic?: string;
  /** 'ringing' | 'calling' | 'connected' | 'incoming' */
  pulseVariant?: 'indigo' | 'green';
  size?: number;
  showConnectedDot?: boolean;
}

const CallUserDisplay = ({
  username,
  profilePic,
  pulseVariant = 'indigo',
  showConnectedDot = false,
}: CallUserDisplayProps) => (
  <div className={`call-avatar-wrap${pulseVariant === 'green' ? ' call-avatar-wrap--connected' : ''}`}>
    {profilePic ? (
      <img className="call-avatar-img" src={profilePic} alt={username} />
    ) : (
      <div className="call-avatar-initials">
        {username?.charAt(0).toUpperCase() ?? '?'}
      </div>
    )}
    {showConnectedDot && <div className="call-connected-dot" />}
  </div>
);

export default CallUserDisplay;
