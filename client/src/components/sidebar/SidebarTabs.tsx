interface SidebarTabsProps {
  activeTab: 'chats' | 'calls';
  onTabChange: (tab: 'chats' | 'calls') => void;
}

const SidebarTabs = ({ activeTab, onTabChange }: SidebarTabsProps) => (
  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
    {(['chats', 'calls'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.05)' : 'transparent',
          color: activeTab === tab ? 'white' : 'var(--text-secondary)',
          border: 'none',
          borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : 'none',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.9rem',
          borderRadius: 0,
        }}
      >
        {tab === 'chats' ? 'Chats' : 'Call Logs'}
      </button>
    ))}
  </div>
);

export default SidebarTabs;
