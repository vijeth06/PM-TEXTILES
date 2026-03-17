import React from 'react';

export default function PageShell({
  title,
  description,
  badge,
  actions,
  stats = [],
  children
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                {badge}
              </span>
            ) : null}
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {description ? <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {stats.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{stat.value}</p>
                {stat.helper ? <p className="mt-0.5 text-xs text-slate-500">{stat.helper}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section>{children}</section>
    </div>
  );
}
