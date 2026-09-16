import Sidebar from "@/components/global/sidebar";

export default function AppLayout({
  children
} :{
  children: React.ReactNode;
}){
  return (
    <div className="flex min-h-screen items-stretch">
      <aside className="flex self-stretch">
        {/* sidebar */}
        <Sidebar />
      </aside>
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
