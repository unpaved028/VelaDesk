'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import {
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntries,
  type TimeEntryRow,
} from '@/app/actions/timeEntryActions';
import { formatDurationMinutes } from '@/lib/time/duration';

interface TimeTrackerProps {
  ticketId: number;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const TimeTracker = ({ ticketId }: TimeTrackerProps) => {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [durationInput, setDurationInput] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getTimeEntries(ticketId).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setEntries(result.data);
        setError('');
      } else {
        setError(result.error || 'Could not load time entries.');
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  useEffect(() => {
    if (timerStartedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timerStartedAt]);

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const billableMinutes = entries
    .filter((entry) => entry.isBillable)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);

  const submitDuration = (raw: string) => {
    setError('');
    startTransition(async () => {
      const result = await createTimeEntry({
        ticketId,
        durationInput: raw,
        isBillable,
      });
      if (!result.success || !result.data) {
        setError(result.error || 'Could not save time entry.');
        return;
      }
      setEntries((prev) => [result.data, ...prev]);
      setDurationInput('');
    });
  };

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    submitDuration(durationInput);
  };

  const handleToggleTimer = () => {
    if (timerStartedAt === null) {
      setTimerStartedAt(Date.now());
      setNow(Date.now());
      return;
    }
    const elapsedMs = Date.now() - timerStartedAt;
    const minutes = Math.max(1, Math.round(elapsedMs / 60000));
    setTimerStartedAt(null);
    submitDuration(String(minutes));
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimeEntry(id, ticketId);
      if (!result.success) {
        setError(result.error || 'Could not delete time entry.');
        return;
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    });
  };

  return (
    <div className="p-6 border-b border-outline-variant/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Time Tracking</h3>
        <span className="text-[10px] font-bold text-on-surface-variant">
          {formatDurationMinutes(billableMinutes)} billable / {formatDurationMinutes(totalMinutes)}
        </span>
      </div>

      <form onSubmit={handleAdd} className="space-y-3">
        <input
          type="text"
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          placeholder="15m or 1h 30m"
          disabled={isPending}
          className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <label className="flex items-center gap-2 text-xs text-on-surface-variant">
          <input
            type="checkbox"
            checked={isBillable}
            onChange={(e) => setIsBillable(e.target.checked)}
            className="rounded border-outline-variant"
          />
          Billable
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !durationInput.trim()}
            className="flex-1 py-2 rounded-lg bg-primary-container text-on-primary-container text-[11px] font-bold uppercase tracking-wider disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleToggleTimer}
            disabled={isPending}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
              timerStartedAt
                ? 'bg-error/15 text-error'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            {timerStartedAt ? `Stop ${formatElapsed(now - timerStartedAt)}` : 'Start'}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-[11px] font-medium text-error">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-xs text-on-surface-variant">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-on-surface-variant">No time logged on this ticket.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between gap-2 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface">
                  {formatDurationMinutes(entry.durationMinutes)}
                  {entry.isBillable ? (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-primary">Billable</span>
                  ) : (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-outline">Internal</span>
                  )}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">{entry.userName}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={isPending}
                className="text-[10px] font-bold uppercase tracking-wider text-outline hover:text-error"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
