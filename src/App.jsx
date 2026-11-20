import { useState } from "react";
import "./App.css";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

import AdminDashboard from "./AdminDashboard";
import OperatorDashboard from "./OperatorDashboard";
import QCDashboard from "./QCDashboard";

const roleEmails = {
  admin001: "syarifahnaniey@gmail.com",
  operator001: "syashananiey@gmail.com",
  qc001: "s23a0160@siswa.umk.edu.my",
};

function App() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");

  // LOGIN
  const handleLogin = async () => {
    const email = roleEmails[userId.trim()];

    if (!email) {
      setMessage("Invalid User ID or Password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const selectedRole = userId.trim().replace("001", "");

      setRole(selectedRole);
      setMessage("");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Invalid User ID or Password");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRole("");
      setMessage("");
      setUserId("");
      setPassword("");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("Logout failed. Please try again.");
    }
  };


  // ADMIN DASHBOARD
  if (role === "admin") {
    return (
      <AdminDashboard onLogout={handleLogout} />
    );
  }

  // OPERATOR DASHBOARD
  if (role === "operator") {
    return <OperatorDashboard onLogout={handleLogout} />;
  }

  // QC DASHBOARD
  if (role === "qc") {
    return (
      <QCDashboard onLogout={handleLogout} />
    );
  }

  // LOGIN PAGE
  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-left">
          <h1>
            AI Predictive Monitoring
          </h1>

          <h2>
            for Order Management
          </h2>

          <p>
            Monitor orders, manage inventory,
            predict future demand, and detect
            operational risks using Artificial
            Intelligence.
          </p>
        </div>

        <div className="login-right">
          <h2>
            Welcome Back
          </h2>

          <p className="subtitle">
            Please login to access the system
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="username">
              User ID
            </label>

            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Enter your User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">
              Login
            </button>
          </form>

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}

          <p className="footer">
            AI Predictive Monitoring for
            Order Management
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;
