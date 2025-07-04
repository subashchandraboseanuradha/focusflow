// Utility function to test database connectivity and schema
export async function testDatabaseConnection(supabase: any) {
  try {
    // Test 1: Check if we can access the flows table schema
    const { data, error } = await supabase
      .from('flows')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database test failed:', error);
      return {
        success: false,
        error: error.message,
        suggestion: getDatabaseErrorSuggestion(error)
      };
    }
    
    return {
      success: true,
      message: 'Database connection successful'
    };
    
  } catch (err) {
    console.error('Database test exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      suggestion: 'Please check your internet connection and try again.'
    };
  }
}

function getDatabaseErrorSuggestion(error: any): string {
  if (error.message?.includes('user_id') && error.message?.includes('schema cache')) {
    return 'Schema cache issue detected. Please refresh the page and try again.';
  }
  
  if (error.message?.includes('relation "flows" does not exist')) {
    return 'Database tables are missing. Please run the database migration.';
  }
  
  if (error.message?.includes('permission denied')) {
    return 'Permission issue. Please check your authentication status.';
  }
  
  if (error.code === 'PGRST116') {
    return 'Authentication required. Please sign in and try again.';
  }
  
  return 'Database connection issue. Please try again or contact support.';
}
