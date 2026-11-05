/**
 * 区マスタ（東京23区）。
 *
 * - `code` は全国地方公共団体コード（6桁のうち検査数字を除く5桁）。
 * - `officialSiteUrl` / `surveyGuideUrl` は、公式情報で確認できたものだけを入れる。
 *   確認できていない区は `null` のままにし、推測のURLを入れない。
 * - 調査データの有無は区マスタではなく `src/data/ward-surveys.ts` の登録で決まる。
 */
export type Ward = {
  /** 保存キーと選択の識別子（ローマ字、小文字）。 */
  id: string;
  code: string;
  /** 表示名（「新宿区」のように「区」まで含む）。 */
  name: string;
  /** 検索用のよみ（ひらがな、「く」まで含む）。 */
  kana: string;
  /** 区の公式サイトのトップ。未確認は null。 */
  officialSiteUrl: string | null;
  /** 区の不動産調査向け案内ページ。未確認は null。 */
  surveyGuideUrl: string | null;
};

export const WARDS: readonly Ward[] = [
  { id: "chiyoda", code: "13101", name: "千代田区", kana: "ちよだく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "chuo", code: "13102", name: "中央区", kana: "ちゅうおうく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "minato", code: "13103", name: "港区", kana: "みなとく", officialSiteUrl: null, surveyGuideUrl: null },
  {
    id: "shinjuku",
    code: "13104",
    name: "新宿区",
    kana: "しんじゅくく",
    officialSiteUrl: "https://www.city.shinjuku.lg.jp/",
    surveyGuideUrl: "https://www.city.shinjuku.lg.jp/kusei/toshikei01_000001_00065.html",
  },
  { id: "bunkyo", code: "13105", name: "文京区", kana: "ぶんきょうく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "taito", code: "13106", name: "台東区", kana: "たいとうく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "sumida", code: "13107", name: "墨田区", kana: "すみだく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "koto", code: "13108", name: "江東区", kana: "こうとうく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "shinagawa", code: "13109", name: "品川区", kana: "しながわく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "meguro", code: "13110", name: "目黒区", kana: "めぐろく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "ota", code: "13111", name: "大田区", kana: "おおたく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "setagaya", code: "13112", name: "世田谷区", kana: "せたがやく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "shibuya", code: "13113", name: "渋谷区", kana: "しぶやく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "nakano", code: "13114", name: "中野区", kana: "なかのく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "suginami", code: "13115", name: "杉並区", kana: "すぎなみく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "toshima", code: "13116", name: "豊島区", kana: "としまく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "kita", code: "13117", name: "北区", kana: "きたく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "arakawa", code: "13118", name: "荒川区", kana: "あらかわく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "itabashi", code: "13119", name: "板橋区", kana: "いたばしく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "nerima", code: "13120", name: "練馬区", kana: "ねりまく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "adachi", code: "13121", name: "足立区", kana: "あだちく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "katsushika", code: "13122", name: "葛飾区", kana: "かつしかく", officialSiteUrl: null, surveyGuideUrl: null },
  { id: "edogawa", code: "13123", name: "江戸川区", kana: "えどがわく", officialSiteUrl: null, surveyGuideUrl: null },
];

/** 保存値がないときの区。既存の新宿区ユーザーの見え方を変えないため新宿区。 */
export const DEFAULT_WARD_ID = "shinjuku";

export function findWard(id: string | null | undefined): Ward | undefined {
  if (!id) return undefined;
  return WARDS.find((ward) => ward.id === id);
}

/** 区名・よみ・ローマ字で絞り込む。空の検索語は全区を返す。 */
export function searchWards(query: string, wards: readonly Ward[] = WARDS): Ward[] {
  const q = normalize(query);
  if (!q) return [...wards];
  return wards.filter((ward) => {
    const hay = [ward.name, ward.name.replace(/区$/, ""), ward.kana, ward.id].map(normalize);
    return hay.some((h) => h.includes(q));
  });
}

function normalize(s: string): string {
  // カタカナはひらがなに寄せ、大文字小文字と空白の差をなくす。
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
