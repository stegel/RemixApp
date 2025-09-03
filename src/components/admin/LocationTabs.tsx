import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TeamSummaryTable } from '../TeamSummaryTable';
import { TeamAnalytics } from '../../utils/api';
import { LOCATIONS, LocationValue } from './constants';
import { filterAnalyticsByLocation, getLocationTeamCount } from './helpers';

interface LocationTabsProps {
  analytics: TeamAnalytics[];
  filterLocation: LocationValue;
  onLocationChange: (location: LocationValue) => void;
}

export function LocationTabs({ analytics, filterLocation, onLocationChange }: LocationTabsProps) {
  return (
    <Tabs value={filterLocation} onValueChange={onLocationChange} className="w-full">
      <TabsList 
        className="grid w-full grid-cols-4 mb-6 bg-muted p-1 h-auto" 
        style={{ 
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-family-lato)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)'
        }}
      >
        {LOCATIONS.map(location => (
          <TabsTrigger 
            key={location.value}
            value={location.value} 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors flex flex-col items-center justify-center h-auto py-2"
            style={{ 
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-lato)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)'
            }}
          >
            <span>{location.label}</span>
            <span style={{ fontSize: 'var(--text-label)', opacity: 0.7 }}>
              ({getLocationTeamCount(analytics, location.value)} teams)
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      
      {LOCATIONS.map(location => (
        <TabsContent key={location.value} value={location.value} className="mt-0">
          <TeamSummaryTable 
            analytics={filterAnalyticsByLocation(analytics, location.value)}
            filteredLocation={location.value}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}