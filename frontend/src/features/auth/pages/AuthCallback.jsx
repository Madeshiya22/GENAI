import { useEffect } from "react";
import { useNavigate } from "react-router";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 0);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="login">
      <div className="login__card">
        <h1>Signing you in</h1>
        <p>Please wait while we finish setting up your session.</p>
      </div>
    </section>
  );
};

export default AuthCallback;
