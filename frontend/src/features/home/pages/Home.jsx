import Spline from "@splinetool/react-spline";
import { ArrowRight } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import "../../../styles/Home.scss";

const SPLINE_SCENE = "https://prod.spline.design/dqt9fhc2p7mmdJNK/scene.splinecode";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const firstName = (user?.fullname || user?.name || "there").split(" ")[0];

  return (
    <main className="home">
      <section className="home__scene" aria-label="Mento AI robot">
        <Spline scene={SPLINE_SCENE} />
      </section>

      <section className="home__content">
        <p className="home__eyebrow">Welcome, {firstName}</p>
        <h1>Mento AI</h1>
        <p className="home__copy">
          Your intelligent mentor for coding, concepts, and problem-solving.
        </p>

        <button
          type="button"
          className="home__start"
          onClick={() => navigate("/chat")}
        >
          Start chat
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
};

export default Home;
