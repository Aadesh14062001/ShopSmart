import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    debugger;
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed.");
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to ShopSmart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <a className="login-brand" href="/" aria-label="ShopSmart home">
          ShopSmart<span>.</span>
        </a>

        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in to continue shopping</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div className="login-options">
            <label className="remember-option">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#forgot-password">Forgot password?</a>
          </div>

          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "sign in"}
          </button>
        </form>

        <div className="login-divider">
          <span>or continue with</span>
        </div>

        <div className="login-google">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const idToken = credentialResponse.credential;

              if (!idToken) {
                alert("Google did not return an ID token.");
                return;
              }

              try {
                const response = await fetch(
                  "http://localhost:8080/api/Auth/google",
                  {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      idToken: idToken,
                    }),
                  },
                );

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(
                    data.message || "Backend authentication failed.",
                  );
                }

                // alert(`Welcome, ${data.name || data.email}!`);
                // console.log("Authenticated Google user:", data);
                window.location.href = "/";
              } catch (error) {
                console.error("Google login error:", error);
                alert(
                  error instanceof Error
                    ? error.message
                    : "Unable to connect to the backend.",
                );
              }
            }}
            onError={() => {
              alert("Google sign-in failed. Please try again.");
            }}
          />
        </div>

        <p className="login-signup">
          New to ShopSmart? <a href="#signup">Create an account</a>
        </p>

        <a className="login-back" href="/">
          ← Back to shopping
        </a>
      </section>
    </main>
  );
}
