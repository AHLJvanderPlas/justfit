// PersonCard component — shared between clients list and detail views (P1B)
interface Client {
  user_id: string;
  display_name: string;
  level: string;
  verified: boolean;
  billable: boolean;
  photo_url: string | null;
  has_contraindications?: boolean;
  last_session_date?: string | null;
  intake_completed?: boolean;
}

interface PersonCardProps {
  client: Client;
  onClick?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  L0: 'text-muted', L1: 'text-muted', L2: 'text-sky-400',
  L3: 'text-emerald', L4: 'text-emerald',
};

export default function PersonCard({ client, onClick }: PersonCardProps) {
  const initials = client.display_name.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-3xl bg-bg-card border border-border transition-colors ${onClick ? 'cursor-pointer hover:border-emerald/40' : ''}`}
    >
      <div className="flex items-start gap-3">
        {client.photo_url ? (
          <img src={client.photo_url} alt={client.display_name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-emerald-dim flex items-center justify-center flex-shrink-0">
            <span className="text-emerald font-black text-sm" style={{ fontFamily: 'var(--font-display)' }}>
              {initials}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-text font-semibold truncate">{client.display_name}</p>
            {client.verified && <span title="Email verified" className="text-emerald text-xs">✓</span>}
            {client.has_contraindications && (
              <span title="Has contraindications" className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-md">
                ⚠
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-mono ${LEVEL_COLORS[client.level] ?? 'text-muted'}`}>
              {client.level}
            </span>
            {client.billable && (
              <span className="text-xs bg-emerald/10 text-emerald px-1.5 py-0.5 rounded-md">billable</span>
            )}
            {client.last_session_date && (
              <span className="text-xs text-muted">last: {client.last_session_date}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
