import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api, realtime } from '../services/api';
import { useError } from '../contexts/ErrorContext';
import { ErrorSeverity, ErrorType } from '../types/errors';
import type { GameSession, RealtimeMessage } from '../types/api';

interface ActiveSessionsListProps {
  serverId: string;
}

export function ActiveSessionsList({ serverId }: ActiveSessionsListProps) {
  const { logError } = useError();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.game.activeSessions(serverId);
      setSessions(data);
    } catch (error) {
      logError(error, ErrorType.NETWORK, ErrorSeverity.MEDIUM, 'Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  }, [serverId, logError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const channel = `sessions:${serverId}`;
    const handler = (payload: RealtimeMessage) => {
      if (payload.type === 'sessions:update') {
        fetchSessions();
      }
    };
    realtime.subscribe(channel, handler);
    return () => realtime.unsubscribe(channel, handler);
  }, [serverId, fetchSessions]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
        <div className="text-center text-slate-400 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
        <div className="text-center text-slate-400 py-8">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active games in this server</p>
          <p className="text-sm mt-2">Be the first to start a game!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-4">
        Active Sessions ({sessions.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-slate-700/50 rounded-lg p-4 border-2 border-slate-600/50
                     hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{session.playerName}</p>
                <p className="text-slate-400 text-sm">
                  Round {session.roundNumber} • {session.score} pts
                </p>
              </div>
              <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/50">
                <p className="text-green-400 text-xs font-semibold">In Progress</p>
              </div>
            </div>
            <div className="text-center text-slate-400 text-sm py-2">
              Spectator mode coming soon
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
