import { TeamAnalytics } from '../../utils/api';
import { LocationValue } from './constants';

// Helper functions for AdminDashboard

export function filterAnalyticsByLocation(analytics: TeamAnalytics[], location: LocationValue): TeamAnalytics[] {
  if (location === '__all__') {
    return analytics;
  }
  return analytics.filter(team => team.location === location);
}

export function getLocationTeamCount(analytics: TeamAnalytics[], location: LocationValue): number {
  return filterAnalyticsByLocation(analytics, location).length;
}

