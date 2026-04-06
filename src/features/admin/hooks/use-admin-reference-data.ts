"use client";

import { useQuery } from "@tanstack/react-query";

import { listRows } from "@/features/admin/lib/data-client";

export function useAdminReferenceData() {
  return useQuery({
    queryKey: ["admin-reference-data"],
    queryFn: async () => {
      const [businesses, settingsRows, profileRows] = await Promise.all([
        listRows("businesses", { orderBy: "name", ascending: true }),
        listRows("user_settings", { orderBy: "created_at", ascending: true }),
        listRows("profiles", { orderBy: "created_at", ascending: true }),
      ]);

      return {
        businesses,
        settings: settingsRows[0] ?? null,
        profile: profileRows[0] ?? null,
      };
    },
  });
}
