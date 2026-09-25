import { useState } from "react";
import "./ManageDashboard.css";

function ManageDashboard({ onLogout }) {

  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="management-layout">

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="management-sidebar">

        <div>

          <h2 className="management-brand">
            OrderAI
          </h2>

          <nav>

            <a
              className={
                activePage === "dashboard"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </a>


            <a
              className={
                activePage === "analytics"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("analytics")}
            >
              Business Analytics
            </a>


            <a
              className={
                activePage === "aiInsights"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("aiInsights")}
            >
              AI Decision Insights
            </a>


            <a
              className={
                activePage === "forecast"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("forecast")}
            >
              Demand Forecasting
            </a>


            <a
              className={
                activePage === "stock"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("stock")}
            >
              Stock Prediction
            </a>


            <a
              className={
                activePage === "risk"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("risk")}
            >
              Risk Monitoring
            </a>


            <a
              className={
                activePage === "reports"
                  ? "management-active"
                  : ""
              }
              onClick={() => setActivePage("reports")}
            >
              Reports
            </a>

          </nav>

        </div>


        <button
          className="management-logout"
          onClick={onLogout}
        >
          Logout
        </button>

      </aside>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="management-main">


        {/* =========================
            DASHBOARD
        ========================== */}

        {activePage === "dashboard" && (
          <>

            <div className="management-topbar">

              <div>
                <h1>Management Dashboard</h1>

                <p>
                  Business Performance, Quality Overview & AI Decision Support
                </p>
              </div>


              <div className="management-profile">

                <div className="management-profile-circle">
                  M
                </div>

                <div>
                  <strong>Management</strong>
                  <p>manager001</p>
                </div>

              </div>

            </div>


            {/* =========================
                SUMMARY
            ========================== */}

            <div className="management-summary-grid">

              <div className="management-card">

                <p>Total Orders</p>

                <h2>1,248</h2>

                <span className="management-green">
                  +8.4% this month
                </span>

              </div>


              <div className="management-card">

                <p>Completed Orders</p>

                <h2>1,105</h2>

                <span className="management-green">
                  88.5% completion
                </span>

              </div>


              <div className="management-card">

                <p>Quality Issues</p>

                <h2>32</h2>

                <span className="management-red">
                  Requires monitoring
                </span>

              </div>


              <div className="management-card">

                <p>High Risk Orders</p>

                <h2>18</h2>

                <span className="management-yellow">
                  Immediate attention
                </span>

              </div>

            </div>


            {/* =========================
                ORDER TREND + AI INSIGHTS
            ========================== */}

            <div className="management-dashboard-grid">

              <div className="management-panel">

                <h3>Monthly Order Trend</h3>

                <p className="management-section-subtitle">
                  Order volume over the last six months
                </p>


                <div className="management-chart">

                  <div style={{ height: "45%" }}></div>

                  <div style={{ height: "55%" }}></div>

                  <div style={{ height: "50%" }}></div>

                  <div style={{ height: "68%" }}></div>

                  <div style={{ height: "75%" }}></div>

                  <div style={{ height: "88%" }}></div>

                </div>


                <div className="management-chart-labels">

                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>

                </div>

              </div>


              <div className="management-panel">

                <h3>AI Decision Insights</h3>


                <div className="management-insight management-insight-pink">

                  <strong>Demand Increase</strong>

                  <p>
                    Product AA demand is predicted to increase next month.
                  </p>

                </div>


                <div className="management-insight management-insight-yellow">

                  <strong>Stock Risk</strong>

                  <p>
                    Serum A may experience stock shortage within 7 days.
                  </p>

                </div>


                <div className="management-insight management-insight-red">

                  <strong>Cancellation Risk</strong>

                  <p>
                    18 orders currently show a high cancellation risk.
                  </p>

                </div>

              </div>

            </div>


            {/* =========================
                BUSINESS OVERVIEW
            ========================== */}

            <div className="management-dashboard-grid">

              <div className="management-panel">

                <h3>Order Performance</h3>


                <div className="management-performance-list">

                  <div className="management-performance-item">

                    <div>
                      <span>Completed</span>
                      <strong>88.5%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-green"
                        style={{ width: "88.5%" }}
                      ></div>

                    </div>

                  </div>


                  <div className="management-performance-item">

                    <div>
                      <span>Pending</span>
                      <strong>6.1%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-yellow"
                        style={{ width: "6.1%" }}
                      ></div>

                    </div>

                  </div>


                  <div className="management-performance-item">

                    <div>
                      <span>Cancelled</span>
                      <strong>5.4%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-red"
                        style={{ width: "5.4%" }}
                      ></div>

                    </div>

                  </div>

                </div>

              </div>


              <div className="management-panel">

                <h3>Quality Performance</h3>


                <div className="management-performance-list">

                  <div className="management-performance-item">

                    <div>
                      <span>Passed</span>
                      <strong>82.8%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-green"
                        style={{ width: "82.8%" }}
                      ></div>

                    </div>

                  </div>


                  <div className="management-performance-item">

                    <div>
                      <span>Rejected</span>
                      <strong>10.8%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-red"
                        style={{ width: "10.8%" }}
                      ></div>

                    </div>

                  </div>


                  <div className="management-performance-item">

                    <div>
                      <span>Recheck</span>
                      <strong>6.4%</strong>
                    </div>

                    <div className="management-progress">

                      <div
                        className="management-progress-yellow"
                        style={{ width: "6.4%" }}
                      ></div>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =========================
                MANAGEMENT ALERTS
            ========================== */}

            <div className="management-panel">

              <h3>Management Alerts</h3>


              <div className="management-alert-list">

                <div className="management-alert management-danger-alert">

                  <div>

                    <strong>
                      Product AA Quality Issue
                    </strong>

                    <p>
                      Product AA currently has the highest number of detected quality issues.
                    </p>

                  </div>

                  <span>
                    High Priority
                  </span>

                </div>


                <div className="management-alert management-warning-alert">

                  <div>

                    <strong>
                      High Cancellation Risk
                    </strong>

                    <p>
                      18 orders are currently identified as high-risk orders.
                    </p>

                  </div>

                  <span>
                    Monitor
                  </span>

                </div>


                <div className="management-alert management-warning-alert">

                  <div>

                    <strong>
                      Stock Shortage Risk
                    </strong>

                    <p>
                      3 products may require restocking based on predicted demand.
                    </p>

                  </div>

                  <span>
                    Review
                  </span>

                </div>


                <div className="management-alert management-success-alert">

                  <div>

                    <strong>
                      Quality Performance Stable
                    </strong>

                    <p>
                      Overall quality pass rate remains above 80%.
                    </p>

                  </div>

                  <span>
                    Stable
                  </span>

                </div>

              </div>

            </div>


            {/* =========================
                STOCK REQUIREMENT
            ========================== */}

            <div className="management-panel">

              <div className="management-section-header">

                <div>

                  <h3>
                    Stock Requirement Prediction
                  </h3>

                  <p className="management-section-subtitle">
                    Predicted stock requirements based on future demand
                  </p>

                </div>

              </div>


              <table>

                <thead>

                  <tr>

                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Predicted Demand</th>
                    <th>Recommendation</th>
                    <th>Status</th>

                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>Product AA</td>

                    <td>100</td>

                    <td>180</td>

                    <td>
                      Restock +100
                    </td>

                    <td>

                      <span className="management-status management-red-status">
                        High Risk
                      </span>

                    </td>

                  </tr>


                  <tr>

                    <td>Serum A</td>

                    <td>150</td>

                    <td>135</td>

                    <td>
                      Monitor Stock
                    </td>

                    <td>

                      <span className="management-status management-yellow-status">
                        Medium
                      </span>

                    </td>

                  </tr>


                  <tr>

                    <td>Cleanser B</td>

                    <td>300</td>

                    <td>190</td>

                    <td>
                      Stock Sufficient
                    </td>

                    <td>

                      <span className="management-status management-green-status">
                        Safe
                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>


            {/* =========================
                RECENT CORRECTIVE ACTIONS
            ========================== */}

            <div className="management-panel">

              <div className="management-section-header">

                <div>

                  <h3>
                    Recent Corrective Actions
                  </h3>

                  <p className="management-section-subtitle">
                    Latest actions created by Quality Assurance
                  </p>

                </div>

              </div>


              <table>

                <thead>

                  <tr>

                    <th>Action ID</th>
                    <th>Product</th>
                    <th>Issue</th>
                    <th>Corrective Action</th>
                    <th>Status</th>

                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>CA001</td>

                    <td>Product AA</td>

                    <td>
                      Damaged Packaging
                    </td>

                    <td>
                      Packaging process review
                    </td>

                    <td>

                      <span className="management-status management-red-status">
                        Open
                      </span>

                    </td>

                  </tr>


                  <tr>

                    <td>CA002</td>

                    <td>Serum A</td>

                    <td>
                      Wrong Quantity
                    </td>

                    <td>
                      Quantity verification procedure
                    </td>

                    <td>

                      <span className="management-status management-yellow-status">
                        In Progress
                      </span>

                    </td>

                  </tr>


                  <tr>

                    <td>CA003</td>

                    <td>Cleanser B</td>

                    <td>
                      Wrong Product
                    </td>

                    <td>
                      Operator verification procedure updated
                    </td>

                    <td>

                      <span className="management-status management-green-status">
                        Completed
                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </>
        )}


        {/* =========================
            BUSINESS ANALYTICS
        ========================= */}

        {activePage === "analytics" && (
        <>

            <div className="management-topbar">

            <div>
                <h1>Business Analytics</h1>
                <p>
                Analyze order performance, product demand and operational trends
                </p>
            </div>

            <div className="management-profile">

                <div className="management-profile-circle">
                M
                </div>

                <div>
                <strong>Management</strong>
                <p>manager001</p>
                </div>

            </div>

            </div>


            {/* ANALYTICS FILTER */}

            <div className="management-panel">

            <div className="management-section-header">

                <div>
                <h3>Analytics Filter</h3>

                <p className="management-section-subtitle">
                    Filter business performance by period and product
                </p>
                </div>

            </div>

            <div className="management-analytics-filters">

                <select>
                <option>This Month</option>
                <option>This Week</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                </select>

                <select>
                <option>All Products</option>
                <option>Product AA</option>
                <option>Serum A</option>
                <option>Cleanser B</option>
                <option>Toner E</option>
                </select>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="management-summary-grid">

            <div className="management-card">
                <p>Total Orders</p>
                <h2>1,248</h2>

                <span className="management-green">
                +8.4% this month
                </span>
            </div>


            <div className="management-card">
                <p>Completed Orders</p>
                <h2>1,105</h2>

                <span className="management-green">
                88.5% completion
                </span>
            </div>


            <div className="management-card">
                <p>Cancelled Orders</p>
                <h2>67</h2>

                <span className="management-red">
                5.4% cancellation rate
                </span>
            </div>


            <div className="management-card">
                <p>Delayed Orders</p>
                <h2>31</h2>

                <span className="management-yellow">
                Requires monitoring
                </span>
            </div>

            </div>


            {/* ORDER TREND + ORDER STATUS */}

            <div className="management-dashboard-grid">

            <div className="management-panel">

                <h3>Monthly Order Performance</h3>

                <p className="management-section-subtitle">
                Total order volume over the last six months
                </p>

                <div className="management-analytics-chart">

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "48%" }}
                    ></div>
                    <span>Apr</span>
                </div>

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "56%" }}
                    ></div>
                    <span>May</span>
                </div>

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "52%" }}
                    ></div>
                    <span>Jun</span>
                </div>

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "68%" }}
                    ></div>
                    <span>Jul</span>
                </div>

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "77%" }}
                    ></div>
                    <span>Aug</span>
                </div>

                <div className="management-analytics-bar-item">
                    <div
                    className="management-analytics-bar"
                    style={{ height: "88%" }}
                    ></div>
                    <span>Sep</span>
                </div>

                </div>

            </div>


            <div className="management-panel">

                <h3>Order Status Distribution</h3>

                <p className="management-section-subtitle">
                Current distribution of order outcomes
                </p>

                <div className="management-analytics-performance">

                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Completed</span>
                    <strong>88.5%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-green"
                        style={{ width: "88.5%" }}
                    ></div>
                    </div>

                </div>


                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Pending</span>
                    <strong>3.6%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-yellow"
                        style={{ width: "3.6%" }}
                    ></div>
                    </div>

                </div>


                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Cancelled</span>
                    <strong>5.4%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-red"
                        style={{ width: "5.4%" }}
                    ></div>
                    </div>

                </div>


                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Delayed</span>
                    <strong>2.5%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-pink"
                        style={{ width: "2.5%" }}
                    ></div>
                    </div>

                </div>

                </div>

            </div>

            </div>


            {/* PRODUCT PERFORMANCE */}

            <div className="management-panel">

            <div className="management-section-header">

                <div>
                <h3>Product Performance</h3>

                <p className="management-section-subtitle">
                    Compare product order volume, completion and cancellation performance
                </p>
                </div>

            </div>

            <table>

                <thead>
                <tr>
                    <th>Product</th>
                    <th>Total Orders</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                    <th>Delayed</th>
                    <th>Completion Rate</th>
                    <th>Performance</th>
                </tr>
                </thead>

                <tbody>

                <tr>
                    <td>Product AA</td>
                    <td>340</td>
                    <td>278</td>
                    <td>38</td>
                    <td>24</td>
                    <td>81.8%</td>

                    <td>
                    <span className="management-status management-yellow-status">
                        Monitor
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>Serum A</td>
                    <td>315</td>
                    <td>290</td>
                    <td>15</td>
                    <td>10</td>
                    <td>92.1%</td>

                    <td>
                    <span className="management-status management-green-status">
                        Good
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>Cleanser B</td>
                    <td>287</td>
                    <td>258</td>
                    <td>18</td>
                    <td>11</td>
                    <td>89.9%</td>

                    <td>
                    <span className="management-status management-green-status">
                        Good
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>Toner E</td>
                    <td>306</td>
                    <td>279</td>
                    <td>14</td>
                    <td>13</td>
                    <td>91.2%</td>

                    <td>
                    <span className="management-status management-green-status">
                        Good
                    </span>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* OPERATIONAL ANALYTICS */}

            <div className="management-dashboard-grid">

            <div className="management-panel">

                <h3>Operational Performance</h3>

                <div className="management-analytics-performance">

                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Order Fulfillment Rate</span>
                    <strong>88.5%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-green"
                        style={{ width: "88.5%" }}
                    ></div>
                    </div>

                </div>


                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Quality Pass Rate</span>
                    <strong>82.8%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-green"
                        style={{ width: "82.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="management-analytics-performance-item">

                    <div className="management-analytics-performance-header">
                    <span>Cancellation Rate</span>
                    <strong>5.4%</strong>
                    </div>

                    <div className="management-progress">
                    <div
                        className="management-progress-red"
                        style={{ width: "5.4%" }}
                    ></div>
                    </div>

                </div>

                </div>

            </div>


            <div className="management-panel">

                <h3>Business Insights</h3>

                <div className="management-insight management-insight-pink">
                <strong>Order Growth</strong>
                <p>
                    Total order volume increased by 8.4% compared with last month.
                </p>
                </div>


                <div className="management-insight management-insight-yellow">
                <strong>Product AA Requires Monitoring</strong>
                <p>
                    Product AA has a lower completion rate and higher cancellation activity.
                </p>
                </div>


                <div className="management-insight management-insight-green">
                <strong>Strong Product Performance</strong>
                <p>
                    Serum A currently records the highest completion rate.
                </p>
                </div>

            </div>

            </div>

        </>
        )}


        {/* =========================
    AI DECISION INSIGHTS
========================= */}

{activePage === "aiInsights" && (
  <>

    <div className="management-topbar">

      <div>
        <h1>AI Decision Insights</h1>

        <p>
          Review AI-generated insights based on business and operational data
        </p>
      </div>


      <div className="management-profile">

        <div className="management-profile-circle">
          M
        </div>

        <div>
          <strong>Management</strong>
          <p>manager001</p>
        </div>

      </div>

    </div>


    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>AI Decision Insights</h3>

          <p className="management-section-subtitle">
            AI-generated insights based on demand, stock, quality and order risk
          </p>
        </div>

      </div>


      <div className="management-ai-list">


        {/* DEMAND FORECAST */}

        <div className="management-ai-card management-ai-high">

          <div className="management-ai-card-header">

            <div>
              <span className="management-ai-category">
                DEMAND FORECAST
              </span>

              <h4>
                Product AA Demand Expected to Increase
              </h4>
            </div>

            <span className="management-status management-red-status">
              High Attention
            </span>

          </div>


          <p>
            Product AA demand is predicted to increase next month based on
            recent order trends.
          </p>


          <div className="management-ai-details">

            <div>
              <span>Current Stock</span>
              <strong>100</strong>
            </div>

            <div>
              <span>Predicted Demand</span>
              <strong>180</strong>
            </div>

            <div>
              <span>AI Insight</span>
              <strong>Possible Stock Shortage</strong>
            </div>

          </div>

        </div>


        {/* QUALITY RISK */}

        <div className="management-ai-card management-ai-high">

          <div className="management-ai-card-header">

            <div>
              <span className="management-ai-category">
                QUALITY RISK
              </span>

              <h4>
                Recurring Packaging Issue Detected
              </h4>
            </div>

            <span className="management-status management-red-status">
              High Attention
            </span>

          </div>


          <p>
            Product AA continues to record the highest number of damaged
            packaging cases.
          </p>


          <div className="management-ai-details">

            <div>
              <span>Product</span>
              <strong>Product AA</strong>
            </div>

            <div>
              <span>Detected Issues</span>
              <strong>18</strong>
            </div>

            <div>
              <span>Main Issue</span>
              <strong>Damaged Packaging</strong>
            </div>

          </div>

        </div>


        {/* STOCK PREDICTION */}

        <div className="management-ai-card management-ai-medium">

          <div className="management-ai-card-header">

            <div>
              <span className="management-ai-category">
                STOCK PREDICTION
              </span>

              <h4>
                Serum A Stock Requires Monitoring
              </h4>
            </div>

            <span className="management-status management-yellow-status">
              Monitor
            </span>

          </div>


          <p>
            Serum A stock level is approaching its predicted demand and may
            require closer monitoring.
          </p>


          <div className="management-ai-details">

            <div>
              <span>Current Stock</span>
              <strong>150</strong>
            </div>

            <div>
              <span>Predicted Demand</span>
              <strong>135</strong>
            </div>

            <div>
              <span>AI Insight</span>
              <strong>Stock Margin Low</strong>
            </div>

          </div>

        </div>


        {/* ORDER RISK */}

        <div className="management-ai-card management-ai-medium">

          <div className="management-ai-card-header">

            <div>
              <span className="management-ai-category">
                ORDER RISK
              </span>

              <h4>
                Cancellation Risk Increasing
              </h4>
            </div>

            <span className="management-status management-yellow-status">
              Monitor
            </span>

          </div>


          <p>
            Recent order patterns indicate an increase in orders with higher
            cancellation risk.
          </p>


          <div className="management-ai-details">

            <div>
              <span>High-Risk Orders</span>
              <strong>18</strong>
            </div>

            <div>
              <span>Cancellation Rate</span>
              <strong>5.4%</strong>
            </div>

            <div>
              <span>Trend</span>
              <strong>Increasing</strong>
            </div>

          </div>

        </div>


      </div>

    </div>

  </>
)}


        {/* =========================
    DEMAND FORECASTING
========================= */}

{activePage === "forecast" && (
  <>

    <div className="management-topbar">

      <div>
        <h1>Demand Forecasting</h1>
        <p>
          View predicted product demand based on historical order patterns
        </p>
      </div>

      <div className="management-profile">

        <div className="management-profile-circle">
          M
        </div>

        <div>
          <strong>Management</strong>
          <p>manager001</p>
        </div>

      </div>

    </div>


    {/* =========================
        FORECAST FILTER
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Forecast Filter</h3>

          <p className="management-section-subtitle">
            View demand prediction by forecast period and product
          </p>
        </div>

      </div>


      <div className="management-forecast-filters">

        <select>
          <option>Next Month</option>
          <option>Next 3 Months</option>
          <option>Next 6 Months</option>
        </select>


        <select>
          <option>All Products</option>
          <option>Product AA</option>
          <option>Serum A</option>
          <option>Cleanser B</option>
          <option>Toner E</option>
        </select>

      </div>

    </div>


    {/* =========================
        SUMMARY
    ========================== */}

    <div className="management-summary-grid">

      <div className="management-card">
        <p>Forecasted Demand</p>
        <h2>1,420</h2>

        <span className="management-green">
          +13.8% expected
        </span>
      </div>


      <div className="management-card">
        <p>Highest Demand Product</p>
        <h2>Product AA</h2>

        <span className="management-pink">
          420 predicted orders
        </span>
      </div>


      <div className="management-card">
        <p>Products Increasing</p>
        <h2>3</h2>

        <span className="management-yellow">
          Demand trending upward
        </span>
      </div>


      <div className="management-card">
        <p>Forecast Confidence</p>
        <h2>87%</h2>

        <span className="management-green">
          High confidence
        </span>
      </div>

    </div>


    {/* =========================
        FORECAST TREND
    ========================== */}

    <div className="management-dashboard-grid">

      <div className="management-panel">

        <h3>Demand Forecast Trend</h3>

        <p className="management-section-subtitle">
          Historical demand compared with predicted demand
        </p>


        <div className="management-forecast-chart">

          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "50%" }}
            ></div>

            <span>Apr</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "57%" }}
            ></div>

            <span>May</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "62%" }}
            ></div>

            <span>Jun</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "68%" }}
            ></div>

            <span>Jul</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "74%" }}
            ></div>

            <span>Aug</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-actual"
              style={{ height: "79%" }}
            ></div>

            <span>Sep</span>

          </div>


          <div className="management-forecast-bar-group">

            <div
              className="management-forecast-predicted"
              style={{ height: "90%" }}
            ></div>

            <span>Oct</span>

          </div>

        </div>


        <div className="management-forecast-legend">

          <div>
            <span className="management-legend-actual"></span>
            Historical Demand
          </div>

          <div>
            <span className="management-legend-predicted"></span>
            Predicted Demand
          </div>

        </div>

      </div>


      {/* =========================
          FORECAST OVERVIEW
      ========================== */}

      <div className="management-panel">

        <h3>Forecast Overview</h3>

        <div className="management-forecast-overview-list">

          <div className="management-forecast-overview-item">

            <div>
              <span>Product AA</span>
              <strong>+24%</strong>
            </div>

            <p>
              Strong demand increase expected next month.
            </p>

          </div>


          <div className="management-forecast-overview-item">

            <div>
              <span>Serum A</span>
              <strong>+11%</strong>
            </div>

            <p>
              Moderate increase in customer demand.
            </p>

          </div>


          <div className="management-forecast-overview-item">

            <div>
              <span>Cleanser B</span>
              <strong>+5%</strong>
            </div>

            <p>
              Demand expected to remain relatively stable.
            </p>

          </div>


          <div className="management-forecast-overview-item">

            <div>
              <span>Toner E</span>
              <strong>-3%</strong>
            </div>

            <p>
              Slight decrease in demand is predicted.
            </p>

          </div>

        </div>

      </div>

    </div>


    {/* =========================
        PRODUCT DEMAND FORECAST
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Product Demand Forecast</h3>

          <p className="management-section-subtitle">
            Comparison between current and predicted product demand
          </p>
        </div>

      </div>


      <table>

        <thead>
          <tr>
            <th>Product</th>
            <th>Current Demand</th>
            <th>Predicted Demand</th>
            <th>Change</th>
            <th>Trend</th>
            <th>Confidence</th>
          </tr>
        </thead>


        <tbody>

          <tr>
            <td>Product AA</td>
            <td>340</td>
            <td>420</td>
            <td>+23.5%</td>

            <td>
              <span className="management-status management-red-status">
                Increasing
              </span>
            </td>

            <td>91%</td>
          </tr>


          <tr>
            <td>Serum A</td>
            <td>315</td>
            <td>350</td>
            <td>+11.1%</td>

            <td>
              <span className="management-status management-yellow-status">
                Increasing
              </span>
            </td>

            <td>88%</td>
          </tr>


          <tr>
            <td>Cleanser B</td>
            <td>287</td>
            <td>302</td>
            <td>+5.2%</td>

            <td>
              <span className="management-status management-green-status">
                Stable
              </span>
            </td>

            <td>85%</td>
          </tr>


          <tr>
            <td>Toner E</td>
            <td>306</td>
            <td>296</td>
            <td>-3.3%</td>

            <td>
              <span className="management-status management-blue-status">
                Decreasing
              </span>
            </td>

            <td>84%</td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        DEMAND INSIGHTS
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Demand Forecast Insights</h3>

          <p className="management-section-subtitle">
            Key observations generated from forecast results
          </p>
        </div>

      </div>


      <div className="management-demand-insights">

        <div className="management-demand-insight-card">

          <span>Highest Growth</span>

          <strong>Product AA</strong>

          <p>
            Predicted demand is expected to increase by approximately 23.5%.
          </p>

        </div>


        <div className="management-demand-insight-card">

          <span>Most Stable</span>

          <strong>Cleanser B</strong>

          <p>
            Demand is expected to remain relatively consistent.
          </p>

        </div>


        <div className="management-demand-insight-card">

          <span>Demand Decline</span>

          <strong>Toner E</strong>

          <p>
            A small reduction in demand is predicted for the next period.
          </p>

        </div>

      </div>

    </div>

  </>
)}


        {/* =========================
    STOCK PREDICTION
========================= */}

{activePage === "stock" && (
  <>

    <div className="management-topbar">

      <div>
        <h1>Stock Prediction</h1>

        <p>
          View predicted stock requirements and potential shortage risks
        </p>
      </div>

      <div className="management-profile">

        <div className="management-profile-circle">
          M
        </div>

        <div>
          <strong>Management</strong>
          <p>manager001</p>
        </div>

      </div>

    </div>


    {/* =========================
        STOCK FILTER
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Stock Prediction Filter</h3>

          <p className="management-section-subtitle">
            View predicted stock requirements by period and product
          </p>
        </div>

      </div>


      <div className="management-stock-filters">

        <select>
          <option>Next Month</option>
          <option>Next 3 Months</option>
          <option>Next 6 Months</option>
        </select>

        <select>
          <option>All Products</option>
          <option>Product AA</option>
          <option>Serum A</option>
          <option>Cleanser B</option>
          <option>Toner E</option>
        </select>

      </div>

    </div>


    {/* =========================
        SUMMARY
    ========================== */}

    <div className="management-summary-grid">

      <div className="management-card">
        <p>Total Current Stock</p>

        <h2>870</h2>

        <span className="management-pink">
          Across all products
        </span>
      </div>


      <div className="management-card">
        <p>Predicted Requirement</p>

        <h2>1,368</h2>

        <span className="management-yellow">
          Based on forecast demand
        </span>
      </div>


      <div className="management-card">
        <p>Stock Shortage Risk</p>

        <h2>2</h2>

        <span className="management-red">
          Products at risk
        </span>
      </div>


      <div className="management-card">
        <p>Stock Sufficient</p>

        <h2>2</h2>

        <span className="management-green">
          Products currently safe
        </span>
      </div>

    </div>


    {/* =========================
        STOCK LEVEL OVERVIEW
    ========================== */}

    <div className="management-dashboard-grid">

      <div className="management-panel">

        <h3>Stock vs Predicted Demand</h3>

        <p className="management-section-subtitle">
          Comparison between available stock and predicted demand
        </p>


        <div className="management-stock-comparison-list">


          {/* PRODUCT AA */}

          <div className="management-stock-comparison-item">

            <div className="management-stock-comparison-header">

              <div>
                <strong>Product AA</strong>
                <span>100 stock / 180 predicted demand</span>
              </div>

              <span className="management-status management-red-status">
                High Risk
              </span>

            </div>


            <div className="management-stock-bar">

              <div
                className="management-stock-bar-red"
                style={{ width: "55%" }}
              ></div>

            </div>

          </div>


          {/* SERUM A */}

          <div className="management-stock-comparison-item">

            <div className="management-stock-comparison-header">

              <div>
                <strong>Serum A</strong>
                <span>150 stock / 170 predicted demand</span>
              </div>

              <span className="management-status management-yellow-status">
                At Risk
              </span>

            </div>


            <div className="management-stock-bar">

              <div
                className="management-stock-bar-yellow"
                style={{ width: "88%" }}
              ></div>

            </div>

          </div>


          {/* CLEANSER B */}

          <div className="management-stock-comparison-item">

            <div className="management-stock-comparison-header">

              <div>
                <strong>Cleanser B</strong>
                <span>300 stock / 190 predicted demand</span>
              </div>

              <span className="management-status management-green-status">
                Sufficient
              </span>

            </div>


            <div className="management-stock-bar">

              <div
                className="management-stock-bar-green"
                style={{ width: "100%" }}
              ></div>

            </div>

          </div>


          {/* TONER E */}

          <div className="management-stock-comparison-item">

            <div className="management-stock-comparison-header">

              <div>
                <strong>Toner E</strong>
                <span>320 stock / 296 predicted demand</span>
              </div>

              <span className="management-status management-green-status">
                Sufficient
              </span>

            </div>


            <div className="management-stock-bar">

              <div
                className="management-stock-bar-green"
                style={{ width: "92%" }}
              ></div>

            </div>

          </div>

        </div>

      </div>


      {/* =========================
          STOCK RISK OVERVIEW
      ========================== */}

      <div className="management-panel">

        <h3>Stock Risk Overview</h3>

        <p className="management-section-subtitle">
          Products requiring closer stock monitoring
        </p>


        <div className="management-stock-risk-list">


          <div className="management-stock-risk-card management-stock-risk-high">

            <div>
              <strong>Product AA</strong>
              <p>Predicted shortage of approximately 80 units.</p>
            </div>

            <span>-80</span>

          </div>


          <div className="management-stock-risk-card management-stock-risk-medium">

            <div>
              <strong>Serum A</strong>
              <p>Stock is slightly below predicted demand.</p>
            </div>

            <span>-20</span>

          </div>


          <div className="management-stock-risk-card management-stock-risk-safe">

            <div>
              <strong>Cleanser B</strong>
              <p>Current stock exceeds predicted demand.</p>
            </div>

            <span>+110</span>

          </div>


          <div className="management-stock-risk-card management-stock-risk-safe">

            <div>
              <strong>Toner E</strong>
              <p>Current stock is sufficient for predicted demand.</p>
            </div>

            <span>+24</span>

          </div>

        </div>

      </div>

    </div>


    {/* =========================
        STOCK PREDICTION TABLE
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Product Stock Prediction</h3>

          <p className="management-section-subtitle">
            Predicted stock position based on current inventory and future demand
          </p>
        </div>

      </div>


      <table>

        <thead>

          <tr>
            <th>Product</th>
            <th>Current Stock</th>
            <th>Predicted Demand</th>
            <th>Predicted Balance</th>
            <th>Stock Status</th>
            <th>Risk Level</th>
          </tr>

        </thead>


        <tbody>

          <tr>
            <td>Product AA</td>

            <td>100</td>

            <td>180</td>

            <td className="management-red">
              -80
            </td>

            <td>
              <span className="management-status management-red-status">
                Shortage
              </span>
            </td>

            <td>
              <span className="management-status management-red-status">
                High
              </span>
            </td>
          </tr>


          <tr>
            <td>Serum A</td>

            <td>150</td>

            <td>170</td>

            <td className="management-red">
              -20
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Low Stock
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Medium
              </span>
            </td>
          </tr>


          <tr>
            <td>Cleanser B</td>

            <td>300</td>

            <td>190</td>

            <td className="management-green">
              +110
            </td>

            <td>
              <span className="management-status management-green-status">
                Sufficient
              </span>
            </td>

            <td>
              <span className="management-status management-green-status">
                Low
              </span>
            </td>
          </tr>


          <tr>
            <td>Toner E</td>

            <td>320</td>

            <td>296</td>

            <td className="management-green">
              +24
            </td>

            <td>
              <span className="management-status management-green-status">
                Sufficient
              </span>
            </td>

            <td>
              <span className="management-status management-green-status">
                Low
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        STOCK PREDICTION INSIGHTS
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Stock Prediction Insights</h3>

          <p className="management-section-subtitle">
            Key observations based on predicted stock positions
          </p>
        </div>

      </div>


      <div className="management-stock-insights">

        <div className="management-stock-insight-card">

          <span>Highest Shortage Risk</span>

          <strong>Product AA</strong>

          <p>
            Current stock may be insufficient by approximately 80 units.
          </p>

        </div>


        <div className="management-stock-insight-card">

          <span>Stock Requires Monitoring</span>

          <strong>Serum A</strong>

          <p>
            Predicted demand is slightly higher than the available stock.
          </p>

        </div>


        <div className="management-stock-insight-card">

          <span>Highest Stock Surplus</span>

          <strong>Cleanser B</strong>

          <p>
            Current inventory exceeds predicted demand by approximately 110 units.
          </p>

        </div>

      </div>

    </div>

  </>
)}


        {/* =========================
    RISK MONITORING
========================= */}

{activePage === "risk" && (
  <>

    <div className="management-topbar">

      <div>
        <h1>Risk Monitoring</h1>

        <p>
          Monitor operational, stock, quality and order-related risks
        </p>
      </div>

      <div className="management-profile">

        <div className="management-profile-circle">
          M
        </div>

        <div>
          <strong>Management</strong>
          <p>manager001</p>
        </div>

      </div>

    </div>


    {/* =========================
        RISK FILTER
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Risk Filter</h3>

          <p className="management-section-subtitle">
            Filter detected risks by category and severity
          </p>
        </div>

      </div>


      <div className="management-risk-filters">

        <select>
          <option>All Risk Categories</option>
          <option>Order Risk</option>
          <option>Stock Risk</option>
          <option>Quality Risk</option>
          <option>Delivery Risk</option>
          <option>Supplier Risk</option>
        </select>

        <select>
          <option>All Severity</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

      </div>

    </div>


    {/* =========================
        SUMMARY
    ========================== */}

    <div className="management-summary-grid">

      <div className="management-card">
        <p>Total Active Risks</p>
        <h2>14</h2>

        <span className="management-red">
          Across current operations
        </span>
      </div>


      <div className="management-card">
        <p>High Risk</p>
        <h2>4</h2>

        <span className="management-red">
          Requires close monitoring
        </span>
      </div>


      <div className="management-card">
        <p>Medium Risk</p>
        <h2>6</h2>

        <span className="management-yellow">
          Monitor regularly
        </span>
      </div>


      <div className="management-card">
        <p>Low Risk</p>
        <h2>4</h2>

        <span className="management-green">
          Currently controlled
        </span>
      </div>

    </div>


    {/* =========================
        RISK OVERVIEW
    ========================== */}

    <div className="management-dashboard-grid">

      <div className="management-panel">

        <h3>Risk Category Overview</h3>

        <p className="management-section-subtitle">
          Current risks detected across the order management process
        </p>


        <div className="management-risk-category-list">

          <div className="management-risk-category-item">

            <div className="management-risk-category-header">
              <span>Order Cancellation Risk</span>
              <strong>18 Orders</strong>
            </div>

            <div className="management-progress">
              <div
                className="management-progress-red"
                style={{ width: "78%" }}
              ></div>
            </div>

          </div>


          <div className="management-risk-category-item">

            <div className="management-risk-category-header">
              <span>Stock Shortage Risk</span>
              <strong>2 Products</strong>
            </div>

            <div className="management-progress">
              <div
                className="management-progress-red"
                style={{ width: "65%" }}
              ></div>
            </div>

          </div>


          <div className="management-risk-category-item">

            <div className="management-risk-category-header">
              <span>Quality Risk</span>
              <strong>5 Issues</strong>
            </div>

            <div className="management-progress">
              <div
                className="management-progress-yellow"
                style={{ width: "50%" }}
              ></div>
            </div>

          </div>


          <div className="management-risk-category-item">

            <div className="management-risk-category-header">
              <span>Delivery Delay Risk</span>
              <strong>8 Orders</strong>
            </div>

            <div className="management-progress">
              <div
                className="management-progress-yellow"
                style={{ width: "42%" }}
              ></div>
            </div>

          </div>


          <div className="management-risk-category-item">

            <div className="management-risk-category-header">
              <span>Supplier Delay Risk</span>
              <strong>2 Suppliers</strong>
            </div>

            <div className="management-progress">
              <div
                className="management-progress-green"
                style={{ width: "25%" }}
              ></div>
            </div>

          </div>

        </div>

      </div>


      {/* =========================
          HIGHEST RISKS
      ========================== */}

      <div className="management-panel">

        <h3>Highest Risks</h3>

        <p className="management-section-subtitle">
          Risks currently requiring the most attention
        </p>


        <div className="management-high-risk-list">

          <div className="management-high-risk-card management-high-risk-red">

            <div>
              <span>ORDER RISK</span>

              <strong>
                High Cancellation Probability
              </strong>

              <p>
                18 orders currently show high cancellation risk.
              </p>
            </div>

            <span className="management-status management-red-status">
              High
            </span>

          </div>


          <div className="management-high-risk-card management-high-risk-red">

            <div>
              <span>STOCK RISK</span>

              <strong>
                Product AA Stock Shortage
              </strong>

              <p>
                Current stock may be insufficient for predicted demand.
              </p>
            </div>

            <span className="management-status management-red-status">
              High
            </span>

          </div>


          <div className="management-high-risk-card management-high-risk-yellow">

            <div>
              <span>QUALITY RISK</span>

              <strong>
                Recurring Packaging Defect
              </strong>

              <p>
                Product AA continues to record recurring damaged packaging cases.
              </p>
            </div>

            <span className="management-status management-yellow-status">
              Medium
            </span>

          </div>

        </div>

      </div>

    </div>


    {/* =========================
        RISK MONITORING TABLE
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Risk Monitoring Details</h3>

          <p className="management-section-subtitle">
            Detailed overview of current risks detected by the system
          </p>
        </div>

      </div>


      <table>

        <thead>

          <tr>
            <th>Risk ID</th>
            <th>Category</th>
            <th>Reference</th>
            <th>Risk Description</th>
            <th>Trend</th>
            <th>Severity</th>
            <th>Status</th>
          </tr>

        </thead>


        <tbody>

          <tr>
            <td>RK001</td>

            <td>Order Risk</td>

            <td>18 Orders</td>

            <td>
              High probability of order cancellation
            </td>

            <td>
              <span className="management-risk-trend-up">
                Increasing
              </span>
            </td>

            <td>
              <span className="management-status management-red-status">
                High
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>RK002</td>

            <td>Stock Risk</td>

            <td>Product AA</td>

            <td>
              Current stock is below predicted demand
            </td>

            <td>
              <span className="management-risk-trend-up">
                Increasing
              </span>
            </td>

            <td>
              <span className="management-status management-red-status">
                High
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>RK003</td>

            <td>Quality Risk</td>

            <td>Product AA</td>

            <td>
              Recurring damaged packaging issue detected
            </td>

            <td>
              <span className="management-risk-trend-up">
                Increasing
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Medium
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>RK004</td>

            <td>Delivery Risk</td>

            <td>8 Orders</td>

            <td>
              Orders may experience delivery delays
            </td>

            <td>
              <span className="management-risk-trend-stable">
                Stable
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Medium
              </span>
            </td>

            <td>
              <span className="management-status management-blue-status">
                Observed
              </span>
            </td>
          </tr>


          <tr>
            <td>RK005</td>

            <td>Supplier Risk</td>

            <td>Supplier 02</td>

            <td>
              Possible supplier delivery delay
            </td>

            <td>
              <span className="management-risk-trend-down">
                Decreasing
              </span>
            </td>

            <td>
              <span className="management-status management-green-status">
                Low
              </span>
            </td>

            <td>
              <span className="management-status management-green-status">
                Controlled
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        RISK INSIGHTS
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Risk Insights</h3>

          <p className="management-section-subtitle">
            Key observations from current risk monitoring data
          </p>
        </div>

      </div>


      <div className="management-risk-insights">

        <div className="management-risk-insight-card">

          <span>Highest Operational Risk</span>

          <strong>Order Cancellation</strong>

          <p>
            18 orders currently have a high probability of cancellation.
          </p>

        </div>


        <div className="management-risk-insight-card">

          <span>Highest Product Risk</span>

          <strong>Product AA</strong>

          <p>
            Product AA is affected by both stock shortage and recurring quality issues.
          </p>

        </div>


        <div className="management-risk-insight-card">

          <span>Improving Risk</span>

          <strong>Supplier Delay</strong>

          <p>
            Supplier delay risk has decreased compared with the previous period.
          </p>

        </div>

      </div>

    </div>

  </>
)}


        {/* =========================
    MANAGEMENT REPORTS
========================= */}

{activePage === "reports" && (
  <>

    <div className="management-topbar">

      <div>
        <h1>Management Reports</h1>

        <p>
          Review consolidated business, quality, stock and risk performance
        </p>
      </div>

      <div className="management-profile">

        <div className="management-profile-circle">
          M
        </div>

        <div>
          <strong>Management</strong>
          <p>manager001</p>
        </div>

      </div>

    </div>


    {/* =========================
        REPORT FILTER
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Report Filter</h3>

          <p className="management-section-subtitle">
            Filter management reports by period and category
          </p>
        </div>

      </div>


      <div className="management-report-filters">

        <select>
          <option>This Month</option>
          <option>This Week</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
        </select>

        <select>
          <option>All Categories</option>
          <option>Business Performance</option>
          <option>Demand Forecast</option>
          <option>Stock Prediction</option>
          <option>Risk Monitoring</option>
          <option>Quality Performance</option>
        </select>

        <button className="management-report-btn">
          Generate Report
        </button>

      </div>

    </div>


    {/* =========================
        REPORT SUMMARY
    ========================== */}

    <div className="management-summary-grid">

      <div className="management-card">
        <p>Total Orders</p>
        <h2>1,248</h2>

        <span className="management-green">
          +8.4% this month
        </span>
      </div>


      <div className="management-card">
        <p>Quality Issues</p>
        <h2>32</h2>

        <span className="management-red">
          5 recurring issues
        </span>
      </div>


      <div className="management-card">
        <p>Products at Stock Risk</p>
        <h2>2</h2>

        <span className="management-yellow">
          Requires monitoring
        </span>
      </div>


      <div className="management-card">
        <p>Active Risks</p>
        <h2>14</h2>

        <span className="management-red">
          4 high-risk cases
        </span>
      </div>

    </div>


    {/* =========================
        BUSINESS PERFORMANCE REPORT
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Business Performance Report</h3>

          <p className="management-section-subtitle">
            Summary of current order performance
          </p>
        </div>

      </div>


      <div className="management-report-performance">

        <div className="management-report-performance-item">

          <div className="management-report-performance-header">
            <span>Order Completion Rate</span>
            <strong>88.5%</strong>
          </div>

          <div className="management-progress">
            <div
              className="management-progress-green"
              style={{ width: "88.5%" }}
            ></div>
          </div>

        </div>


        <div className="management-report-performance-item">

          <div className="management-report-performance-header">
            <span>Cancellation Rate</span>
            <strong>5.4%</strong>
          </div>

          <div className="management-progress">
            <div
              className="management-progress-red"
              style={{ width: "5.4%" }}
            ></div>
          </div>

        </div>


        <div className="management-report-performance-item">

          <div className="management-report-performance-header">
            <span>Delayed Orders</span>
            <strong>2.5%</strong>
          </div>

          <div className="management-progress">
            <div
              className="management-progress-yellow"
              style={{ width: "2.5%" }}
            ></div>
          </div>

        </div>

      </div>

    </div>


    {/* =========================
        DEMAND & STOCK REPORT
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Demand & Stock Report</h3>

          <p className="management-section-subtitle">
            Comparison between forecasted demand and available stock
          </p>
        </div>

      </div>


      <table>

        <thead>
          <tr>
            <th>Product</th>
            <th>Current Demand</th>
            <th>Predicted Demand</th>
            <th>Current Stock</th>
            <th>Predicted Balance</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          <tr>
            <td>Product AA</td>
            <td>340</td>
            <td>420</td>
            <td>100</td>
            <td className="management-red">-320</td>

            <td>
              <span className="management-status management-red-status">
                High Risk
              </span>
            </td>
          </tr>


          <tr>
            <td>Serum A</td>
            <td>315</td>
            <td>350</td>
            <td>150</td>
            <td className="management-red">-200</td>

            <td>
              <span className="management-status management-yellow-status">
                At Risk
              </span>
            </td>
          </tr>


          <tr>
            <td>Cleanser B</td>
            <td>287</td>
            <td>302</td>
            <td>300</td>
            <td>-2</td>

            <td>
              <span className="management-status management-yellow-status">
                Monitor
              </span>
            </td>
          </tr>


          <tr>
            <td>Toner E</td>
            <td>306</td>
            <td>296</td>
            <td>320</td>
            <td className="management-green">+24</td>

            <td>
              <span className="management-status management-green-status">
                Sufficient
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        QUALITY REPORT
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Quality Performance Report</h3>

          <p className="management-section-subtitle">
            Summary of product quality results from QC and QA
          </p>
        </div>

      </div>


      <table>

        <thead>
          <tr>
            <th>Product</th>
            <th>Total Inspections</th>
            <th>Passed</th>
            <th>Rejected</th>
            <th>Recheck</th>
            <th>Quality Issues</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          <tr>
            <td>Product AA</td>
            <td>42</td>
            <td>24</td>
            <td>12</td>
            <td>6</td>
            <td>18</td>

            <td>
              <span className="management-status management-red-status">
                High Attention
              </span>
            </td>
          </tr>


          <tr>
            <td>Serum A</td>
            <td>48</td>
            <td>43</td>
            <td>3</td>
            <td>2</td>
            <td>5</td>

            <td>
              <span className="management-status management-green-status">
                Good
              </span>
            </td>
          </tr>


          <tr>
            <td>Cleanser B</td>
            <td>39</td>
            <td>34</td>
            <td>3</td>
            <td>2</td>
            <td>5</td>

            <td>
              <span className="management-status management-green-status">
                Good
              </span>
            </td>
          </tr>


          <tr>
            <td>Toner E</td>
            <td>57</td>
            <td>53</td>
            <td>2</td>
            <td>2</td>
            <td>4</td>

            <td>
              <span className="management-status management-green-status">
                Good
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        RISK REPORT
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Risk Report</h3>

          <p className="management-section-subtitle">
            Current operational risks detected across the system
          </p>
        </div>

      </div>


      <table>

        <thead>
          <tr>
            <th>Risk Category</th>
            <th>Reference</th>
            <th>Risk Description</th>
            <th>Severity</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          <tr>
            <td>Order Risk</td>
            <td>18 Orders</td>
            <td>High cancellation probability detected</td>

            <td>
              <span className="management-status management-red-status">
                High
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>Stock Risk</td>
            <td>Product AA</td>
            <td>Current stock below predicted demand</td>

            <td>
              <span className="management-status management-red-status">
                High
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>Quality Risk</td>
            <td>Product AA</td>
            <td>Recurring damaged packaging issue</td>

            <td>
              <span className="management-status management-yellow-status">
                Medium
              </span>
            </td>

            <td>
              <span className="management-status management-yellow-status">
                Monitoring
              </span>
            </td>
          </tr>


          <tr>
            <td>Delivery Risk</td>
            <td>8 Orders</td>
            <td>Potential delivery delays detected</td>

            <td>
              <span className="management-status management-yellow-status">
                Medium
              </span>
            </td>

            <td>
              <span className="management-status management-blue-status">
                Observed
              </span>
            </td>
          </tr>

        </tbody>

      </table>

    </div>


    {/* =========================
        REPORT HIGHLIGHTS
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Report Highlights</h3>

          <p className="management-section-subtitle">
            Key findings from the current management report
          </p>
        </div>

      </div>


      <div className="management-report-highlights">

        <div className="management-report-highlight-card">

          <span>Business Performance</span>

          <strong>Orders Increasing</strong>

          <p>
            Total order volume increased by 8.4% this month.
          </p>

        </div>


        <div className="management-report-highlight-card">

          <span>Demand & Stock</span>

          <strong>Product AA Requires Attention</strong>

          <p>
            Forecast demand is significantly higher than available stock.
          </p>

        </div>


        <div className="management-report-highlight-card">

          <span>Quality</span>

          <strong>Packaging Issue Remains High</strong>

          <p>
            Product AA continues to record the highest number of quality issues.
          </p>

        </div>


        <div className="management-report-highlight-card">

          <span>Risk</span>

          <strong>Cancellation Risk Increasing</strong>

          <p>
            18 orders are currently identified as high cancellation risk.
          </p>

        </div>

      </div>

    </div>


    {/* =========================
        EXPORT REPORT
    ========================== */}

    <div className="management-panel">

      <div className="management-section-header">

        <div>
          <h3>Export Report</h3>

          <p className="management-section-subtitle">
            Download the current management report
          </p>
        </div>

      </div>


      <div className="management-export-buttons">

        <button className="management-export-btn">
          Download PDF
        </button>

        <button className="management-export-btn management-export-secondary">
          Download CSV
        </button>

      </div>

    </div>

  </>
)}

      </main>

    </div>
  );
}

export default ManageDashboard;