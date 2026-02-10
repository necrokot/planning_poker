import { FIBONACCI_VALUES, type FibonacciValue } from '@planning-poker/shared';
import { useState } from 'react';

interface VotingCardsProps {
  onVote: (value: FibonacciValue) => void;
  disabled?: boolean;
  selectedValue?: FibonacciValue;
  hasVoted?: boolean;
}

export function VotingCards({
  onVote,
  disabled = false,
  selectedValue,
  hasVoted,
}: VotingCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<FibonacciValue | null>(null);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Select your estimate</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {FIBONACCI_VALUES.map((value) => {
          const isSelected = selectedValue === value;
          const isHovered = hoveredCard === value;

          return (
            <button
              type="button"
              key={value}
              onClick={() => !disabled && onVote(value)}
              onMouseEnter={() => setHoveredCard(value)}
              onMouseLeave={() => setHoveredCard(null)}
              disabled={disabled}
              className={`
                w-16 h-24 rounded-lg border-2 font-bold text-xl
                transition-all duration-200 transform
                ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-700 scale-105 shadow-lg'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-primary-400'
                }
                ${isHovered && !isSelected && !disabled ? 'scale-105 shadow-md' : ''}
                ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${hasVoted && !isSelected ? 'opacity-40' : ''}
              `}
            >
              {value}
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-center text-gray-500 mt-4">Vote submitted! Waiting for others...</p>
      )}
    </div>
  );
}
