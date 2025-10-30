import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { TurnBasedGame } from './components/TurnBasedGame';
import { Statistics } from './components/Statistics';
import { Options } from './components/Options';
import { Shop } from './components/Shop';
import { LobbySelection } from './components/LobbySelection';
import { MatchmakingQueue } from './components/MatchmakingQueue';
import { LobbyRoom } from './components/LobbyRoom';
import { Leaderboard } from './components/Leaderboard';
import { MatchHistory } from './components/MatchHistory';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { useError } from './contexts/ErrorContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { ErrorNotification, OfflineBanner } from './components/ErrorNotification';

type Page = 'menu' | 'lobby-selection' | 'matchmaking' | 'lobby-room' | 'play' | 'statistics' | 'leaderboard' | 'match-history' | 'options' | 'shop';

function App() {
  const { user, getUsername } = useAuth();
  const { currentError, clearError } = useError();
  const networkStatus = useNetworkStatus();
  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const serverId = 'dev-server-123';

  if (!user) {
    return <Login />;
  }

  const playerName = getUsername();
  const playerId = user.id;

  const handlePlayClick = () => {
    setCurrentPage('lobby-selection');
  };

  const handleJoinRandom = () => {
    setCurrentPage('matchmaking');
  };

  const handleStartLobby = () => {
    // Generate a 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setLobbyId(code);
    setIsHost(true);
    setCurrentPage('lobby-room');
  };

  const handleMatchFound = (matchedLobbyId: string) => {
    setLobbyId(matchedLobbyId);
    setIsHost(false);
    setCurrentPage('lobby-room');
  };

  const handleStartGame = () => {
    setCurrentPage('play');
  };

  const handleJoinSession = (sessionId: string) => {
    setLobbyId(sessionId);
    setIsHost(false);
    setCurrentPage('lobby-room');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MainMenu onNavigate={(page) => page === 'play' ? handlePlayClick() : setCurrentPage(page)} />;
      case 'lobby-selection':
        return (
          <LobbySelection
            onJoinRandom={handleJoinRandom}
            onStartLobby={handleStartLobby}
            onJoinSession={handleJoinSession}
            onBack={() => setCurrentPage('menu')}
            serverId={serverId}
          />
        );
      case 'matchmaking':
        return (
          <MatchmakingQueue
            playerName={playerName}
            onMatchFound={handleMatchFound}
            onCancel={() => setCurrentPage('lobby-selection')}
          />
        );
      case 'lobby-room':
        return lobbyId ? (
          <LobbyRoom
            lobbyId={lobbyId}
            playerId={playerId}
            playerName={playerName}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeave={() => setCurrentPage('menu')}
          />
        ) : null;
      case 'play':
        return <TurnBasedGame onBack={() => setCurrentPage('menu')} serverId={serverId} isHost={isHost} />;
      case 'statistics':
        return <Statistics onBack={() => setCurrentPage('menu')} />;
      case 'leaderboard':
        return <Leaderboard onBack={() => setCurrentPage('menu')} />;
      case 'match-history':
        return <MatchHistory onBack={() => setCurrentPage('menu')} />;
      case 'options':
        return <Options onBack={() => setCurrentPage('menu')} />;
      case 'shop':
        return <Shop onBack={() => setCurrentPage('menu')} />;
      default:
        return <MainMenu onNavigate={(page) => page === 'play' ? handlePlayClick() : setCurrentPage(page)} />;
    }
  };

  return (
    <>
      {renderPage()}
      <ErrorNotification error={currentError} onDismiss={clearError} />
      <OfflineBanner show={!networkStatus.online} />
    </>
  );
}

export default App;
