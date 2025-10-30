import { SelectedTile, Tile } from '../types/game';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { audioManager } from '../utils/audioManager';

interface GameGridProps {
  grid: Tile[][];
  selectedTiles: SelectedTile[];
  onTileSelect: (tile: Tile) => void;
  gameOver: boolean;
}

export function GameGrid({ grid, selectedTiles, onTileSelect, gameOver }: GameGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isSelected = (row: number, col: number) => {
    return selectedTiles.some(t => t.row === row && t.col === col);
  };

  const getSelectionIndex = (row: number, col: number) => {
    return selectedTiles.findIndex(t => t.row === row && t.col === col);
  };

  const getMultiplierColor = (multiplier: string | null) => {
    switch (multiplier) {
      case 'DL': return 'bg-blue-500';
      case 'TL': return 'bg-blue-700';
      case 'DW': return 'bg-pink-500';
      case 'TW': return 'bg-pink-700';
      default: return 'bg-gradient-to-br from-purple-800 to-purple-900';
    }
  };

  const getMultiplierText = (multiplier: string | null) => {
    return multiplier || '';
  };

  return (
    <div
      className="inline-block bg-purple-950/50 p-4 rounded-2xl shadow-2xl border-4 border-purple-700/50"
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 8}, minmax(0, 1fr))` }}>
        {grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const selected = isSelected(rowIndex, colIndex);
            const selectionIdx = getSelectionIndex(rowIndex, colIndex);
            const multiplierColor = getMultiplierColor(tile.multiplier);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onMouseDown={() => {
                  if (!gameOver) {
                    setIsDragging(true);
                    onTileSelect(tile);
                    audioManager.playLetterClick(selectedTiles.length);
                  }
                }}
                onMouseEnter={() => {
                  if (isDragging && !gameOver) {
                    onTileSelect(tile);
                    audioManager.playLetterClick(selectedTiles.length);
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                  }
                }}
                disabled={gameOver}
                className={`
                  relative w-16 h-16 rounded-xl font-bold text-2xl
                  transition-all duration-150 transform
                  ${selected
                    ? 'scale-110 ring-4 ring-pink-400 shadow-2xl shadow-pink-400/70 animate-pulse'
                    : 'hover:scale-105 hover:shadow-lg'
                  }
                  ${multiplierColor}
                  ${gameOver ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-125 active:shadow-2xl active:shadow-yellow-400/80'}
                  text-white shadow-md
                `}
              >
                {tile.isGem && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </div>
                )}

                {tile.multiplier && (
                  <span className="absolute top-1 left-1 text-[10px] font-semibold opacity-80">
                    {getMultiplierText(tile.multiplier)}
                  </span>
                )}

                <span className="relative z-10">{tile.letter}</span>

                {selected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center text-purple-900 text-xs font-bold shadow-lg">
                    {selectionIdx + 1}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
