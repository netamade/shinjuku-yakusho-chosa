import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findWard } from "./wards.ts";
import { WARD_SURVEYS } from "./ward-surveys.ts";
import * as minato from "./wards/minato.ts";
import * as setagaya from "./wards/setagaya.ts";
import * as shibuya from "./wards/shibuya.ts";
import * as shinjuku from "./wards/shinjuku.ts";

/** 区ファイルごとの定数と、登録簿に載る WardSurvey。 */
const CASES = [
  { wardId: "shinjuku", mod: shinjuku, survey: shinjuku.SHINJUKU },
  { wardId: "shibuya", mod: shibuya, survey: shibuya.SHIBUYA },
  { wardId: "minato", mod: minato, survey: minato.MINATO },
  { wardId: "setagaya", mod: setagaya, survey: setagaya.SETAGAYA },
];

describe("調査データの健全性", () => {
  it("登録簿の区はすべてこのテストの対象に入っている", () => {
    assert.deepEqual(Object.keys(WARD_SURVEYS).sort(), CASES.map((c) => c.wardId).sort());
  });

  for (const { wardId, mod, survey } of CASES) {
    describe(wardId, () => {
      it("wardId が区マスタと登録簿のキーに一致する", () => {
        assert.equal(survey.wardId, wardId);
        assert.equal(findWard(survey.wardId)?.id, wardId);
        assert.equal(WARD_SURVEYS[wardId], survey);
      });

      it("WardSurvey は区ファイルの STOPS・CATEGORIES・ITEMS をそのまま使う", () => {
        assert.equal(survey.stops, mod.STOPS);
        assert.equal(survey.categories, mod.CATEGORIES);
        assert.equal(survey.items, mod.ITEMS);
      });

      it("立ち寄り先の id が重複しない", () => {
        const ids = survey.stops.map((s) => s.id);
        assert.equal(new Set(ids).size, ids.length);
      });

      it("全項目の stop が STOPS に存在する", () => {
        const stops = new Set(survey.stops.map((s) => s.id));
        for (const item of survey.items) assert.ok(stops.has(item.stop), `${item.id}: stop "${item.stop}"`);
      });

      it("全項目の category が CATEGORIES に含まれる", () => {
        const cats = new Set(survey.categories);
        for (const item of survey.items) assert.ok(cats.has(item.category), `${item.id}: category "${item.category}"`);
      });

      it("項目 id が重複しない", () => {
        const seen = new Set<string>();
        for (const item of survey.items) {
          assert.ok(!seen.has(item.id), `重複 ${item.id}`);
          seen.add(item.id);
        }
        assert.ok(survey.items.length > 0);
      });
    });
  }
});
