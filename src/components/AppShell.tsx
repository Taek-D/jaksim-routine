import { type PropsWithChildren } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

const tabItems = [
  { to: "/home", label: "홈", icon: "home" },
  { to: "/report", label: "리포트", icon: "bar_chart" },
  { to: "/settings", label: "설정", icon: "settings" },
];

function shouldShowTabs(pathname: string): boolean {
  return (
    pathname.startsWith("/home") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/settings")
  );
}

export default function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const showTabs = shouldShowTabs(location.pathname);

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex justify-center">
      <div className="w-full max-w-[640px] bg-white min-h-screen relative shadow-xl flex flex-col">

        <main className="flex-1 flex flex-col relative bg-[#f4f6f8]">{children}</main>

        {showTabs && (
          <nav
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(calc(100%-32px),320px)]"
            aria-label="주요 탭"
          >
            <div className="grid grid-cols-3 h-[56px] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-gray-200/60">
              {tabItems.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-0.5 transition-colors rounded-2xl",
                      isActive ? "text-gray-900" : "text-gray-400"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={tab.icon}
                        size={22}
                        filled={isActive}
                        className={cn("transition-all", isActive && "scale-110")}
                      />
                      <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>
                        {tab.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
