interface SidebarTabsProps {
  activeTab: 'chats' | 'calls';
  onTabChange: (tab: 'chats' | 'calls') => void;
}

const SidebarTabs = ({ activeTab, onTabChange }: SidebarTabsProps) => (
  <div className="sidebar-tabs">
    {(['chats', 'calls'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        className={`sidebar-tab-btn${activeTab === tab ? ' sidebar-tab-btn--active' : ''}`}
      >
        {tab === 'chats' ? 'Chats' : 'Call Logs'}
      </button>
    ))}
  </div>
);

export default SidebarTabs;
