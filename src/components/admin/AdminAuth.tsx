import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { typographyStyles } from '../../utils/ui-helpers';
import { Lock } from 'lucide-react';


interface AdminAuthProps {
  onAuthenticated: () => void;
}

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'remix2025') {
      onAuthenticated();
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card style={{ borderRadius: 'var(--radius-card)' }}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle style={typographyStyles.h2}>
            Admin Access Required
          </CardTitle>
          <CardDescription style={typographyStyles.muted}>
            Please enter the admin password to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderRadius: 'var(--radius)' }}
                className="w-full border-border"
              />
              {passwordError && (
                <p className="mt-2 text-sm text-destructive" style={{ 
                  fontFamily: 'var(--font-family-lato)', 
                  fontSize: 'var(--text-label)', 
                  fontWeight: 'var(--font-weight-regular)'
                }}>
                  {passwordError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
              style={{ borderRadius: 'var(--radius-button)' }}
            >
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}