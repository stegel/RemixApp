import React from 'react';
import { Button } from '../ui/button';
import { ADMIN_TABS, AdminTabId } from './constants';

interface AdminNavigationProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
}

export function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
  return (
    <div className="flex space-x-2 mb-6">
      {ADMIN_TABS.map(tab => (
        <Button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          variant={activeTab === tab.id ? 'default' : 'outline'}
          className={activeTab === tab.id ? 'bg-primary text-primary-foreground' : ''}
          style={{ borderRadius: 'var(--radius-button)' }}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}