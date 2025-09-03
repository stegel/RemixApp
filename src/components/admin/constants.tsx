// Constants and configuration for the Admin Dashboard

export const LOCATIONS = [
  { value: '__all__', label: 'All Locations' },
  { value: 'Americas', label: 'Americas' },
  { value: 'Amsterdam', label: 'Amsterdam' },
  { value: 'Hyderabad', label: 'Hyderabad' }
] as const;

export const ADMIN_TABS = [
  { id: 'evaluations', label: 'Evaluations' },
  { id: 'summary', label: 'Team Summary' },
  { id: 'analytics', label: 'Detailed Analytics' },
  { id: 'teams', label: 'Teams' }
] as const;

export type LocationValue = typeof LOCATIONS[number]['value'];
export type AdminTabId = typeof ADMIN_TABS[number]['id'];

export const ADMIN_PASSWORD = 'remix2025';