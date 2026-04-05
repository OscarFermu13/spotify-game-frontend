export default function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase shrink-0">{children}</span>
      <div className="flex-1 h-px bg-slate-800" />
      {action && action}
    </div>
  );
}