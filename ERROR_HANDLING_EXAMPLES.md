# Error Handling Examples

This document provides examples of how to use the comprehensive error handling system in your application.

## Table of Contents
1. [Basic Error Handling](#basic-error-handling)
2. [Network Errors](#network-errors)
3. [API Errors](#api-errors)
4. [Validation Errors](#validation-errors)
5. [Database Errors](#database-errors)
6. [Using the Error Context](#using-the-error-context)
7. [Custom Error Handling](#custom-error-handling)
8. [Offline Support](#offline-support)

## Basic Error Handling

### Using the Error Hook

```typescript
import { useErrorHandler } from './contexts/ErrorContext';
import { ErrorType, ErrorSeverity } from './types/errors';

function MyComponent() {
  const handleError = useErrorHandler();

  const handleAction = async () => {
    try {
      // Your code here
      await someAsyncOperation();
    } catch (error) {
      handleError(error, {
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'Failed to complete the action. Please try again.'
      });
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

## Network Errors

### Handling Network Failures with Retry

```typescript
import { ApiClient } from './utils/apiClient';
import { useError } from './contexts/ErrorContext';

function DataFetcher() {
  const { showError } = useError();
  const [data, setData] = useState(null);

  const apiClient = new ApiClient('https://api.example.com');

  const fetchData = async () => {
    try {
      const result = await apiClient.get('/data', {
        timeout: 10000,
        retry: {
          maxRetries: 3,
          initialDelay: 1000
        }
      });
      setData(result);
    } catch (error) {
      // Error is automatically logged by ApiClient
      showError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Unable to load data. Check your connection.',
        timestamp: Date.now(),
        retryable: true
      });
    }
  };

  return (
    <div>
      <button onClick={fetchData}>Load Data</button>
    </div>
  );
}
```

### Detecting Offline Status

```typescript
import { useNetworkStatus } from './hooks/useNetworkStatus';

function NetworkAwareComponent() {
  const networkStatus = useNetworkStatus();

  if (!networkStatus.online) {
    return (
      <div className="alert alert-warning">
        You are offline. Some features may not be available.
      </div>
    );
  }

  return <div>Normal content</div>;
}
```

## API Errors

### Handling Different Status Codes

```typescript
import { ApiClient } from './utils/apiClient';
import { APIError } from './types/errors';

const apiClient = new ApiClient('https://api.example.com');

async function updateProfile(data: any) {
  try {
    const result = await apiClient.put('/profile', data);
    return result;
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.statusCode) {
        case 400:
          // Validation error
          throw new ValidationError('Invalid profile data', error.originalError);
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Show permission denied message
          throw error;
        case 404:
          // Resource not found
          throw new Error('Profile not found');
        default:
          throw error;
      }
    }
    throw error;
  }
}
```

## Validation Errors

### Form Validation

```typescript
import { validateSchema, ValidationRules } from './utils/validation';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: 0
  });
  const [errors, setErrors] = useState({});

  const validationSchema = {
    username: [
      ValidationRules.required('Username is required'),
      ValidationRules.username()
    ],
    email: [
      ValidationRules.required('Email is required'),
      ValidationRules.email()
    ],
    age: [
      ValidationRules.required('Age is required'),
      ValidationRules.min(18, 'You must be at least 18 years old')
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateSchema(formData, validationSchema);

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    // Proceed with form submission
    submitForm(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      {errors.username && <span className="error">{errors.username}</span>}

      {/* Other fields... */}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Validation Rules

```typescript
import { ValidationRules } from './utils/validation';

const passwordSchema = {
  password: [
    ValidationRules.required('Password is required'),
    ValidationRules.minLength(8, 'Password must be at least 8 characters'),
    ValidationRules.custom(
      (value) => /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value),
      'Password must contain uppercase, lowercase, and numbers'
    )
  ],
  confirmPassword: [
    ValidationRules.required('Please confirm your password'),
    ValidationRules.custom(
      (value) => value === formData.password,
      'Passwords do not match'
    )
  ]
};
```

## Database Errors

### Handling Supabase Errors

```typescript
import { supabase } from './lib/supabase';
import { DatabaseError } from './types/errors';
import { errorLogger } from './utils/errorLogger';

async function saveGameScore(score: number) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert({ score, player_name: 'Player' })
      .select()
      .single();

    if (error) {
      const dbError = new DatabaseError('Failed to save score', error);
      errorLogger.logError(
        dbError,
        ErrorType.DATABASE,
        ErrorSeverity.HIGH,
        'Unable to save your score. Please try again.',
        { score, error: error.message }
      );
      throw dbError;
    }

    return data;
  } catch (error) {
    // Handle error appropriately
    throw error;
  }
}
```

### Transaction-like Operations

```typescript
async function updateUserAndStats(userId: string, updates: any) {
  try {
    // Update user
    const { error: userError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (userError) {
      throw new DatabaseError('Failed to update user', userError);
    }

    // Update stats
    const { error: statsError } = await supabase
      .from('user_stats')
      .update({ last_updated: new Date().toISOString() })
      .eq('user_id', userId);

    if (statsError) {
      // Ideally, you'd want to rollback the user update here
      throw new DatabaseError('Failed to update stats', statsError);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DatabaseError) {
      errorLogger.logError(
        error,
        ErrorType.DATABASE,
        ErrorSeverity.HIGH,
        'Failed to update your profile. Please try again.'
      );
    }
    throw error;
  }
}
```

## Using the Error Context

### Showing Errors to Users

```typescript
import { useError } from './contexts/ErrorContext';
import { ErrorType, ErrorSeverity } from './types/errors';

function MyComponent() {
  const { showError } = useError();

  const handleCriticalAction = async () => {
    try {
      await performCriticalOperation();
    } catch (error) {
      // This will show a notification to the user
      showError({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.CRITICAL,
        message: error.message,
        userMessage: 'A critical error occurred. Please contact support.',
        timestamp: Date.now(),
        retryable: false,
        context: { operation: 'critical-action' }
      });
    }
  };

  return <button onClick={handleCriticalAction}>Critical Action</button>;
}
```

### Silent Error Logging

```typescript
import { useErrorHandler } from './contexts/ErrorContext';

function AnalyticsComponent() {
  const handleError = useErrorHandler();

  const trackEvent = async (event: string) => {
    try {
      await analytics.track(event);
    } catch (error) {
      // Log the error but don't show it to the user
      handleError(error, {
        type: ErrorType.API,
        severity: ErrorSeverity.LOW,
        userMessage: 'Analytics tracking failed',
        silent: true
      });
    }
  };

  return <div>Component content</div>;
}
```

## Custom Error Handling

### Creating Custom Error Types

```typescript
import { ErrorType, ErrorSeverity } from './types/errors';

class PaymentError extends Error {
  type = ErrorType.API;
  severity = ErrorSeverity.HIGH;
  retryable = false;

  constructor(
    message: string,
    public paymentId?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

async function processPayment(amount: number) {
  try {
    const result = await paymentApi.charge(amount);
    return result;
  } catch (error) {
    throw new PaymentError(
      'Payment processing failed',
      error.paymentId,
      error
    );
  }
}
```

### Error Boundaries for Specific Components

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <div>
      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="error-container">
            <h2>Chat component failed</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Retry</button>
          </div>
        )}
        onError={(error, errorInfo) => {
          // Custom error handling
          console.log('Chat error:', error);
        }}
      >
        <ChatComponent />
      </ErrorBoundary>

      <OtherComponents />
    </div>
  );
}
```

## Offline Support

### Queueing Actions While Offline

```typescript
import { useNetworkStatus } from './hooks/useNetworkStatus';

function OfflineAwareForm() {
  const networkStatus = useNetworkStatus();
  const [pendingActions, setPendingActions] = useState([]);

  const handleSubmit = async (data: any) => {
    if (!networkStatus.online) {
      // Queue the action for when we're back online
      setPendingActions([...pendingActions, { type: 'submit', data }]);
      showNotification('Action queued. Will be sent when online.');
      return;
    }

    try {
      await submitData(data);
    } catch (error) {
      handleError(error);
    }
  };

  useEffect(() => {
    if (networkStatus.online && pendingActions.length > 0) {
      // Process pending actions
      pendingActions.forEach(action => {
        if (action.type === 'submit') {
          submitData(action.data);
        }
      });
      setPendingActions([]);
    }
  }, [networkStatus.online, pendingActions]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Graceful Degradation

```typescript
import { useNetworkStatus } from './hooks/useNetworkStatus';

function FeatureComponent() {
  const networkStatus = useNetworkStatus();
  const [cachedData, setCachedData] = useState(null);

  const loadData = async () => {
    if (!networkStatus.online) {
      // Use cached data
      const cached = localStorage.getItem('cached-data');
      if (cached) {
        setCachedData(JSON.parse(cached));
        return;
      }
    }

    try {
      const data = await fetchData();
      setCachedData(data);
      localStorage.setItem('cached-data', JSON.stringify(data));
    } catch (error) {
      // Try to use cached data as fallback
      const cached = localStorage.getItem('cached-data');
      if (cached) {
        setCachedData(JSON.parse(cached));
        showWarning('Using cached data due to connection issues');
      } else {
        handleError(error);
      }
    }
  };

  return (
    <div>
      {!networkStatus.online && cachedData && (
        <div className="warning-banner">
          Showing cached data (you are offline)
        </div>
      )}
      {/* Render data */}
    </div>
  );
}
```

## Best Practices

1. **Always provide user-friendly messages**: Technical errors should not be shown directly to users
2. **Log errors appropriately**: Use the correct severity level
3. **Handle retryable errors**: Implement retry logic for network and server errors
4. **Validate early**: Validate user input before making API calls
5. **Use specific error types**: This helps with error tracking and debugging
6. **Test error scenarios**: Test your error handling with network failures, API errors, etc.
7. **Graceful degradation**: Provide fallbacks when features are unavailable
8. **Monitor error logs**: Regularly check error logs in the database to identify issues
