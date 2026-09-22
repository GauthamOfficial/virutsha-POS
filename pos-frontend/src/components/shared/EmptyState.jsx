const EmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#3a3a3a] bg-[#1a1a1a] px-6 py-14 text-center">
    {icon && <div className="text-4xl text-[#5a5a5a]">{icon}</div>}
    <h3 className="text-lg font-semibold text-[#e4e4e4]">{title}</h3>
    {message && <p className="max-w-md text-sm text-[#ababab]">{message}</p>}
    {action}
  </div>
);

export default EmptyState;
