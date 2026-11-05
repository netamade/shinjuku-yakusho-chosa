import { STATUS_LABEL, type Status, type WardSurvey } from "../data/survey.ts";
import type { ItemRecord, PropertyInfo } from "./ward-storage.ts";

/** 書き出し（調査メモ）の文面。区名は選択中の区に追従する。 */
export function buildExport(
  wardName: string,
  survey: WardSurvey,
  info: PropertyInfo,
  recordOf: (id: string) => ItemRecord,
): string {
  const lines: string[] = [];
  lines.push(`${wardName} 売買役所調査メモ`);
  lines.push(`住居表示: ${info.address || "（未記入）"}`);
  lines.push(`地番: ${info.chiban || "（未記入）"}`);
  lines.push(`物件名: ${info.name || "（未記入）"}`);
  lines.push(`調査日: ${info.date || "（未記入）"}`);
  lines.push(`調査者: ${info.investigator || "（未記入）"}`);
  lines.push("");
  if (survey.exportNotes.length > 0) {
    lines.push(...survey.exportNotes);
    lines.push("");
  }
  const buckets: Status[] = ["done", "hold", "na", "open"];
  const bucketTitle: Record<Status, string> = {
    done: "確認済",
    hold: "要確認",
    na: STATUS_LABEL.na,
    open: "未着手",
  };
  for (const status of buckets) {
    const rows = survey.items.filter((item) => recordOf(item.id).status === status);
    lines.push(`■ ${bucketTitle[status]}（${rows.length}）`);
    if (rows.length === 0) lines.push("（なし）");
    for (const item of rows) {
      const memo = recordOf(item.id).memo.trim();
      lines.push(`- ${item.title}${memo ? `：${memo}` : ""}`);
    }
    lines.push("");
  }
  lines.push("出典の起点: " + survey.sourceGuide);
  lines.push("本メモは調査の控であり、行政の証明書ではない。");
  return lines.join("\n");
}
