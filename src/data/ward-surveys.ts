/**
 * 区ごとの調査データの登録簿。
 * 他区のデータは公式情報で確認してから `src/data/wards/<区>.ts` を作り、ここに足す。
 */
import type { WardSurvey } from "./survey.ts";
import { SHINJUKU } from "./wards/shinjuku.ts";

export const WARD_SURVEYS: Readonly<Record<string, WardSurvey>> = {
  [SHINJUKU.wardId]: SHINJUKU,
};

/** 調査データがない区は undefined（画面は「データ準備中」を出す）。 */
export function surveyOf(wardId: string): WardSurvey | undefined {
  return Object.prototype.hasOwnProperty.call(WARD_SURVEYS, wardId) ? WARD_SURVEYS[wardId] : undefined;
}

export function hasSurvey(wardId: string): boolean {
  return surveyOf(wardId) !== undefined;
}
