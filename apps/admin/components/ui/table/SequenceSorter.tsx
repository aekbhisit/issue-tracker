"use client";

import { useEffect, useState } from "react";

type SequenceDirection = "up" | "down";

export interface SequenceSorterProps {
  value: number;
  min?: number;
  onMove?: (direction: SequenceDirection) => void;
  onCommit?: (sequence: number) => void;
  disabledUp?: boolean;
  disabledDown?: boolean;
  moveUpLabel?: string;
  moveDownLabel?: string;
  inputAriaLabel?: string;
  className?: string;
}

export function SequenceSorter({
  value,
  min = 1,
  onMove,
  onCommit,
  disabledUp = false,
  disabledDown = false,
  moveUpLabel = "Move up",
  moveDownLabel = "Move down",
  inputAriaLabel = "Sequence position",
  className,
}: SequenceSorterProps) {
  const [inputValue, setInputValue] = useState(() => value.toString());
  const isMoveUpDisabled = disabledUp || value <= min;
  const isMoveDownDisabled = disabledDown;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleCommit = () => {
    if (inputValue.trim() === "") {
      setInputValue(value.toString());
      return;
    }

    const parsed = Number.parseInt(inputValue, 10);
    if (!Number.isInteger(parsed) || parsed < min) {
      setInputValue(value.toString());
      return;
    }

    if (parsed !== value) {
      onCommit?.(parsed);
    } else {
      setInputValue(value.toString());
    }
  };

  const baseButtonClass =
    "control-height px-3 text-sm border border-gray-300 rounded-lg text-gray-600 bg-white dark:text-gray-100 dark:bg-gray-900 dark:border-gray-500 dark:hover:bg-gray-800/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 dark:disabled:border-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center";

  const containerClass = className ? `flex items-center gap-2 ${className}` : "flex items-center gap-2";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={baseButtonClass}
          onClick={() => onMove?.("up")}
          disabled={isMoveUpDisabled || !onMove}
          aria-label={moveUpLabel}
          title={moveUpLabel}
        >
          ↑
        </button>
      </div>
      <input
        type="number"
        min={min}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={handleCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleCommit();
          }
          if (event.key === "Escape") {
            setInputValue(value.toString());
          }
        }}
        className="input-control w-20"
        aria-label={inputAriaLabel}
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={baseButtonClass}
          onClick={() => onMove?.("down")}
          disabled={isMoveDownDisabled || !onMove}
          aria-label={moveDownLabel}
          title={moveDownLabel}
        >
          ↓
        </button>
      </div>
    </div>
  );
}


