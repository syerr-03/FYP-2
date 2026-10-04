import { useEffect, useState } from "react";
import "./AdminDashboard.css";

function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastMonths, setForecastMonths] = useState(3);
  const [forecastStart, setForecastStart] = useState("");
  const [forecastEnd, setForecastEnd] = useState("");
  
  const formatForecastDate = (dateString) => {
    if (!dateString) return "";

    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    setForecastLoading(true);

    fetch(
      `http://127.0.0.1:5000/predict-demand?months=${forecastMonths}`
    )
      .then((response) => response.json())
      .then((result) => {
        setForecastData(result.data || []);
        setForecastStart(result.forecast_start || "");
        setForecastEnd(result.forecast_end || "");
        setForecastLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching forecast:", error);
        setForecastLoading(false);
      });

}, [forecastMonths]);

    const forecastSummary = Object.values(
      forecastData.reduce((acc, item) => {
        const code = item.Product_Code;
        const qty = Number(item.Predicted_Quantity) || 0;

        if (!acc[code]) {
          acc[code] = {
            Product_Code: code,
            Predicted_Quantity: 0,
          };
        }

        acc[code].Predicted_Quantity += qty;

        return acc;
      }, {})
    ).sort(
      (a, b) => b.Predicted_Quantity - a.Predicted_Quantity
    );

    const getDemandCategory = (qty) => {
      if (qty >= 1000) return "High";
      if (qty >= 300) return "Medium";
      return "Low";
    };

    const highDemandCount = forecastSummary.filter(
      (item) => item.Predicted_Quantity >= 1000
    ).length;

    const mediumDemandCount = forecastSummary.filter(
      (item) =>
        item.Predicted_Quantity >= 300 &&
        item.Predicted_Quantity < 1000
    ).length;

    const lowDemandCount = forecastSummary.filter(
      (item) => item.Predicted_Quantity < 300
    ).length;

    const highestDemandProduct = forecastSummary[0];
    
    const monthlyForecast = forecastData.reduce((acc, item) => {
      const month = item.Month;
      const qty = Number(item.Predicted_Quantity) || 0;

      if (!acc[month]) {
        acc[month] = 0;
      }

      acc[month] += qty;

      return acc;
    }, {});

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const maxMonthlyDemand = Math.max(
      ...months.map((month) => monthlyForecast[month] || 0),
      1
    );

    const topProducts = forecastSummary.slice(0, 10);

    const highestMonthlyProduct =
      highestDemandProduct?.Product_Code || "-";

  return (
    <div className="admin-layout">

      <aside className="sidebar">
        <div>
          <h2 className="brand">OrderAI</h2>

          <nav>
            <a
              className={activePage === "dashboard" ? "active" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </a>

            <a
              className={activePage === "orders" ? "active" : ""}
              onClick={() => setActivePage("orders")}
            >
              Order Management
            </a>

            <a
              className={activePage === "inventory" ? "active" : ""}
              onClick={() => setActivePage("inventory")}
            >
              Inventory Management
            </a>

            <a
                className={activePage === "staff" ? "active" : ""}
                onClick={() => setActivePage("staff")}
                >
                Staff Management
                </a>
            <a
                className={activePage === "risk" ? "active" : ""}
                onClick={() => setActivePage("risk")}
                >
                Operational Risk
                </a>
            <a
                className={activePage === "forecast" ? "active" : ""}
                onClick={() => setActivePage("forecast")}
                >
                Demand Forecasting
                </a>
            <a
                className={activePage === "customer" ? "active" : ""}
                onClick={() => setActivePage("customer")}
                >
                Customer Analytics
                </a>
            <a
                className={activePage === "anomaly" ? "active" : ""}
                onClick={() => setActivePage("anomaly")}
                >
                Anomaly Detection
                </a>
            <a
                className={activePage === "reports" ? "active" : ""}
                onClick={() => setActivePage("reports")}
                >
                Reports
                </a>
          </nav>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>


      <main className="main-content">

        {/* =========================
            ADMIN DASHBOARD
        ========================== */}

        {activePage === "dashboard" && (
          <>
            <div className="topbar">
              <div>
                <h1>Admin Dashboard</h1>
                <p>
                  AI Predictive Monitoring for Order Management
                </p>
              </div>

              <div className="admin-profile">
                <div className="profile-circle">
                  A
                </div>

                <div>
                  <strong>Admin</strong>
                  <p>admin001</p>
                </div>
              </div>
            </div>


            <div className="summary-grid">

              <div className="summary-card">
                <p>Total Orders</p>
                <h2>1,248</h2>
                <span className="normal">
                  +8.4% this month
                </span>
              </div>

              <div className="summary-card">
                <p>Pending Orders</p>
                <h2>86</h2>
                <span className="warning">
                  Needs attention
                </span>
              </div>

              <div className="summary-card">
                <p>Low Stock Items</p>
                <h2>12</h2>
                <span className="danger">
                  Stock warning
                </span>
              </div>

              <div className="summary-card">
                <p>Risk Alerts</p>
                <h2>7</h2>
                <span className="danger">
                  High priority
                </span>
              </div>

            </div>


            <div className="dashboard-grid">

              <div className="panel">
                <h3>Order Overview</h3>

                <div className="fake-chart">
                  <div style={{ height: "35%" }}></div>
                  <div style={{ height: "55%" }}></div>
                  <div style={{ height: "48%" }}></div>
                  <div style={{ height: "75%" }}></div>
                  <div style={{ height: "65%" }}></div>
                  <div style={{ height: "88%" }}></div>
                </div>
              </div>


              <div className="panel">
                <h3>Operational Alerts</h3>

                <div className="alert danger-alert">
                  <strong>High Risk</strong>
                  <p>
                    5 orders have unusual cancellation patterns.
                  </p>
                </div>

                <div className="alert warning-alert">
                  <strong>Stock Warning</strong>
                  <p>
                    Product A may run low within 7 days.
                  </p>
                </div>

                <div className="alert success-alert">
                  <strong>Inventory Stable</strong>
                  <p>
                    Most products currently have sufficient stock.
                  </p>
                </div>
              </div>

            </div>


            <div className="panel bottom-panel">
              <h3>Recent Orders</h3>

              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Order Date</th>
                    <th>Order Time</th>
                    <th>Status</th>
                    <th>Delivery</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>ORD001</td>
                    <td>Nur Aina</td>
                    <td>25/09/2026</td>
                    <td>08:15 AM</td>

                    <td>
                      <span className="status green">
                        Completed
                      </span>
                    </td>

                    <td>
                      <span className="status green">
                        Delivered
                      </span>
                    </td>

                    <td>
                      <span className="status green">
                        Low
                      </span>
                    </td>
                  </tr>


                  <tr>
                    <td>ORD002</td>
                    <td>Amirul</td>
                    <td>25/09/2026</td>
                    <td>08:42 AM</td>

                    <td>
                      <span className="status yellow">
                        Processing
                      </span>
                    </td>

                    <td>
                      <span className="status yellow">
                        On The Way
                      </span>
                    </td>

                    <td>
                      <span className="status yellow">
                        Medium
                      </span>
                    </td>
                  </tr>


                  <tr>
                    <td>ORD003</td>
                    <td>Siti Hajar</td>
                    <td>25/09/2026</td>
                    <td>09:05 AM</td>

                    <td>
                      <span className="status red">
                        Cancelled
                      </span>
                    </td>

                    <td>
                      <span className="status red">
                        Delayed
                      </span>
                    </td>

                    <td>
                      <span className="status red">
                        High
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </>
        )}


        {/* =========================
            ORDER MANAGEMENT
        ========================== */}

        {activePage === "orders" && (
          <>
            <div className="topbar">
              <div>
                <h1>Order Management</h1>
                <p>
                  View and manage customer orders
                </p>
              </div>

              <div className="admin-profile">
                <div className="profile-circle">
                  A
                </div>

                <div>
                  <strong>Admin</strong>
                  <p>admin001</p>
                </div>
              </div>
            </div>


            <div className="panel">

              <div className="order-page-header">

                <div>
                  <h3>All Orders</h3>

                  <p className="order-subtitle">
                    Monitor order date, time, status,
                    delivery and risk level
                  </p>
                </div>

                <button className="add-order-btn">
                  + Add Order
                </button>

              </div>


              <div className="order-filters">

                <input
                  type="text"
                  placeholder="Search Order ID or Customer..."
                />

                <select>
                  <option>All Status</option>
                  <option>New Order</option>
                  <option>Processing</option>
                  <option>Waiting QC</option>
                  <option>Ready for Delivery</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>

                <select>
                  <option>All Risk</option>
                  <option>Low Risk</option>
                  <option>Medium Risk</option>
                  <option>High Risk</option>
                </select>

              </div>


              <div className="bottom-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Order Date</th>
                      <th>Order Time</th>
                      <th>Status</th>
                      <th>Delivery</th>
                      <th>Risk</th>
                      <th>Action</th>
                    </tr>
                  </thead>


                  <tbody>

                    <tr>
                      <td>ORD1058</td>
                      <td>Aina</td>
                      <td>Serum A</td>
                      <td>2</td>
                      <td>25/09/2026</td>
                      <td>08:15 AM</td>

                      <td>
                        <span className="status yellow">
                          Processing
                        </span>
                      </td>

                      <td>
                        <span className="status yellow">
                          Preparing
                        </span>
                      </td>

                      <td>
                        <span className="status green">
                          Low
                        </span>
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>ORD1059</td>
                      <td>Farah</td>
                      <td>Cleanser B</td>
                      <td>1</td>
                      <td>25/09/2026</td>
                      <td>08:42 AM</td>

                      <td>
                        <span className="status green">
                          Completed
                        </span>
                      </td>

                      <td>
                        <span className="status green">
                          Delivered
                        </span>
                      </td>

                      <td>
                        <span className="status green">
                          Low
                        </span>
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>ORD1060</td>
                      <td>Amir</td>
                      <td>Product C</td>
                      <td>4</td>
                      <td>25/09/2026</td>
                      <td>09:05 AM</td>

                      <td>
                        <span className="status yellow">
                          Waiting QC
                        </span>
                      </td>

                      <td>
                        <span className="status yellow">
                          Pending
                        </span>
                      </td>

                      <td>
                        <span className="status yellow">
                          Medium
                        </span>
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>ORD1061</td>
                      <td>Sofia</td>
                      <td>Product D</td>
                      <td>5</td>
                      <td>25/09/2026</td>
                      <td>09:18 AM</td>

                      <td>
                        <span className="status red">
                          Cancelled
                        </span>
                      </td>

                      <td>
                        <span className="status red">
                          Not Shipped
                        </span>
                      </td>

                      <td>
                        <span className="status red">
                          High
                        </span>
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>ORD1062</td>
                      <td>Hana</td>
                      <td>Serum A</td>
                      <td>3</td>
                      <td>25/09/2026</td>
                      <td>09:32 AM</td>

                      <td>
                        <span className="status yellow">
                          Waiting QC
                        </span>
                      </td>

                      <td>
                        <span className="status yellow">
                          Pending
                        </span>
                      </td>

                      <td>
                        <span className="status green">
                          Low
                        </span>
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>

                  </tbody>

                </table>

              </div>

            </div>
          </>
        )}


        {/* =========================
            INVENTORY MANAGEMENT
        ========================== */}

        {activePage === "inventory" && (
          <>
            <div className="topbar">
              <div>
                <h1>Inventory Management</h1>
                <p>
                  Monitor product stock levels and inventory status
                </p>
              </div>

              <div className="admin-profile">
                <div className="profile-circle">
                  A
                </div>

                <div>
                  <strong>Admin</strong>
                  <p>admin001</p>
                </div>
              </div>
            </div>


            {/* INVENTORY SUMMARY */}

            <div className="inventory-summary-grid">

              <div className="inventory-summary-card">
                <p>Total Products</p>
                <h2>48</h2>
                <span className="normal">
                  Active products
                </span>
              </div>

              <div className="inventory-summary-card">
                <p>Stock Available</p>
                <h2>2,450</h2>
                <span className="normal">
                  Total available units
                </span>
              </div>

              <div className="inventory-summary-card">
                <p>Low Stock</p>
                <h2>7</h2>
                <span className="warning">
                  Restock soon
                </span>
              </div>

              <div className="inventory-summary-card">
                <p>Critical Stock</p>
                <h2>3</h2>
                <span className="danger">
                  Immediate attention
                </span>
              </div>

            </div>


            {/* INVENTORY ALERTS */}

            <div className="dashboard-grid">

              <div className="panel">
                <h3>Stock Overview</h3>

                <div className="inventory-stock-list">

                  <div className="inventory-stock-item">
                    <div>
                      <strong>Serum A</strong>
                      <p>SKU: PRD001</p>
                    </div>

                    <div>
                      <span className="status green">
                        120 Available
                      </span>
                    </div>
                  </div>


                  <div className="inventory-stock-item">
                    <div>
                      <strong>Cleanser B</strong>
                      <p>SKU: PRD002</p>
                    </div>

                    <div>
                      <span className="status yellow">
                        35 Low Stock
                      </span>
                    </div>
                  </div>


                  <div className="inventory-stock-item">
                    <div>
                      <strong>Product C</strong>
                      <p>SKU: PRD003</p>
                    </div>

                    <div>
                      <span className="status red">
                        8 Critical
                      </span>
                    </div>
                  </div>

                </div>
              </div>


              <div className="panel">
                <h3>Inventory Alerts</h3>

                <div className="alert danger-alert">
                  <strong>Critical Stock</strong>
                  <p>
                    Product C has only 8 units remaining.
                  </p>
                </div>

                <div className="alert warning-alert">
                  <strong>Low Stock Warning</strong>
                  <p>
                    Cleanser B is approaching minimum stock level.
                  </p>
                </div>

                <div className="alert success-alert">
                  <strong>Inventory Stable</strong>
                  <p>
                    38 products currently have sufficient stock.
                  </p>
                </div>
              </div>

            </div>


            {/* INVENTORY TABLE */}

            <div className="panel">

              <div className="inventory-page-header">

                <div>
                  <h3>Product Inventory</h3>

                  <p className="inventory-subtitle">
                    View current, reserved and available stock levels
                  </p>
                </div>

                <button className="add-product-btn">
                  + Add Product
                </button>

              </div>


              <div className="inventory-filters">

                <input
                  type="text"
                  placeholder="Search Product ID or Product Name..."
                />

                <select>
                  <option>All Stock Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Critical Stock</option>
                  <option>Out of Stock</option>
                </select>

              </div>


              <div className="bottom-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Reserved</th>
                      <th>Available</th>
                      <th>Minimum Stock</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>


                  <tbody>

                    <tr>
                      <td>PRD001</td>
                      <td>Serum A</td>
                      <td>150</td>
                      <td>30</td>
                      <td>120</td>
                      <td>40</td>

                      <td>
                        <span className="status green">
                          In Stock
                        </span>
                      </td>

                      <td>
                        25/09/2026
                        <br />
                        08:30 AM
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>PRD002</td>
                      <td>Cleanser B</td>
                      <td>50</td>
                      <td>15</td>
                      <td>35</td>
                      <td>40</td>

                      <td>
                        <span className="status yellow">
                          Low Stock
                        </span>
                      </td>

                      <td>
                        25/09/2026
                        <br />
                        08:45 AM
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>PRD003</td>
                      <td>Product C</td>
                      <td>12</td>
                      <td>4</td>
                      <td>8</td>
                      <td>30</td>

                      <td>
                        <span className="status red">
                          Critical
                        </span>
                      </td>

                      <td>
                        25/09/2026
                        <br />
                        09:02 AM
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>PRD004</td>
                      <td>Product D</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>25</td>

                      <td>
                        <span className="status red">
                          Out of Stock
                        </span>
                      </td>

                      <td>
                        25/09/2026
                        <br />
                        09:10 AM
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>


                    <tr>
                      <td>PRD005</td>
                      <td>Toner E</td>
                      <td>200</td>
                      <td>25</td>
                      <td>175</td>
                      <td>50</td>

                      <td>
                        <span className="status green">
                          In Stock
                        </span>
                      </td>

                      <td>
                        25/09/2026
                        <br />
                        09:20 AM
                      </td>

                      <td>
                        <button className="table-action-btn">
                          View
                        </button>
                      </td>
                    </tr>

                  </tbody>

                </table>

              </div>

            </div>
          </>
        )}

        {/* =========================
            STAFF MANAGEMENT
        ========================== */}

        {activePage === "staff" && (
        <>
            <div className="topbar">
            <div>
                <h1>Staff Management</h1>
                <p>
                Manage system users, staff roles and account status
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">
                A
                </div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* STAFF SUMMARY */}

            <div className="staff-summary-grid">

            <div className="staff-summary-card">
                <p>Total Staff</p>
                <h2>18</h2>
                <span className="normal">
                Registered users
                </span>
            </div>

            <div className="staff-summary-card">
                <p>Operators</p>
                <h2>8</h2>
                <span className="normal">
                Order operations
                </span>
            </div>

            <div className="staff-summary-card">
                <p>QC & QA</p>
                <h2>6</h2>
                <span className="normal">
                Quality team
                </span>
            </div>

            <div className="staff-summary-card">
                <p>Inactive Accounts</p>
                <h2>2</h2>
                <span className="danger">
                Account attention
                </span>
            </div>

            </div>


            {/* STAFF TABLE */}

            <div className="panel">

            <div className="staff-page-header">

                <div>
                <h3>Staff Accounts</h3>

                <p className="staff-subtitle">
                    View and manage staff access to the system
                </p>
                </div>

                <button className="add-staff-btn">
                + Add Staff
                </button>

            </div>


            <div className="staff-filters">

                <input
                type="text"
                placeholder="Search Staff ID or Name..."
                />

                <select>
                <option>All Roles</option>
                <option>Operator</option>
                <option>QC</option>
                <option>QA</option>
                <option>Management</option>
                </select>

                <select>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                    <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Action</th>
                    </tr>
                </thead>

                <tbody>

                    <tr>
                    <td>STF001</td>
                    <td>Nur Aisyah</td>
                    <td>
                        <span className="role-badge operator-role">
                        Operator
                        </span>
                    </td>
                    <td>aisyah@orderai.com</td>

                    <td>
                        <span className="status green">
                        Active
                        </span>
                    </td>

                    <td>
                        25/09/2026
                        <br />
                        08:10 AM
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>STF002</td>
                    <td>Amir Hakim</td>
                    <td>
                        <span className="role-badge qc-role">
                        QC
                        </span>
                    </td>
                    <td>amir@orderai.com</td>

                    <td>
                        <span className="status green">
                        Active
                        </span>
                    </td>

                    <td>
                        25/09/2026
                        <br />
                        08:25 AM
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>STF003</td>
                    <td>Siti Hana</td>
                    <td>
                        <span className="role-badge qa-role">
                        QA
                        </span>
                    </td>
                    <td>hana@orderai.com</td>

                    <td>
                        <span className="status green">
                        Active
                        </span>
                    </td>

                    <td>
                        25/09/2026
                        <br />
                        08:40 AM
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>STF004</td>
                    <td>Farid Zain</td>
                    <td>
                        <span className="role-badge management-role">
                        Management
                        </span>
                    </td>
                    <td>farid@orderai.com</td>

                    <td>
                        <span className="status green">
                        Active
                        </span>
                    </td>

                    <td>
                        24/09/2026
                        <br />
                        04:15 PM
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>STF005</td>
                    <td>Nadia Karim</td>
                    <td>
                        <span className="role-badge operator-role">
                        Operator
                        </span>
                    </td>
                    <td>nadia@orderai.com</td>

                    <td>
                        <span className="status red">
                        Inactive
                        </span>
                    </td>

                    <td>
                        18/09/2026
                        <br />
                        11:20 AM
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>

                </tbody>

                </table>

            </div>

            </div>
        </>
        )}

        {/* =========================
            OPERATIONAL RISK
        ========================== */}

        {activePage === "risk" && (
        <>
            <div className="topbar">
            <div>
                <h1>Operational Risk</h1>
                <p>
                Monitor and review operational risks detected in the system
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">
                A
                </div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* RISK SUMMARY */}

            <div className="risk-summary-grid">

            <div className="risk-summary-card">
                <p>Total Risk Alerts</p>
                <h2>24</h2>
                <span className="warning">
                This month
                </span>
            </div>

            <div className="risk-summary-card">
                <p>High Risk</p>
                <h2>7</h2>
                <span className="danger">
                Immediate attention
                </span>
            </div>

            <div className="risk-summary-card">
                <p>Medium Risk</p>
                <h2>10</h2>
                <span className="warning">
                Monitor closely
                </span>
            </div>

            <div className="risk-summary-card">
                <p>Low Risk</p>
                <h2>7</h2>
                <span className="normal">
                Stable
                </span>
            </div>

            </div>


            {/* RISK OVERVIEW */}

            <div className="dashboard-grid">

            <div className="panel">
                <h3>Risk Categories</h3>

                <div className="risk-category-list">

                <div className="risk-category-item">
                    <div>
                    <strong>Order Cancellation</strong>
                    <p>Repeated customer cancellations</p>
                    </div>

                    <span className="status red">
                    6 Alerts
                    </span>
                </div>


                <div className="risk-category-item">
                    <div>
                    <strong>Delivery Delay</strong>
                    <p>Orders exceeding expected delivery time</p>
                    </div>

                    <span className="status yellow">
                    5 Alerts
                    </span>
                </div>


                <div className="risk-category-item">
                    <div>
                    <strong>Stock Shortage</strong>
                    <p>Insufficient inventory for active orders</p>
                    </div>

                    <span className="status red">
                    4 Alerts
                    </span>
                </div>


                <div className="risk-category-item">
                    <div>
                    <strong>Returns</strong>
                    <p>High number of returned orders</p>
                    </div>

                    <span className="status yellow">
                    3 Alerts
                    </span>
                </div>

                </div>
            </div>


            <div className="panel">
                <h3>Recent Risk Alerts</h3>

                <div className="alert danger-alert">
                <strong>High Cancellation Risk</strong>
                <p>
                    Customer CUS018 has cancelled 4 orders recently.
                </p>
                </div>

                <div className="alert danger-alert">
                <strong>Stock Shortage</strong>
                <p>
                    Product C stock may not support current demand.
                </p>
                </div>

                <div className="alert warning-alert">
                <strong>Delivery Delay</strong>
                <p>
                    Several deliveries to Area B are delayed.
                </p>
                </div>
            </div>

            </div>


            {/* RISK TABLE */}

            <div className="panel">

            <div className="risk-page-header">

                <div>
                <h3>Risk Monitoring</h3>

                <p className="risk-subtitle">
                    View risk level, type and affected orders
                </p>
                </div>

            </div>


            <div className="risk-filters">

                <input
                type="text"
                placeholder="Search Order ID or Customer..."
                />

                <select>
                <option>All Risk Types</option>
                <option>Cancellation</option>
                <option>Return</option>
                <option>Delivery Delay</option>
                <option>Stock Shortage</option>
                <option>Invalid Order</option>
                <option>Supplier Delay</option>
                </select>

                <select>
                <option>All Risk Levels</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                    <tr>
                    <th>Risk ID</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Risk Type</th>
                    <th>Risk Level</th>
                    <th>Date Detected</th>
                    <th>Status</th>
                    <th>Action</th>
                    </tr>
                </thead>


                <tbody>

                    <tr>
                    <td>RSK001</td>
                    <td>ORD1061</td>
                    <td>Sofia</td>
                    <td>Cancellation</td>

                    <td>
                        <span className="status red">
                        High
                        </span>
                    </td>

                    <td>
                        25/09/2026
                        <br />
                        09:20 AM
                    </td>

                    <td>
                        <span className="status red">
                        Active
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>RSK002</td>
                    <td>ORD1060</td>
                    <td>Amir</td>
                    <td>Stock Shortage</td>

                    <td>
                        <span className="status red">
                        High
                        </span>
                    </td>

                    <td>
                        25/09/2026
                        <br />
                        09:05 AM
                    </td>

                    <td>
                        <span className="status yellow">
                        Monitoring
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>RSK003</td>
                    <td>ORD1049</td>
                    <td>Haziq</td>
                    <td>Delivery Delay</td>

                    <td>
                        <span className="status yellow">
                        Medium
                        </span>
                    </td>

                    <td>
                        24/09/2026
                        <br />
                        04:30 PM
                    </td>

                    <td>
                        <span className="status yellow">
                        Monitoring
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>RSK004</td>
                    <td>ORD1038</td>
                    <td>Nadia</td>
                    <td>Return</td>

                    <td>
                        <span className="status yellow">
                        Medium
                        </span>
                    </td>

                    <td>
                        24/09/2026
                        <br />
                        02:10 PM
                    </td>

                    <td>
                        <span className="status green">
                        Resolved
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>RSK005</td>
                    <td>ORD1025</td>
                    <td>Farah</td>
                    <td>Invalid Order</td>

                    <td>
                        <span className="status green">
                        Low
                        </span>
                    </td>

                    <td>
                        23/09/2026
                        <br />
                        11:45 AM
                    </td>

                    <td>
                        <span className="status green">
                        Resolved
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>

                </tbody>

                </table>

            </div>

            </div>
        </>
        )}

        {/* =========================
            DEMAND FORECASTING
        ========================== */}

        {activePage === "forecast" && (
        <>
            <div className="topbar">
            <div>
                <h1>Demand Forecasting</h1>
                <p>
                Monitor predicted product demand based on historical order trends
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">A</div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* FORECAST SUMMARY */}

            <div className="forecast-summary-grid">

              <div className="forecast-summary-card">
                <p>Forecast Period</p>

                <div className="forecast-period-row">
                  <h2>{forecastMonths} Months</h2>

                  <select
                    value={forecastMonths}
                    onChange={(e) =>
                      setForecastMonths(Number(e.target.value))
                    }
                    className="forecast-period-select"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>

                <span className={forecastLoading ? "forecast-loading" : "normal"}>
                  {forecastLoading
                    ? "Loading forecast..."
                    : forecastStart && forecastEnd
                    ? `${forecastStart} - ${forecastEnd}`
                    : ""}
                </span>
              </div>


              <div className="forecast-summary-card">
                <p>High Demand Products</p>
                <h2>{highDemandCount}</h2>
                <span className="danger">
                  Predicted ≥ 1,000 units
                </span>
              </div>


              <div className="forecast-summary-card">
                <p>Medium Demand Products</p>
                <h2>{mediumDemandCount}</h2>
                <span className="normal">
                  Predicted 300 - 999 units
                </span>
              </div>


              <div className="forecast-summary-card">
                <p>Low Demand Products</p>
                <h2>{lowDemandCount}</h2>
                <span className="warning">
                  Predicted below 300 units
                </span>
              </div>

            </div>

            
            {/* FORECAST CHART + INSIGHTS */}

            <div className="dashboard-grid">

              <div className="panel">
                <h3>Predicted Demand Trend</h3>

                <p className="forecast-chart-subtitle">
                  Total predicted product demand by month for 2026
                </p>

                <div className="forecast-chart">
                  {months.map((month) => {
                    const qty = monthlyForecast[month] || 0;

                    const height =
                      maxMonthlyDemand > 0
                        ? (qty / maxMonthlyDemand) * 100
                        : 0;

                    return (
                      <div
                        key={month}
                        style={{
                          height: `${Math.max(height, 5)}%`
                        }}
                        title={`${month}: ${Math.round(qty)} units`}
                      >
                        <span>{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div className="panel">
                <h3>Forecast Insights</h3>

                <div className="alert danger-alert">
                  <strong>Highest Demand Product</strong>

                  <p>
                    {highestDemandProduct
                      ? `${highestDemandProduct.Product_Code} is predicted to have the highest demand in 2026 with approximately ${Math.round(
                          highestDemandProduct.Predicted_Quantity
                        ).toLocaleString()} units.`
                      : "Forecast data is loading."}
                  </p>
                </div>


                <div className="alert warning-alert">
                  <strong>Stock Preparation</strong>

                  <p>
                    {highestDemandProduct
                      ? `Additional stock preparation should be considered for ${highestDemandProduct.Product_Code} due to its high predicted demand.`
                      : "Forecast data is loading."}
                  </p>
                </div>


                <div className="alert success-alert">
                  <strong>Demand Monitoring</strong>

                  <p>
                    {highDemandCount} products are classified as high demand,
                    while {mediumDemandCount} are medium demand and{" "}
                    {lowDemandCount} are low demand for 2026.
                  </p>
                </div>

              </div>

            </div>


            {/* FORECAST TABLE */}

            <div className="panel">

              <div className="forecast-page-header">
                <div>
                  <h3>Product Demand Forecast</h3>

                  <p className="forecast-subtitle">
                    {forecastStart && forecastEnd
                      ? `Predicted demand for each product from ${formatForecastDate(
                          forecastStart
                        )} to ${formatForecastDate(forecastEnd)}`
                      : "Predicted product demand forecast"}
                  </p>
                </div>
              </div>


              <div className="bottom-panel">

                <table>

                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Predicted Demand</th>
                      <th>Demand Level</th>
                      <th>Forecast Period</th>
                    </tr>
                  </thead>

                  <tbody>

                    {forecastLoading ? (

                      <tr>
                        <td colSpan="4">
                          Loading forecast data...
                        </td>
                      </tr>

                    ) : topProducts.length === 0 ? (

                      <tr>
                        <td colSpan="4">
                          No forecast data available.
                        </td>
                      </tr>

                    ) : (

                      topProducts.map((item) => {

                        const level = getDemandCategory(
                          item.Predicted_Quantity
                        );

                        let statusClass = "yellow";

                        if (level === "High") {
                          statusClass = "red";
                        }

                        if (level === "Low") {
                          statusClass = "green";
                        }

                        return (
                          <tr key={item.Product_Code}>

                            <td>
                              {item.Product_Code}
                            </td>

                            <td>
                              {Math.round(
                                item.Predicted_Quantity
                              ).toLocaleString()} units
                            </td>

                            <td>
                              <span
                                className={`status ${statusClass}`}
                              >
                                {level}
                              </span>
                            </td>

                            <td>
                            {forecastStart && forecastEnd
                              ? `${formatForecastDate(forecastStart)} - ${formatForecastDate(forecastEnd)}`
                              : "-"}
                          </td>

                          </tr>
                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

            </div>
            
            </>
            )}

        {/* =========================
            CUSTOMER ANALYTICS
        ========================== */}

        {activePage === "customer" && (
        <>
            <div className="topbar">
            <div>
                <h1>Customer Analytics</h1>
                <p>
                Analyze customer behaviour and segmentation based on order history
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">A</div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* CUSTOMER SUMMARY */}

            <div className="customer-summary-grid">

            <div className="customer-summary-card">
                <p>Total Customers</p>
                <h2>426</h2>
                <span className="normal">
                Registered customers
                </span>
            </div>

            <div className="customer-summary-card">
                <p>High Value Customers</p>
                <h2>82</h2>
                <span className="normal">
                Frequent buyers
                </span>
            </div>

            <div className="customer-summary-card">
                <p>Regular Customers</p>
                <h2>261</h2>
                <span className="normal">
                Stable purchase activity
                </span>
            </div>

            <div className="customer-summary-card">
                <p>At-Risk Customers</p>
                <h2>83</h2>
                <span className="danger">
                Monitor behaviour
                </span>
            </div>

            </div>


            {/* CUSTOMER SEGMENTS */}

            <div className="dashboard-grid">

            <div className="panel">
                <h3>Customer Segments</h3>

                <div className="customer-segment-list">

                <div className="customer-segment-item">
                    <div>
                    <strong>High Value</strong>
                    <p>Frequent orders with high purchase value</p>
                    </div>

                    <span className="status green">
                    82 Customers
                    </span>
                </div>


                <div className="customer-segment-item">
                    <div>
                    <strong>Regular</strong>
                    <p>Consistent purchasing behaviour</p>
                    </div>

                    <span className="status green">
                    261 Customers
                    </span>
                </div>


                <div className="customer-segment-item">
                    <div>
                    <strong>Low Activity</strong>
                    <p>Infrequent purchasing activity</p>
                    </div>

                    <span className="status yellow">
                    56 Customers
                    </span>
                </div>


                <div className="customer-segment-item">
                    <div>
                    <strong>At Risk</strong>
                    <p>High cancellation or return behaviour</p>
                    </div>

                    <span className="status red">
                    27 Customers
                    </span>
                </div>

                </div>
            </div>


            <div className="panel">
                <h3>Customer Insights</h3>

                <div className="alert success-alert">
                <strong>Strong Customer Group</strong>
                <p>
                    High-value customers show consistent repeat purchases.
                </p>
                </div>

                <div className="alert warning-alert">
                <strong>Low Activity</strong>
                <p>
                    Some customers have shown reduced purchase activity.
                </p>
                </div>

                <div className="alert danger-alert">
                <strong>Risk Behaviour</strong>
                <p>
                    Several customers have repeated cancellation or return activity.
                </p>
                </div>
            </div>

            </div>


            {/* CUSTOMER TABLE */}

            <div className="panel">

            <div className="customer-page-header">
                <div>
                <h3>Customer Segmentation</h3>

                <p className="customer-subtitle">
                    View customer behaviour, segment and risk indicators
                </p>
                </div>
            </div>


            <div className="customer-filters">

                <input
                type="text"
                placeholder="Search Customer ID or Name..."
                />

                <select>
                <option>All Segments</option>
                <option>High Value</option>
                <option>Regular</option>
                <option>Low Activity</option>
                <option>At Risk</option>
                </select>

                <select>
                <option>All Risk Levels</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                    <tr>
                    <th>Customer ID</th>
                    <th>Customer</th>
                    <th>Total Orders</th>
                    <th>Cancelled</th>
                    <th>Returns</th>
                    <th>Segment</th>
                    <th>Risk Level</th>
                    <th>Last Order</th>
                    <th>Action</th>
                    </tr>
                </thead>


                <tbody>

                    <tr>
                    <td>CUS001</td>
                    <td>Aina</td>
                    <td>28</td>
                    <td>1</td>
                    <td>0</td>

                    <td>
                        <span className="status green">
                        High Value
                        </span>
                    </td>

                    <td>
                        <span className="status green">
                        Low
                        </span>
                    </td>

                    <td>25/09/2026</td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>CUS002</td>
                    <td>Farah</td>
                    <td>14</td>
                    <td>1</td>
                    <td>1</td>

                    <td>
                        <span className="status green">
                        Regular
                        </span>
                    </td>

                    <td>
                        <span className="status green">
                        Low
                        </span>
                    </td>

                    <td>25/09/2026</td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>CUS003</td>
                    <td>Amir</td>
                    <td>9</td>
                    <td>2</td>
                    <td>1</td>

                    <td>
                        <span className="status yellow">
                        Low Activity
                        </span>
                    </td>

                    <td>
                        <span className="status yellow">
                        Medium
                        </span>
                    </td>

                    <td>22/09/2026</td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>CUS004</td>
                    <td>Sofia</td>
                    <td>11</td>
                    <td>4</td>
                    <td>2</td>

                    <td>
                        <span className="status red">
                        At Risk
                        </span>
                    </td>

                    <td>
                        <span className="status red">
                        High
                        </span>
                    </td>

                    <td>25/09/2026</td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>CUS005</td>
                    <td>Hana</td>
                    <td>17</td>
                    <td>0</td>
                    <td>1</td>

                    <td>
                        <span className="status green">
                        Regular
                        </span>
                    </td>

                    <td>
                        <span className="status green">
                        Low
                        </span>
                    </td>

                    <td>24/09/2026</td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>

                </tbody>

                </table>

            </div>

            </div>
        </>
        )}

        {/* =========================
            ANOMALY DETECTION
        ========================== */}

        {activePage === "anomaly" && (
        <>
            <div className="topbar">
            <div>
                <h1>Anomaly Detection</h1>
                <p>
                Detect unusual order and transaction patterns in the system
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">A</div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* ANOMALY SUMMARY */}

            <div className="anomaly-summary-grid">

            <div className="anomaly-summary-card">
                <p>Total Transactions</p>
                <h2>1,248</h2>
                <span className="normal">
                Analyzed transactions
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Anomalies Detected</p>
                <h2>18</h2>
                <span className="danger">
                Requires review
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Under Review</p>
                <h2>6</h2>
                <span className="warning">
                Pending investigation
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Resolved</p>
                <h2>12</h2>
                <span className="normal">
                Reviewed anomalies
                </span>
            </div>

            </div>


            {/* ANOMALY OVERVIEW */}

            <div className="dashboard-grid">

            <div className="panel">
                <h3>Anomaly Categories</h3>

                <div className="anomaly-category-list">

                <div className="anomaly-category-item">
                    <div>
                    <strong>Unusual Order Quantity</strong>
                    <p>Order quantity significantly differs from normal behaviour</p>
                    </div>

                    <span className="status red">
                    6 Detected
                    </span>
                </div>


                <div className="anomaly-category-item">
                    <div>
                    <strong>Repeated Cancellation</strong>
                    <p>Abnormal cancellation activity detected</p>
                    </div>

                    <span className="status yellow">
                    5 Detected
                    </span>
                </div>


                <div className="anomaly-category-item">
                    <div>
                    <strong>Unusual Order Time</strong>
                    <p>Orders placed outside normal activity patterns</p>
                    </div>

                    <span className="status yellow">
                    4 Detected
                    </span>
                </div>


                <div className="anomaly-category-item">
                    <div>
                    <strong>Abnormal Transaction Pattern</strong>
                    <p>Transaction behaviour differs from historical patterns</p>
                    </div>

                    <span className="status red">
                    3 Detected
                    </span>
                </div>

                </div>
            </div>


            <div className="panel">
                <h3>Recent Anomaly Alerts</h3>

                <div className="alert danger-alert">
                <strong>Unusual Order Quantity</strong>
                <p>
                    ORD1072 contains a significantly higher quantity than normal.
                </p>
                </div>

                <div className="alert warning-alert">
                <strong>Repeated Cancellation</strong>
                <p>
                    CUS004 shows unusual cancellation activity.
                </p>
                </div>

                <div className="alert warning-alert">
                <strong>Unusual Order Time</strong>
                <p>
                    An order was placed outside the customer's normal order pattern.
                </p>
                </div>
            </div>

            </div>


            {/* ANOMALY TABLE */}

            <div className="panel">

            <div className="anomaly-page-header">
                <div>
                <h3>Detected Anomalies</h3>

                <p className="anomaly-subtitle">
                    Review unusual orders and transaction behaviour
                </p>
                </div>
            </div>


            <div className="anomaly-filters">

                <input
                type="text"
                placeholder="Search Anomaly ID, Order ID or Customer..."
                />

                <select>
                <option>All Anomaly Types</option>
                <option>Unusual Order Quantity</option>
                <option>Repeated Cancellation</option>
                <option>Unusual Order Time</option>
                <option>Abnormal Transaction Pattern</option>
                </select>

                <select>
                <option>All Status</option>
                <option>Detected</option>
                <option>Under Review</option>
                <option>Resolved</option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                    <tr>
                    <th>Anomaly ID</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Anomaly Type</th>
                    <th>Anomaly Score</th>
                    <th>Detected Date</th>
                    <th>Status</th>
                    <th>Action</th>
                    </tr>
                </thead>


                <tbody>

                    <tr>
                    <td>ANM001</td>
                    <td>ORD1072</td>
                    <td>Haziq</td>
                    <td>Unusual Order Quantity</td>
                    <td>-0.82</td>

                    <td>
                        25/09/2026
                        <br />
                        10:12 AM
                    </td>

                    <td>
                        <span className="status red">
                        Detected
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>ANM002</td>
                    <td>ORD1061</td>
                    <td>Sofia</td>
                    <td>Repeated Cancellation</td>
                    <td>-0.71</td>

                    <td>
                        25/09/2026
                        <br />
                        09:25 AM
                    </td>

                    <td>
                        <span className="status yellow">
                        Under Review
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>ANM003</td>
                    <td>ORD1054</td>
                    <td>Nadia</td>
                    <td>Unusual Order Time</td>
                    <td>-0.63</td>

                    <td>
                        24/09/2026
                        <br />
                        11:48 PM
                    </td>

                    <td>
                        <span className="status yellow">
                        Under Review
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>


                    <tr>
                    <td>ANM004</td>
                    <td>ORD1048</td>
                    <td>Farah</td>
                    <td>Abnormal Transaction Pattern</td>
                    <td>-0.58</td>

                    <td>
                        24/09/2026
                        <br />
                        03:18 PM
                    </td>

                    <td>
                        <span className="status green">
                        Resolved
                        </span>
                    </td>

                    <td>
                        <button className="table-action-btn">
                        View
                        </button>
                    </td>
                    </tr>

                </tbody>

                </table>

            </div>

            </div>
        </>
        )}

        {/* =========================
            REPORTS
        ========================== */}

        {activePage === "reports" && (
        <>
            <div className="topbar">
            <div>
                <h1>Reports</h1>
                <p>
                View and generate reports for orders, inventory, risks and analytics
                </p>
            </div>

            <div className="admin-profile">
                <div className="profile-circle">A</div>

                <div>
                <strong>Admin</strong>
                <p>admin001</p>
                </div>
            </div>
            </div>


            {/* REPORT SUMMARY */}

            <div className="report-summary-grid">

            <div className="report-summary-card">
                <p>Total Reports</p>
                <h2>36</h2>
                <span className="normal">
                Generated reports
                </span>
            </div>

            <div className="report-summary-card">
                <p>This Month</p>
                <h2>8</h2>
                <span className="normal">
                September 2026
                </span>
            </div>

            <div className="report-summary-card">
                <p>Scheduled</p>
                <h2>4</h2>
                <span className="warning">
                Upcoming reports
                </span>
            </div>

            <div className="report-summary-card">
                <p>Latest Report</p>
                <h2>Today</h2>
                <span className="normal">
                09:30 AM
                </span>
            </div>

            </div>


            {/* REPORT TYPES */}

            <div className="report-type-grid">

            <div className="report-type-card">
                <h3>Order Report</h3>

                <p>
                Summary of total orders, completed orders,
                cancellations and order status.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>


            <div className="report-type-card">
                <h3>Inventory Report</h3>

                <p>
                Current stock, low-stock products,
                reserved stock and stock shortages.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>


            <div className="report-type-card">
                <h3>Operational Risk Report</h3>

                <p>
                Risk alerts, risk categories,
                severity levels and resolved issues.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>


            <div className="report-type-card">
                <h3>Demand Forecast Report</h3>

                <p>
                Predicted product demand,
                demand changes and future stock requirements.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>


            <div className="report-type-card">
                <h3>Customer Analytics Report</h3>

                <p>
                Customer segments, order behaviour,
                cancellations and return activity.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>


            <div className="report-type-card">
                <h3>Anomaly Detection Report</h3>

                <p>
                Detected anomalies, unusual transactions
                and anomaly review status.
                </p>

                <button className="report-view-btn">
                View Report
                </button>
            </div>

            </div>


            {/* REPORT HISTORY */}

            <div className="panel">

            <div className="report-page-header">
                <div>
                <h3>Report History</h3>

                <p className="report-subtitle">
                    View previously generated reports
                </p>
                </div>

                <button className="generate-report-btn">
                + Generate Report
                </button>
            </div>


            <div className="report-filters">

                <input
                type="text"
                placeholder="Search Report ID or Report Name..."
                />

                <select>
                <option>All Report Types</option>
                <option>Order Report</option>
                <option>Inventory Report</option>
                <option>Operational Risk Report</option>
                <option>Demand Forecast Report</option>
                <option>Customer Analytics Report</option>
                <option>Anomaly Detection Report</option>
                </select>

                <select>
                <option>All Periods</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                    <tr>
                    <th>Report ID</th>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Generated Date</th>
                    <th>Generated By</th>
                    <th>Action</th>
                    </tr>
                </thead>


                <tbody>

                    <tr>
                    <td>RPT001</td>
                    <td>September Order Summary</td>
                    <td>Order Report</td>
                    <td>Monthly</td>

                    <td>
                        25/09/2026
                        <br />
                        09:30 AM
                    </td>

                    <td>Admin</td>

                    <td>
                        <div className="report-actions">
                        <button className="table-action-btn">
                            View
                        </button>

                        <button className="export-btn">
                            Export
                        </button>
                        </div>
                    </td>
                    </tr>


                    <tr>
                    <td>RPT002</td>
                    <td>Inventory Status Report</td>
                    <td>Inventory Report</td>
                    <td>Weekly</td>

                    <td>
                        24/09/2026
                        <br />
                        04:20 PM
                    </td>

                    <td>Admin</td>

                    <td>
                        <div className="report-actions">
                        <button className="table-action-btn">
                            View
                        </button>

                        <button className="export-btn">
                            Export
                        </button>
                        </div>
                    </td>
                    </tr>


                    <tr>
                    <td>RPT003</td>
                    <td>Operational Risk Analysis</td>
                    <td>Risk Report</td>
                    <td>Weekly</td>

                    <td>
                        23/09/2026
                        <br />
                        03:15 PM
                    </td>

                    <td>Admin</td>

                    <td>
                        <div className="report-actions">
                        <button className="table-action-btn">
                            View
                        </button>

                        <button className="export-btn">
                            Export
                        </button>
                        </div>
                    </td>
                    </tr>


                    <tr>
                    <td>RPT004</td>
                    <td>Demand Forecast Summary</td>
                    <td>Demand Forecast</td>
                    <td>Monthly</td>

                    <td>
                        22/09/2026
                        <br />
                        11:30 AM
                    </td>

                    <td>Admin</td>

                    <td>
                        <div className="report-actions">
                        <button className="table-action-btn">
                            View
                        </button>

                        <button className="export-btn">
                            Export
                        </button>
                        </div>
                    </td>
                    </tr>


                    <tr>
                    <td>RPT005</td>
                    <td>Customer Segmentation Report</td>
                    <td>Customer Analytics</td>
                    <td>Monthly</td>

                    <td>
                        20/09/2026
                        <br />
                        02:45 PM
                    </td>

                    <td>Admin</td>

                    <td>
                        <div className="report-actions">
                        <button className="table-action-btn">
                            View
                        </button>

                        <button className="export-btn">
                            Export
                        </button>
                        </div>
                    </td>
                    </tr>

                </tbody>

                </table>

            </div>

            </div>
        </>
        )}

      </main>

    </div>
  );
}

export default AdminDashboard;