/**
 * 区ごとの進捗・メモと、選択中の区の保存。
 *
 * localStorage に直接触らず `KeyValueStorage` を受け取るので、node のテストから使える。
 *
 * 保存キー
 * - `ward-yakusho:selected-ward`      … 選択中の区 id
 * - `ward-yakusho:v1:<区id>`           … 区ごとの物件情報と項目ごとの状態・メモ
 * - `ward-yakusho:legacy-migrated`     … 旧キーの移行を済ませた印
 *
 * 旧キー `shinjuku-yakusho-v1`（新宿区専用だった頃の保存）は、初回に一度だけ
 * 新宿区の進捗として新キーへ写す。旧キーは消さずに残す（戻せるように）。
 */
import type { Status } from "../data/survey.ts";

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type PropertyInfo = {
  address: string;
  chiban: string;
  name: string;
  investigator: string;
  date: string;
};

export type ItemRecord = { status: Status; memo: string };

export type WardSaved = {
  info: PropertyInfo;
  records: Record<string, ItemRecord>;
};

export const LEGACY_SHINJUKU_KEY = "shinjuku-yakusho-v1";
export const LEGACY_MIGRATED_KEY = "ward-yakusho:legacy-migrated";
export const SELECTED_WARD_KEY = "ward-yakusho:selected-ward";
const WARD_KEY_PREFIX = "ward-yakusho:v1:";

export function wardStorageKey(wardId: string): string {
  return WARD_KEY_PREFIX + wardId;
}

export const emptyInfo = (): PropertyInfo => ({
  address: "",
  chiban: "",
  name: "",
  investigator: "",
  date: "",
});

export const emptySaved = (): WardSaved => ({ info: emptyInfo(), records: {} });

/** 壊れた JSON や欠けた項目があっても空の値で補って返す。 */
export function parseSaved(raw: string | null): WardSaved {
  if (!raw) return emptySaved();
  try {
    const parsed = JSON.parse(raw) as Partial<WardSaved> | null;
    if (!parsed || typeof parsed !== "object") return emptySaved();
    const records =
      parsed.records && typeof parsed.records === "object" && !Array.isArray(parsed.records)
        ? parsed.records
        : {};
    return { info: { ...emptyInfo(), ...(parsed.info ?? {}) }, records };
  } catch {
    return emptySaved();
  }
}

/**
 * 旧キーを新宿区の新キーへ一度だけ写す。
 * - 済みの印があれば何もしない。
 * - 新宿区の新キーにすでにデータがあれば上書きしない。
 * - 旧キーは消さない。
 * 写したら true。
 */
export function migrateLegacy(storage: KeyValueStorage): boolean {
  if (storage.getItem(LEGACY_MIGRATED_KEY)) return false;
  const legacy = storage.getItem(LEGACY_SHINJUKU_KEY);
  const target = wardStorageKey("shinjuku");
  let migrated = false;
  if (legacy && storage.getItem(target) === null) {
    try {
      JSON.parse(legacy);
      storage.setItem(target, legacy);
      migrated = true;
    } catch {
      // 読めない旧データは写さない（旧キーはそのまま残る）。
    }
  }
  storage.setItem(LEGACY_MIGRATED_KEY, "1");
  return migrated;
}

export function loadWard(storage: KeyValueStorage, wardId: string): WardSaved {
  migrateLegacy(storage);
  return parseSaved(storage.getItem(wardStorageKey(wardId)));
}

export function saveWard(storage: KeyValueStorage, wardId: string, saved: WardSaved): void {
  storage.setItem(wardStorageKey(wardId), JSON.stringify(saved));
}

/** 保存された区 id が `isKnown` で通るときだけ返す。 */
export function loadSelectedWard(
  storage: KeyValueStorage,
  isKnown: (id: string) => boolean,
  fallback: string,
): string {
  const id = storage.getItem(SELECTED_WARD_KEY);
  return id && isKnown(id) ? id : fallback;
}

export function saveSelectedWard(storage: KeyValueStorage, wardId: string): void {
  storage.setItem(SELECTED_WARD_KEY, wardId);
}

/** localStorage が使えない環境（プライベートモードの一部など）でも落ちない包み。 */
export function safeStorage(storage: KeyValueStorage | undefined): KeyValueStorage {
  const memory = new Map<string, string>();
  return {
    getItem(key) {
      if (memory.has(key)) return memory.get(key)!;
      try {
        if (storage) return storage.getItem(key);
      } catch {
        /* fall through */
      }
      return null;
    },
    setItem(key, value) {
      try {
        if (storage) {
          storage.setItem(key, value);
          return;
        }
      } catch {
        /* fall through */
      }
      memory.set(key, value);
    },
  };
}
