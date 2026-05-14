"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterAdminNavigation } from "./AdminSidebar";
import type { PermissionSubject } from "@/lib/permissions";

export function AdminMobileNav({
  session,
  sidebarOpen,
  setSidebarOpen,
}: {
  session: PermissionSubject;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const visibleNavigation = filterAdminNavigation(session);

  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <span className="text-xl font-bold tracking-tight text-stonehill-primary">Stonehill CMS</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {visibleNavigation.map((item) => {
                          const isActive = pathname?.startsWith(item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                  isActive
                                    ? "bg-stonehill-primary/10 text-stonehill-primary"
                                    : "text-slate-900/70 hover:bg-slate-50 hover:text-stonehill-primary"
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    "mr-3 h-5 w-5 shrink-0 transition-colors",
                                    isActive ? "text-stonehill-primary" : "text-slate-900/50 group-hover:text-stonehill-primary"
                                  )}
                                  aria-hidden="true"
                                />
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
