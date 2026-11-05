import { useMemo, useState, type ReactNode } from "react";
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
  CHANNEL_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Channel,
  type Status,
  type SurveyItem,
  type WardSurvey,
} from "@/data/survey";
import { DEFAULT_WARD_ID, findWard, WARDS, type Ward } from "@/data/wards";
import { surveyOf } from "@/data/ward-surveys";
import { buildExport } from "@/lib/export-text";
import { useSelectedWard, useSurveyStore } from "@/lib/survey-store";
import { WardPicker } from "@/components/ward-picker";

type View = "ledger" | "route" | "export";
type ChannelFilter = "all" | Channel;

const STATUSES: Status[] = ["open", "done", "hold", "na"];

export function Desk() {
  const selection = useSelectedWard();
  const ward = findWard(selection.wardId) ?? findWard(DEFAULT_WARD_ID) ?? WARDS[0];
  const survey = surveyOf(ward.id);
  const picker = <WardPicker ward={ward} onSelect={selection.setWardId} />;

  if (!survey) return <PreparingDesk ward={ward} picker={picker} />;
  // key で区ごとに絞り込みや表示タブを初期化する。
  return <WardDesk key={ward.id} ward={ward} survey={survey} picker={picker} />;
}

function WardDesk({ ward, survey, picker }: { ward: Ward; survey: WardSurvey; picker: ReactNode }) {
  const store = useSurveyStore(ward.id);
  const ITEMS = survey.items;
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
  }, [store, ITEMS]);

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
  }, [category, channel, query, hideClosed, store, ITEMS]);

  const exportText = useMemo(
    () => buildExport(ward.name, survey, store.info, store.recordOf),
    [ward.name, survey, store],
  );

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
          {picker}
          <Masthead tagline={survey.tagline} title={`${ward.name} 売買役所調査台帳`} intro={survey.intro} />

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
            categories={survey.categories}
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
        {view === "route" && <Route survey={survey} store={store} />}
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
          {survey.footerNotes.map((note, i) => (
            <p key={note} className={i === 0 ? undefined : "mt-2"}>
              {note}
            </p>
          ))}
          <p className="mt-2">
            <a className="text-seal underline decoration-line underline-offset-2" href={survey.sourceGuide} target="_blank" rel="noreferrer">
              {survey.sourceGuideLinkLabel}
            </a>
            {survey.footerContact && (
              <>
                <span className="px-2">·</span>
                {survey.footerContact}
              </>
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}

function Ledger({
  items,
  categories,
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
  categories: readonly string[];
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
  const cats = ["すべて", ...categories];
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

function Route({ survey, store }: { survey: WardSurvey; store: ReturnType<typeof useSurveyStore> }) {
  const groups = survey.stops.map((stop) => ({
    stop,
    items: survey.items.filter((item) => item.stop === stop.id && store.recordOf(item.id).status !== "na"),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-line bg-card px-4 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-seal" />
          <h2 className="font-display text-xl">{survey.route.title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted">{survey.route.body}</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {survey.route.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
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

function Masthead({ tagline, title, intro }: { tagline: string; title: string; intro: string }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="grid size-14 shrink-0 place-items-center border border-seal bg-seal font-display text-2xl text-card"
        aria-hidden
      >
        調
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs tracking-widest text-seal">{tagline}</p>
        <h1 className="font-display text-2xl font-semibold leading-tight md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{intro}</p>
      </div>
    </div>
  );
}

/** 調査データがまだない区。壊れた画面にせず、準備中であることと区の公式情報（確認済みのもののみ）を出す。 */
function PreparingDesk({ ward, picker }: { ward: Ward; picker: ReactNode }) {
  const links = [
    ward.surveyGuideUrl && { href: ward.surveyGuideUrl, label: "区の不動産調査向け案内" },
    ward.officialSiteUrl && { href: ward.officialSiteUrl, label: "区の公式サイト" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
          {picker}
          <Masthead
            tagline="TOKYO 23 WARDS · REAL ESTATE"
            title={`${ward.name} 売買役所調査台帳`}
            intro="区ごとの調査項目、窓口、電話、公式の調べ先をまとめる台帳です。"
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <section className="border border-dashed border-line bg-card px-4 py-10 text-center" aria-live="polite">
          <p className="font-display text-xl">データ準備中</p>
          <p className="mt-2 text-sm text-muted">
            {ward.name}の調査項目はまだ載せていません。公式情報で確認してから追加します。上の区の選択から、調査データのある区に切り替えられます。
          </p>
          {links.length > 0 && (
            <p className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-seal underline decoration-line underline-offset-2"
                >
                  {link.label}
                  <ExternalLink className="size-3.5" />
                </a>
              ))}
            </p>
          )}
        </section>
        <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>この台帳は行政の証明書ではありません。重説や契約の判断の前に、原典と窓口で確認してください。</p>
        </footer>
      </main>
    </div>
  );
}
