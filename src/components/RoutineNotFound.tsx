import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

export default function RoutineNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center border-b border-gray-100">
        <button
          onClick={() => navigate("/home")}
          className="w-10 h-10 flex items-center justify-start text-gray-600"
          type="button"
        >
          <Icon name="arrow_back" size={24} />
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-[20px] p-8 shadow-sm flex flex-col items-center gap-4 text-center">
          <Icon name="search_off" size={48} className="text-gray-300" />
          <h1 className="text-[20px] font-bold text-[#101828]">루틴을 찾을 수 없어요</h1>
          <button
            className="h-[44px] px-6 rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
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
