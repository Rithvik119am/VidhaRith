'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileIcon, FormInputIcon, Menu } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      label: "Forms",
      href: "/dashboard/forms",
      icon: FormInputIcon,
    },
    {
      label: "Files",
      href: "/dashboard/files",
      icon: FileIcon,
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)]  mx-auto w-full">
      {/* Mobile header */}
      <div className="flex items-center justify-between  border-b border-gray-200 p-4">
        <Link href="/dashboard/forms" className="text-lg font-semibold text-gray-800">Dashboard</Link>

        <div className="flex items-center space-x-2 lg:hidden">
          {/* Sidebar Toggle Button */}
          <Button
            variant="ghost"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* User Button */}
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Show only UserButton on large screens */}
        <div className="hidden lg:block">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64  lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto p-4 space-y-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2">
              Navigation
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant="ghost"
                    className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-muted text-primary font-medium'
                        : 'text-muted-foreground hover:bg-gray-100'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content className="container flex-grow mx-auto m-2" */}
        <main className="flex-1 overflow-y-auto p-0 bg-background lg:p-6">{children}</main>
      </div>
    </div>
  );
}
