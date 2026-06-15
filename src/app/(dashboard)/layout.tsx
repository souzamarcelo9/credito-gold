import { SessionWrapper } from "@/components/dashboard/SessionWrapper"
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>
}
