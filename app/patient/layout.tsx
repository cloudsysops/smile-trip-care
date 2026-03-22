import type { ReactNode } from "react";

import { ThemeToggle } from "@/app/components/ui/ThemeToggle";

export default function PatientLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end px-4 pt-4">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
      {children}
    </>
  );
}
