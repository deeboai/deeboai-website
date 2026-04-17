"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_PREFERENCES_STORAGE_KEY = "deeboai-admin-preferences";

type AdminPreferences = Record<string, string>;

function readAdminPreferences() {
  if (typeof window === "undefined") {
    return {} as AdminPreferences;
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_PREFERENCES_STORAGE_KEY);

    if (!rawValue) {
      return {} as AdminPreferences;
    }

    const parsedValue = JSON.parse(rawValue) as AdminPreferences;

    return typeof parsedValue === "object" && parsedValue !== null ? parsedValue : {};
  } catch {
    return {} as AdminPreferences;
  }
}

function writeAdminPreferences(nextPreferences: AdminPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
}

export function useAdminPreference(key: string) {
  const [storedValue, setStoredValue] = useState("");

  useEffect(() => {
    const nextValue = readAdminPreferences()[key] ?? "";
    setStoredValue(nextValue);
  }, [key]);

  function rememberValue(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return;
    }

    const nextPreferences = {
      ...readAdminPreferences(),
      [key]: normalizedValue,
    };

    writeAdminPreferences(nextPreferences);
    setStoredValue(normalizedValue);
  }

  return {
    storedValue,
    rememberValue,
  };
}

export function usePreferredOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  preferredValue: string,
) {
  return useMemo(() => {
    if (!preferredValue) {
      return items;
    }

    return [...items].sort((left, right) => {
      if (getValue(left) === preferredValue) {
        return -1;
      }

      if (getValue(right) === preferredValue) {
        return 1;
      }

      return 0;
    });
  }, [getValue, items, preferredValue]);
}
