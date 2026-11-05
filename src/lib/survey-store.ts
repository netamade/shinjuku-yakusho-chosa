import { useEffect, useState } from "react";
import type { Status } from "@/data/survey";

const KEY = "shinjuku-yakusho-v1";

export type PropertyInfo = {
  address: string;
  chiban: string;
  name: string;
  investigator: string;
  date: string;
};

export type ItemRecord = { status: Status; memo: string };

type Saved = {
  info: PropertyInfo;
  records: Record<string, ItemRecord>;
};

const emptyInfo = (): PropertyInfo => ({
  address: "",
  chiban: "",
  name: "",
  investigator: "",
  date: "",
});

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { info: emptyInfo(), records: {} };
    const parsed = JSON.parse(raw) as Saved;
    return {
      info: { ...emptyInfo(), ...parsed.info },
      records: parsed.records ?? {},
    };
  } catch {
    return { info: emptyInfo(), records: {} };
  }
}

export function useSurveyStore() {
  const [info, setInfo] = useState<PropertyInfo>(emptyInfo);
  const [records, setRecords] = useState<Record<string, ItemRecord>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = load();
    setInfo(saved.info);
    setRecords(saved.records);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ info, records }));
  }, [info, records, hydrated]);

  function recordOf(id: string): ItemRecord {
    return records[id] ?? { status: "open", memo: "" };
  }

  function setStatus(id: string, status: Status) {
    setRecords((prev) => ({
      ...prev,
      [id]: { memo: prev[id]?.memo ?? "", status },
    }));
  }

  function setMemo(id: string, memo: string) {
    setRecords((prev) => ({
      ...prev,
      [id]: { status: prev[id]?.status ?? "open", memo },
    }));
  }

  function reset() {
    setInfo(emptyInfo());
    setRecords({});
  }

  return { info, setInfo, recordOf, setStatus, setMemo, reset, hydrated };
}
