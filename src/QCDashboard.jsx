import { useState } from "react";
import "./QCDashboard.css";

function QCDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionStatuses, setInspectionStatuses] = useState({
    ORD1060: "Waiting QC",
    ORD1062: "Waiting QC",
    ORD1063: "Waiting QC",
    });

  return (
    <div className="qc-layout">

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="qc-sidebar">
        <div>
          <h2 className="qc-brand">OrderAI</h2>

          <nav>

            <a
              className={
                activePage === "dashboard"
                  ? "qc-active"
                  : ""
              }
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </a>

            <a
              className={
                activePage === "pending"
                  ? "qc-active"
                  : ""
              }
              onClick={() => setActivePage("pending")}
            >
              Pending Inspection
            </a>

            <a
                className={
                    activePage === "results"
                    ? "qc-active"
                    : ""
                }
                onClick={() => setActivePage("results")}
                >
                Inspection Results
                </a>

            <a
                className={
                    activePage === "qualityHistory"
                    ? "qc-active"
                    : ""
                }
                onClick={() => setActivePage("qualityHistory")}
                >
                Quality History
                </a>
            <a
                className={activePage === "reports" ? "qc-active" : ""}
                onClick={() => setActivePage("reports")}
                >
                Reports
                </a>

          </nav>
        </div>

        <button
          className="qc-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </aside>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="qc-main">


        {/* =========================
            DASHBOARD
        ========================== */}

        {activePage === "dashboard" && (
          <>
            <div className="qc-topbar">

              <div>
                <h1>QC Dashboard</h1>
                <p>
                  Quality Control Inspection & Order Verification
                </p>
              </div>


              <div className="qc-profile">

                <div className="qc-profile-circle">
                  Q
                </div>

                <div>
                  <strong>QC</strong>
                  <p>qc001</p>
                </div>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="qc-summary-grid">

              <div className="qc-card">
                <p>Pending Inspection</p>
                <h2>9</h2>

                <span className="qc-yellow">
                  Waiting for QC
                </span>
              </div>


              <div className="qc-card">
                <p>Passed Today</p>
                <h2>21</h2>

                <span className="qc-green">
                  Approved orders
                </span>
              </div>


              <div className="qc-card">
                <p>Rejected Today</p>
                <h2>4</h2>

                <span className="qc-red">
                  Quality issues found
                </span>
              </div>


              <div className="qc-card">
                <p>Recheck Required</p>
                <h2>3</h2>

                <span className="qc-yellow">
                  Needs inspection again
                </span>
              </div>

            </div>

            {/* INSPECTION FLOW + ALERT */}

            <div className="qc-dashboard-grid">

              <div className="qc-panel">

                <h3>
                  Inspection Status Flow
                </h3>

                <div className="qc-flow">

                  <div className="qc-flow-step">
                    <span>9</span>
                    <p>Waiting</p>
                  </div>

                  <div className="qc-flow-arrow">
                    →
                  </div>

                  <div className="qc-flow-step">
                    <span>4</span>
                    <p>Inspecting</p>
                  </div>

                  <div className="qc-flow-arrow">
                    →
                  </div>

                  <div className="qc-flow-step">
                    <span>21</span>
                    <p>Passed</p>
                  </div>

                  <div className="qc-flow-arrow">
                    →
                  </div>

                  <div className="qc-flow-step">
                    <span>4</span>
                    <p>Rejected</p>
                  </div>

                </div>

              </div>


              <div className="qc-panel">

                <h3>
                  Quality Alerts
                </h3>

                <div className="qc-alert qc-danger-alert">
                  <strong>Packaging Issue</strong>

                  <p>
                    2 orders have damaged packaging.
                  </p>
                </div>


                <div className="qc-alert qc-warning-alert">
                  <strong>Recheck Required</strong>

                  <p>
                    3 corrected orders are waiting for reinspection.
                  </p>
                </div>


                <div className="qc-alert qc-success-alert">
                  <strong>Inspection Stable</strong>

                  <p>
                    Most inspected orders passed quality checks today.
                  </p>
                </div>

              </div>

            </div>


            {/* PENDING INSPECTION PREVIEW */}

            <div className="qc-panel">

              <div className="qc-section-header">

                <h3>
                  Pending Inspection
                </h3>

              </div>


              <table>

                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Operator</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>


                <tbody>

                  <tr>
                    <td>ORD1060</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>4</td>
                    <td>Operator 01</td>

                    <td>
                        <span
                        className={
                            inspectionStatuses["ORD1060"] === "Recheck"
                            ? "qc-status qc-yellow-status"
                            : "qc-status qc-yellow-status"
                        }
                        >
                        {inspectionStatuses["ORD1060"]}
                        </span>
                    </td>

                    <td>
                        <button
                        className={
                            inspectionStatuses["ORD1060"] === "Recheck"
                            ? "qc-action-btn qc-recheck-inspect-btn"
                            : "qc-action-btn"
                        }
                        onClick={() =>
                            setSelectedInspection({
                            orderId: "ORD1060",
                            customer: "Amir",
                            product: "Product C",
                            qty: 4,
                            operator: "Operator 01",
                            })
                        }
                        >
                        Inspect
                        </button>
                    </td>
                    </tr>


                  <tr>
                    <td>ORD1062</td>
                    <td>Hana</td>
                    <td>Serum A</td>
                    <td>3</td>
                    <td>Operator 02</td>

                    <td>
                        <span
                            className={
                                inspectionStatuses["ORD1060"] === "Completed"
                                ? "qc-status qc-green-status"
                                : "qc-status qc-yellow-status"
                            }
                            >
                            {inspectionStatuses["ORD1060"]}
                            </span>
                    </td>

                    <td>
                        <button
                        className={
                            inspectionStatuses["ORD1062"] === "Recheck"
                            ? "qc-action-btn qc-recheck-inspect-btn"
                            : "qc-action-btn"
                        }
                        onClick={() =>
                            setSelectedInspection({
                            orderId: "ORD1062",
                            customer: "Hana",
                            product: "Serum A",
                            qty: 3,
                            operator: "Operator 02",
                            })
                        }
                        >
                        Inspect
                        </button>
                    </td>
                    </tr>


                  <tr>
                    <td>ORD1063</td>
                    <td>Nadia</td>
                    <td>Cleanser B</td>
                    <td>2</td>
                    <td>Operator 01</td>

                    <td>
                        <span
                            className={
                                inspectionStatuses["ORD1063"] === "Completed"
                                ? "qc-status qc-green-status"
                                : "qc-status qc-yellow-status"
                            }
                            >
                            {inspectionStatuses["ORD1063"]}
                            </span>
                    </td>

                    <td>
                        <button
                        className={
                            inspectionStatuses["ORD1063"] === "Recheck"
                            ? "qc-action-btn qc-recheck-inspect-btn"
                            : "qc-action-btn"
                        }
                        onClick={() =>
                            setSelectedInspection({
                            orderId: "ORD1063",
                            customer: "Nadia",
                            product: "Cleanser B",
                            qty: 2,
                            operator: "Operator 01",
                            })
                        }
                        >
                        Inspect
                        </button>
                    </td>
                    </tr>

                </tbody>

              </table>

            </div>

          </>
        )}


        {/* =========================
            PENDING INSPECTION
        ========================== */}

        {activePage === "pending" && (
          <>
            <div className="qc-topbar">

              <div>
                <h1>Pending Inspection</h1>

                <p>
                  Inspect prepared orders received from operators
                </p>
              </div>


              <div className="qc-profile">

                <div className="qc-profile-circle">
                  Q
                </div>

                <div>
                  <strong>QC</strong>
                  <p>qc001</p>
                </div>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="qc-summary-grid">

              <div className="qc-card">
                <p>Waiting Inspection</p>
                <h2>9</h2>

                <span className="qc-pink">
                  Pending QC
                </span>
              </div>


              <div className="qc-card">
                <p>Inspecting</p>
                <h2>4</h2>

                <span className="qc-blue">
                  In progress
                </span>
              </div>


              <div className="qc-card">
                <p>Recheck Required</p>
                <h2>3</h2>

                <span className="qc-yellow">
                  Needs reinspection
                </span>
              </div>


              <div className="qc-card">
                <p>Priority Inspection</p>
                <h2>2</h2>

                <span className="qc-red">
                  Urgent attention
                </span>
              </div>

            </div>


            {/* INSPECTION TABLE */}

            <div className="qc-panel">

              <div className="qc-section-header">

                <div>
                  <h3>
                    Orders Awaiting Inspection
                  </h3>

                  <p className="qc-section-subtitle">
                    Review prepared orders and perform quality inspection
                  </p>
                </div>

              </div>


              <div className="qc-pending-filters">

                <input
                  type="text"
                  placeholder="Search Order ID, Customer or Product..."
                />


                <select>

                  <option>
                    All Inspection Status
                  </option>

                  <option>
                    Waiting QC
                  </option>

                  <option>
                    Inspecting
                  </option>

                  <option>
                    Recheck
                  </option>

                </select>

              </div>


              <table>

                <thead>

                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Operator</th>
                    <th>Sent to QC</th>
                    <th>Inspection Status</th>
                    <th>Action</th>
                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>ORD1060</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>4</td>
                    <td>Operator 01</td>

                    <td>
                      25/09/2026
                      <br />
                      09:15 AM
                    </td>

                    <td>
                      <span className="qc-status qc-yellow-status">
                        Waiting QC
                      </span>
                    </td>

                    <td>
                      <button className="qc-action-btn">
                        Inspect
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1062</td>
                    <td>Hana</td>
                    <td>Serum A</td>
                    <td>3</td>
                    <td>Operator 02</td>

                    <td>
                      25/09/2026
                      <br />
                      09:30 AM
                    </td>

                    <td>
                      <span className="qc-status qc-blue-status">
                        Inspecting
                      </span>
                    </td>

                    <td>
                      <button className="qc-action-btn">
                        Continue
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1063</td>
                    <td>Nadia</td>
                    <td>Cleanser B</td>
                    <td>2</td>
                    <td>Operator 01</td>

                    <td>
                      25/09/2026
                      <br />
                      09:45 AM
                    </td>

                    <td>
                      <span className="qc-status qc-yellow-status">
                        Recheck
                      </span>
                    </td>

                    <td>
                      <button className="qc-action-btn">
                        Recheck
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1064</td>
                    <td>Sofia</td>
                    <td>Toner E</td>
                    <td>5</td>
                    <td>Operator 03</td>

                    <td>
                      25/09/2026
                      <br />
                      10:00 AM
                    </td>

                    <td>
                      <span className="qc-status qc-yellow-status">
                        Waiting QC
                      </span>
                    </td>

                    <td>
                      <button className="qc-action-btn">
                        Inspect
                      </button>
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>
          </>
        )}

        {selectedInspection && (
  <div className="qc-panel qc-inspection-panel">

    <div className="qc-section-header">

      <div>
        <h3>Inspection Checklist</h3>

        <p className="qc-section-subtitle">
          Complete the quality inspection for this order
        </p>
      </div>

      <button
        className="qc-close-btn"
        onClick={() => setSelectedInspection(null)}
      >
        Close
      </button>

    </div>


    {/* ORDER INFORMATION */}

    <div className="qc-inspection-info">

      <div>
        <span>Order ID</span>
        <strong>{selectedInspection.orderId}</strong>
      </div>

      <div>
        <span>Customer</span>
        <strong>{selectedInspection.customer}</strong>
      </div>

      <div>
        <span>Product</span>
        <strong>{selectedInspection.product}</strong>
      </div>

      <div>
        <span>Quantity</span>
        <strong>{selectedInspection.qty}</strong>
      </div>

      <div>
        <span>Operator</span>
        <strong>{selectedInspection.operator}</strong>
      </div>

    </div>


    {/* CHECKLIST */}

    <div className="qc-checklist-grid">

      <label>
        <input type="checkbox" />
        <span>Correct Product</span>
      </label>

      <label>
        <input type="checkbox" />
        <span>Correct Quantity</span>
      </label>

      <label>
        <input type="checkbox" />
        <span>Product Condition Good</span>
      </label>

      <label>
        <input type="checkbox" />
        <span>Packaging Good</span>
      </label>

      <label>
        <input type="checkbox" />
        <span>Expiry Date Valid</span>
      </label>

    </div>


    {/* INSPECTION ACTION */}

    <div className="qc-inspection-actions">

      <button
        className="qc-recheck-btn"
        onClick={() => {

          setInspectionStatuses((prev) => ({
            ...prev,
            [selectedInspection.orderId]: "Recheck",
          }));

          setSelectedInspection(null);

        }}
      >
        Recheck
      </button>


      <button
        className="qc-complete-btn"
        onClick={() => {

          setInspectionStatuses((prev) => ({
            ...prev,
            [selectedInspection.orderId]: "Completed",
          }));

          setSelectedInspection(null);

        }}
      >
        Complete Inspection
      </button>

    </div>

  </div>
)}

        {/* =========================
            INSPECTION RESULTS
        ========================== */}

        {activePage === "results" && (
        <>
            <div className="qc-topbar">

            <div>
                <h1>Inspection Results</h1>

                <p>
                Review passed, rejected and recheck inspection results
                </p>
            </div>


            <div className="qc-profile">

                <div className="qc-profile-circle">
                Q
                </div>

                <div>
                <strong>QC</strong>
                <p>qc001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="qc-summary-grid">

            <div className="qc-card">
                <p>Total Inspected</p>
                <h2>28</h2>

                <span className="qc-pink">
                Today
                </span>
            </div>


            <div className="qc-card">
                <p>Passed</p>
                <h2>21</h2>

                <span className="qc-green">
                Approved
                </span>
            </div>


            <div className="qc-card">
                <p>Rejected</p>
                <h2>4</h2>

                <span className="qc-red">
                Quality failed
                </span>
            </div>


            <div className="qc-card">
                <p>Recheck</p>
                <h2>3</h2>

                <span className="qc-yellow">
                Correction required
                </span>
            </div>

            </div>


            {/* RESULT TABLE */}

            <div className="qc-panel">

            <div className="qc-section-header">

                <div>
                <h3>Inspection Records</h3>

                <p className="qc-section-subtitle">
                    View completed inspection outcomes and remarks
                </p>
                </div>

            </div>


            <div className="qc-result-filters">

                <input
                type="text"
                placeholder="Search Order ID, Customer or Product..."
                />


                <select>

                <option>
                    All Results
                </option>

                <option>
                    Passed
                </option>

                <option>
                    Rejected
                </option>

                <option>
                    Recheck
                </option>

                </select>

            </div>


            <table>

                <thead>

                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Result</th>
                    <th>Inspected At</th>
                    <th>Remarks</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                <tr>

                    <td>ORD1057</td>
                    <td>Aina</td>
                    <td>Serum A</td>
                    <td>2</td>

                    <td>
                    <span className="qc-status qc-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    08:15 AM
                    </td>

                    <td>
                    All quality checks passed
                    </td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ORD1058</td>
                    <td>Farah</td>
                    <td>Cleanser B</td>
                    <td>1</td>

                    <td>
                    <span className="qc-status qc-red-status">
                        Rejected
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    08:40 AM
                    </td>

                    <td>
                    Damaged packaging
                    </td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ORD1059</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>4</td>

                    <td>
                    <span className="qc-status qc-yellow-status">
                        Recheck
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:00 AM
                    </td>

                    <td>
                    Quantity mismatch
                    </td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ORD1060</td>
                    <td>Hana</td>
                    <td>Toner E</td>
                    <td>3</td>

                    <td>
                    <span className="qc-status qc-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:30 AM
                    </td>

                    <td>
                    All quality checks passed
                    </td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>

                </tbody>

            </table>

            </div>
        </>
        )}

        {/* =========================
            QUALITY HISTORY
        ========================== */}

        {activePage === "qualityHistory" && (
        <>
            <div className="qc-topbar">

            <div>
                <h1>Quality History</h1>

                <p>
                Review historical quality records and recurring inspection issues
                </p>
            </div>


            <div className="qc-profile">

                <div className="qc-profile-circle">
                Q
                </div>

                <div>
                <strong>QC</strong>
                <p>qc001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="qc-summary-grid">

            <div className="qc-card">
                <p>Total Inspections</p>
                <h2>186</h2>

                <span className="qc-pink">
                This month
                </span>
            </div>


            <div className="qc-card">
                <p>Passed</p>
                <h2>154</h2>

                <span className="qc-green">
                Successful inspections
                </span>
            </div>


            <div className="qc-card">
                <p>Quality Issues</p>
                <h2>32</h2>

                <span className="qc-red">
                Rejected or recheck
                </span>
            </div>


            <div className="qc-card">
                <p>Recurring Issues</p>
                <h2>5</h2>

                <span className="qc-yellow">
                Repeated defects
                </span>
            </div>

            </div>

            {/* MOST PROBLEMATIC PRODUCT */}

            <div className="qc-panel qc-problem-product">

            <div className="qc-section-header">
                <div>
                <h3>Most Problematic Product</h3>

                <p className="qc-section-subtitle">
                    Product with the highest number of detected quality issues this month
                </p>
                </div>
            </div>

            <div className="qc-problem-product-content">

                <div className="qc-problem-product-info">
                    <p className="qc-problem-label">
                    Highest Issue Detection
                    </p>

                    <h2>Product AA</h2>

                    <p className="qc-problem-description">
                    18 quality issues detected this month
                    </p>
                </div>

                <div className="qc-problem-stats">

                    <div className="qc-problem-stat-card">
                    <span>Main Issue</span>
                    <strong>Damaged Packaging</strong>
                    </div>

                    <div className="qc-problem-stat-card">
                    <span>Rejected</span>
                    <strong>12 Orders</strong>
                    </div>

                    <div className="qc-problem-stat-card">
                    <span>Recheck</span>
                    <strong>6 Orders</strong>
                    </div>

                </div>

                </div>

            </div>


            {/* HISTORY OVERVIEW */}

            <div className="qc-dashboard-grid">

            <div className="qc-panel">

                <h3>Common Quality Issues</h3>

                <div className="qc-history-list">

                <div className="qc-history-item">

                    <div>
                    <strong>Damaged Packaging</strong>
                    <p>Most frequently reported defect</p>
                    </div>

                    <span className="qc-status qc-red-status">
                    12 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Quantity Mismatch</strong>
                    <p>Incorrect quantity found during inspection</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                    7 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Wrong Product</strong>
                    <p>Incorrect product prepared for order</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                    5 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Expiry Issue</strong>
                    <p>Product expiry date requires attention</p>
                    </div>

                    <span className="qc-status qc-red-status">
                    3 Cases
                    </span>

                </div>

                </div>

            </div>


            <div className="qc-panel">

                <h3>Quality Insights</h3>

                <div className="qc-alert qc-danger-alert">
                <strong>Repeated Packaging Defect</strong>

                <p>
                    Packaging defects have appeared repeatedly this month.
                </p>
                </div>


                <div className="qc-alert qc-warning-alert">
                <strong>Quantity Issue</strong>

                <p>
                    Several orders required recheck due to quantity mismatch.
                </p>
                </div>


                <div className="qc-alert qc-success-alert">
                <strong>Quality Improvement</strong>

                <p>
                    Overall pass rate has improved compared with last month.
                </p>
                </div>

            </div>

            </div>


            {/* QUALITY HISTORY TABLE */}

            <div className="qc-panel">

            <div className="qc-section-header">

                <div>
                <h3>Quality Records</h3>

                <p className="qc-section-subtitle">
                    View previous inspection results and detected quality issues
                </p>
                </div>

            </div>


            <div className="qc-history-filters">

                <input
                type="text"
                placeholder="Search Order ID, Product or Issue..."
                />


                <select>

                <option>
                    All Results
                </option>

                <option>
                    Passed
                </option>

                <option>
                    Rejected
                </option>

                <option>
                    Recheck
                </option>

                </select>


                <select>

                <option>
                    All Issue Types
                </option>

                <option>
                    Damaged Packaging
                </option>

                <option>
                    Quantity Mismatch
                </option>

                <option>
                    Wrong Product
                </option>

                <option>
                    Expiry Issue
                </option>

                <option>
                    No Issue
                </option>

                </select>

            </div>


            <table>

                <thead>

                <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Operator</th>
                    <th>Result</th>
                    <th>Quality Issue</th>
                    <th>QC Inspector</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                <tr>

                    <td>25/09/2026</td>
                    <td>ORD1058</td>
                    <td>Cleanser B</td>
                    <td>Operator 02</td>

                    <td>
                    <span className="qc-status qc-red-status">
                        Rejected
                    </span>
                    </td>

                    <td>
                    Damaged Packaging
                    </td>

                    <td>QC 01</td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>25/09/2026</td>
                    <td>ORD1059</td>
                    <td>Product C</td>
                    <td>Operator 01</td>

                    <td>
                    <span className="qc-status qc-yellow-status">
                        Recheck
                    </span>
                    </td>

                    <td>
                    Quantity Mismatch
                    </td>

                    <td>QC 01</td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>24/09/2026</td>
                    <td>ORD1054</td>
                    <td>Serum A</td>
                    <td>Operator 03</td>

                    <td>
                    <span className="qc-status qc-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    No Issue
                    </td>

                    <td>QC 02</td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>23/09/2026</td>
                    <td>ORD1049</td>
                    <td>Toner E</td>
                    <td>Operator 02</td>

                    <td>
                    <span className="qc-status qc-red-status">
                        Rejected
                    </span>
                    </td>

                    <td>
                    Wrong Product
                    </td>

                    <td>QC 01</td>

                    <td>
                    <button className="qc-action-btn">
                        View
                    </button>
                    </td>

                </tr>

                </tbody>

            </table>

            </div>
        </>
        )}

        {/* =========================
            REPORTS
        ========================= */}

        {activePage === "reports" && (
        <>
            <div className="qc-topbar">

            <div>
                <h1>Quality Reports</h1>
                <p>
                Review overall quality performance and generate inspection reports
                </p>
            </div>

            <div className="qc-profile">

                <div className="qc-profile-circle">
                Q
                </div>

                <div>
                <strong>QC</strong>
                <p>qc001</p>
                </div>

            </div>

            </div>


            {/* REPORT FILTERS */}

            <div className="qc-panel">

            <div className="qc-section-header">

                <div>
                <h3>Report Filter</h3>

                <p className="qc-section-subtitle">
                    Select a reporting period to review quality performance
                </p>
                </div>

            </div>

            <div className="qc-report-filters">

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

                <select>
                <option>All Results</option>
                <option>Passed</option>
                <option>Rejected</option>
                <option>Recheck</option>
                </select>

                <button className="qc-report-btn">
                Generate Report
                </button>

            </div>

            </div>


            {/* REPORT SUMMARY */}

            <div className="qc-summary-grid">

            <div className="qc-card">
                <p>Total Inspections</p>
                <h2>186</h2>

                <span className="qc-pink">
                This month
                </span>
            </div>

            <div className="qc-card">
                <p>Passed</p>
                <h2>154</h2>

                <span className="qc-green">
                82.8% pass rate
                </span>
            </div>

            <div className="qc-card">
                <p>Rejected</p>
                <h2>20</h2>

                <span className="qc-red">
                10.8% rejection rate
                </span>
            </div>

            <div className="qc-card">
                <p>Recheck</p>
                <h2>12</h2>

                <span className="qc-yellow">
                6.4% recheck rate
                </span>
            </div>

            </div>


            {/* PERFORMANCE OVERVIEW */}

            <div className="qc-dashboard-grid">

            <div className="qc-panel">

                <h3>Quality Performance</h3>

                <div className="qc-report-performance">

                <div className="qc-performance-item">

                    <div className="qc-performance-header">
                    <span>Pass Rate</span>
                    <strong>82.8%</strong>
                    </div>

                    <div className="qc-progress-bar">
                    <div
                        className="qc-progress-fill qc-progress-green"
                        style={{ width: "82.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qc-performance-item">

                    <div className="qc-performance-header">
                    <span>Rejection Rate</span>
                    <strong>10.8%</strong>
                    </div>

                    <div className="qc-progress-bar">
                    <div
                        className="qc-progress-fill qc-progress-red"
                        style={{ width: "10.8%" }}
                    ></div>
                    </div>

                </div>


                <div className="qc-performance-item">

                    <div className="qc-performance-header">
                    <span>Recheck Rate</span>
                    <strong>6.4%</strong>
                    </div>

                    <div className="qc-progress-bar">
                    <div
                        className="qc-progress-fill qc-progress-yellow"
                        style={{ width: "6.4%" }}
                    ></div>
                    </div>

                </div>

                </div>

            </div>


            <div className="qc-panel">

                <h3>Top Quality Issues</h3>

                <div className="qc-history-list">

                <div className="qc-history-item">

                    <div>
                    <strong>Damaged Packaging</strong>
                    <p>Most frequent issue</p>
                    </div>

                    <span className="qc-status qc-red-status">
                    12 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Quantity Mismatch</strong>
                    <p>Incorrect quantity detected</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                    7 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Wrong Product</strong>
                    <p>Incorrect product prepared</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                    5 Cases
                    </span>

                </div>


                <div className="qc-history-item">

                    <div>
                    <strong>Expiry Issue</strong>
                    <p>Product expiry requires attention</p>
                    </div>

                    <span className="qc-status qc-red-status">
                    3 Cases
                    </span>

                </div>

                </div>

            </div>

            </div>


            {/* PRODUCT PERFORMANCE */}

            <div className="qc-panel">

            <div className="qc-section-header">

                <div>
                <h3>Product Quality Performance</h3>

                <p className="qc-section-subtitle">
                    Compare inspection results and detected issues by product
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
                    <th>Quality Issues</th>
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
                    <span className="qc-status qc-red-status">
                        18 Issues
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
                    <span className="qc-status qc-yellow-status">
                        5 Issues
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
                    <span className="qc-status qc-yellow-status">
                        5 Issues
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
                    <span className="qc-status qc-green-status">
                        4 Issues
                    </span>
                    </td>
                    <td>93.0%</td>
                </tr>

                </tbody>

            </table>

            </div>


            {/* EXPORT REPORT */}

            <div className="qc-panel">

            <div className="qc-report-export">

                <div>
                <h3>Export Quality Report</h3>

                <p className="qc-section-subtitle">
                    Download the generated quality inspection report
                </p>
                </div>

                <div className="qc-export-buttons">

                <button className="qc-export-btn">
                    Download PDF
                </button>

                <button className="qc-export-btn qc-export-secondary">
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

export default QCDashboard;