import { useState, useEffect } from "react";
import "./QCDashboard.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

function QCDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionStatuses, setInspectionStatuses] = useState({
    ORD1060: "Waiting QC",
    ORD1062: "Waiting QC",
    ORD1063: "Waiting QC",
    });
  const [qcOrders, setQcOrders] = useState([]);
  const [inspectionChecklist, setInspectionChecklist] = useState({
    correctProduct: false,
    correctQuantity: false,
    productConditionGood: false,
    packagingGood: false,
    expiryDateValid: false,
  });

const [recheckNote, setRecheckNote] = useState("");

const [inspectionResults, setInspectionResults] = useState([]);

const [qualityHistory, setQualityHistory] = useState([]);

useEffect(() => {
  const fetchQCOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));

      const orders = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (order) =>
            order.Order_Status === "Waiting QC" &&
            ["Pending", "Inspecting", "Recheck"].includes(
              order.QC_Status
            )
        );

      setQcOrders(orders);
    } catch (error) {
      console.error("Error fetching QC orders:", error);
    }
  };

  fetchQCOrders();
}, []);

useEffect(() => {
  const fetchInspectionResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));

      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((order) =>
          ["Recheck", "Passed", "Passed (After Recheck)", "Rejected"].includes(
            order.QC_Result
          )
        )
        .map((order) => ({
          orderId: order.Order_ID,

          customer:
            order.Customer_Name ||
            order.Customer ||
            "-",

          product:
            order.items && order.items.length > 0
              ? order.items.map((item) => item.Product_Name).join(", ")
              : "-",

          qty: order.items
            ? order.items.reduce(
                (total, item) =>
                  total + Number(item.Quantity || 0),
                0
              )
            : 0,

          result: order.QC_Result,

          inspectedAt:
            order.QC_Rejected_At ||
            order.QC_Completed_At ||
            order.QC_Recheck_At ||
            "-",

          remarks:
            order.QC_Reject_Note ||
            order.QC_Recheck_Note ||
            (order.QC_Result === "Passed"
              ? "All quality checks passed"
              : order.QC_Result === "Passed (After Recheck)"
              ? "Issue corrected and passed QC"
              : "-"),
        }));

      setInspectionResults(results);
    } catch (error) {
      console.error(
        "Error fetching inspection results:",
        error
      );
    }
  };

  fetchInspectionResults();
}, []);

useEffect(() => {
  const fetchQualityHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));

      const history = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((order) =>
          ["Recheck", "Passed", "Passed (After Recheck)", "Rejected"].includes(
            order.QC_Result
          )
        )
        .map((order) => ({
          date:
            order.QC_Completed_At ||
            order.QC_Recheck_At ||
            order.QC_Inspecting_At ||
            "-",

          orderId: order.Order_ID,

          product:
            order.items && order.items.length > 0
              ? order.items.map((item) => item.Product_Name).join(", ")
              : "-",

          operator: "Operator 01",

          result: order.QC_Result,

          qualityIssue:
            order.QC_Reject_Note ||
            (order.QC_Result === "Passed"
              ? "No Issue"
              : order.QC_Result === "Passed (After Recheck)"
              ? "Issue Corrected"
              : "-"),

          inspector: "QC 01",
        }));

      setQualityHistory(history);
    } catch (error) {
      console.error("Error fetching quality history:", error);
    }
  };

  fetchQualityHistory();
}, []);

const newQCOrderCount = qcOrders.filter(
  (order) => order.QC_Viewed !== true
).length;

const handleOpenPendingInspection = async () => {
  setActivePage("pending");

  try {
    const unreadOrders = qcOrders.filter(
      (order) => order.QC_Viewed !== true
    );

    for (const order of unreadOrders) {
      await updateDoc(
        doc(db, "orders", order.Order_ID),
        {
          QC_Viewed: true,
        }
      );
    }

    setQcOrders((prevOrders) =>
      prevOrders.map((order) => ({
        ...order,
        QC_Viewed: true,
      }))
    );
  } catch (error) {
    console.error("Error marking QC orders as viewed:", error);
  }
};

const totalInspections = qualityHistory.length;

const totalPassed = qualityHistory.filter(
  (record) =>
    record.result === "Passed" ||
    record.result === "Passed (After Recheck)"
).length;

const totalIssues = qualityHistory.filter(
  (record) =>
    record.qualityIssue &&
    record.qualityIssue !== "No Issue"
).length;

const recurringIssues = Object.values(
  qualityHistory.reduce((acc, record) => {
    if (
      record.qualityIssue &&
      record.qualityIssue !== "No Issue" &&
      record.qualityIssue !== "Issue Corrected"
    ) {
      acc[record.qualityIssue] =
        (acc[record.qualityIssue] || 0) + 1;
    }

    return acc;
  }, {})
).filter((count) => count > 1).length;

const productIssueCounts = qualityHistory.reduce((acc, record) => {
  if (
    record.qualityIssue &&
    record.qualityIssue !== "No Issue"
  ) {
    const productName = record.product || "Unknown Product";

    if (!acc[productName]) {
      acc[productName] = {
        count: 0,
        issues: {},
      };
    }

    acc[productName].count += 1;

    acc[productName].issues[record.qualityIssue] =
      (acc[productName].issues[record.qualityIssue] || 0) + 1;
  }

  return acc;
}, {});

const mostProblematicProduct =
  Object.entries(productIssueCounts)
    .sort((a, b) => b[1].count - a[1].count)[0] || null;

const mostProblematicProductName =
  mostProblematicProduct
    ? mostProblematicProduct[0]
    : "-";

const mostProblematicProductCount =
  mostProblematicProduct
    ? mostProblematicProduct[1].count
    : 0;

const mostCommonIssue =
  mostProblematicProduct
    ? Object.entries(mostProblematicProduct[1].issues)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
    : "-";

const mostProblematicRejectedCount =
  mostProblematicProductName !== "-"
    ? qualityHistory.filter(
        (record) =>
          record.product === mostProblematicProductName &&
          record.result === "Rejected"
      ).length
    : 0;

const mostProblematicRecheckPassedCount =
  mostProblematicProductName !== "-"
    ? qualityHistory.filter(
        (record) =>
          record.product === mostProblematicProductName &&
          record.result === "Passed (After Recheck)"
      ).length
    : 0;

const commonIssueCounts = qualityHistory.reduce((acc, record) => {
  if (
    record.qualityIssue &&
    record.qualityIssue !== "No Issue" &&
    record.qualityIssue !== "Issue Corrected"
  ) {
    acc[record.qualityIssue] =
      (acc[record.qualityIssue] || 0) + 1;
  }

  return acc;
}, {});


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
              onClick={handleOpenPendingInspection}
            >
              <span>Pending Inspection</span>

              {newQCOrderCount > 0 && activePage !== "pending" && (
                <span className="qc-notification-badge">
                  {newQCOrderCount}
                </span>
              )}
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
        ><h2>186</h2>
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
                  {[...qcOrders]
                    .sort(
                      (a, b) =>
                        new Date(b.Sent_To_QC_At || 0) -
                        new Date(a.Sent_To_QC_At || 0)
                    )
                    .map((order) => (
                    <tr key={order.Order_ID}>
                      <td>{order.Order_ID}</td>

                      <td>
                        {order.Customer_Name || order.Customer || "-"}
                      </td>

                      <td>
                        {order.items && order.items.length > 0
                          ? order.items.map((item) => item.Product_Name).join(", ")
                          : "-"}
                      </td>

                      <td>
                        {order.items
                          ? order.items.reduce(
                              (total, item) =>
                                total + Number(item.Quantity || 0),
                              0
                            )
                          : "-"}
                      </td>

                      <td>Operator 01</td>

                      <td>
                        {order.Sent_To_QC_At
                          ? new Date(order.Sent_To_QC_At).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        <span
                          className={
                            order.QC_Status === "Recheck"
                              ? "qc-status qc-yellow-status"
                              : order.QC_Status === "Inspecting"
                              ? "qc-status qc-blue-status"
                              : "qc-status qc-yellow-status"
                          }
                        >
                          {order.QC_Status === "Recheck"
                            ? "Recheck Required"
                            : order.QC_Status === "Inspecting"
                            ? "Inspecting"
                            : "Waiting QC"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="qc-action-btn"
                          onClick={async () => {
                            try {
                              const isRecheck = order.QC_Status === "Recheck";

                              if (isRecheck && order.QC_Checklist) {
                                setInspectionChecklist({
                                  correctProduct:
                                    order.QC_Checklist.correctProduct || false,
                                  correctQuantity:
                                    order.QC_Checklist.correctQuantity || false,
                                  productConditionGood:
                                    order.QC_Checklist.productConditionGood || false,
                                  packagingGood:
                                    order.QC_Checklist.packagingGood || false,
                                  expiryDateValid:
                                    order.QC_Checklist.expiryDateValid || false,
                                });

                                setRecheckNote(order.QC_Recheck_Note || "");
                              } else {
                                setInspectionChecklist({
                                  correctProduct: false,
                                  correctQuantity: false,
                                  productConditionGood: false,
                                  packagingGood: false,
                                  expiryDateValid: false,
                                });

                                setRecheckNote("");
                              }

                              await updateDoc(
                                doc(db, "orders", order.Order_ID),
                                {
                                  QC_Status: "Inspecting",
                                  QC_Inspecting_At: new Date().toISOString(),
                                }
                              );

                              setQcOrders((prevOrders) =>
                                prevOrders.map((item) =>
                                  item.Order_ID === order.Order_ID
                                    ? {
                                        ...item,
                                        QC_Status: "Inspecting",
                                      }
                                    : item
                                )
                              );

                              setSelectedInspection({
                                orderId: order.Order_ID,
                                customer:
                                  order.Customer_Name ||
                                  order.Customer ||
                                  "-",

                                product:
                                  order.items && order.items.length > 0
                                    ? order.items
                                        .map((item) => item.Product_Name)
                                        .join(", ")
                                    : "-",

                                qty: order.items
                                  ? order.items.reduce(
                                      (total, item) =>
                                        total + Number(item.Quantity || 0),
                                      0
                                    )
                                  : 0,

                                operator: "Operator 01",
                                isRecheck: isRecheck,
                                previousRecheckNote:
                                  order.QC_Recheck_Note || "",
                              });
                            } catch (error) {
                              console.error(
                                "Error starting QC inspection:",
                                error
                              );
                            }
                          }}
                        >
                          {order.QC_Status === "Recheck" ? "Recheck" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  ))}
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

    {selectedInspection.isRecheck && (
      <div className="qc-previous-recheck-note">
        <strong>Previous Recheck Note</strong>
        <p>
          {selectedInspection.previousRecheckNote || "-"}
        </p>
      </div>
    )}

    {/* CHECKLIST */}

    <div className="qc-checklist-grid">

    <label>
      <input
        type="checkbox"
        checked={inspectionChecklist.correctProduct}
        onChange={(e) =>
          setInspectionChecklist((prev) => ({
            ...prev,
            correctProduct: e.target.checked,
          }))
        }
      />
      <span>Correct Product</span>
    </label>

    <label>
      <input
        type="checkbox"
        checked={inspectionChecklist.correctQuantity}
        onChange={(e) =>
          setInspectionChecklist((prev) => ({
            ...prev,
            correctQuantity: e.target.checked,
          }))
        }
      />
      <span>Correct Quantity</span>
    </label>

    <label>
      <input
        type="checkbox"
        checked={inspectionChecklist.productConditionGood}
        onChange={(e) =>
          setInspectionChecklist((prev) => ({
            ...prev,
            productConditionGood: e.target.checked,
          }))
        }
      />
      <span>Product Condition Good</span>
    </label>

    <label>
      <input
        type="checkbox"
        checked={inspectionChecklist.packagingGood}
        onChange={(e) =>
          setInspectionChecklist((prev) => ({
            ...prev,
            packagingGood: e.target.checked,
          }))
        }
      />
      <span>Packaging Good</span>
    </label>

    <label>
      <input
        type="checkbox"
        checked={inspectionChecklist.expiryDateValid}
        onChange={(e) =>
          setInspectionChecklist((prev) => ({
            ...prev,
            expiryDateValid: e.target.checked,
          }))
        }
      />
      <span>Expiry Date Valid</span>
    </label>

  </div>

    <div className="qc-recheck-note-section">
  <label htmlFor="recheckNote">
    Reason for Rejection
  </label>

  <textarea
    id="recheckNote"
    placeholder="Enter reason for rejection..."
    value={recheckNote}
    onChange={(e) => setRecheckNote(e.target.value)}
  />
</div>

    {/* INSPECTION ACTION */}

    <div className="qc-inspection-actions">

      <button
        className="qc-reject-btn"
        onClick={async () => {
          try {
            if (!recheckNote.trim()) {
              alert("Please enter a reason for rejection.");
              return;
            }

            const rejectTime = new Date().toISOString();

            await updateDoc(
              doc(db, "orders", selectedInspection.orderId),
              {
                QC_Status: "Rejected",
                QC_Result: "Rejected",
                Order_Status: "Rejected by QC",

                QC_Reject_Note: recheckNote.trim(),
                QC_Rejected_At: rejectTime,

                QC_Checklist: {
                  correctProduct: inspectionChecklist.correctProduct,
                  correctQuantity: inspectionChecklist.correctQuantity,
                  productConditionGood: inspectionChecklist.productConditionGood,
                  packagingGood: inspectionChecklist.packagingGood,
                  expiryDateValid: inspectionChecklist.expiryDateValid,
                },
              }
            );

            setInspectionResults((prevResults) => [
              ...prevResults,
              {
                orderId: selectedInspection.orderId,
                customer: selectedInspection.customer,
                product: selectedInspection.product,
                qty: selectedInspection.qty,
                result: "Rejected",
                inspectedAt: rejectTime,
                remarks: recheckNote.trim(),
              },
            ]);

            setQcOrders((prevOrders) =>
              prevOrders.filter(
                (order) =>
                  order.Order_ID !== selectedInspection.orderId
              )
            );

            setInspectionStatuses((prev) => ({
              ...prev,
              [selectedInspection.orderId]: "Rejected",
            }));

            setSelectedInspection(null);
            setRecheckNote("");
          } catch (error) {
            console.error("Error rejecting QC inspection:", error);
          }
        }}
      >
        Reject
      </button>


      <button
        className="qc-pass-btn"
        onClick={async () => {
          try {
            const allChecksPassed =
              inspectionChecklist.correctProduct &&
              inspectionChecklist.correctQuantity &&
              inspectionChecklist.productConditionGood &&
              inspectionChecklist.packagingGood &&
              inspectionChecklist.expiryDateValid;

            if (!allChecksPassed) {
              alert(
                "Please complete all QC checklist items before completing the inspection."
              );
              return;
            }

            const completedTime = new Date().toISOString();

            await updateDoc(
              doc(db, "orders", selectedInspection.orderId),
              {
                QC_Status: "Approved",
                Order_Status: "QC Approved",
                Delivery_Status: "Ready",

                QC_Result: selectedInspection.isRecheck
                  ? "Passed (After Recheck)"
                  : "Passed",

                QC_Final_Checklist: {
                  correctProduct: inspectionChecklist.correctProduct,
                  correctQuantity: inspectionChecklist.correctQuantity,
                  productConditionGood: inspectionChecklist.productConditionGood,
                  packagingGood: inspectionChecklist.packagingGood,
                  expiryDateValid: inspectionChecklist.expiryDateValid,
                },

                QC_Completed_At: completedTime,
                Delivery_Status: "Pending Delivery",
              }
            );

            setInspectionResults((prevResults) => {
              const finalResult = selectedInspection.isRecheck
                ? "Passed (After Recheck)"
                : "Passed";

              const finalRemarks = selectedInspection.isRecheck
                ? recheckNote.trim() ||
                  selectedInspection.previousRecheckNote ||
                  "-"
                : "All quality checks passed";

              const existingIndex = prevResults.findIndex(
                (result) => result.orderId === selectedInspection.orderId
              );

              const updatedResult = {
                orderId: selectedInspection.orderId,
                customer: selectedInspection.customer,
                product: selectedInspection.product,
                qty: selectedInspection.qty,
                result: finalResult,
                inspectedAt: completedTime,
                remarks: finalRemarks,
              };

              if (existingIndex !== -1) {
                return prevResults.map((result, index) =>
                  index === existingIndex ? updatedResult : result
                );
                const isRecheck =
                  order.QC_Status === "Recheck" ||
                  order.QC_Rejected_At ||
                  order.QC_Reject_Note;
                              }

              return [...prevResults, updatedResult];
            });

            setQcOrders((prevOrders) =>
              prevOrders.filter(
                (order) =>
                  order.Order_ID !== selectedInspection.orderId
              )
            );

            setInspectionStatuses((prev) => ({
              ...prev,
              [selectedInspection.orderId]: "Completed",
            }));

            setSelectedInspection(null);
          } catch (error) {
            console.error(
              "Error completing QC inspection:",
              error
            );
          }
        }}
      >
        Pass
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

                  {[...inspectionResults]
                    .sort(
                      (a, b) =>
                        new Date(b.inspectedAt || 0) -
                        new Date(a.inspectedAt || 0)
                    )
                    .map((result, index) => (
                    <tr key={`${result.orderId}-${index}`}>
                      <td>{result.orderId}</td>
                      <td>{result.customer}</td>
                      <td>{result.product}</td>
                      <td>{result.qty}</td>

                      <td>
                        <span
                          className={
                            result.result === "Recheck"
                              ? "qc-status qc-yellow-status"
                              : result.result === "Passed" ||
                                result.result === "Passed (After Recheck)"
                              ? "qc-status qc-green-status"
                              : "qc-status qc-red-status"
                          }
                        >
                          {result.result}
                        </span>
                      </td>

                      <td>
                        {new Date(result.inspectedAt).toLocaleDateString()}
                        <br />
                        {new Date(result.inspectedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td>{result.remarks}</td>

                      <td>
                        <button className="qc-action-btn">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

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
                      <span className="qc-issue-badge qc-issue-problem">
                        Damaged Packaging
                      </span>
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
                <h2>{totalInspections}</h2>

                <span className="qc-pink">
                This month
                </span>
            </div>


            <div className="qc-card">
                <p>Passed</p>
                <h2>{totalPassed}</h2>

                <span className="qc-green">
                Successful inspections
                </span>
            </div>


            <div className="qc-card">
                <p>Quality Issues</p>
                <h2>{totalIssues}</h2>

                <span className="qc-red">
                Rejected or recheck
                </span>
            </div>


            <div className="qc-card">
                <p>Recurring Issues</p>
                <h2>{recurringIssues}</h2>

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

                    <h2>{mostProblematicProductName}</h2>

                    <p className="qc-problem-description">
                    {mostProblematicProductCount} quality issues detected
                    </p>
                </div>

                <div className="qc-problem-stats">

                    <div className="qc-problem-stat-card">
                    <span>Main Issue</span>
                    <strong>{mostCommonIssue}</strong>
                    </div>

                    <div className="qc-problem-stat-card">
                    <span>Rejected</span>
                    <strong>{mostProblematicRejectedCount} Orders</strong>
                    </div>

                    <div className="qc-problem-stat-card">
                    <span>Passed After Recheck</span>
                    <strong>{mostProblematicRecheckPassedCount} Orders</strong>
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
                      {commonIssueCounts["Damaged Packaging"] || 0} Cases
                    </span>

                  </div>


                  <div className="qc-history-item">

                    <div>
                      <strong>Quantity Mismatch</strong>
                      <p>Incorrect quantity found during inspection</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                      {commonIssueCounts["Quantity Mismatch"] || 0} Cases
                    </span>

                  </div>


                  <div className="qc-history-item">

                    <div>
                      <strong>Wrong Product</strong>
                      <p>Incorrect product prepared for order</p>
                    </div>

                    <span className="qc-status qc-yellow-status">
                      {commonIssueCounts["Wrong Product"] || 0} Cases
                    </span>

                  </div>


                  <div className="qc-history-item">

                    <div>
                      <strong>Expiry Issue</strong>
                      <p>Product expiry date requires attention</p>
                    </div>

                    <span className="qc-status qc-red-status">
                      {commonIssueCounts["Expiry Issue"] || 0} Cases
                    </span>

                  </div>

                </div>

              </div>


              <div className="qc-panel">

                <h3>Quality Insights</h3>

                {commonIssueCounts["Damaged Packaging"] > 0 && (
                  <div className="qc-alert qc-danger-alert">
                    <strong>Packaging Issue Detected</strong>

                    <p>
                      {commonIssueCounts["Damaged Packaging"]} order(s) had packaging issues.
                    </p>
                  </div>
                )}


                {commonIssueCounts["Quantity Mismatch"] > 0 && (
                  <div className="qc-alert qc-warning-alert">
                    <strong>Quantity Issue Detected</strong>

                    <p>
                      {commonIssueCounts["Quantity Mismatch"]} order(s) had quantity mismatch issues.
                    </p>
                  </div>
                )}


                {commonIssueCounts["Wrong Product"] > 0 && (
                  <div className="qc-alert qc-danger-alert">
                    <strong>Wrong Product Detected</strong>

                    <p>
                      {commonIssueCounts["Wrong Product"]} order(s) contained the wrong product.
                    </p>
                  </div>
                )}


                {commonIssueCounts["Expiry Issue"] > 0 && (
                  <div className="qc-alert qc-danger-alert">
                    <strong>Expiry Issue Detected</strong>

                    <p>
                      {commonIssueCounts["Expiry Issue"]} order(s) had expiry-related problems.
                    </p>
                  </div>
                )}


                {totalIssues === 0 && (
                  <div className="qc-alert qc-success-alert">
                    <strong>No Quality Issues</strong>

                    <p>
                      No quality issues have been detected in the inspected orders.
                    </p>
                  </div>
                )}

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

                  {qualityHistory.length > 0 ? (
                    [...qualityHistory]
                      .sort(
                        (a, b) =>
                          new Date(b.date || 0) -
                          new Date(a.date || 0)
                      )
                      .map((record, index) => (
                      <tr key={`${record.orderId}-${index}`}>
                        <td>
                          {record.date !== "-"
                            ? new Date(record.date).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>{record.orderId}</td>

                        <td>{record.product}</td>

                        <td>{record.operator}</td>

                        <td>
                          <span
                            className={
                              record.result === "Recheck"
                                ? "qc-status qc-yellow-status"
                                : record.result === "Passed" ||
                                  record.result === "Passed (After Recheck)"
                                ? "qc-status qc-green-status"
                                : "qc-status qc-red-status"
                            }
                          >
                            {record.result}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              record.qualityIssue === "No Issue"
                                ? "qc-issue-badge qc-issue-ok"
                                : "qc-issue-badge qc-issue-problem"
                            }
                          >
                            {record.qualityIssue}
                          </span>
                        </td>

                        <td>{record.inspector}</td>

                        <td>
                          <button className="qc-action-btn">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No quality history available.
                      </td>
                    </tr>
                  )}
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