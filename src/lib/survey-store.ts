import { useEffect, useState } from "react";
import type { Status } from "@/data/survey";
import { DEFAULT_WARD_ID, findWard } from "@/data/wards";
import {
  emptySaved,
  loadSelectedWard,
  loadWard,
  safeStorage,
  saveSelectedWard,
  saveWard,
  type ItemRecord,
  type KeyValueStorage,
  type PropertyInfo,
  type WardSaved,
} from "@/lib/ward-storage";

export type { ItemRecord, PropertyInfo } from "@/lib/ward-storage";

function browserStorage(): KeyValueStorage {
  return safeStorage(typeof window === "undefined" ? undefined : window.localStorage);
}

/** 選択中の区。初回描画後に保存値を読み、変えたら保存する。 */
export function useSelectedWard() {
  const [wardId, setWardIdState] = useState<string>(DEFAULT_WARD_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWardIdState(loadSelectedWard(browserStorage(), (id) => findWard(id) !== undefined, DEFAULT_WARD_ID));
    setHydrated(true);
  }, []);

  function setWardId(id: string) {
    if (!findWard(id)) return;
    setWardIdState(id);
    saveSelectedWard(browserStorage(), id);
  }

  return { wardId, setWardId, hydrated };
}

type State = WardSaved & { wardId: string };

/**
 * 区ごとの物件情報と進捗。保存先は区ごとに分かれる。
 * state に区 id を持たせ、区を切り替えた直後に前の区の内容を新しい区へ書かないようにしている。
 */
export function useSurveyStore(wardId: string, enabled = true) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setState({ wardId, ...loadWard(browserStorage(), wardId) });
  }, [wardId, enabled]);

  useEffect(() => {
    if (!state) return;
    saveWard(browserStorage(), state.wardId, { info: state.info, records: state.records });
  }, [state]);

  const current: WardSaved = state && state.wardId === wardId ? state : emptySaved();
  const hydrated = state !== null && state.wardId === wardId;

  function update(fn: (prev: WardSaved) => WardSaved) {
    setState((prev) => {
      if (!prev || prev.wardId !== wardId) return prev;
      return { wardId: prev.wardId, ...fn(prev) };
    });
  }

  function setInfo(info: PropertyInfo) {
    update((prev) => ({ ...prev, info }));
  }

  function recordOf(id: string): ItemRecord {
    return current.records[id] ?? { status: "open", memo: "" };
  }

  function setStatus(id: string, status: Status) {
    update((prev) => ({
      ...prev,
      records: { ...prev.records, [id]: { memo: prev.records[id]?.memo ?? "", status } },
    }));
  }

  function setMemo(id: string, memo: string) {
    update((prev) => ({
      ...prev,
      records: { ...prev.records, [id]: { status: prev.records[id]?.status ?? "open", memo } },
    }));
  }

  function reset() {
    update(() => emptySaved());
  }

  return { info: current.info, setInfo, recordOf, setStatus, setMemo, reset, hydrated };
}
