export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="report-scroll-container" className="w-full min-h-screen" style={{ background: "#0A0A0A" }}>
      {children}
    </div>
  );
}
