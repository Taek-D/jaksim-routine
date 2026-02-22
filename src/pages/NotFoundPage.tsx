import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <section className="screen centered">
      <div className="card">
        <h1 className="heading">페이지를 찾을 수 없어요</h1>
        <button className="secondary-button" type="button" onClick={() => navigate("/home")}>
          홈으로
        </button>
      </div>
    </section>
  );
}

