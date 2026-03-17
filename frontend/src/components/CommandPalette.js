import React, { useEffect, useMemo, useState } from 'react';

export default function CommandPalette({
  open,
  onClose,
  items,
  onSelect
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items.slice(0, 12);

    return items
      .filter((item) =>
        item.name.toLowerCase().includes(term) ||
        (item.keywords || []).some((keyword) => keyword.toLowerCase().includes(term)) ||
        (item.section || '').toLowerCase().includes(term)
      )
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.max(filteredItems.length - 1, 0)));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      if (event.key === 'Enter' && filteredItems[activeIndex]) {
        event.preventDefault();
        onSelect(filteredItems[activeIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onSelect, filteredItems, activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="mx-auto mt-20 max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a module name or keyword..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-slate-500">Use arrow keys to navigate, Enter to open, Esc to close.</p>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <button
                key={item.href}
                onClick={() => onSelect(item)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  index === activeIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{item.section}</p>
              </button>
            ))
          ) : (
            <p className="px-3 py-6 text-sm text-slate-500">No modules match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
