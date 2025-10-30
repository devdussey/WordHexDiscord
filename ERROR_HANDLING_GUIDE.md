# Comprehensive Error Handling Strategy

Your application now includes a production-ready error handling system with the following components:

## Overview

The error handling system provides:
- User-friendly error messages
- Automatic error logging with offline queue
- Network failure detection and recovery
- Validation utilities
- API retry logic with exponential backoff
- Graceful degradation
- Error boundary with auto-recovery

## Architecture

### 1. Error Types (`src/types/errors.ts`)
Defines custom error classes for different scenarios:
- `NetworkError` - Network connectivity issues
- `APIError` - API request failures
- `ValidationError` - Form/input validation failures
- `AuthError` - Authentication failures
- `DatabaseError` - Database operation failures

Each error includes:
- Type classification
- Severity level (LOW, MEDIUM, HIGH, CRITICAL)
- User-friendly message
- Retry capability flag
- Context metadata

### 2. Error Logger (`src/utils/errorLogger.ts`)
Centralized error logging service with:
- **Offline Queue**: Stores errors locally when offline
- **Auto-sync**: Syncs errors to database when connection restored
- **Severity-based Handling**: Critical errors sync immediately
- **Local Storage**: Persists queue across sessions
- **Automatic Cleanup**: Removes old synced errors

### 3. Network Status Hook (`src/hooks/useNetworkStatus.ts`)
Real-time network monitoring:
- Tracks online/offline state
- Measures downtime duration
- Updates automatically on connectivity changes

### 4. Error Notification Component (`src/components/ErrorNotification.tsx`)
User interface for errors:
- **Auto-dismiss**: Low/medium severity errors auto-hide
- **Color-coded**: Severity-based color schemes
- **Retry Button**: For retryable errors
- **Offline Banner**: Persistent banner when offline
- **Accessible**: ARIA labels and live regions

### 5. API Client (`src/utils/apiClient.ts`)
Enhanced HTTP client with:
- **Automatic Retries**: Exponential backoff for failed requests
- **Timeout Handling**: Configurable request timeouts
- **Status Code Mapping**: User-friendly messages per status
- **Error Logging**: Automatic error logging
- **Offline Detection**: Fails fast when offline

Example configuration:
```typescript
const client = new ApiClient('https://api.example.com', {}, {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
});
```

### 6. Validation Utilities (`src/utils/validation.ts`)
Comprehensive validation system:
- **Pre-built Rules**: Required, email, length, pattern, etc.
- **Custom Rules**: Easy to add custom validators
- **Schema Validation**: Validate entire objects
- **Field-level Errors**: Detailed error messages per field

### 7. Error Boundary (`src/components/ErrorBoundary.tsx`)
React error boundary with:
- **Auto-recovery**: Attempts to recover from non-critical errors
- **Multiple Strategies**: Try again, reload, or go home
- **Error Count Tracking**: Escalates after repeated failures
- **Custom Fallback**: Optional custom error UI
- **Development Mode**: Shows component stack in dev

### 8. Error Context (`src/contexts/ErrorContext.tsx`)
Global error state management:
- **showError()**: Display errors to users
- **clearError()**: Dismiss current error
- **logError()**: Log errors with automatic handling
- **useErrorHandler()**: Simplified error handling hook

### 9. Database Migration (`supabase/migrations/20251029160757_create_error_logs_table.sql`)
Error logs table with:
- All error metadata
- Time-based indexes for queries
- Row-level security policies
- JSON context storage

## Common Use Cases

### 1. Network Failures
```typescript
try {
  await fetchData();
} catch (error) {
  handleError(error, {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Unable to connect. Please check your internet.'
  });
}
```

The system will:
- Automatically retry the request
- Show offline banner if no connection
- Queue error for logging when offline
- Provide retry button to user

### 2. API Errors
```typescript
const client = new ApiClient('https://api.example.com');
const data = await client.get('/endpoint'); // Auto-retry + logging
```

The ApiClient handles:
- Status code interpretation
- User-friendly messages
- Automatic retries for 5xx errors
- Error logging
- Timeout handling

### 3. Form Validation
```typescript
const schema = {
  email: [ValidationRules.required(), ValidationRules.email()],
  age: [ValidationRules.min(18)]
};

const result = validateSchema(formData, schema);
if (!result.valid) {
  setErrors(result.errors); // Display per-field errors
}
```

### 4. Database Operations
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*');

if (error) {
  throw new DatabaseError('Failed to fetch users', error);
}
```

The error will be:
- Logged automatically
- Shown to user with friendly message
- Queued if offline
- Marked as retryable

## Integration Points

### In Components
```typescript
import { useError } from './contexts/ErrorContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';

function MyComponent() {
  const { showError } = useError();
  const networkStatus = useNetworkStatus();

  // Use in your component logic
}
```

### In API Calls
```typescript
import { ApiClient } from './utils/apiClient';

const api = new ApiClient('https://api.example.com');
const data = await api.get('/endpoint', {
  timeout: 5000,
  retry: { maxRetries: 5 }
});
```

### In Forms
```typescript
import { validateSchema, ValidationRules } from './utils/validation';

const result = validateSchema(data, schema);
```

## Monitoring & Analytics

Errors are automatically logged to the `error_logs` table with:
- Error type and severity
- User-friendly and technical messages
- Context metadata
- Timestamp
- Retry status

Query error logs:
```sql
SELECT * FROM error_logs
WHERE severity = 'CRITICAL'
ORDER BY timestamp DESC
LIMIT 100;
```

Analyze error patterns:
```sql
SELECT error_type, COUNT(*) as count
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;
```

## Offline Support

The system provides graceful offline handling:

1. **Detection**: Network status hook detects offline state
2. **UI Feedback**: Persistent offline banner shown
3. **Queueing**: Errors queued locally for later sync
4. **Recovery**: Auto-sync when connection restored
5. **Graceful Degradation**: Features degrade appropriately

## Best Practices

1. **Always use user-friendly messages**: Never show raw error messages to users
2. **Choose appropriate severity**: Use CRITICAL sparingly
3. **Provide context**: Include relevant metadata in error logs
4. **Handle retries**: Use ApiClient for automatic retries
5. **Validate early**: Validate input before API calls
6. **Test offline**: Test your app's offline behavior
7. **Monitor logs**: Regularly check error logs for patterns
8. **Graceful fallbacks**: Provide alternatives when features fail

## Testing Error Scenarios

To test error handling:

1. **Network Errors**: Turn off internet connection
2. **API Errors**: Mock failed API responses
3. **Validation**: Submit invalid form data
4. **Timeouts**: Set low timeout values
5. **Critical Errors**: Throw errors in components

## Performance Considerations

- Error queue limited to 100 items
- Syncs every 30 seconds when online
- Critical errors sync immediately
- Old errors auto-deleted after 24 hours
- Local storage used for persistence

## Security

- RLS enabled on error_logs table
- No sensitive data in error messages
- Context sanitized before logging
- User can only see own errors

## Files Created

1. `src/types/errors.ts` - Error type definitions
2. `src/utils/errorLogger.ts` - Error logging service
3. `src/utils/apiClient.ts` - Enhanced HTTP client
4. `src/utils/validation.ts` - Validation utilities
5. `src/hooks/useNetworkStatus.ts` - Network monitoring
6. `src/components/ErrorNotification.tsx` - Error UI
7. `src/components/ErrorBoundary.tsx` - Enhanced boundary
8. `src/contexts/ErrorContext.tsx` - Global error state
9. `supabase/migrations/20251029160757_create_error_logs_table.sql` - Database schema
10. `ERROR_HANDLING_EXAMPLES.md` - Usage examples
11. `ERROR_HANDLING_GUIDE.md` - This guide

## Next Steps

1. Apply database migration
2. Review examples in ERROR_HANDLING_EXAMPLES.md
3. Integrate error handling into existing components
4. Test offline scenarios
5. Monitor error logs in production
6. Customize error messages for your use case
7. Add application-specific error types as needed

For detailed examples of each use case, see `ERROR_HANDLING_EXAMPLES.md`.
