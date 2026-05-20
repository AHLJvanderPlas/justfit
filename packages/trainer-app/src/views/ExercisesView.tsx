// ExercisesView — custom exercise library CRUD (P1D)
import { useState, useEffect } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';
import { MUSCLES } from '@justfit/shared';
import { EQUIPMENT } from '@justfit/shared';

interface Exercise {
  id: string;
  name: string;
  exercise_type: string;
  difficulty: number;
  primary_muscles_json: string;
  secondary_muscles_json: string;
  equipment_required_json: string;
  instructions_markdown?: string;
}

const BLANK_FORM = {
  name: '', exercise_type: 'strength', difficulty: 3,
  primary_muscles: [] as string[], secondary_muscles: [] as string[],
  equipment_required: [] as string[], contraindications: [] as string[],
  instructions_markdown: '',
};

export default function ExercisesView() {
  const { token, activeGymId } = useGymStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !activeGymId) return;
    api.getExercises(token, activeGymId)
      .then(d => setExercises(d as Exercise[]))
      .finally(() => setLoading(false));
  }, [token, activeGymId]);

  function openNew() { setForm({ ...BLANK_FORM }); setEditing(null); setShowForm(true); }
  function openEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      exercise_type: ex.exercise_type ?? 'strength',
      difficulty: ex.difficulty ?? 3,
      primary_muscles: ex.primary_muscles_json ? JSON.parse(ex.primary_muscles_json) : [],
      secondary_muscles: ex.secondary_muscles_json ? JSON.parse(ex.secondary_muscles_json) : [],
      equipment_required: ex.equipment_required_json ? JSON.parse(ex.equipment_required_json) : [],
      contraindications: [],
      instructions_markdown: ex.instructions_markdown ?? '',
    });
    setEditing(ex.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeGymId) return;
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.updateExercise(token, activeGymId, editing, form);
      } else {
        await api.createExercise(token, activeGymId, form);
      }
      const data = await api.getExercises(token, activeGymId);
      setExercises(data as Exercise[]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!token || !activeGymId || !confirm('Delete this exercise?')) return;
    await api.deleteExercise(token, activeGymId, id);
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>EXERCISES</h2>
        <button onClick={openNew} className="bg-emerald text-bg px-4 py-2 rounded-xl font-semibold text-sm">+ New</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-dvh flex items-start justify-center p-4 pt-10">
            <form onSubmit={handleSave} className="w-full max-w-lg bg-bg-card border border-border rounded-3xl p-6 space-y-4">
              <h3 className="font-black text-text text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                {editing ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
              </h3>

              <Field label="Name *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="input" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.exercise_type} onChange={e => setForm(f => ({ ...f, exercise_type: e.target.value }))}
                    className="input">
                    {['strength','cardio','mobility','skill'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Difficulty (1-5)">
                  <input type="number" min={1} max={5} value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: parseInt(e.target.value) }))}
                    className="input" />
                </Field>
              </div>

              <Field label="Primary muscles">
                <MultiSelect options={MUSCLES as unknown as string[]} selected={form.primary_muscles}
                  onChange={v => setForm(f => ({ ...f, primary_muscles: v }))} />
              </Field>

              <Field label="Equipment">
                <MultiSelect options={EQUIPMENT as unknown as string[]} selected={form.equipment_required}
                  onChange={v => setForm(f => ({ ...f, equipment_required: v }))} />
              </Field>

              <Field label="Instructions (markdown)">
                <textarea value={form.instructions_markdown}
                  onChange={e => setForm(f => ({ ...f, instructions_markdown: e.target.value }))}
                  rows={4} className="input font-mono text-sm" />
              </Field>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl border border-border text-muted hover:text-text text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-emerald text-bg font-black text-sm disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {saving ? '...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">🏋️</p>
          <p>No custom exercises yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map(ex => (
            <div key={ex.id} className="flex items-center justify-between p-4 rounded-2xl bg-bg-card border border-border">
              <div>
                <p className="text-text font-semibold">{ex.name}</p>
                <p className="text-xs text-muted capitalize">{ex.exercise_type} · difficulty {ex.difficulty ?? '–'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(ex)} className="text-xs text-muted hover:text-text px-3 py-1 rounded-lg border border-border">Edit</button>
                <button onClick={() => handleDelete(ex.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg border border-red-500/20">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  }
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-bg rounded-xl border border-border">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
            selected.includes(o) ? 'bg-emerald text-bg font-semibold' : 'bg-bg-card text-muted hover:text-text border border-border'
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}
