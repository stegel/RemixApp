import { checkSchemaStatus, reloadSchemaCache } from './api';

export interface DatabaseStatus {
  isConnected: boolean;
  tablesExist: boolean;
  error?: string;
  details?: {
    teams: boolean;
    evaluations: boolean;
    functions: boolean;
  };
}

export const checkDatabaseStatus = async (): Promise<DatabaseStatus> => {
  try {
    const schemaStatus = await checkSchemaStatus();
    
    return {
      isConnected: schemaStatus.success,
      tablesExist: schemaStatus.ready,
      details: schemaStatus.checks,
      error: schemaStatus.error
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Could not find the table') || errorMessage.includes('schema cache')) {
      return {
        isConnected: true,
        tablesExist: false,
        error: 'Database tables not found - schema cache may need refresh'
      };
    }
    
    return {
      isConnected: false,
      tablesExist: false,
      error: errorMessage
    };
  }
};

export const refreshSchemaCache = async (): Promise<{ success: boolean; message: string }> => {
  try {
    return await reloadSchemaCache();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to refresh schema cache');
  }
};