'use client'
import { History, Home, Settings, SidebarIcon, UserPen } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {

  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems = [
    {
      name: "Today",
      icon: <Home />,
      href: "/dashboard",
    },
    {
      name: "History",
      icon: <History />,
      href: "/history",
    },
    {
      name: "Standups",
      icon: <UserPen />,
      href: "/standups",
    },
    {
      name: "Settings",
      icon: <Settings />,
      href: "/settings",
    },
  ];

  return (
    <div className={`min-h-screen ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out overflow-hidden flex flex-col bg-[#F8FAFC] ${collapsed ? 'pl-4' : 'pl-6'} py-4 ${collapsed ? 'pr-4' : 'pr-4'}`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed &&
        <div className="flex items-center justify-baseline gap-4">
          <div className="h-8 w-8 bg-black"></div> 
          <span className="text-lg font-semibold">Standys</span>
        </div>}

        <div className="h-full flex items-center">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <SidebarIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="w-full mt-12 flex flex-col gap-8">
        {sidebarItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className=""
          >
            <div key={item.name} className={`flex w-full items-center ${collapsed ? 'justify-center gap-0' : 'justify-baseline gap-4'}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className={`font-light transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                {item.name}
              </span>
            </div>
          </a>
         
        ))}
      </div>
    </div>
  )
}
