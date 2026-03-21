import type { ReactNode } from "react";

import { PatientThemeLock } from "./PatientThemeLock";

export default function PatientLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PatientThemeLock>{children}</PatientThemeLock>;
}
