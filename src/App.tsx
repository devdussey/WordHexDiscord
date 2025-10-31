import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MainMenu } from './components/MainMenu';
import { TurnBasedGame } from './components/TurnBasedGame';
import { Statistics } from './components/Statistics';
import { Options } from './components/Options';
import { LobbySelection } from './components/LobbySelection';
import { LobbyRoom } from './components/LobbyRoom';
import { Leaderboard } from './components/Leaderboard';
import { useAuth } from './contexts/AuthContext';
import { useError } from './contexts/ErrorContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { ErrorNotification, OfflineBanner } from './components/ErrorNotification';
import { api } from './services/api';
import { ErrorType, ErrorSeverity } from './types/errors';
import type { LobbySummary, MatchSummary } from './types/api';

type Page =
  | 'menu'
  | 'lobby-selection'
  | 'lobby-room'
  | 'play'
  | 'statistics'
  | 'leaderboard'
  | 'options';

function App() {
  const { user, getUsername, loading } = useAuth();
  const { currentError, clearError, showError, logError } = useError();
  const networkStatus = useNetworkStatus();
  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [activeLobby, setActiveLobby] = useState<LobbySummary | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<MatchSummary | null>(null);
  const serverId = 'dev-server-123';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white">Connecting to WordHex…</h2>
          <p className="text-purple-200 mt-2">Getting your player profile ready.</p>
        </div>
      </div>
    );
  }

  const playerName = getUsername();
  const playerId = user.id;

  const handlePlayClick = () => {
    setCurrentPage('lobby-selection');
  };
  const handleStartLobby = async () => {
    try {
      const response = await api.lobby.create({
        hostId: playerId,
        username: playerName,
        serverId,
      });
      const lobby = response?.lobby;
      if (!lobby) {
        throw new Error('Failed to create lobby');
      }
      setActiveLobby(lobby);
      setIsHost(true);
      setCurrentPage('lobby-room');
    } catch (error) {
      logError(error, ErrorType.NETWORK, ErrorSeverity.HIGH, 'Could not create lobby');
    }
  };

  const handleStartGame = (match: MatchSummary) => {
    setCurrentMatch(match);
    setCurrentPage('play');
  };

  const handleJoinSession = async (code: string) => {
    try {
      const response = await api.lobby.join({
        code,
        userId: playerId,
        username: playerName,
      });
      const lobby = response?.lobby;
      if (!lobby) {
        throw new Error('Lobby not found');
      }
      setActiveLobby(lobby);
      setIsHost(false);
      setCurrentPage('lobby-room');
    } catch (error) {
      showError({
        message: error instanceof Error ? error.message : 'Failed to join lobby',
        severity: ErrorSeverity.MEDIUM,
        type: ErrorType.NETWORK,
      });
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MainMenu onNavigate={(page) => page === 'play' ? handlePlayClick() : setCurrentPage(page)} />;
      case 'lobby-selection':
        return (
          <LobbySelection
            onStartLobby={handleStartLobby}
            onJoinSession={handleJoinSession}
            onBack={() => setCurrentPage('menu')}
            serverId={serverId}
          />
        );
      case 'lobby-room':
        return activeLobby ? (
          <LobbyRoom
            lobbyId={activeLobby.id}
            lobbyCode={activeLobby.code}
            playerId={playerId}
            playerName={playerName}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeave={() => {
              setActiveLobby(null);
              setCurrentMatch(null);
              setIsHost(false);
              setCurrentPage('menu');
            }}
          />
        ) : null;
      case 'play':
        return (
          <TurnBasedGame
            onBack={() => {
              setCurrentMatch(null);
              setActiveLobby(null);
              setIsHost(false);
              setCurrentPage('menu');
            }}
            serverId={serverId}
            isHost={isHost}
            match={currentMatch}
          />
        );
      case 'statistics':
        return <Statistics onBack={() => setCurrentPage('menu')} />;
      case 'leaderboard':
        return <Leaderboard onBack={() => setCurrentPage('menu')} />;
      case 'options':
        return <Options onBack={() => setCurrentPage('menu')} />;
      default:
        return <MainMenu onNavigate={(page) => page === 'play' ? handlePlayClick() : setCurrentPage(page)} />;
    }
  };

  return (
    <>
      {renderPage()}
      <ErrorNotification error={currentError} onDismiss={clearError} />
      <OfflineBanner show={!networkStatus.online} />
      <Analytics />
    </>
  );
}

export default App;
