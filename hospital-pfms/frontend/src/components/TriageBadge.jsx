const TIER_MAP = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low'
};

export default function TriageBadge({ level }) {
  const tier = TIER_MAP[level] || 'neutral';
  return (
    <span className={`badge badge-${tier}`}>
      {tier !== 'neutral' && <span className="badge-dot" />}
      {level || 'Pending'}
    </span>
  );
}
