const EmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-panel px-6 py-14 text-center">
    {icon && <div className="text-4xl text-faint">{icon}</div>}
    <h3 className="text-lg font-semibold text-ink">{title}</h3>
    {message && <p className="max-w-md text-sm text-muted">{message}</p>}
    {action}
  </div>
);

export default EmptyState;
