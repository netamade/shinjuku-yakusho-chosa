import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildExport } from "./export-text.ts";
import { SHINJUKU } from "../data/wards/shinjuku.ts";
import type { WardSurvey } from "../data/survey.ts";
import { emptyInfo, type ItemRecord } from "./ward-storage.ts";

const open = (): ItemRecord => ({ status: "open", memo: "" });

describe("書き出し文", () => {
  it("新宿区の見出し・注記・出典は従来どおり", () => {
    const text = buildExport("新宿区", SHINJUKU, emptyInfo(), open);
    const lines = text.split("\n");
    assert.equal(lines[0], "新宿区 売買役所調査メモ");
    assert.ok(text.includes("※新宿区は全区が都市計画区域・市街化区域、景観計画区域、宅地造成等工事規制区域。"));
    assert.ok(text.includes(`■ 未着手（${SHINJUKU.items.length}）`));
    assert.ok(text.includes("出典の起点: " + SHINJUKU.sourceGuide));
    assert.equal(lines.at(-1), "本メモは調査の控であり、行政の証明書ではない。");
  });

  it("区名は選択中の区に追従し、区の注記はその区のものだけ入る", () => {
    const other: WardSurvey = {
      ...SHINJUKU,
      wardId: "test",
      items: SHINJUKU.items.slice(0, 2),
      exportNotes: [],
      sourceGuide: "https://example.invalid/guide",
    };
    const text = buildExport("テスト区", other, emptyInfo(), open);
    assert.equal(text.split("\n")[0], "テスト区 売買役所調査メモ");
    assert.ok(!text.includes("新宿区"));
    assert.ok(text.includes("■ 未着手（2）"));
  });

  it("状態ごとに振り分け、メモを添える", () => {
    const recs: Record<string, ItemRecord> = {
      identify: { status: "done", memo: " 地番確認 " },
      registry: { status: "na", memo: "" },
    };
    const text = buildExport("新宿区", SHINJUKU, { ...emptyInfo(), address: "西新宿1-1" }, (id) => recs[id] ?? open());
    assert.ok(text.includes("住居表示: 西新宿1-1"));
    assert.ok(text.includes("地番: （未記入）"));
    assert.ok(text.includes("■ 確認済（1）\n- 住居表示と地番を分けて押さえる：地番確認"));
    assert.ok(text.includes("■ 該当なし（1）\n- 登記事項・公図・地積測量図"));
    assert.ok(text.includes("■ 要確認（0）\n（なし）"));
  });
});
