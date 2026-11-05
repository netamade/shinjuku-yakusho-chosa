import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { searchWards, WARDS, type Ward } from "@/data/wards";
import { hasSurvey } from "@/data/ward-surveys";

/** 画面上部の区選択。区名・よみ・ローマ字で検索できる。 */
export function WardPicker({ ward, onSelect }: { ward: Ward; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchWards(query, WARDS);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative no-print">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex h-10 items-center gap-2 border border-line bg-paper px-3 text-sm"
      >
        <MapPin className="size-4 text-seal" />
        <span className="text-muted">区</span>
        <span className="font-medium">{ward.name}</span>
        {!hasSurvey(ward.id) && <span className="text-xs text-muted">（データ準備中）</span>}
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-11 left-0 z-20 w-[min(22rem,calc(100vw-2rem))] border border-line bg-card shadow-sm"
        >
          <label className="relative block border-b border-line">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) choose(results[0].id);
              }}
              placeholder="区名・よみで探す（例：しぶや）"
              aria-label="区を検索"
              className="h-11 w-full bg-card pr-3 pl-10 text-sm"
            />
          </label>
          <ul role="listbox" aria-label="東京23区" className="max-h-80 overflow-y-auto py-1">
            {results.map((w) => {
              const ready = hasSurvey(w.id);
              const selected = w.id === ward.id;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(w.id)}
                    className={
                      "flex h-10 w-full items-center gap-2 px-3 text-left text-sm " +
                      (selected ? "bg-seal-soft text-seal" : "hover:bg-paper")
                    }
                  >
                    <Check className={"size-4 " + (selected ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{w.name}</span>
                    <span className={"text-xs " + (ready ? "text-ink" : "text-muted")}>
                      {ready ? "調査データあり" : "データ準備中"}
                    </span>
                  </button>
                </li>
              );
            })}
            {results.length === 0 && <li className="px-3 py-4 text-sm text-muted">該当する区がありません。</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
