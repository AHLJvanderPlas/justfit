// ProgramsView — program builder with dnd-kit drag and drop (P1E + P1F)
import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';
import {
  validateContraindications, validateWeeklyDistribution,
} from '@justfit/shared';
import type { SessionStructure, RuleConstraints } from '@justfit/shared';

interface Program {
  id: string;
  name: string;
  goal?: string;
  duration_weeks: number;
  sessions_per_week: number;
  is_template: number;
  created_at_ms: number;
}

export default function ProgramsView() {
  const { token, activeGymId } = useGymStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!token || !activeGymId) return;
    api.getPrograms(token, activeGymId)
      .then(d => setPrograms(d as Program[]))
      .finally(() => setLoading(false));
  }, [token, activeGymId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" /></div>;

  if (editing) return (
    <ProgramBuilder programId={editing} token={token!} gymId={activeGymId!}
      onClose={() => { setEditing(null); }} onSaved={() => {
        api.getPrograms(token!, activeGymId!).then(d => setPrograms(d as Program[]));
        setEditing(null);
      }} />
  );

  if (showNew) return (
    <ProgramBuilder programId={null} token={token!} gymId={activeGymId!}
      onClose={() => setShowNew(false)} onSaved={(id) => {
        api.getPrograms(token!, activeGymId!).then(d => setPrograms(d as Program[]));
        setShowNew(false);
        setEditing(id ?? null);
      }} />
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>PROGRAMS</h2>
        <button onClick={() => setShowNew(true)} className="bg-emerald text-bg px-4 py-2 rounded-xl font-semibold text-sm">+ New</button>
      </div>
      {programs.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">📋</p>
          <p>No programs yet. Build your first training template.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-bg-card border border-border">
              <div>
                <p className="text-text font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{p.duration_weeks}w · {p.sessions_per_week}×/week{p.goal ? ` · ${p.goal}` : ''}</p>
              </div>
              <button onClick={() => setEditing(p.id)}
                className="text-xs text-emerald hover:text-emerald/80 px-3 py-1 rounded-lg border border-emerald/20">
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROGRAM BUILDER ─────────────────────────────────────────────────────────
interface SessionBlock {
  id: string;
  type: 'warmup' | 'main' | 'cooldown';
  name: string;
  exercises: ExerciseSlotUI[];
}

interface ExerciseSlotUI {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps?: number;
  duration_sec?: number;
  rest_sec: number;
  lock_flag: 'open' | 'pool' | 'locked';
  primary_muscles: string[];
  contraindications: string[];
}

interface ProgramSession {
  week: number;
  day: number;
  name: string;
  blocks: SessionBlock[];
}

interface BuilderProps {
  programId: string | null;
  token: string;
  gymId: string;
  onClose: () => void;
  onSaved: (id?: string) => void;
}

function ProgramBuilder({ programId, token, gymId, onClose, onSaved }: BuilderProps) {
  const [meta, setMeta] = useState({ name: '', goal: '', duration_weeks: 4, sessions_per_week: 3 });
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [activeCell, setActiveCell] = useState<{ week: number; day: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; category: string; tags_json: string; source: string }>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!programId) return;
    api.getProgram(token, gymId, programId).then((data) => {
      const d = data as { name: string; goal?: string; duration_weeks: number; sessions_per_week: number; sessions?: Array<{ week_number: number; day_in_week: number; name: string; structure_json: string }> };
      setMeta({ name: d.name, goal: d.goal ?? '', duration_weeks: d.duration_weeks, sessions_per_week: d.sessions_per_week });
      const sess = (d.sessions ?? []).map(s => {
        const structure = s.structure_json ? JSON.parse(s.structure_json) as SessionStructure : { blocks: [] };
        return {
          week: s.week_number, day: s.day_in_week, name: s.name ?? `Session W${s.week_number}D${s.day_in_week}`,
          blocks: (structure.blocks ?? []).map(b => ({
            id: crypto.randomUUID(),
            type: b.type as 'warmup' | 'main' | 'cooldown',
            name: b.name ?? b.type,
            exercises: (b.exercises ?? []).map(e => ({
              id: crypto.randomUUID(),
              exercise_id: e.exercise_id,
              exercise_name: e.exercise_id,
              sets: e.sets, reps: e.reps, duration_sec: e.duration_sec,
              rest_sec: e.rest_sec, lock_flag: e.lock_flag,
              primary_muscles: e.primary_muscles ?? [],
              contraindications: e.contraindications ?? [],
            })),
          })),
        };
      });
      setSessions(sess);
    });
  }, [programId, token, gymId]);

  // Debounced exercise search
  useEffect(() => {
    if (!exerciseSearch) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      api.searchExercises(token, gymId, { q: exerciseSearch, gymId }).then(r => setSearchResults(r as typeof searchResults));
    }, 300);
    return () => clearTimeout(t);
  }, [exerciseSearch, token, gymId]);

  // Real-time validation (R524 + R527)
  useEffect(() => {
    if (!activeCell) return;
    const sess = sessions.find(s => s.week === activeCell.week && s.day === activeCell.day);
    if (!sess) return;
    const structure: SessionStructure = {
      blocks: sess.blocks.map(b => ({
        type: b.type, name: b.name,
        exercises: b.exercises.map(e => ({
          exercise_id: e.exercise_id, exercise_source: 'global' as const,
          sets: e.sets, reps: e.reps, duration_sec: e.duration_sec, rest_sec: e.rest_sec,
          lock_flag: e.lock_flag, primary_muscles: e.primary_muscles,
          contraindications: e.contraindications,
        })),
      })),
    };
    const contraResult = validateContraindications(structure, {});
    setErrors(contraResult.hardFail.map(f => `${f.rule}: ${f.message}`));

    const constraints: RuleConstraints = {
      substitution_policy: 'open', missed_session_policy: 'skip',
      weekly_checks: { push_pull_balance: true },
    };
    const distResult = validateWeeklyDistribution([structure], constraints);
    setWarnings(distResult.warnings);
  }, [sessions, activeCell]);

  function addExerciseToBlock(blockId: string, ex: { id: string; name: string }) {
    setSessions(prev => prev.map(s => {
      if (!activeCell || s.week !== activeCell.week || s.day !== activeCell.day) return s;
      return {
        ...s,
        blocks: s.blocks.map(b => b.id === blockId ? {
          ...b,
          exercises: [...b.exercises, {
            id: crypto.randomUUID(), exercise_id: ex.id, exercise_name: ex.name,
            sets: 3, reps: 10, rest_sec: 60, lock_flag: 'open', primary_muscles: [], contraindications: [],
          }],
        } : b),
      };
    }));
    setExerciseSearch('');
    setSearchResults([]);
  }

  function handleDragEnd(event: DragEndEvent, sessionKey: string) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSessions(prev => prev.map(s => {
      const key = `${s.week}-${s.day}`;
      if (key !== sessionKey) return s;
      return {
        ...s,
        blocks: s.blocks.map(b => {
          const ids = b.exercises.map(e => e.id);
          const oldIdx = ids.indexOf(String(active.id));
          const newIdx = ids.indexOf(String(over.id));
          if (oldIdx < 0 || newIdx < 0) return b;
          return { ...b, exercises: arrayMove(b.exercises, oldIdx, newIdx) };
        }),
      };
    }));
  }

  function getOrCreateSession(week: number, day: number): ProgramSession {
    const existing = sessions.find(s => s.week === week && s.day === day);
    if (existing) return existing;
    return {
      week, day, name: `Session W${week}D${day}`,
      blocks: [{ id: crypto.randomUUID(), type: 'main', name: 'Main', exercises: [] }],
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sessionsPayload = sessions.map(s => ({
        week_number: s.week, day_in_week: s.day, name: s.name,
        structure: {
          blocks: s.blocks.map(b => ({
            type: b.type, name: b.name,
            exercises: b.exercises.map(e => ({
              exercise_id: e.exercise_id, exercise_source: 'global',
              sets: e.sets, reps: e.reps, rest_sec: e.rest_sec, lock_flag: e.lock_flag,
              primary_muscles: e.primary_muscles, contraindications: e.contraindications,
            })),
          })),
        },
      }));
      if (programId) {
        await api.updateProgram(token, gymId, programId, { ...meta, sessions: sessionsPayload });
        onSaved(programId);
      } else {
        const res = await api.createProgram(token, gymId, { ...meta, sessions: sessionsPayload }) as { id: string };
        onSaved(res.id);
      }
    } finally { setSaving(false); }
  }

  const activeSession = activeCell
    ? sessions.find(s => s.week === activeCell.week && s.day === activeCell.day)
    : null;

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className="text-muted hover:text-text">←</button>
        <h2 className="text-2xl font-black text-text flex-1" style={{ fontFamily: 'var(--font-display)' }}>
          {programId ? 'EDIT PROGRAM' : 'NEW PROGRAM'}
        </h2>
        <button onClick={handleSave} disabled={saving || errors.length > 0}
          className="bg-emerald text-bg px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="col-span-2">
          <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Program name</label>
          <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
            className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald" />
        </div>
        {[
          { label: 'Duration (weeks)', key: 'duration_weeks', type: 'number' },
          { label: 'Sessions/week', key: 'sessions_per_week', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs text-muted uppercase tracking-wider mb-1 block">{label}</label>
            <input type={type} value={(meta as Record<string, string | number>)[key]}
              onChange={e => setMeta(m => ({ ...m, [key]: parseInt(e.target.value) }))}
              className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald" />
          </div>
        ))}
      </div>

      {/* Week × Day grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-muted text-xs uppercase tracking-wider text-left p-2 w-16">Week</th>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                <th key={i} className="text-muted text-xs uppercase tracking-wider text-center p-2">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: meta.duration_weeks }, (_, w) => (
              <tr key={w}>
                <td className="text-muted text-xs font-mono p-2">W{w + 1}</td>
                {Array.from({ length: 7 }, (_, d) => {
                  const sess = sessions.find(s => s.week === w + 1 && s.day === d + 1);
                  const isActive = activeCell?.week === w + 1 && activeCell?.day === d + 1;
                  return (
                    <td key={d} className="p-1">
                      <button
                        onClick={() => {
                          if (!sess) setSessions(prev => [...prev, getOrCreateSession(w + 1, d + 1)]);
                          setActiveCell({ week: w + 1, day: d + 1 });
                        }}
                        className={`w-full min-h-12 rounded-xl border text-xs transition-colors ${
                          isActive ? 'border-emerald bg-emerald/10 text-emerald' :
                          sess ? 'border-border bg-bg-card text-text hover:border-emerald/40' :
                          'border-dashed border-border/40 text-muted/40 hover:border-muted'
                        }`}>
                        {sess ? (
                          <span className="p-2 block truncate">{sess.blocks.reduce((n, b) => n + b.exercises.length, 0)} ex</span>
                        ) : '+'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Session editor */}
      {activeCell && activeSession && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>
              WEEK {activeCell.week} · DAY {activeCell.day}
            </h3>
            <button onClick={() => {
              setSessions(prev => prev.filter(s => !(s.week === activeCell.week && s.day === activeCell.day)));
              setActiveCell(null);
            }} className="text-xs text-red-400">Remove session</button>
          </div>

          {/* Validation panel */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/20">
              <p className="text-xs text-red-400 font-semibold mb-1">Contraindication conflicts</p>
              {errors.map((e, i) => <p key={i} className="text-xs text-red-300">{e}</p>)}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-semibold mb-1">Warnings</p>
              {warnings.map((w, i) => <p key={i} className="text-xs text-amber-300">{w}</p>)}
            </div>
          )}

          {activeSession.blocks.map(block => (
            <div key={block.id} className="mb-4 p-4 rounded-2xl bg-bg-card border border-border">
              <p className="text-xs text-muted uppercase tracking-wider mb-3 font-semibold">{block.name}</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragEnd={e => handleDragEnd(e, `${activeCell.week}-${activeCell.day}`)}>
                <SortableContext items={block.exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                  {block.exercises.map(ex => (
                    <SortableExerciseRow key={ex.id} exercise={ex}
                      onLockChange={(lockFlag) => {
                        setSessions(prev => prev.map(s => {
                          if (s.week !== activeCell.week || s.day !== activeCell.day) return s;
                          return { ...s, blocks: s.blocks.map(b => b.id === block.id ? {
                            ...b, exercises: b.exercises.map(e => e.id === ex.id ? { ...e, lock_flag: lockFlag } : e),
                          } : b) };
                        }));
                      }}
                      onRemove={() => {
                        setSessions(prev => prev.map(s => {
                          if (s.week !== activeCell.week || s.day !== activeCell.day) return s;
                          return { ...s, blocks: s.blocks.map(b => b.id === block.id ? {
                            ...b, exercises: b.exercises.filter(e => e.id !== ex.id),
                          } : b) };
                        }));
                      }} />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Exercise search */}
              <div className="mt-3 relative">
                <input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                  placeholder="Search exercises to add..."
                  className="w-full bg-bg border border-border/60 rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-emerald" />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg border border-border rounded-2xl z-10 max-h-48 overflow-y-auto shadow-xl">
                    {searchResults.map(r => (
                      <button key={r.id} onClick={() => addExerciseToBlock(block.id, r)}
                        className="w-full text-left px-3 py-2 hover:bg-bg-card text-sm text-text border-b border-border/30 last:border-0">
                        <span>{r.name}</span>
                        <span className="text-muted text-xs ml-2">{r.category}</span>
                        {r.source === 'custom' && <span className="text-xs text-emerald ml-1">custom</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableExerciseRow({ exercise, onLockChange, onRemove }: {
  exercise: ExerciseSlotUI;
  onLockChange: (lock: 'open' | 'pool' | 'locked') => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const lockColors = { open: 'text-muted', pool: 'text-amber-400', locked: 'text-red-400' };
  const lockIcons = { open: '↔', pool: '⊘', locked: '🔒' };
  const lockNext: Record<string, 'pool' | 'locked' | 'open'> = { open: 'pool', pool: 'locked', locked: 'open' };

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-bg border border-border/40 text-sm">
      <span {...attributes} {...listeners} className="text-muted cursor-grab px-1">⠿</span>
      <span className="flex-1 text-text truncate">{exercise.exercise_name}</span>
      <span className="text-muted font-mono text-xs">{exercise.sets}×{exercise.reps ?? `${exercise.duration_sec}s`}</span>
      <button onClick={() => onLockChange(lockNext[exercise.lock_flag])}
        title={`Lock: ${exercise.lock_flag}`}
        className={`text-sm ${lockColors[exercise.lock_flag]}`}>
        {lockIcons[exercise.lock_flag]}
      </button>
      <button onClick={onRemove} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
    </div>
  );
}
