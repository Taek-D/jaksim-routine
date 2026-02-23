import { useEffect, useState, type PropsWithChildren } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { closeMiniApp, openExternalUrl, shareMiniAppLink } from "../integrations/tossSdk";
import { buildSupportMailto } from "../config/appConfig";
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
  const navigate = useNavigate();
  const location = useLocation();
  const showTabs = shouldShowTabs(location.pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  const closeCurrentScreen = async () => {
    const isIntro = location.pathname.startsWith("/onboarding");
    if (isIntro) {
      const closed = await closeMiniApp();
      if (!closed) {
        navigate("/home", { replace: true });
      }
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/home", { replace: true });
    }
  };

  const openReportAction = async () => {
    const opened = await openExternalUrl(
      buildSupportMailto("[작심루틴] 신고 접수"),
      { fallback: "none" }
    );
    setMoreOpen(false);
    setNotice(opened ? "신고 접수 창을 열었어요." : "토스 앱에서 신고하기를 열 수 있어요.");
  };

  const openShareAction = async () => {
    try {
      const result = await shareMiniAppLink({
        title: "작심루틴",
        text: "오늘 체크인하고 2주 루틴을 이어가요.",
        url: "intoss://jaksim-routine/home",
      });

      if (result === "shared") {
        setNotice("공유 창을 열었어요.");
      } else if (result === "copied") {
        setNotice("공유 문구를 복사했어요.");
      } else {
        setNotice("공유를 열 수 없어요.");
      }
    } catch {
      setNotice("공유를 완료하지 못했어요.");
    } finally {
      setMoreOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex justify-center">
      <div className="w-full max-w-[640px] bg-white min-h-screen relative shadow-xl flex flex-col">
        <header className="sticky top-0 z-10 bg-[#f4f6f8]/90 backdrop-blur-md px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Icon name="check_circle" size={20} className="text-gray-800" />
            <span className="text-[17px] font-bold text-[#101828]">작심루틴</span>
          </div>
          <div className="flex gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              type="button"
              aria-label="더보기"
              onClick={() => setMoreOpen(true)}
            >
              <Icon name="more_horiz" size={24} className="text-gray-600" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              type="button"
              aria-label="닫기"
              onClick={() => {
                void closeCurrentScreen();
              }}
            >
              <Icon name="close" size={24} className="text-gray-600" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative bg-[#f4f6f8]">{children}</main>

        {moreOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex justify-center items-start pt-20 px-4"
            role="presentation"
            onClick={() => setMoreOpen(false)}
          >
            <section
              className="w-full max-w-[360px] bg-white rounded-2xl p-5 shadow-xl flex flex-col gap-3"
              role="dialog"
              aria-modal="true"
              aria-label="더보기 메뉴"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-[16px] font-bold text-[#101828] mb-1">더보기</h2>
              <div className="flex flex-col gap-2">
                <button
                  className="h-[44px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => {
                    void openReportAction();
                  }}
                >
                  <Icon name="flag" size={18} />
                  신고하기
                </button>
                <button
                  className="h-[44px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => {
                    void openShareAction();
                  }}
                >
                  <Icon name="share" size={18} />
                  공유하기
                </button>
                <button
                  className="h-[44px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
                  type="button"
                  onClick={() => setMoreOpen(false)}
                >
                  닫기
                </button>
              </div>
            </section>
          </div>
        )}

        {notice && (
          <div className="fixed left-1/2 bottom-[84px] -translate-x-1/2 w-[min(calc(100%-32px),420px)] z-[130]" role="status" aria-live="polite">
            <div className="rounded-xl bg-[#101828] text-[#f9fafb] text-[13px] font-medium px-4 py-3 shadow-lg text-center">
              {notice}
            </div>
          </div>
        )}

        {showTabs && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-50 max-w-[640px] mx-auto" aria-label="주요 탭">
            <div className="grid grid-cols-3 h-[60px]">
              {tabItems.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 transition-colors active:bg-gray-50",
                      isActive ? "text-gray-900" : "text-gray-400"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={tab.icon}
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
