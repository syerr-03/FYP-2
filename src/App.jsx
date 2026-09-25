import { useState } from "react";
import "./App.css";

import AdminDashboard from "./AdminDashboard";
import OperatorDashboard from "./OperatorDashboard";
import QCDashboard from "./QCDashboard";
import QADashboard from "./QADashboard";
import ManageDashboard from "./ManageDashboard";

function App() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");

  const handleLogin = () => {
    if (
      userId === "admin001" &&
      password === "admin123"
    ) {
      setRole("admin");
      setMessage("");
    }

    else if (
      userId === "operator001" &&
      password === "operator123"
    ) {
      setRole("operator");
      setMessage("");
    }

    else if (
      userId === "qc001" &&
      password === "qc123"
    ) {
      setRole("qc");
      setMessage("");
    }

    else if (
      userId === "qa001" &&
      password === "qa123"
    ) {
      setRole("qa");
      setMessage("");
    }

    else if (
      userId === "manager001" &&
      password === "manager123"
    ) {
      setRole("management");
      setMessage("");
    }

    else {
      setMessage("Invalid User ID or Password");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  const handleLogout = () => {
    setRole("");
    setMessage("");
  };

  if (role === "admin") {
    return (
      <AdminDashboard
        onLogout={handleLogout}
      />
    );
  }

  if (role === "operator") {
    return (
      <OperatorDashboard
        onLogout={handleLogout}
      />
    );
  }

  if (role === "qc") {
    return (
      <QCDashboard
        onLogout={handleLogout}
      />
    );
  }

  if (role === "qa") {
    return (
      <QADashboard
        onLogout={handleLogout}
      />
    );
  }

  if (role === "management") {
    return (
      <ManageDashboard
        onLogout={handleLogout}
      />
    );
  }

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
              onChange={(e) =>
                setUserId(e.target.value)
              }
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
              onChange={(e) =>
                setPassword(e.target.value)
              }
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