export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0A0A0A" }}>
      {children}
    </div>
  );
}
