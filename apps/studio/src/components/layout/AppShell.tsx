"use client";

import { Sidebar } from "./Sidebar";
import { SelectionToolbar } from "@/components/shared/SelectionToolbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex overflow-hidden bg-[#050507]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
        <SelectionToolbar />
      </div>
    </div>
  );
}
