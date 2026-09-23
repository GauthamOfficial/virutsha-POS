const PageHeading = ({ title, subtitle, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 md:px-8">
    <div>
      <h1 className="text-2xl font-bold tracking-wide text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export default PageHeading;
