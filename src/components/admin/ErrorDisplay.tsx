import React from 'react';

interface ErrorDisplayProps {
  error: string;
}

function isDatabaseError(error: string): boolean {
  return error.includes('Could not find the table');
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-destructive mb-6" style={{ borderRadius: 'var(--radius)' }}>
      <p>{error}</p>
      {isDatabaseError(error) && (
        <div className="mt-3 p-3 bg-muted rounded" style={{ borderRadius: 'var(--radius)' }}>
          <p className="text-sm font-semibold mb-2 text-foreground">To fix this error:</p>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to the SQL Editor</li>
            <li>Copy and paste the contents of <code>/database-schema.sql</code></li>
            <li>Run the SQL script to create the required tables</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  );
}