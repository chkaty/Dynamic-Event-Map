import React, { useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext.jsx";

const toneCls = {
  info:    "border-blue-300 bg-blue-50",
  success: "border-green-300 bg-green-50",
  warn:    "border-amber-300 bg-amber-50",
  error:   "border-red-300 bg-red-50",
};

export default function NotificationBanner() {
  const { items, dismiss } = useNotifications();
  return (
    <div className="fixed left-1/2 top-3 z-1000 flex w-full max-w-3xl -translate-x-1/2 flex-col gap-2 px-3">
      {items.map((n) => (
        <Banner key={n.id} n={n} onClose={() => dismiss(n.id, n.stickyKey)} />
      ))}
    </div>
  );
}

function Banner({ n, onClose }) {
  useEffect(() => {
    if (!n.autoCloseMs) return;
    const t = setTimeout(onClose, n.autoCloseMs);
    return () => clearTimeout(t);
  }, [n.autoCloseMs, onClose]);

  return (
    <div className={`rounded-xl border px-4 py-3 shadow ${toneCls[n.type] || toneCls.info}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-slate-400" />
        <div className="min-w-0 flex-1">
          {n.title && <p className="truncate font-medium text-slate-900">{n.title}</p>}
          {n.message && <p className="mt-0.5 text-sm text-slate-800">{n.message}</p>}
          {n.actions?.length ? (
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {n.actions.map((a, i) => (
                <a key={i} className="underline hover:opacity-80" href={a.href} onClick={a.onClick}>
                  {a.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <button className="ml-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-white/60" onClick={onClose} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}