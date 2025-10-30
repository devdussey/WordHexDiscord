import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { ErrorBoundary } from './components/ErrorBoundary';
import { errorLogger } from './utils/errorLogger';
import { ErrorType, ErrorSeverity } from './types/errors';

// Polyfill for Discord's broken event.once
if (typeof EventTarget !== 'undefined' && EventTarget.prototype) {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  if (!('once' in Object.getOwnPropertyDescriptor(EventTarget.prototype, 'addEventListener')?.value || {})) {
    console.log('[Polyfill] Adding event.once support');
  }
}

// Add once method to any event emitter that doesn't have it
(window as any).EventEmitter = class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  once(event: string, callback: Function) {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }
};

// Debug utilities
export const DEBUG = true;
function debug(...args: unknown[]) {
  if (DEBUG) {
    console.log('[Debug]', ...args);
  }
}

function getQueryParam(param: string): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  } catch (e) {
    console.error('Failed to parse URL parameters:', e);
    return null;
  }
}

async function waitForDOMLoaded() {
  if (document.readyState === 'complete') return;
  return new Promise<void>(resolve => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

async function initializeDiscordSDK(clientId: string) {
  debug('Starting Discord SDK initialization...');
  await waitForDOMLoaded();

  // Create container first
  const container = document.createElement('div');
  container.id = 'discord-sdk-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  debug('Created SDK container');

  // Initialize SDK
  try {
    debug('Creating Discord SDK instance...');
    const sdk = new DiscordSDK(clientId);
    
    // Set a reasonable timeout for initialization
    const timeoutMs = 15000; // Increased timeout for slower connections
    
    await Promise.race([
      sdk.ready().then(() => {
        debug('Discord SDK ready() completed');
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discord SDK initialization timeout')), timeoutMs)
      )
    ]);

    // At this point, the SDK is ready to use
    debug('Discord SDK ready, checking connectivity...');
    return sdk;
  } catch (error) {
    console.error('Discord SDK initialization error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      origin: window.location.origin,
      clientId
    });
    throw error;
  }
}

async function initializeApp() {
  debug('Starting app initialization...');
  
  // First check if root element exists
  if (!document.getElementById('root')) {
    throw new Error('Root element #root not found in DOM');
  }

  let discord = null;
  
  // Check if we should initialize Discord
  const frameId = getQueryParam('frame_id');
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

  debug('Discord check:', { frameId: !!frameId, clientId: !!clientId, actualClientId: clientId });

  if (frameId && clientId) {
    try {
      discord = await initializeDiscordSDK(clientId);
      debug('Discord SDK initialized successfully');

      try {
        await discord.commands.authorize({
          client_id: clientId,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds']
        });
        debug('Discord authorization successful');
      } catch (authError) {
        console.warn(
          'Discord authorization failed (continuing in limited mode):',
          authError instanceof Error ? authError.message : authError
        );
      }
    } catch (discordError) {
      // Log but don't throw - app should work without Discord
      console.warn(
        'Discord integration disabled:',
        discordError instanceof Error ? discordError.message : discordError
      );
    }
  } else {
    debug('Running in standalone mode - Discord features will be limited');
    debug('Missing:', !frameId ? 'frame_id' : '', !clientId ? 'client_id' : '');
  }

  window.onerror = (message, source, lineno, colno, error) => {
    errorLogger.logError(
      error || new Error(String(message)),
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      'An unexpected error occurred',
      { source, lineno, colno }
    );
    return false;
  };

  window.onunhandledrejection = (event) => {
    errorLogger.logError(
      event.reason,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      'An unexpected error occurred in the background',
      { promiseRejection: true }
    );
  };

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ErrorProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

initializeApp().catch(error => {
  console.error('Failed to initialize app:', error);
  // Still try to render error UI
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-lg text-white">
              <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
              <p className="text-red-400 mb-4">{error instanceof Error ? error.message : String(error)}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
              >
                Reload page
              </button>
            </div>
          </div>
        </ErrorBoundary>
      </StrictMode>
    );
  }
});
