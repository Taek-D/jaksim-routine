import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-[#f4f6f8]">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-[20px] p-8 shadow-sm flex flex-col items-center gap-4 text-center max-w-[360px] w-full">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Icon name="search_off" size={32} className="text-gray-400" />
          </div>
          <h1 className="text-[20px] font-bold text-[#101828]">페이지를 찾을 수 없어요</h1>
          <p className="text-[14px] text-gray-500">요청하신 페이지가 존재하지 않아요.</p>
          <button
            className="mt-2 h-[44px] px-6 rounded-xl bg-[#111827] text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
            type="button"
            onClick={() => navigate("/home")}
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
