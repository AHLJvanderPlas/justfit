import { useState, useEffect } from "react";
import { C, eyebrow } from "../tokens.js";
import { Glass } from "../uiComponents.jsx";
import api from "../apiClient.js";
import { useAppShell } from "../AppShellContext.js";

const LEVEL_LABELS = { L0: 'None', L1: 'Basic', L2: 'Standard', L3: 'Full (billable)', L4: 'Complete' };
const LEVEL_ORDER = ['L0', 'L1', 'L2', 'L3', 'L4'];

export default function TrainersPanel() {
  const { token } = useAppShell();
  const [disclosures, setDisclosures] = useState([]);
  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ goals: [], experience_level: 'beginner', injuries: [], equipment_access: [], availability_days_per_week: 3 });
  const [savingIntake, setSavingIntake] = useState(false);
  const [responding, setResponding] = useState(false);
  const [levelChanging, setLevelChanging] = useState(null);
  const [error, setError] = useState('');

  // Trainer switch consent toggle
  const [allowSwitch, setAllowSwitch] = useState(true);
  const [switchConsentSaving, setSwitchConsentSaving] = useState(false);
  const [isInGym, setIsInGym] = useState(false);

  // Connect to trainer flow (Sub-flow C)
  const [connectStep, setConnectStep] = useState(0); // 0=hidden 1=code-entry 2=confirm 3=done
  const [connectCode, setConnectCode] = useState('');
  const [connectGymInfo, setConnectGymInfo] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getDisclosures(token), api.getIntake(token), api.getTrainerData(token)])
      .then(([d, i, td]) => {
        setDisclosures(d.disclosures ?? []);
        if (i) {
          setIntake(i);
          setIntakeForm({
            goals: i.goals ?? [],
            experience_level: i.experience_level ?? 'beginner',
            injuries: i.injuries ?? [],
            equipment_access: i.equipment_access ?? [],
            availability_days_per_week: i.availability_days_per_week ?? 3,
          });
        }
        if (td && !td.error && td.gym_id) {
          setIsInGym(true);
          setAllowSwitch(td.allow_trainer_switch !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSwitchConsentToggle(newVal) {
    setAllowSwitch(newVal);
    setSwitchConsentSaving(true);
    try {
      await api.setTrainerSwitchConsent(token, newVal);
    } catch { setAllowSwitch(!newVal); }
    setSwitchConsentSaving(false);
  }

  async function handleLevelChange(gymId, newLevel) {
    if (!token) return;
    setLevelChanging(gymId); setError('');
    try {
      await api.upsertDisclosure(token, gymId, newLevel);
      setDisclosures(prev => prev.map(d => d.gym_id === gymId ? { ...d, level: newLevel } : d));
    } catch (e) {
      setError(e.message ?? 'Update failed');
    } finally { setLevelChanging(null); }
  }

  async function handleUpgradeResponse(gymId, requestId, response) {
    if (!token) return;
    setResponding(true); setError('');
    try {
      await api.respondUpgradeRequest(token, gymId, requestId, response);
      setDisclosures(prev => prev.map(d => d.gym_id === gymId
        ? { ...d, upgrade_request: null, level: response === 'accept' ? (d.upgrade_request?.target_level ?? d.level) : d.level }
        : d
      ));
    } catch (e) {
      setError(e.message ?? 'Failed');
    } finally { setResponding(false); }
  }

  async function handleSaveIntake(e) {
    e.preventDefault();
    if (!token) return;
    setSavingIntake(true); setError('');
    try {
      await api.saveIntake(token, intakeForm);
      setIntake(intakeForm);
      setShowIntake(false);
    } catch (e2) {
      setError(e2.message ?? 'Save failed');
    } finally { setSavingIntake(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${C.emerald}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* Pending upgrade requests */}
      {disclosures.filter(d => d.upgrade_request).map(d => (
        <div key={d.gym_id} style={{ marginBottom: 16, padding: 16, borderRadius: 20, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
            Disclosure upgrade request
          </p>
          <p style={{ fontSize: 14, color: C.text, marginBottom: 2 }}>
            <strong>{d.gym_name ?? d.gym_id}</strong> requests level {d.upgrade_request.target_level}
          </p>
          {d.upgrade_request.reason && (
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{d.upgrade_request.reason}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={responding}
              onClick={() => handleUpgradeResponse(d.gym_id, d.upgrade_request.request_id, 'accept')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: C.emerald, color: C.bg, fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', opacity: responding ? 0.5 : 1 }}>
              Accept
            </button>
            <button disabled={responding}
              onClick={() => handleUpgradeResponse(d.gym_id, d.upgrade_request.request_id, 'decline')}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'transparent', color: '#f59e0b', fontWeight: 700, fontSize: 13, border: '1px solid rgba(245,158,11,0.4)', cursor: 'pointer', opacity: responding ? 0.5 : 1 }}>
              Decline
            </button>
          </div>
        </div>
      ))}

      {/* Connected trainers */}
      {disclosures.length === 0 ? (
        <Glass style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>👥</p>
          <p style={{ fontSize: 14, color: C.muted }}>No trainers connected yet.</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Your trainer will send you an invite link, or connect via a short code below.</p>
        </Glass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {disclosures.map(d => (
            <Glass key={d.gym_id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{d.gym_name ?? d.gym_id}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>Connected trainer</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 8 }}>
                  {LEVEL_LABELS[d.level] ?? d.level}
                </span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                Data sharing level
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LEVEL_ORDER.map(l => (
                  <button key={l} disabled={levelChanging === d.gym_id}
                    onClick={() => handleLevelChange(d.gym_id, l)}
                    style={{
                      padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: d.level === l ? C.emerald : C.bgCard,
                      color: d.level === l ? C.bg : C.muted,
                      opacity: levelChanging === d.gym_id ? 0.5 : 1,
                    }}>
                    {l}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                {d.level === 'L0' && 'Trainer cannot see any personal data.'}
                {d.level === 'L1' && 'Trainer sees your name only.'}
                {d.level === 'L2' && 'Trainer sees name, goals, and progress.'}
                {d.level === 'L3' && 'Trainer can send invoices (billing data shared).'}
                {d.level === 'L4' && 'Full profile including contact details shared.'}
              </p>
            </Glass>
          ))}
        </div>
      )}

      {/* Connect to trainer (Sub-flow C) */}
      {connectStep === 0 && (
        <button onClick={() => { setConnectStep(1); setConnectError(''); setConnectCode(''); setConnectGymInfo(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 20, width: '100%' }}>
          <span style={{ fontSize: 16 }}>+</span> Connect to a trainer
        </button>
      )}
      {connectStep === 1 && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
          <p style={{ ...eyebrow, fontSize: 9.5, color: C.muted, marginBottom: 12 }}>ENTER TRAINER CODE</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
            Ask your trainer for their code (format: FIT-XXXXXX) or paste a full invite link.
          </p>
          <input
            value={connectCode}
            onChange={e => { setConnectCode(e.target.value.trim()); setConnectError(''); }}
            placeholder="FIT-XXXXXX"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${connectError ? '#f87171' : C.border}`, background: 'rgba(255,255,255,0.06)', color: C.text, fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box', marginBottom: 10, textTransform: 'uppercase' }}
          />
          {connectError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{connectError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={connectLoading || !connectCode}
              onClick={async () => {
                setConnectLoading(true); setConnectError('');
                try {
                  const res = await api.lookupConnect(connectCode);
                  if (res.error) { setConnectError('Code not found — check with your trainer.'); }
                  else { setConnectGymInfo(res); setConnectStep(2); }
                } catch { setConnectError('Could not reach server — try again.'); }
                finally { setConnectLoading(false); }
              }}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 13, cursor: (connectLoading || !connectCode) ? 'not-allowed' : 'pointer', opacity: (connectLoading || !connectCode) ? 0.5 : 1 }}>
              {connectLoading ? '…' : 'Look up →'}
            </button>
            <button onClick={() => setConnectStep(0)}
              style={{ padding: '12px 16px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {connectStep === 2 && connectGymInfo && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(16,185,129,0.05)', border: `1px solid ${C.emeraldBorder}` }}>
          <p style={{ ...eyebrow, fontSize: 9.5, color: C.emerald, marginBottom: 12 }}>CONFIRM CONNECTION</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{connectGymInfo.trainer_name}</p>
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 16 }}>{connectGymInfo.gym_name}</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>
            Your trainer will need to approve this request before they can view your data.
          </p>
          {connectError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{connectError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={connectLoading}
              onClick={async () => {
                setConnectLoading(true); setConnectError('');
                try {
                  const res = await api.connectToTrainer(token, connectCode);
                  if (res.ok || res.error === 'already_connected') setConnectStep(3);
                  else setConnectError(res.error ?? 'Request failed');
                } catch { setConnectError('Could not reach server — try again.'); }
                finally { setConnectLoading(false); }
              }}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 13, cursor: connectLoading ? 'not-allowed' : 'pointer', opacity: connectLoading ? 0.5 : 1 }}>
              {connectLoading ? '…' : 'Send request'}
            </button>
            <button onClick={() => { setConnectStep(1); setConnectGymInfo(null); }}
              style={{ padding: '12px 16px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </div>
      )}
      {connectStep === 3 && (
        <div style={{ marginBottom: 20, padding: 20, borderRadius: 20, background: 'rgba(16,185,129,0.05)', border: `1px solid ${C.emeraldBorder}`, textAlign: 'center' }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Request sent!</p>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>Your trainer will approve the connection shortly.</p>
          <button onClick={() => { setConnectStep(0); setConnectCode(''); setConnectGymInfo(null); }}
            style={{ padding: '10px 20px', borderRadius: 12, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Done
          </button>
        </div>
      )}

      {/* Intake form */}
      <div style={{ marginTop: 24, marginBottom: 8, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: C.emerald, textTransform: 'uppercase' }}>
        Health Intake
      </div>
      <Glass style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
          {intake ? 'Your intake is on file. Trainers with Level 2+ access can view it.' : 'Complete your health intake so your trainer can personalise your programme.'}
        </p>
        {!showIntake ? (
          <button onClick={() => setShowIntake(true)}
            style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: intake ? 'transparent' : C.emerald, color: intake ? C.text : C.bg, fontWeight: 700, fontSize: 14, border: intake ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
            {intake ? 'Update intake' : 'Complete intake'}
          </button>
        ) : (
          <form onSubmit={handleSaveIntake} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Experience level</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['beginner', 'intermediate', 'advanced'].map(l => (
                  <button key={l} type="button" onClick={() => setIntakeForm(f => ({ ...f, experience_level: l }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: intakeForm.experience_level === l ? C.emerald : C.bgCard,
                      color: intakeForm.experience_level === l ? C.bg : C.muted,
                      border: 'none' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                Sessions per week
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setIntakeForm(f => ({ ...f, availability_days_per_week: n }))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      background: intakeForm.availability_days_per_week === n ? C.emerald : C.bgCard,
                      color: intakeForm.availability_days_per_week === n ? C.bg : C.muted,
                      border: 'none' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowIntake(false)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={savingIntake}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: C.emerald, color: C.bg, fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer', opacity: savingIntake ? 0.5 : 1 }}>
                {savingIntake ? '...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Glass>

      {error && !showIntake && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      {/* ── Trainer instellingen (only shown when connected to a gym) ── */}
      {isInGym && (
        <>
          <div style={{ marginTop: 28, marginBottom: 8, fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: C.emerald, textTransform: 'uppercase' }}>
            Jouw trainer
          </div>
          <Glass style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Trainer wissel toestaan</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                  {allowSwitch
                    ? 'Gym mag jou van trainer wisselen zonder eerst toestemming te vragen.'
                    : 'Je bevestigt elke wisseling zelf voordat deze ingaat.'}
                </div>
              </div>
              <button
                onClick={() => handleSwitchConsentToggle(!allowSwitch)}
                disabled={switchConsentSaving}
                style={{
                  width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: allowSwitch ? C.emerald : C.subtle,
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                  opacity: switchConsentSaving ? 0.5 : 1,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: allowSwitch ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10, background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </Glass>
        </>
      )}
    </div>
  );
}
