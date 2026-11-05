import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_MIGRATED_KEY,
  LEGACY_SHINJUKU_KEY,
  loadSelectedWard,
  loadWard,
  migrateLegacy,
  parseSaved,
  safeStorage,
  saveSelectedWard,
  saveWard,
  SELECTED_WARD_KEY,
  wardStorageKey,
  type KeyValueStorage,
  type WardSaved,
} from "./ward-storage.ts";
import { DEFAULT_WARD_ID, findWard } from "../data/wards.ts";

class MemoryStorage implements KeyValueStorage {
  map = new Map<string, string>();
  writes: string[] = [];
  constructor(init: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(init)) this.map.set(k, v);
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.writes.push(key);
    this.map.set(key, value);
  }
}

const legacyData: WardSaved = {
  info: { address: "西新宿2-8-1", chiban: "123番4", name: "旧データ", investigator: "山田", date: "2026-10-01" },
  records: { youto: { status: "done", memo: "第一種住居" }, road: { status: "hold", memo: "" } },
};

const isKnown = (id: string) => findWard(id) !== undefined;

describe("区の切替（選択中の区の保存）", () => {
  it("保存がなければ既定の区", () => {
    assert.equal(loadSelectedWard(new MemoryStorage(), isKnown, DEFAULT_WARD_ID), "shinjuku");
  });

  it("保存した区を次回復元する", () => {
    const s = new MemoryStorage();
    saveSelectedWard(s, "shibuya");
    assert.equal(s.getItem(SELECTED_WARD_KEY), "shibuya");
    assert.equal(loadSelectedWard(s, isKnown, DEFAULT_WARD_ID), "shibuya");
    saveSelectedWard(s, "shinjuku");
    assert.equal(loadSelectedWard(s, isKnown, DEFAULT_WARD_ID), "shinjuku");
  });

  it("区マスタにない保存値は既定の区に戻す", () => {
    const s = new MemoryStorage({ [SELECTED_WARD_KEY]: "yokohama" });
    assert.equal(loadSelectedWard(s, isKnown, DEFAULT_WARD_ID), "shinjuku");
  });
});

describe("区ごとの保存分離", () => {
  it("キーは区ごとに分かれ、旧キーとは別", () => {
    assert.equal(wardStorageKey("shinjuku"), "ward-yakusho:v1:shinjuku");
    assert.notEqual(wardStorageKey("shinjuku"), wardStorageKey("shibuya"));
    assert.notEqual(wardStorageKey("shinjuku"), LEGACY_SHINJUKU_KEY);
  });

  it("ある区の保存は他の区に漏れない", () => {
    const s = new MemoryStorage();
    saveWard(s, "shinjuku", legacyData);
    const other = loadWard(s, "shibuya");
    assert.deepEqual(other.records, {});
    assert.equal(other.info.address, "");

    saveWard(s, "shibuya", { ...other, records: { youto: { status: "na", memo: "渋谷" } } });
    assert.deepEqual(loadWard(s, "shinjuku"), legacyData);
    assert.deepEqual(loadWard(s, "shibuya").records, { youto: { status: "na", memo: "渋谷" } });
  });

  it("壊れた保存値は空として読む", () => {
    assert.deepEqual(parseSaved("{not json"), parseSaved(null));
    assert.deepEqual(parseSaved("null").records, {});
    assert.deepEqual(parseSaved('{"records":[1]}').records, {});
    const partial = parseSaved('{"info":{"address":"A"}}');
    assert.equal(partial.info.address, "A");
    assert.equal(partial.info.chiban, "");
  });
});

describe("旧キー shinjuku-yakusho-v1 の移行", () => {
  it("旧データを新宿区の進捗として引き継ぎ、旧キーは残す", () => {
    const raw = JSON.stringify(legacyData);
    const s = new MemoryStorage({ [LEGACY_SHINJUKU_KEY]: raw });
    assert.deepEqual(loadWard(s, "shinjuku"), legacyData);
    assert.equal(s.getItem(LEGACY_SHINJUKU_KEY), raw);
    assert.equal(s.getItem(wardStorageKey("shinjuku")), raw);
    assert.equal(s.getItem(LEGACY_MIGRATED_KEY), "1");
  });

  it("他の区には引き継がない", () => {
    const s = new MemoryStorage({ [LEGACY_SHINJUKU_KEY]: JSON.stringify(legacyData) });
    assert.deepEqual(loadWard(s, "shibuya").records, {});
    // 他区を先に開いても、新宿区には移行済みのデータがある
    assert.deepEqual(loadWard(s, "shinjuku"), legacyData);
  });

  it("一度だけ行い、移行後の新宿区の変更を旧データで戻さない", () => {
    const s = new MemoryStorage({ [LEGACY_SHINJUKU_KEY]: JSON.stringify(legacyData) });
    assert.equal(migrateLegacy(s), true);
    const edited: WardSaved = { ...legacyData, records: {} };
    saveWard(s, "shinjuku", edited);
    assert.equal(migrateLegacy(s), false);
    assert.deepEqual(loadWard(s, "shinjuku"), edited);
  });

  it("新宿区の新キーが既にあれば上書きしない", () => {
    const current: WardSaved = { ...legacyData, info: { ...legacyData.info, name: "新しい方" } };
    const s = new MemoryStorage({
      [LEGACY_SHINJUKU_KEY]: JSON.stringify(legacyData),
      [wardStorageKey("shinjuku")]: JSON.stringify(current),
    });
    assert.equal(migrateLegacy(s), false);
    assert.deepEqual(loadWard(s, "shinjuku"), current);
  });

  it("旧データがなければ印だけ付ける", () => {
    const s = new MemoryStorage();
    assert.equal(migrateLegacy(s), false);
    assert.equal(s.getItem(wardStorageKey("shinjuku")), null);
    assert.equal(s.getItem(LEGACY_MIGRATED_KEY), "1");
  });

  it("読めない旧データは写さず、旧キーも消さない", () => {
    const s = new MemoryStorage({ [LEGACY_SHINJUKU_KEY]: "{broken" });
    assert.equal(migrateLegacy(s), false);
    assert.equal(s.getItem(wardStorageKey("shinjuku")), null);
    assert.equal(s.getItem(LEGACY_SHINJUKU_KEY), "{broken");
  });
});

describe("safeStorage", () => {
  it("localStorage がなくてもメモリで動く", () => {
    const s = safeStorage(undefined);
    s.setItem("a", "1");
    assert.equal(s.getItem("a"), "1");
    assert.equal(s.getItem("b"), null);
  });

  it("書き込みが失敗してもメモリに残す", () => {
    const failing: KeyValueStorage = {
      getItem: () => "old",
      setItem: () => {
        throw new Error("quota");
      },
    };
    const s = safeStorage(failing);
    s.setItem("k", "new");
    assert.equal(s.getItem("k"), "new");
  });
});
