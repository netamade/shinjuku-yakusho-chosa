/**
 * 区に依存しない調査台帳の型とラベル。
 * 区ごとの調査項目は `src/data/wards/<区>.ts` に置き、`src/data/ward-surveys.ts` で登録する。
 */
export type Channel = "online" | "counter" | "both" | "offsite";
export type Priority = "must" | "usual" | "if";
export type Status = "open" | "na" | "done" | "hold";

export type SurveyItem = {
  id: string;
  category: string;
  title: string;
  priority: Priority;
  channel: Channel;
  /** 来庁順の立ち寄り先。区ごとの `WardSurvey.stops` の id を指す。 */
  stop: string;
  why: string;
  points: string[];
  how: string;
  ask?: string;
  place?: string;
  tel?: string;
  href?: string;
  hrefLabel?: string;
  caveat?: string;
};

export type Stop = { id: string; label: string; where: string };

/** 区ごとの調査データ。画面の区固有の文言もここに持たせ、画面側は区に依存しない。 */
export type WardSurvey = {
  /** 区マスタ（`WARDS`）の id。 */
  wardId: string;
  /** 見出し上の英字ラベル。 */
  tagline: string;
  /** 見出し下の説明。 */
  intro: string;
  /** 整理の起点にした区の公式ページ。 */
  sourceGuide: string;
  /** フッターのリンク文言。 */
  sourceGuideLinkLabel: string;
  stops: Stop[];
  categories: readonly string[];
  items: SurveyItem[];
  /** 来庁順タブの冒頭。 */
  route: { title: string; body: string; tips: string[] };
  /** フッターの注記（段落ごと）。 */
  footerNotes: string[];
  /** フッターのリンク横に並べる問い合わせ先。 */
  footerContact?: string;
  /** 書き出し文の冒頭に入れる区の注記（「※」で始まる行）。 */
  exportNotes: string[];
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  must: "重説で落とさない",
  usual: "通常見る",
  if: "該当しそうなとき",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  online: "オンライン",
  counter: "窓口",
  both: "GIS＋窓口",
  offsite: "区役所の外",
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "未",
  done: "済",
  na: "該当なし",
  hold: "要確認",
};
