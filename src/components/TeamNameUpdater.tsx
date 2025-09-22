import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { typographyStyles } from '../utils/ui-helpers';
import { updateTeamNameByNumber, Team } from '../utils/api';
import { Download, Upload } from 'lucide-react';

interface TeamUpdateInput {
  teamNumber: number;
  newName: string;
}

interface UpdateResult {
  success: number;
  errors: string[];
  total: number;
}

export function TeamNameUpdater() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [updateResults, setUpdateResults] = useState<UpdateResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csvText: string): TeamUpdateInput[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Skip header if it exists (check if first line contains expected headers)
    const firstLine = lines[0].toLowerCase();
    const hasHeader = (firstLine.includes('team') && firstLine.includes('name')) || 
                      (firstLine.includes('number') && firstLine.includes('name'));
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
      const rowNumber = hasHeader ? index + 2 : index + 1;

      if (values.length < 2) {
        throw new Error(`Row ${rowNumber}: Invalid format. Expected Team Number and New Team Name`);
      }

      const teamNumberStr = values[0];
      const newName = values[1];

      if (!teamNumberStr || !newName?.trim()) {
        throw new Error(`Row ${rowNumber}: Both team number and new name are required`);
      }

      // Parse team number
      const teamNumber = parseInt(teamNumberStr);
      if (isNaN(teamNumber) || teamNumber <= 0) {
        throw new Error(`Row ${rowNumber}: Team number must be a positive integer`);
      }

      return {
        teamNumber,
        newName: newName.trim()
      };
    });
  };

  const handleCSVUpdate = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setUpdating(true);
    setError(null);
    setUpdateResults(null);

    try {
      const csvText = await csvFile.text();
      const updates = parseCSV(csvText);
      
      const results = await updateTeamNamesFromCSV(updates);
      setUpdateResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team names');
    } finally {
      setUpdating(false);
    }
  };

  const updateTeamNamesFromCSV = async (updates: TeamUpdateInput[]): Promise<UpdateResult> => {
    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      try {
        // Update by team number
        await updateTeamNameByNumber(update.teamNumber, update.newName);
        success++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    return {
      success,
      errors,
      total: updates.length
    };
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Team Number,New Team Name',
      '101,Engineering Innovation Team',
      '102,Design Excellence Team',
      '103,Product Strategy Team'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-name-updates-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCsvFile(null);
    setUpdateResults(null);
    setError(null);
  };

  return (
    <Card style={{ borderRadius: 'var(--radius-card)' }}>
      <CardHeader>
        <CardTitle style={typographyStyles.h2}>
          Update Team Names
        </CardTitle>
        <CardDescription style={typographyStyles.muted}>
          Bulk update team names using a CSV file upload
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              style={{ 
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-lato)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-bold)'
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Update Team Names from CSV
            </Button>
          </DialogTrigger>
          <DialogContent style={{ borderRadius: 'var(--radius)' }}>
            <DialogHeader>
              <DialogTitle style={typographyStyles.h2}>
                Update Team Names from CSV
              </DialogTitle>
              <DialogDescription style={typographyStyles.muted}>
                Upload a CSV file to bulk update team names. Format: Team Number, New Team Name
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {error && (
                <div 
                  className="p-3 border border-destructive bg-destructive/10 text-destructive" 
                  style={{ 
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-family-lato)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)'
                  }}
                >
                  {error}
                </div>
              )}
              
              {updateResults && (
                <div 
                  className="p-3 border border-accent bg-accent/10 text-accent-foreground" 
                  style={{ 
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-family-lato)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)'
                  }}
                >
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Update Results:</p>
                  <p className="text-[rgba(3,0,0,1)]">Successfully updated {updateResults.success} out of {updateResults.total} teams</p>
                  {updateResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Errors:</p>
                      <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                        {updateResults.errors.map((error, index) => (
                          <li 
                            key={index} 
                            style={{ 
                              fontSize: 'var(--text-label)',
                              fontFamily: 'var(--font-family-lato)',
                              fontWeight: 'var(--font-weight-regular)'
                            }}
                          >
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label 
                  htmlFor="csvFile" 
                  style={{
                    ...typographyStyles.label,
                    fontFamily: 'var(--font-family-lato)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)'
                  }}
                >
                  Select CSV File
                </Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="border-border"
                  style={{ 
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--input-background)',
                    fontFamily: 'var(--font-family-lato)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)'
                  }}
                />
                <p 
                  className="text-muted-foreground"
                  style={{
                    fontSize: 'var(--text-label)',
                    fontFamily: 'var(--font-family-lato)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)'
                  }}
                >
                  Expected format: Team Number, New Team Name (header row optional)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCSV}
                  style={{ 
                    borderRadius: 'var(--radius-button)',
                    fontFamily: 'var(--font-family-lato)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-bold)'
                  }}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Sample
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                style={{ 
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-lato)',
                  fontSize: 'var(--text-base)', 
                  fontWeight: 'var(--font-weight-bold)'
                }}
              >
                Close
              </Button>
              <Button
                onClick={handleCSVUpdate}
                disabled={!csvFile || updating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                style={{ 
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-lato)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-bold)'
                }}
              >
                {updating ? 'Updating...' : 'Update Team Names'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}