import Sidebar from "@/components/global/sidebar";

export default function AppLayout({
  children
} :{
  children: React.ReactNode;
}){
  return (
    <div className="min-h-full flex">
      <div>
        {/* sidebar */}
        <Sidebar />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}