import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function WebViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") ?? "";

  useEffect(() => {
    if (!url) {
      navigate(-1);
    }
  }, [navigate, url]);

  if (!url) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {title && (
        <div className="px-4 pt-5 pb-3 bg-white">
          <h1 className="text-[22px] font-bold text-[#101828] tracking-tight truncate">{title}</h1>
        </div>
      )}
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={title}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  );
}
