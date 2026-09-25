import { useState } from "react";
import "./QADashboard.css";

function QADashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedIssue, setSelectedIssue] = useState(null);

  return (
    <div className="qa-layout">

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="qa-sidebar">
        <div>
          <h2 className="qa-brand">OrderAI</h2>

          <nav>

            <a
              className={activePage === "dashboard" ? "qa-active" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </a>

            <a
              className={activePage === "analytics" ? "qa-active" : ""}
              onClick={() => setActivePage("analytics")}
            >
              Quality Analytics
            </a>

            <a
              className={activePage === "defects" ? "qa-active" : ""}
              onClick={() => setActivePage("defects")}
            >
              Defect Monitoring
            </a>

            <a
              className={activePage === "recurring" ? "qa-active" : ""}
              onClick={() => setActivePage("recurring")}
            >
              Recurring Issues
            </a>

            <a
              className={activePage === "corrective" ? "qa-active" : ""}
              onClick={() => setActivePage("corrective")}
            >
              Corrective Actions
            </a>

            <a
              className={activePage === "reports" ? "qa-active" : ""}
              onClick={() => setActivePage("reports")}
            >
              Reports
            </a>

          </nav>
        </div>

        <button className="qa-logout" onClick={onLogout}>
          Logout
        </button>
      </aside>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="qa-main">

        {/* =========================
            DASHBOARD
        ========================== */}

        {activePage === "dashboard" && (
          <>

            <div className="qa-topbar">

              <div>
                <h1>QA Dashboard</h1>
                <p>Quality Assurance & Quality Monitoring</p>
              </div>

              <div className="qa-profile">

                <div className="qa-profile-circle">
                  QA
                </div>

                <div>
                  <strong>Quality Assurance</strong>
                  <p>qa001</p>
                </div>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="qa-summary-grid">

              <div className="qa-card">
                <p>Total Inspections</p>
                <h2>186</h2>

                <span className="qa-green">
                  This month
                </span>
              </div>


              <div className="qa-card">
                <p>Defect Rate</p>
                <h2>6.8%</h2>

                <span className="qa-red">
                  Requires monitoring
                </span>
              </div>


              <div className="qa-card">
                <p>Recurring Issues</p>
                <h2>5</h2>

                <span className="qa-yellow">
                  Investigation needed
                </span>
              </div>


              <div className="qa-card">
                <p>Open Actions</p>
                <h2>3</h2>

                <span className="qa-pink">
                  Corrective actions
                </span>
              </div>

            </div>


            {/* TREND + ALERT */}

            <div className="qa-dashboard-grid">

              <div className="qa-panel">

                <h3>Quality Issue Trend</h3>

                <div className="qa-chart">
                  <div style={{ height: "40%" }}></div>
                  <div style={{ height: "55%" }}></div>
                  <div style={{ height: "38%" }}></div>
                  <div style={{ height: "72%" }}></div>
                  <div style={{ height: "60%" }}></div>
                  <div style={{ height: "48%" }}></div>
                </div>

                <div className="qa-chart-labels">
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                </div>

              </div>


              <div className="qa-panel">

                <h3>Quality Alerts</h3>

                <div className="qa-alert qa-danger-alert">

                  <strong>Repeated Packaging Defect</strong>

                  <p>
                    12 damaged packaging cases detected for Product AA.
                  </p>

                </div>


                <div className="qa-alert qa-warning-alert">

                  <strong>Return Trend Increasing</strong>

                  <p>
                    Cleanser B return rate increased this week.
                  </p>

                </div>


                <div className="qa-alert qa-success-alert">

                  <strong>Quality Improvement</strong>

                  <p>
                    Wrong quantity cases decreased compared to last month.
                  </p>

                </div>

              </div>

            </div>


            {/* RECURRING ISSUES */}

            <div className="qa-panel">

              <h3>Recurring Quality Issues</h3>

              <table>

                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Product</th>
                    <th>Cases</th>
                    <th>Trend</th>
                    <th>Risk Level</th>
                    <th>Action</th>
                  </tr>
                </thead>


                <tbody>

                  <tr>

                    <td>Damaged Packaging</td>
                    <td>Product AA</td>
                    <td>12</td>
                    <td>Increasing</td>

                    <td>
                      <span className="qa-status qa-red-status">
                        High
                      </span>
                    </td>

                    <td>
                      <button
                        className="qa-action-btn"
                        onClick={() => setActivePage("recurring")}
                      >
                        Review
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>Wrong Quantity</td>
                    <td>Serum A</td>
                    <td>5</td>
                    <td>Stable</td>

                    <td>
                      <span className="qa-status qa-yellow-status">
                        Medium
                      </span>
                    </td>

                    <td>
                      <button
                        className="qa-action-btn"
                        onClick={() => setActivePage("recurring")}
                      >
                        Review
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>Incorrect Product</td>
                    <td>Cleanser B</td>
                    <td>2</td>
                    <td>Decreasing</td>

                    <td>
                      <span className="qa-status qa-green-status">
                        Low
                      </span>
                    </td>

                    <td>
                      <button
                        className="qa-action-btn"
                        onClick={() => setActivePage("recurring")}
                      >
                        Review
                      </button>
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>


            {/* DEFECT CATEGORIES + CORRECTIVE ACTIONS */}

            <div className="qa-dashboard-grid">

              <div className="qa-panel">

                <h3>Defect Categories</h3>

                <div className="qa-defect-list">

                  <div className="qa-defect-item">

                    <div>
                      <strong>Damaged Packaging</strong>
                      <span>18 cases</span>
                    </div>

                    <div className="qa-progress">
                      <div className="qa-progress-red"></div>
                    </div>

                  </div>


                  <div className="qa-defect-item">

                    <div>
                      <strong>Wrong Product</strong>
                      <span>8 cases</span>
                    </div>

                    <div className="qa-progress">
                      <div className="qa-progress-yellow"></div>
                    </div>

                  </div>


                  <div className="qa-defect-item">

                    <div>
                      <strong>Wrong Quantity</strong>
                      <span>5 cases</span>
                    </div>

                    <div className="qa-progress">
                      <div className="qa-progress-pink"></div>
                    </div>

                  </div>


                  <div className="qa-defect-item">

                    <div>
                      <strong>Expired Product</strong>
                      <span>1 case</span>
                    </div>

                    <div className="qa-progress">
                      <div className="qa-progress-blue"></div>
                    </div>

                  </div>

                </div>

              </div>


              <div className="qa-panel">

                <h3>Corrective Actions</h3>

                <div className="qa-action-card">

                  <strong>Packaging Process Review</strong>

                  <p>
                    Review packaging procedure for Product AA.
                  </p>

                  <span className="qa-status qa-red-status">
                    Open
                  </span>

                </div>


                <div className="qa-action-card">

                  <strong>Operator Training</strong>

                  <p>
                    Conduct refresher training for order preparation.
                  </p>

                  <span className="qa-status qa-yellow-status">
                    In Progress
                  </span>

                </div>


                <div className="qa-action-card">

                  <strong>Quantity Verification</strong>

                  <p>
                    Updated checking procedure implemented.
                  </p>

                  <span className="qa-status qa-green-status">
                    Completed
                  </span>

                </div>

              </div>

            </div>

          </>
        )}


        {/* =========================
            QUALITY ANALYTICS
        ========================= */}

        {activePage === "analytics" && (
        <>
            <div className="qa-topbar">

            <div>
                <h1>Quality Analytics</h1>
                <p>
                Analyze quality performance, defect rates and inspection trends
                </p>
            </div>

            <div className="qa-profile">

                <div className="qa-profile-circle">
                QA
                </div>

                <div>
                <strong>Quality Assurance</strong>
                <p>qa001</p>
                </div>

            </div>

            </div>


            {/* ANALYTICS FILTER */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Analytics Filter</h3>

                <p className="qa-section-subtitle">
                    Filter quality performance by period and product
                </p>
                </div>

            </div>

            <div className="qa-analytics-filters">

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

            <div className="qa-summary-grid">

            <div className="qa-card">
                <p>Total Inspections</p>
                <h2>186</h2>

                <span className="qa-green">
                This month
                </span>
            </div>


            <div className="qa-card">
                <p>Pass Rate</p>
                <h2>82.8%</h2>

                <span className="qa-green">
                154 passed
                </span>
            </div>


            <div className="qa-card">
                <p>Defect Rate</p>
                <h2>10.8%</h2>

                <span className="qa-red">
                20 rejected
                </span>
            </div>


            <div className="qa-card">
                <p>Recheck Rate</p>
                <h2>6.4%</h2>

                <span className="qa-yellow">
                12 rechecks
                </span>
            </div>

            </div>


            {/* QUALITY TREND + OUTCOME */}

            <div className="qa-dashboard-grid">

            <div className="qa-panel">

                <h3>Monthly Quality Trend</h3>

                <p className="qa-section-subtitle">
                Number of quality issues detected over the last six months
                </p>

                <div className="qa-analytics-chart">

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "42%" }}
                    ></div>
                    <span>Apr</span>
                </div>

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "55%" }}
                    ></div>
                    <span>May</span>
                </div>

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "48%" }}
                    ></div>
                    <span>Jun</span>
                </div>

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "70%" }}
                    ></div>
                    <span>Jul</span>
                </div>

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "62%" }}
                    ></div>
                    <span>Aug</span>
                </div>

                <div className="qa-analytics-bar-item">
                    <div
                    className="qa-analytics-bar"
                    style={{ height: "50%" }}
                    ></div>
                    <span>Sep</span>
                </div>

                </div>

            </div>


            <div className="qa-panel">

                <h3>Inspection Outcome</h3>

                <p className="qa-section-subtitle">
                Distribution of completed inspection results
                </p>

                <div className="qa-outcome-list">

                <div className="qa-outcome-item">

                    <div className="qa-outcome-header">
                    <span>Passed</span>
                    <strong>154</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-green"
                        style={{ width: "82.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qa-outcome-item">

                    <div className="qa-outcome-header">
                    <span>Rejected</span>
                    <strong>20</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-red"
                        style={{ width: "10.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qa-outcome-item">

                    <div className="qa-outcome-header">
                    <span>Recheck</span>
                    <strong>12</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-yellow"
                        style={{ width: "6.4%" }}
                    ></div>
                    </div>

                </div>

                </div>

            </div>

            </div>


            {/* PRODUCT QUALITY PERFORMANCE */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Product Quality Performance</h3>

                <p className="qa-section-subtitle">
                    Compare quality inspection performance across products
                </p>
                </div>

            </div>

            <table>

                <thead>
                <tr>
                    <th>Product</th>
                    <th>Total Inspected</th>
                    <th>Passed</th>
                    <th>Rejected</th>
                    <th>Recheck</th>
                    <th>Issues</th>
                    <th>Pass Rate</th>
                </tr>
                </thead>

                <tbody>

                <tr>
                    <td>Product AA</td>
                    <td>42</td>
                    <td>24</td>
                    <td>12</td>
                    <td>6</td>
                    <td>
                    <span className="qa-status qa-red-status">
                        18
                    </span>
                    </td>
                    <td>57.1%</td>
                </tr>


                <tr>
                    <td>Serum A</td>
                    <td>48</td>
                    <td>43</td>
                    <td>3</td>
                    <td>2</td>
                    <td>
                    <span className="qa-status qa-yellow-status">
                        5
                    </span>
                    </td>
                    <td>89.6%</td>
                </tr>


                <tr>
                    <td>Cleanser B</td>
                    <td>39</td>
                    <td>34</td>
                    <td>3</td>
                    <td>2</td>
                    <td>
                    <span className="qa-status qa-yellow-status">
                        5
                    </span>
                    </td>
                    <td>87.2%</td>
                </tr>


                <tr>
                    <td>Toner E</td>
                    <td>57</td>
                    <td>53</td>
                    <td>2</td>
                    <td>2</td>
                    <td>
                    <span className="qa-status qa-blue-status">
                        4
                    </span>
                    </td>
                    <td>93.0%</td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* TOP PROBLEMATIC PRODUCTS */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Top Problematic Products</h3>

                <p className="qa-section-subtitle">
                    Products with the highest number of detected quality issues
                </p>
                </div>

            </div>

            <div className="qa-problem-ranking">

                <div className="qa-problem-ranking-item">

                <div className="qa-problem-rank">
                    1
                </div>

                <div className="qa-problem-product-detail">
                    <strong>Product AA</strong>
                    <span>Main issue: Damaged Packaging</span>
                </div>

                <span className="qa-status qa-red-status">
                    18 Issues
                </span>

                </div>


                <div className="qa-problem-ranking-item">

                <div className="qa-problem-rank">
                    2
                </div>

                <div className="qa-problem-product-detail">
                    <strong>Serum A</strong>
                    <span>Main issue: Quantity Mismatch</span>
                </div>

                <span className="qa-status qa-yellow-status">
                    5 Issues
                </span>

                </div>


                <div className="qa-problem-ranking-item">

                <div className="qa-problem-rank">
                    3
                </div>

                <div className="qa-problem-product-detail">
                    <strong>Cleanser B</strong>
                    <span>Main issue: Wrong Product</span>
                </div>

                <span className="qa-status qa-yellow-status">
                    5 Issues
                </span>

                </div>

            </div>

            </div>

        </>
        )}


        {/* =========================
            DEFECT MONITORING
        ========================= */}

        {activePage === "defects" && (
        <>

            <div className="qa-topbar">

            <div>
                <h1>Defect Monitoring</h1>
                <p>
                Monitor detected defects, affected products and current defect status
                </p>
            </div>

            <div className="qa-profile">

                <div className="qa-profile-circle">
                QA
                </div>

                <div>
                <strong>Quality Assurance</strong>
                <p>qa001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="qa-summary-grid">

            <div className="qa-card">
                <p>Active Defects</p>
                <h2>8</h2>

                <span className="qa-red">
                Requires attention
                </span>
            </div>


            <div className="qa-card">
                <p>High Severity</p>
                <h2>3</h2>

                <span className="qa-red">
                Immediate review
                </span>
            </div>


            <div className="qa-card">
                <p>Under Monitoring</p>
                <h2>4</h2>

                <span className="qa-yellow">
                Being observed
                </span>
            </div>


            <div className="qa-card">
                <p>Resolved</p>
                <h2>21</h2>

                <span className="qa-green">
                Closed defects
                </span>
            </div>

            </div>


            {/* FILTERS */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Defect Records</h3>

                <p className="qa-section-subtitle">
                    Review detected defects and monitor their current status
                </p>
                </div>

            </div>

            <div className="qa-defect-filters">

                <input
                type="text"
                placeholder="Search Defect ID, Product or Defect Type..."
                />

                <select>
                <option>All Severity Levels</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                </select>

                <select>
                <option>All Status</option>
                <option>Active</option>
                <option>Monitoring</option>
                <option>Resolved</option>
                </select>

            </div>


            {/* DEFECT TABLE */}

            <table>

                <thead>
                <tr>
                    <th>Defect ID</th>
                    <th>Product</th>
                    <th>Defect Type</th>
                    <th>Cases</th>
                    <th>Trend</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>


                <tbody>

                <tr>
                    <td>DF001</td>
                    <td>Product AA</td>
                    <td>Damaged Packaging</td>
                    <td>12</td>
                    <td>
                    <span className="qa-trend-up">
                        Increasing
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-red-status">
                        High
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-red-status">
                        Active
                    </span>
                    </td>

                    <td>
                    <button className="qa-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>DF002</td>
                    <td>Serum A</td>
                    <td>Wrong Quantity</td>
                    <td>5</td>
                    <td>
                    <span className="qa-trend-stable">
                        Stable
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Medium
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Monitoring
                    </span>
                    </td>

                    <td>
                    <button className="qa-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>DF003</td>
                    <td>Cleanser B</td>
                    <td>Wrong Product</td>
                    <td>2</td>
                    <td>
                    <span className="qa-trend-down">
                        Decreasing
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-green-status">
                        Low
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-green-status">
                        Resolved
                    </span>
                    </td>

                    <td>
                    <button className="qa-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>DF004</td>
                    <td>Toner E</td>
                    <td>Expired Product</td>
                    <td>1</td>
                    <td>
                    <span className="qa-trend-stable">
                        Stable
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-blue-status">
                        Low
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Monitoring
                    </span>
                    </td>

                    <td>
                    <button className="qa-action-btn">
                        View
                    </button>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* DEFECT ATTENTION */}

            <div className="qa-dashboard-grid">

            <div className="qa-panel">

                <h3>Products Requiring Attention</h3>

                <div className="qa-attention-list">

                <div className="qa-attention-item">

                    <div>
                    <strong>Product AA</strong>
                    <p>Damaged Packaging</p>
                    </div>

                    <div className="qa-attention-right">
                    <span className="qa-status qa-red-status">
                        12 Cases
                    </span>

                    <span className="qa-status qa-red-status">
                        High Risk
                    </span>
                    </div>

                </div>


                <div className="qa-attention-item">

                    <div>
                    <strong>Serum A</strong>
                    <p>Wrong Quantity</p>
                    </div>

                    <div className="qa-attention-right">
                    <span className="qa-status qa-yellow-status">
                        5 Cases
                    </span>

                    <span className="qa-status qa-yellow-status">
                        Medium Risk
                    </span>
                    </div>

                </div>


                <div className="qa-attention-item">

                    <div>
                    <strong>Toner E</strong>
                    <p>Expired Product</p>
                    </div>

                    <div className="qa-attention-right">
                    <span className="qa-status qa-blue-status">
                        1 Case
                    </span>

                    <span className="qa-status qa-blue-status">
                        Low Risk
                    </span>
                    </div>

                </div>

                </div>

            </div>


            <div className="qa-panel">

                <h3>Defect Monitoring Insights</h3>

                <div className="qa-alert qa-danger-alert">

                <strong>Product AA Requires Investigation</strong>

                <p>
                    Damaged packaging cases continue to increase and require further review.
                </p>

                </div>


                <div className="qa-alert qa-warning-alert">

                <strong>Serum A Under Monitoring</strong>

                <p>
                    Wrong quantity cases remain stable but should continue to be monitored.
                </p>

                </div>


                <div className="qa-alert qa-success-alert">

                <strong>Cleanser B Improving</strong>

                <p>
                    Wrong product cases are decreasing and currently considered resolved.
                </p>

                </div>

            </div>

            </div>

        </>
        )}


        {/* =========================
            RECURRING ISSUES
        ========================= */}

        {activePage === "recurring" && (
        <>
            <div className="qa-topbar">

            <div>
                <h1>Recurring Issues</h1>
                <p>
                Review repeated quality problems that require investigation
                </p>
            </div>

            <div className="qa-profile">

                <div className="qa-profile-circle">
                QA
                </div>

                <div>
                <strong>Quality Assurance</strong>
                <p>qa001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="qa-summary-grid">

            <div className="qa-card">
                <p>Recurring Issues</p>
                <h2>5</h2>

                <span className="qa-red">
                Require investigation
                </span>
            </div>

            <div className="qa-card">
                <p>High Severity</p>
                <h2>2</h2>

                <span className="qa-red">
                Immediate attention
                </span>
            </div>

            <div className="qa-card">
                <p>Increasing Trend</p>
                <h2>2</h2>

                <span className="qa-yellow">
                Needs monitoring
                </span>
            </div>

            <div className="qa-card">
                <p>Action Created</p>
                <h2>3</h2>

                <span className="qa-green">
                Corrective action assigned
                </span>
            </div>

            </div>


            {/* RECURRING ISSUE TABLE */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Recurring Quality Issues</h3>

                <p className="qa-section-subtitle">
                    Issues that have repeatedly occurred and may require corrective action
                </p>
                </div>

            </div>

            <div className="qa-recurring-filters">

                <input
                type="text"
                placeholder="Search Issue ID, Product or Issue..."
                />

                <select>
                <option>All Severity Levels</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                </select>

                <select>
                <option>All Trends</option>
                <option>Increasing</option>
                <option>Stable</option>
                <option>Decreasing</option>
                </select>

            </div>


            <table>

                <thead>
                <tr>
                    <th>Issue ID</th>
                    <th>Product</th>
                    <th>Issue</th>
                    <th>Cases</th>
                    <th>Trend</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                </thead>

                <tbody>

                <tr>
                    <td>RI001</td>
                    <td>Product AA</td>
                    <td>Damaged Packaging</td>
                    <td>12</td>

                    <td>
                    <span className="qa-trend-up">
                        Increasing
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-red-status">
                        High
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-red-status">
                        Investigation Required
                    </span>
                    </td>

                    <td>
                    <button
                        className="qa-action-btn"
                        onClick={() => {
                        setSelectedIssue({
                            issueId: "RI001",
                            product: "Product AA",
                            issue: "Damaged Packaging",
                            cases: 12,
                            trend: "Increasing",
                            severity: "High",
                        });

                        setActivePage("corrective");
                        }}
                    >
                        Investigate
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>RI002</td>
                    <td>Serum A</td>
                    <td>Wrong Quantity</td>
                    <td>5</td>

                    <td>
                    <span className="qa-trend-stable">
                        Stable
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Medium
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Monitoring
                    </span>
                    </td>

                    <td>
                    <button
                        className="qa-action-btn"
                        onClick={() => {
                        setSelectedIssue({
                            issueId: "RI002",
                            product: "Serum A",
                            issue: "Wrong Quantity",
                            cases: 5,
                            trend: "Stable",
                            severity: "Medium",
                        });

                        setActivePage("corrective");
                        }}
                    >
                        Investigate
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>RI003</td>
                    <td>Cleanser B</td>
                    <td>Wrong Product</td>
                    <td>4</td>

                    <td>
                    <span className="qa-trend-down">
                        Decreasing
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Medium
                    </span>
                    </td>

                    <td>
                    <span className="qa-status qa-green-status">
                        Action Created
                    </span>
                    </td>

                    <td>
                    <button
                        className="qa-action-btn"
                        onClick={() => {
                        setSelectedIssue({
                            issueId: "RI003",
                            product: "Cleanser B",
                            issue: "Wrong Product",
                            cases: 4,
                            trend: "Decreasing",
                            severity: "Medium",
                        });

                        setActivePage("corrective");
                        }}
                    >
                        View Action
                    </button>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>

        </>
        )}


        {/* =========================
            CORRECTIVE ACTIONS
        ========================= */}

        {activePage === "corrective" && (
        <>
            <div className="qa-topbar">

            <div>
                <h1>Corrective Actions</h1>
                <p>
                Investigate recurring issues and manage corrective actions
                </p>
            </div>

            <div className="qa-profile">

                <div className="qa-profile-circle">
                QA
                </div>

                <div>
                <strong>Quality Assurance</strong>
                <p>qa001</p>
                </div>

            </div>

            </div>


            {selectedIssue ? (
            <>
                {/* SELECTED ISSUE */}

                <div className="qa-panel qa-investigation-panel">

                <div className="qa-section-header">

                    <div>
                    <h3>Issue Under Investigation</h3>

                    <p className="qa-section-subtitle">
                        Review the recurring issue before assigning corrective action
                    </p>
                    </div>

                    <button
                    className="qa-back-btn"
                    onClick={() => setActivePage("recurring")}
                    >
                    Back to Recurring Issues
                    </button>

                </div>


                <div className="qa-issue-summary">

                    <div>
                    <span>Issue ID</span>
                    <strong>{selectedIssue.issueId}</strong>
                    </div>

                    <div>
                    <span>Product</span>
                    <strong>{selectedIssue.product}</strong>
                    </div>

                    <div>
                    <span>Issue</span>
                    <strong>{selectedIssue.issue}</strong>
                    </div>

                    <div>
                    <span>Cases</span>
                    <strong>{selectedIssue.cases}</strong>
                    </div>

                    <div>
                    <span>Trend</span>
                    <strong>{selectedIssue.trend}</strong>
                    </div>

                    <div>
                    <span>Severity</span>
                    <strong>{selectedIssue.severity}</strong>
                    </div>

                </div>

                </div>


                {/* INVESTIGATION FORM */}

                <div className="qa-panel">

                <div className="qa-section-header">

                    <div>
                    <h3>Corrective Action Investigation</h3>

                    <p className="qa-section-subtitle">
                        Document the root cause and action required to prevent recurrence
                    </p>
                    </div>

                </div>


                <div className="qa-corrective-form">

                    <div className="qa-form-group qa-form-full">
                    <label>Root Cause</label>

                    <textarea
                        placeholder="Enter the identified root cause..."
                    ></textarea>
                    </div>


                    <div className="qa-form-group qa-form-full">
                    <label>Corrective Action</label>

                    <textarea
                        placeholder="Describe the corrective action to be taken..."
                    ></textarea>
                    </div>


                    <div className="qa-form-group">
                    <label>Assigned To</label>

                    <select>
                        <option>Select responsible person</option>
                        <option>Operator 01</option>
                        <option>Operator 02</option>
                        <option>Operator 03</option>
                        <option>QA Team</option>
                    </select>
                    </div>


                    <div className="qa-form-group">
                    <label>Target Date</label>

                    <input type="date" />
                    </div>


                    <div className="qa-form-group">
                    <label>Priority</label>

                    <select defaultValue={selectedIssue.severity}>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                    </div>


                    <div className="qa-form-group">
                    <label>Status</label>

                    <select>
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                    </select>
                    </div>


                    <div className="qa-form-group qa-form-full">
                    <label>Remarks</label>

                    <textarea
                        placeholder="Add investigation notes or additional remarks..."
                    ></textarea>
                    </div>

                </div>


                <div className="qa-corrective-buttons">

                    <button
                    className="qa-cancel-btn"
                    onClick={() => setActivePage("recurring")}
                    >
                    Cancel
                    </button>

                    <button className="qa-save-btn">
                    Save Corrective Action
                    </button>

                </div>

                </div>

            </>
            ) : (
            <>
                {/* NO ISSUE SELECTED */}

                <div className="qa-panel">

                <h3>Corrective Actions</h3>

                <p className="qa-section-subtitle">
                    Select a recurring issue to begin investigation or review existing actions.
                </p>

                </div>


                {/* EXISTING ACTIONS */}

                <div className="qa-panel">

                <h3>Existing Corrective Actions</h3>

                <table>

                    <thead>
                    <tr>
                        <th>Action ID</th>
                        <th>Related Issue</th>
                        <th>Product</th>
                        <th>Corrective Action</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                    </tr>
                    </thead>

                    <tbody>

                    <tr>
                        <td>CA001</td>
                        <td>RI003</td>
                        <td>Cleanser B</td>
                        <td>Operator verification procedure updated</td>
                        <td>Operator 02</td>

                        <td>
                        <span className="qa-status qa-yellow-status">
                            In Progress
                        </span>
                        </td>
                    </tr>


                    <tr>
                        <td>CA002</td>
                        <td>RI004</td>
                        <td>Toner E</td>
                        <td>Expiry checking procedure revised</td>
                        <td>QA Team</td>

                        <td>
                        <span className="qa-status qa-green-status">
                            Completed
                        </span>
                        </td>
                    </tr>

                    </tbody>

                </table>

                </div>

            </>
            )}

        </>
        )}


        {/* =========================
            AUDIT HISTORY
        ========================== */}

        {activePage === "audit" && (
          <>

            <div className="qa-topbar">

              <div>
                <h1>Audit History</h1>
                <p>
                  Review previous QA investigations and quality assurance activities
                </p>
              </div>

              <div className="qa-profile">

                <div className="qa-profile-circle">
                  QA
                </div>

                <div>
                  <strong>Quality Assurance</strong>
                  <p>qa001</p>
                </div>

              </div>

            </div>

            <div className="qa-panel">

              <h3>QA Audit History</h3>

              <p>
                Historical QA activities and audit records will be displayed here.
              </p>

            </div>

          </>
        )}


        {/* =========================
            REPORTS
        ========================== */}

        {activePage === "reports" && (
        <>

            <div className="qa-topbar">

            <div>
                <h1>QA Reports</h1>
                <p>
                Review quality assurance performance and generate summary reports
                </p>
            </div>

            <div className="qa-profile">

                <div className="qa-profile-circle">
                QA
                </div>

                <div>
                <strong>Quality Assurance</strong>
                <p>qa001</p>
                </div>

            </div>

            </div>


            {/* REPORT FILTER */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Report Filter</h3>

                <p className="qa-section-subtitle">
                    Select report period and product to generate QA performance report
                </p>
                </div>

            </div>

            <div className="qa-report-filters">

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

                <button className="qa-report-btn">
                Generate Report
                </button>

            </div>

            </div>


            {/* REPORT SUMMARY */}

            <div className="qa-summary-grid">

            <div className="qa-card">
                <p>Total Inspections</p>
                <h2>186</h2>

                <span className="qa-green">
                This month
                </span>
            </div>

            <div className="qa-card">
                <p>Defect Rate</p>
                <h2>10.8%</h2>

                <span className="qa-red">
                20 rejected
                </span>
            </div>

            <div className="qa-card">
                <p>Recurring Issues</p>
                <h2>5</h2>

                <span className="qa-yellow">
                Requires investigation
                </span>
            </div>

            <div className="qa-card">
                <p>Corrective Actions</p>
                <h2>3</h2>

                <span className="qa-pink">
                Open & in progress
                </span>
            </div>

            </div>


            {/* QA PERFORMANCE + ISSUE SUMMARY */}

            <div className="qa-dashboard-grid">

            <div className="qa-panel">

                <h3>QA Performance Summary</h3>

                <div className="qa-report-performance">

                <div className="qa-report-performance-item">

                    <div className="qa-report-performance-header">
                    <span>Pass Rate</span>
                    <strong>82.8%</strong>
                    </div>

                    <div className="qa-report-progress">
                    <div
                        className="qa-report-progress-fill qa-report-green"
                        style={{ width: "82.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qa-report-performance-item">

                    <div className="qa-report-performance-header">
                    <span>Defect Rate</span>
                    <strong>10.8%</strong>
                    </div>

                    <div className="qa-report-progress">
                    <div
                        className="qa-report-progress-fill qa-report-red"
                        style={{ width: "10.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qa-report-performance-item">

                    <div className="qa-report-performance-header">
                    <span>Recheck Rate</span>
                    <strong>6.4%</strong>
                    </div>

                    <div className="qa-report-progress">
                    <div
                        className="qa-report-progress-fill qa-report-yellow"
                        style={{ width: "6.4%" }}
                    ></div>
                    </div>

                </div>

                </div>

            </div>


            <div className="qa-panel">

                <h3>Issue Summary</h3>

                <div className="qa-history-list">

                <div className="qa-history-item">

                    <div>
                    <strong>Damaged Packaging</strong>
                    <p>Most frequent defect</p>
                    </div>

                    <span className="qa-status qa-red-status">
                    18 Cases
                    </span>

                </div>


                <div className="qa-history-item">

                    <div>
                    <strong>Wrong Product</strong>
                    <p>Incorrect product detected</p>
                    </div>

                    <span className="qa-status qa-yellow-status">
                    8 Cases
                    </span>

                </div>


                <div className="qa-history-item">

                    <div>
                    <strong>Wrong Quantity</strong>
                    <p>Quantity mismatch detected</p>
                    </div>

                    <span className="qa-status qa-pink-status">
                    5 Cases
                    </span>

                </div>


                <div className="qa-history-item">

                    <div>
                    <strong>Expired Product</strong>
                    <p>Expiry related defect</p>
                    </div>

                    <span className="qa-status qa-blue-status">
                    1 Case
                    </span>

                </div>

                </div>

            </div>

            </div>


            {/* PRODUCT QUALITY REPORT */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Product Quality Report</h3>

                <p className="qa-section-subtitle">
                    Summary of product quality performance and defect occurrence
                </p>
                </div>

            </div>

            <table>

                <thead>
                <tr>
                    <th>Product</th>
                    <th>Total Inspected</th>
                    <th>Passed</th>
                    <th>Rejected</th>
                    <th>Recheck</th>
                    <th>Defects</th>
                    <th>Recurring Issues</th>
                    <th>Risk Level</th>
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
                    <td>2</td>

                    <td>
                    <span className="qa-status qa-red-status">
                        High
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
                    <td>1</td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Medium
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
                    <td>1</td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        Medium
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
                    <td>1</td>

                    <td>
                    <span className="qa-status qa-blue-status">
                        Low
                    </span>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* CORRECTIVE ACTION REPORT */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Corrective Action Report</h3>

                <p className="qa-section-subtitle">
                    Review corrective actions created from recurring quality issues
                </p>
                </div>

            </div>

            <table>

                <thead>
                <tr>
                    <th>Action ID</th>
                    <th>Related Issue</th>
                    <th>Product</th>
                    <th>Corrective Action</th>
                    <th>Assigned To</th>
                    <th>Target Date</th>
                    <th>Status</th>
                </tr>
                </thead>

                <tbody>

                <tr>
                    <td>CA001</td>
                    <td>RI001</td>
                    <td>Product AA</td>
                    <td>Review packaging process and improve protection procedure</td>
                    <td>Operator 01</td>
                    <td>30/09/2026</td>

                    <td>
                    <span className="qa-status qa-red-status">
                        Open
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>CA002</td>
                    <td>RI002</td>
                    <td>Serum A</td>
                    <td>Improve quantity verification procedure</td>
                    <td>Operator 02</td>
                    <td>28/09/2026</td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        In Progress
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>CA003</td>
                    <td>RI003</td>
                    <td>Cleanser B</td>
                    <td>Operator verification procedure updated</td>
                    <td>QA Team</td>
                    <td>24/09/2026</td>

                    <td>
                    <span className="qa-status qa-green-status">
                        Completed
                    </span>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* =========================
                AUDIT HISTORY
            ========================= */}

            <div className="qa-panel">

            <div className="qa-section-header">

                <div>
                <h3>Audit History</h3>

                <p className="qa-section-subtitle">
                    Review previous QA activities and changes made to quality issues
                </p>
                </div>

            </div>

            <div className="qa-audit-filters">

                <input
                type="text"
                placeholder="Search user, activity or reference..."
                />

                <select>
                <option>All Activities</option>
                <option>Issue Reviewed</option>
                <option>Corrective Action Created</option>
                <option>Status Updated</option>
                <option>Issue Resolved</option>
                </select>

            </div>

            <table>

                <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Activity</th>
                    <th>Reference</th>
                    <th>Details</th>
                    <th>Status</th>
                </tr>
                </thead>

                <tbody>

                <tr>
                    <td>
                    25/09/2026
                    <br />
                    10:30 AM
                    </td>

                    <td>QA 01</td>

                    <td>
                    Corrective Action Created
                    </td>

                    <td>CA001 / RI001</td>

                    <td>
                    Corrective action created for damaged packaging issue on Product AA
                    </td>

                    <td>
                    <span className="qa-status qa-red-status">
                        Open
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>
                    25/09/2026
                    <br />
                    11:10 AM
                    </td>

                    <td>QA 01</td>

                    <td>
                    Action Status Updated
                    </td>

                    <td>CA002</td>

                    <td>
                    Corrective action status changed from Open to In Progress
                    </td>

                    <td>
                    <span className="qa-status qa-yellow-status">
                        In Progress
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>
                    24/09/2026
                    <br />
                    03:45 PM
                    </td>

                    <td>QA 02</td>

                    <td>
                    Recurring Issue Reviewed
                    </td>

                    <td>RI003</td>

                    <td>
                    Wrong product issue reviewed for Cleanser B
                    </td>

                    <td>
                    <span className="qa-status qa-blue-status">
                        Reviewed
                    </span>
                    </td>
                </tr>


                <tr>
                    <td>
                    23/09/2026
                    <br />
                    02:15 PM
                    </td>

                    <td>QA 02</td>

                    <td>
                    Issue Resolved
                    </td>

                    <td>RI004</td>

                    <td>
                    Expiry verification procedure completed and issue closed
                    </td>

                    <td>
                    <span className="qa-status qa-green-status">
                        Resolved
                    </span>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* REPORT INSIGHTS */}

            <div className="qa-dashboard-grid">

            <div className="qa-panel">

                <h3>Report Insights</h3>

                <div className="qa-alert qa-danger-alert">
                <strong>Product AA Requires Attention</strong>

                <p>
                    Product AA has the highest number of defects and recurring issues.
                </p>
                </div>


                <div className="qa-alert qa-warning-alert">
                <strong>Packaging Defect Remains High</strong>

                <p>
                    Damaged packaging continues to be the most frequently detected issue.
                </p>
                </div>


                <div className="qa-alert qa-success-alert">
                <strong>Corrective Action Progress</strong>

                <p>
                    One corrective action has been completed successfully.
                </p>
                </div>

            </div>


            <div className="qa-panel">

                <h3>Export Report</h3>

                <p className="qa-section-subtitle">
                Download the generated QA report for documentation and management review
                </p>

                <div className="qa-report-export-buttons">

                <button className="qa-export-btn">
                    Download PDF
                </button>

                <button className="qa-export-btn qa-export-secondary">
                    Download CSV
                </button>

                </div>

            </div>

            </div>

        </>
        )}

      </main>

    </div>
  );
}

export default QADashboard;