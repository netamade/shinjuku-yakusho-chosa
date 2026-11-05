import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WARD_ID, findWard, searchWards, WARDS } from "./wards.ts";
import { hasSurvey, surveyOf, WARD_SURVEYS } from "./ward-surveys.ts";
import { SHINJUKU } from "./wards/shinjuku.ts";

describe("区マスタ", () => {
  it("東京23区を重複なく載せる", () => {
    assert.equal(WARDS.length, 23);
    assert.equal(new Set(WARDS.map((w) => w.id)).size, 23);
    assert.equal(new Set(WARDS.map((w) => w.code)).size, 23);
    assert.equal(new Set(WARDS.map((w) => w.name)).size, 23);
    for (const w of WARDS) assert.match(w.name, /区$/);
  });

  it("調査データのない区の公式URLは未確認のため null", () => {
    for (const w of WARDS) {
      if (hasSurvey(w.id)) continue;
      assert.equal(w.officialSiteUrl, null, w.name);
      assert.equal(w.surveyGuideUrl, null, w.name);
    }
  });

  it("新宿区の案内ページは調査データの出典と一致する", () => {
    assert.equal(findWard("shinjuku")?.surveyGuideUrl, SHINJUKU.sourceGuide);
  });

  it("渋谷区・港区・世田谷区の案内ページは調査データの出典と一致する", () => {
    for (const id of ["shibuya", "minato", "setagaya"]) {
      const ward = findWard(id);
      assert.ok(ward?.officialSiteUrl, id);
      assert.equal(ward?.surveyGuideUrl, surveyOf(id)?.sourceGuide, id);
    }
  });

  it("既定の区は新宿区", () => {
    assert.equal(DEFAULT_WARD_ID, "shinjuku");
    assert.equal(findWard(DEFAULT_WARD_ID)?.name, "新宿区");
  });

  it("未知の id は undefined", () => {
    assert.equal(findWard("nowhere"), undefined);
    assert.equal(findWard(null), undefined);
    assert.equal(findWard(""), undefined);
  });
});

describe("区の検索", () => {
  const names = (q: string) => searchWards(q).map((w) => w.name);

  it("空の検索語は全区", () => {
    assert.equal(searchWards("").length, 23);
    assert.equal(searchWards("  ").length, 23);
  });

  it("区名・よみ・カタカナ・ローマ字で探せる", () => {
    assert.deepEqual(names("渋谷"), ["渋谷区"]);
    assert.deepEqual(names("しぶや"), ["渋谷区"]);
    assert.deepEqual(names("シブヤ"), ["渋谷区"]);
    assert.deepEqual(names("Shibuya"), ["渋谷区"]);
    assert.deepEqual(names("新宿区"), ["新宿区"]);
  });

  it("該当がなければ空", () => {
    assert.deepEqual(names("横浜"), []);
  });
});

describe("区ごとの調査データ", () => {
  it("調査データがあるのは新宿区・渋谷区・港区・世田谷区", () => {
    const ready = ["shinjuku", "shibuya", "minato", "setagaya"];
    assert.deepEqual(Object.keys(WARD_SURVEYS), ready);
    for (const w of WARDS) assert.equal(hasSurvey(w.id), ready.includes(w.id), w.name);
  });

  it("登録された調査データは区マスタの区を指す", () => {
    for (const [id, survey] of Object.entries(WARD_SURVEYS)) {
      assert.equal(survey.wardId, id);
      assert.ok(findWard(id));
    }
  });

  it("Object のプロトタイプ名を区 id とみなさない", () => {
    assert.equal(surveyOf("toString"), undefined);
    assert.equal(surveyOf("__proto__"), undefined);
  });

  it("新宿区の項目は来庁順とカテゴリの定義に収まる", () => {
    const stops = new Set(SHINJUKU.stops.map((s) => s.id));
    const cats = new Set(SHINJUKU.categories);
    const ids = new Set<string>();
    for (const item of SHINJUKU.items) {
      assert.ok(stops.has(item.stop), item.id);
      assert.ok(cats.has(item.category), item.id);
      assert.ok(!ids.has(item.id), `重複 ${item.id}`);
      ids.add(item.id);
    }
    assert.equal(SHINJUKU.items.length, 46);
  });
});
