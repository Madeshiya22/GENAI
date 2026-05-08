import React from "react";
import "../../../styles/Login.scss";

const Login = () => {
  function handleGoogleLogin() {
    window.location.href = "http://localhost:3000/api/auth/google";
  }

  return (
    <section className="login">
      <div className="login__card">
        <h1>MentoAI</h1>

        <button onClick={handleGoogleLogin}>Continue with Google</button>
      </div>
    </section>
  );
};

export default Login;
