import { useEffect, useState, type PropsWithChildren } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { closeMiniApp, openExternalUrl, shareMiniAppLink } from "../integrations/tossSdk";
import { buildSupportMailto } from "../config/appConfig";

const tabItems = [
  { to: "/home", label: "홈" },
  { to: "/report", label: "리포트" },
  { to: "/settings", label: "설정" },
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
    <div className="app">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-mark">JR</span>
          <span className="brand-name">작심루틴</span>
        </div>
        <div className="top-actions">
          <button
            className="ghost-button"
            type="button"
            aria-label="더보기"
            onClick={() => setMoreOpen(true)}
          >
            ⋯
          </button>
          <button
            className="ghost-button"
            type="button"
            aria-label="닫기"
            onClick={() => {
              void closeCurrentScreen();
            }}
          >
            ✕
          </button>
        </div>
      </header>

      <main className="content">{children}</main>

      {moreOpen && (
        <div className="overlay-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
          <section
            className="overlay-card more-menu-card"
            role="dialog"
            aria-modal="true"
            aria-label="더보기 메뉴"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="subheading more-menu-title">더보기</h2>
            <div className="button-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  void openReportAction();
                }}
              >
                신고하기
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  void openShareAction();
                }}
              >
                공유하기
              </button>
              <button className="primary-button" type="button" onClick={() => setMoreOpen(false)}>
                닫기
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && (
        <div className="mini-toast-anchor" role="status" aria-live="polite">
          <div className="mini-toast">{notice}</div>
        </div>
      )}

      {showTabs && (
        <nav className="tab-nav" aria-label="주요 탭">
          {tabItems.map((tab) => (
            <NavLink
              key={tab.to}
              className={({ isActive }) => (isActive ? "tab-link active" : "tab-link")}
              to={tab.to}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
