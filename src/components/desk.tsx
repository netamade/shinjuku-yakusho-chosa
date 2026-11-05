import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardCopy,
  ExternalLink,
  Printer,
  RotateCcw,
  Search,
  ScrollText,
} from "lucide-react";
import {
  CATEGORIES,
  CHANNEL_LABEL,
  ITEMS,
  PRIORITY_LABEL,
  SOURCE_GUIDE,
  STATUS_LABEL,
  STOPS,
  type Channel,
  type Status,
  type SurveyItem,
} from "@/data/survey";
import { useSurveyStore } from "@/lib/survey-store";

type View = "ledger" | "route" | "export";
type ChannelFilter = "all" | Channel;

const STATUSES: Status[] = ["open", "done", "hold", "na"];

export function Desk() {
  const store = useSurveyStore();
  const [view, setView] = useState<View>("ledger");
  const [category, setCategory] = useState<string>("すべて");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [query, setQuery] = useState("");
  const [hideClosed, setHideClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  const counts = useMemo(() => {
    let done = 0;
    let na = 0;
    let hold = 0;
    for (const item of ITEMS) {
      const status = store.recordOf(item.id).status;
      if (status === "done") done += 1;
      else if (status === "na") na += 1;
      else if (status === "hold") hold += 1;
    }
    return { done, na, hold, open: ITEMS.length - done - na - hold };
  }, [store]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return ITEMS.filter((item) => {
      if (category !== "すべて" && item.category !== category) return false;
      if (channel !== "all" && item.channel !== channel) return false;
      const status = store.recordOf(item.id).status;
      if (hideClosed && (status === "done" || status === "na")) return false;
      if (!q) return true;
      const blob = [item.title, item.why, item.how, item.place, item.category, ...(item.points ?? [])].join(" ");
      return blob.includes(q);
    });
  }, [category, channel, query, hideClosed, store]);

  const exportText = useMemo(() => buildExport(store.info, store.recordOf), [store]);

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
          <div className="flex items-start gap-4">
            <div
              className="grid size-14 shrink-0 place-items-center border border-seal bg-seal font-display text-2xl text-card"
              aria-hidden
            >
              調
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-widest text-seal">SHINJUKU · REAL ESTATE</p>
              <h1 className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                新宿区 売買役所調査台帳
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                本庁舎（歌舞伎町1-4-1）を回るときの項目、窓口、電話、公式の調べ先。調査の進捗はこのブラウザに残ります。
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="住居表示" value={store.info.address} onChange={(address) => store.setInfo({ ...store.info, address })} />
            <Field label="地番" value={store.info.chiban} onChange={(chiban) => store.setInfo({ ...store.info, chiban })} />
            <Field label="物件名" value={store.info.name} onChange={(name) => store.setInfo({ ...store.info, name })} />
            <Field label="調査者" value={store.info.investigator} onChange={(investigator) => store.setInfo({ ...store.info, investigator })} />
            <label className="flex flex-col gap-1 text-xs text-muted">
              調査日
              <input
                type="date"
                value={store.info.date}
                onChange={(e) => store.setInfo({ ...store.info, date: e.target.value })}
                className="h-11 border border-line bg-paper px-3 text-sm text-ink"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Stat n={counts.done} label="確認済" />
            <Stat n={counts.hold} label="要確認" />
            <Stat n={counts.na} label="該当なし" />
            <Stat n={counts.open} label="未着手" />
            <span className="text-muted">/ {ITEMS.length}</span>
            <div className="ml-auto flex flex-wrap gap-2 no-print">
              <ViewButton current={view} id="ledger" onClick={setView}>台帳</ViewButton>
              <ViewButton current={view} id="route" onClick={setView}>来庁順</ViewButton>
              <ViewButton current={view} id="export" onClick={setView}>書き出し</ViewButton>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {view === "ledger" && (
          <Ledger
            items={filtered}
            category={category}
            setCategory={setCategory}
            channel={channel}
            setChannel={setChannel}
            query={query}
            setQuery={setQuery}
            hideClosed={hideClosed}
            setHideClosed={setHideClosed}
            store={store}
          />
        )}
        {view === "route" && <Route store={store} />}
        {view === "export" && (
          <ExportPanel
            text={exportText}
            copied={copied}
            onCopy={copyExport}
            onPrint={() => window.print()}
            onReset={store.reset}
          />
        )}

        <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            整理の軸は新宿区「都市計画情報等の調べ方（不動産調査用）」（ページ最終更新 2026年4月1日）です。都税の仮庁舎は令和8年9月24日以降の案内、埋蔵文化財のGIS照会は令和8年10月8日開始の案内に合わせています。この台帳を見た日は2026年11月5日。
          </p>
          <p className="mt-2">
            告示・窓口番号・電話は変わります。重説や契約の判断の前に、原典と窓口で確認してください。これは行政の証明書でも、特定物件の調査結果でもありません。
          </p>
          <p className="mt-2">
            <a className="text-seal underline decoration-line underline-offset-2" href={SOURCE_GUIDE} target="_blank" rel="noreferrer">
              区の不動産調査ガイドを開く
            </a>
            <span className="px-2">·</span>
            コールセンター 03-3209-9999（毎日8時–19時。個別の敷地の断定回答は窓口）
          </p>
        </footer>
      </main>
    </div>
  );
}

function Ledger({
  items,
  category,
  setCategory,
  channel,
  setChannel,
  query,
  setQuery,
  hideClosed,
  setHideClosed,
  store,
}: {
  items: SurveyItem[];
  category: string;
  setCategory: (v: string) => void;
  channel: ChannelFilter;
  setChannel: (v: ChannelFilter) => void;
  query: string;
  setQuery: (v: string) => void;
  hideClosed: boolean;
  setHideClosed: (v: boolean) => void;
  store: ReturnType<typeof useSurveyStore>;
}) {
  const cats = ["すべて", ...CATEGORIES];
  const channels: { id: ChannelFilter; label: string }[] = [
    { id: "all", label: "手段を問わない" },
    { id: "online", label: "オンライン" },
    { id: "both", label: "GIS＋窓口" },
    { id: "counter", label: "窓口" },
    { id: "offsite", label: "区役所の外" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                "h-10 shrink-0 border px-3 text-sm " +
                (category === cat ? "border-ink bg-ink text-card" : "border-line bg-card text-ink")
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="項目、窓口、電話で探す"
              className="h-11 w-full border border-line bg-card pr-3 pl-10 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setHideClosed(!hideClosed)}
            className={
              "h-11 border px-3 text-sm " +
              (hideClosed ? "border-ink bg-ink text-card" : "border-line bg-card")
            }
          >
            未と要確認だけ
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={
                "h-9 border px-3 text-xs " +
                (channel === c.id ? "border-seal bg-seal-soft text-seal" : "border-line bg-card text-muted")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">{items.length} 件</p>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} store={store} />
        ))}
        {items.length === 0 && (
          <p className="border border-dashed border-line bg-card px-4 py-10 text-center text-sm text-muted">
            条件に合う項目がありません。
          </p>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, store }: { item: SurveyItem; store: ReturnType<typeof useSurveyStore> }) {
  const rec = store.recordOf(item.id);
  return (
    <article className="border border-line bg-card">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">{item.category}</span>
            <span className="border border-line px-1.5 py-0.5 text-ink">{PRIORITY_LABEL[item.priority]}</span>
            <span className="border border-line px-1.5 py-0.5 text-muted">{CHANNEL_LABEL[item.channel]}</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm text-muted">{item.why}</p>
        </div>
        <div className="flex shrink-0 gap-1 no-print">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => store.setStatus(item.id, status)}
              className={
                "h-11 min-w-11 border px-2 text-xs " +
                (rec.status === status
                  ? status === "done"
                    ? "border-ink bg-ink text-card"
                    : status === "hold"
                      ? "border-seal bg-seal text-card"
                      : status === "na"
                        ? "border-muted bg-paper text-muted"
                        : "border-ink bg-card text-ink"
                  : "border-line bg-card text-muted")
              }
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs tracking-wide text-muted">見ること</h3>
          <ul className="mt-1 list-disc pl-4 text-sm">
            {item.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">{item.how}</p>
          {item.caveat && <p className="mt-2 text-sm text-seal">{item.caveat}</p>}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {item.place && (
            <p>
              <span className="text-muted">場所 </span>
              {item.place}
            </p>
          )}
          {item.tel && (
            <p>
              <span className="text-muted">電話 </span>
              {item.tel}
            </p>
          )}
          {item.ask && (
            <p className="border-l-2 border-seal pl-3 text-sm">
              <span className="text-muted">窓口で </span>
              {item.ask}
            </p>
          )}
          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-seal underline decoration-line underline-offset-2"
            >
              {item.hrefLabel ?? "公式ページ"}
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <label className="mt-1 flex flex-col gap-1 text-xs text-muted no-print">
            この物件のメモ
            <textarea
              value={rec.memo}
              onChange={(e) => store.setMemo(item.id, e.target.value)}
              rows={3}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink"
              placeholder="指定内容、図面番号、担当者"
            />
          </label>
          {rec.memo && <p className="hidden text-sm print:block">メモ：{rec.memo}</p>}
        </div>
      </div>
    </article>
  );
}

function Route({ store }: { store: ReturnType<typeof useSurveyStore> }) {
  const groups = STOPS.map((stop) => ({
    stop,
    items: ITEMS.filter((item) => item.stop === stop.id && store.recordOf(item.id).status !== "na"),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-line bg-card px-4 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-seal" />
          <h2 className="font-display text-xl">一日で回るなら、下から上へ</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          本庁舎は1階の都市計画図、4階のハザード、7階（用地→道路→環境→住宅）、8階（都市計画→防災まち→景観→指導→調整）。埋蔵文化財は第一分庁舎。法務局・都税・水道は別棟なので同日に詰め込みすぎない。該当なしにした項目は除いています。
        </p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li>持ち物：公図、地番メモ、確認番号、名刺、現金（概要書の写し300円、開発登録簿700円、都市計画図各200円）</li>
          <li>GISの印刷は自分で。区の窓口プリンターは使えない、と操作案内にある。</li>
          <li>道路幅員と建築基準法の道路種別は、電話では答えない。</li>
          <li>建築計画の相談は予約。斜線・角地などの敷地調査は予約不要。</li>
        </ul>
      </div>
      {groups.map(({ stop, items }) => (
        <section key={stop.id} className="border border-line bg-card">
          <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
            <h3 className="font-display text-lg">{stop.label}</h3>
            <p className="text-xs text-muted">{stop.where}</p>
          </header>
          <ul>
            {items.map((item) => {
              const rec = store.recordOf(item.id);
              return (
                <li key={item.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted">{item.place ?? item.how}</p>
                      {item.tel && <p className="text-xs">{item.tel}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted">{STATUS_LABEL[rec.status]}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ExportPanel({
  text,
  copied,
  onCopy,
  onPrint,
  onReset,
}: {
  text: string;
  copied: boolean;
  onCopy: () => void;
  onPrint: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 no-print">
        <button type="button" onClick={onCopy} className="inline-flex h-11 items-center gap-2 border border-ink bg-ink px-4 text-sm text-card">
          <ClipboardCopy className="size-4" />
          {copied ? "コピーした" : "調査メモをコピー"}
        </button>
        <button type="button" onClick={onPrint} className="inline-flex h-11 items-center gap-2 border border-line bg-card px-4 text-sm">
          <Printer className="size-4" />
          印刷
        </button>
        <button type="button" onClick={onReset} className="inline-flex h-11 items-center gap-2 border border-line bg-card px-4 text-sm text-muted">
          <RotateCcw className="size-4" />
          このブラウザの記録を消す
        </button>
      </div>
      <pre className="overflow-x-auto border border-line bg-card p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{text}</pre>
      <p className="flex items-center gap-2 text-xs text-muted no-print">
        <ScrollText className="size-3.5" />
        社内の調査票や重説の下書きに貼るための文面です。証明書の代わりにはなりません。
      </p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 border border-line bg-paper px-3 text-sm text-ink"
      />
    </label>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="border border-line bg-paper px-2 py-1 text-xs">
      <span className="font-medium text-ink">{n}</span> {label}
    </span>
  );
}

function ViewButton({
  current,
  id,
  onClick,
  children,
}: {
  current: View;
  id: View;
  onClick: (id: View) => void;
  children: string;
}) {
  const on = current === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={"h-10 border px-3 text-sm " + (on ? "border-seal bg-seal text-card" : "border-line bg-card")}
    >
      {children}
    </button>
  );
}

function buildExport(
  info: { address: string; chiban: string; name: string; investigator: string; date: string },
  recordOf: (id: string) => { status: Status; memo: string },
) {
  const lines: string[] = [];
  lines.push("新宿区 売買役所調査メモ");
  lines.push(`住居表示: ${info.address || "（未記入）"}`);
  lines.push(`地番: ${info.chiban || "（未記入）"}`);
  lines.push(`物件名: ${info.name || "（未記入）"}`);
  lines.push(`調査日: ${info.date || "（未記入）"}`);
  lines.push(`調査者: ${info.investigator || "（未記入）"}`);
  lines.push("");
  lines.push("※新宿区は全区が都市計画区域・市街化区域、景観計画区域、宅地造成等工事規制区域。");
  lines.push("※津波災害警戒区域と造成宅地防災区域は区内に指定なし（区ガイド）。");
  lines.push("※用途地域の最低敷地面積・壁面線・第一種低層の外壁後退は用途地域としてはなし。地区計画等は別。");
  lines.push("");
  const buckets: { title: string; status: Status }[] = [
    { title: "確認済", status: "done" },
    { title: "要確認", status: "hold" },
    { title: "該当なし", status: "na" },
    { title: "未着手", status: "open" },
  ];
  for (const bucket of buckets) {
    const rows = ITEMS.filter((item) => recordOf(item.id).status === bucket.status);
    lines.push(`■ ${bucket.title}（${rows.length}）`);
    if (rows.length === 0) lines.push("（なし）");
    for (const item of rows) {
      const memo = recordOf(item.id).memo.trim();
      lines.push(`- ${item.title}${memo ? `：${memo}` : ""}`);
    }
    lines.push("");
  }
  lines.push("出典の起点: " + SOURCE_GUIDE);
  lines.push("本メモは調査の控であり、行政の証明書ではない。");
  return lines.join("\n");
}
