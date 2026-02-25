import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";

export default function WebViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") ?? "";

  if (!url) {
    navigate(-1);
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-[48px] flex items-center gap-3">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="뒤로가기"
          onClick={() => navigate(-1)}
        >
          <Icon name="arrow_back" size={22} className="text-gray-700" />
        </button>
        <span className="text-[16px] font-semibold text-[#101828] truncate">{title}</span>
      </header>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={title}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  );
}
