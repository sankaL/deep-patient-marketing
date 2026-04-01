import type { ReactNode } from "react";
import { DailyProvider } from "@daily-co/daily-react";

export const CVIProvider = ({ children }: { children: ReactNode }) => {
  return (
    <DailyProvider>
      {children}
    </DailyProvider>
  )
}
