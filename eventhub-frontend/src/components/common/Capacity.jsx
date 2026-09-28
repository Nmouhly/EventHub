export default function Capacity({ event, detailed = false }) {
  const filled = event.registeredParticipants || 0;
  const percent =
    event.maxParticipants > 0 ? Math.round((filled / event.maxParticipants) * 100) : 0;
  return (
    <div className="capacity">
      <div>
        <span>
          <strong>{filled}</strong> / {event.maxParticipants}
          {detailed && ' participants'}
        </span>
        {detailed && <strong>{percent}%</strong>}
      </div>
      <progress value={Math.min(percent, 100)} max="100" aria-label={`${percent}% capacity`} />
    </div>
  );
}
