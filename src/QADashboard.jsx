import { useState, useEffect } from "react";
import "./QADashboard.css";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function QADashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("analytics");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [qaOrders, setQaOrders] = useState([]);
  const [qaProducts, setQaProducts] = useState([]);
  const [topProductLimit, setTopProductLimit] = useState(3);
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [actionStatus, setActionStatus] = useState("Open");
  const [correctiveActions, setCorrectiveActions] = useState([]);

    useEffect(() => {
    const unsubscribe = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        setQaOrders(orders);
        },
        (error) => {
        console.error("Error loading QA data:", error);
        }
    );

    const loadProducts = async () => {
        try {
        const snapshot = await getDocs(collection(db, "inventory"));

        const products = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        setQaProducts(products);
        } catch (error) {
        console.error("Error loading products:", error);
        }
    };

    loadProducts();

    return () => unsubscribe();
    }, []);

    useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "corrective_actions"),
    (snapshot) => {
      const actions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCorrectiveActions(actions);
    },
    (error) => {
      console.error("Error loading corrective actions:", error);
    }
  );

  return () => unsubscribe();
}, []);

    const qcIssueOrders = qaOrders.filter(
        (order) =>
            order.QC_Result === "Rejected" ||
            order.QC_Reject_Note
        );

        const deliveryIssueOrders = qaOrders.filter(
        (order) =>
            order.Delivery_Issue === true ||
            [
            "Delivery Delayed",
            "Not Received",
            "Returned",
            "Canceled",
            ].includes(order.Delivery_Status)
        );

        const totalQualityIssues =
        qcIssueOrders.length + deliveryIssueOrders.length;

        const affectedProducts = new Set(
        [...qcIssueOrders, ...deliveryIssueOrders].flatMap(
            (order) =>
            (order.items || []).map(
                (item) => item.Product_Name
            )
        )
        ).size;

        const productIssueMap = {};

qaOrders.forEach((order) => {
  (order.items || []).forEach((item) => {
    const productName = item.Product_Name || "Unknown Product";

    if (!productIssueMap[productName]) {
      productIssueMap[productName] = {
        product: productName,
        totalIssues: 0,
        qcIssues: 0,
        deliveryIssues: 0,
        issueTypes: {},
      };
    }

   

    if (
      order.QC_Result === "Rejected" ||
      order.QC_Reject_Note
    ) {
      productIssueMap[productName].qcIssues += 1;

      productIssueMap[productName].totalIssues += 1;

      const issueType =
        order.QC_Reject_Note || "QC Inspection Issue";

      productIssueMap[productName].issueTypes[issueType] =
        (productIssueMap[productName].issueTypes[issueType] || 0) + 1;
    }

    if (
      order.Delivery_Issue === true ||
      [
        "Delivery Delayed",
        "Not Received",
        "Returned",
        "Canceled",
      ].includes(order.Delivery_Status)
    ) {
      productIssueMap[productName].deliveryIssues += 1;

      productIssueMap[productName].totalIssues += 1;
      const issueType =
        order.Delivery_Issue_Type ||
        order.Delivery_Status ||
        "Delivery Issue";

      productIssueMap[productName].issueTypes[issueType] =
        (productIssueMap[productName].issueTypes[issueType] || 0) + 1;
    }
  });
});

const problematicProducts = Object.values(productIssueMap)
  .map((product) => {
    const mainIssue =
      Object.entries(product.issueTypes)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      ...product,
      mainIssue,
    };
  })
  .sort((a, b) => b.totalIssues - a.totalIssues);

  const topProblematicProducts =
  problematicProducts.slice(0, topProductLimit);

  const allProductNames = [
  ...new Set(
    qaProducts
      .map(
        (product) =>
          product.Product_Name ||
          product.productName ||
          product.Name
      )
      .filter(Boolean)
  ),
];

const allProductIssueRanking = allProductNames
  .map((productName) => {
    const issueData = productIssueMap[productName];

    return {
      product: productName,
      totalIssues: issueData?.totalIssues || 0,
      qcIssues: issueData?.qcIssues || 0,
      deliveryIssues: issueData?.deliveryIssues || 0,
    };
  })
  .sort((a, b) => b.totalIssues - a.totalIssues);


const monthlyIssueMap = {};

const addMonthlyIssue = (dateValue) => {
  if (!dateValue || dateValue === "-") return;

  const date = new Date(dateValue);

  if (isNaN(date)) return;

  const key = `${date.getFullYear()}-${date.getMonth()}`;

  if (!monthlyIssueMap[key]) {
    monthlyIssueMap[key] = {
      year: date.getFullYear(),
      month: date.getMonth(),
      total: 0,
    };
  }

  monthlyIssueMap[key].total += 1;
};


qcIssueOrders.forEach((order) => {
  addMonthlyIssue(
    order.QC_Rejected_At ||
    order.QC_Completed_At
  );
});


deliveryIssueOrders.forEach((order) => {
  addMonthlyIssue(
    order.Delivery_Issue_At ||
    order.Delivery_Updated_At
  );
});


const monthlyQualityTrend = Object.values(monthlyIssueMap)
  .sort((a, b) => {
    const dateA = new Date(a.year, a.month);
    const dateB = new Date(b.year, b.month);

    return dateA - dateB;
  })
  .slice(-6)
  .map((item) => ({
    ...item,

    label: new Date(
      item.year,
      item.month
    ).toLocaleString("en-US", {
      month: "short",
    }),
  }));


const maxMonthlyIssues = Math.max(
  ...monthlyQualityTrend.map((item) => item.total),
  1
);

const passedInspections = qaOrders.filter(
  (order) =>
    order.QC_Result === "Passed" ||
    order.QC_Result === "Passed (After Recheck)"
).length;

const rejectedInspections = qaOrders.filter(
  (order) => order.QC_Result === "Rejected"
).length;

const recheckInspections = qaOrders.filter(
  (order) => order.QC_Status === "Recheck"
).length;

const totalInspections =
  passedInspections +
  rejectedInspections +
  recheckInspections;

const passedRate =
  totalInspections > 0
    ? (passedInspections / totalInspections) * 100
    : 0;

const rejectedRate =
  totalInspections > 0
    ? (rejectedInspections / totalInspections) * 100
    : 0;

const recheckRate =
  totalInspections > 0
    ? (recheckInspections / totalInspections) * 100
    : 0;

const productPerformanceMap = {};

qaOrders.forEach((order) => {
  (order.items || []).forEach((item) => {
    const productName =
      item.Product_Name || "Unknown Product";

    if (!productPerformanceMap[productName]) {
      productPerformanceMap[productName] = {
        product: productName,
        inspected: 0,
        passed: 0,
        rejected: 0,
        recheck: 0,
        issues: 0,
      };
    }

    const hasInspection =
      order.QC_Status ||
      order.QC_Result ||
      order.QC_Checklist ||
      order.QC_Final_Checklist;

    if (hasInspection) {
      productPerformanceMap[productName].inspected += 1;
    }

    if (
      order.QC_Result === "Passed" ||
      order.QC_Result === "Passed (After Recheck)"
    ) {
      productPerformanceMap[productName].passed += 1;
    }

    if (order.QC_Result === "Rejected") {
      productPerformanceMap[productName].rejected += 1;
    }

    if (order.QC_Status === "Recheck") {
      productPerformanceMap[productName].recheck += 1;
    }

    if (
      order.QC_Result === "Rejected" ||
      order.QC_Reject_Note ||
      order.Delivery_Issue === true ||
      [
        "Delivery Delayed",
        "Not Received",
        "Returned",
        "Canceled",
      ].includes(order.Delivery_Status)
    ) {
      productPerformanceMap[productName].issues += 1;
    }
  });
});

const productQualityPerformance =
  Object.values(productPerformanceMap)
    .map((product) => ({
      ...product,
      passRate:
        product.inspected > 0
          ? (product.passed / product.inspected) * 100
          : 0,
    }))
    .sort((a, b) => b.issues - a.issues);

    const recurringIssues = Object.values(productIssueMap)
  .flatMap((product) =>
    Object.entries(product.issueTypes)
      .filter(([, count]) => count >= 2)
      .map(([issue, count]) => ({
        product: product.product,
        issue: issue,
        cases: count,

        severity:
          count >= 5
            ? "High"
            : count >= 3
            ? "Medium"
            : "Low",
      }))
  )
  .sort((a, b) => b.cases - a.cases);

  const totalRecurringIssues = recurringIssues.length;

const highSeverityRecurring = recurringIssues.filter(
  (item) => item.severity === "High"
).length;

const mediumSeverityRecurring = recurringIssues.filter(
  (item) => item.severity === "Medium"
).length;

const lowSeverityRecurring = recurringIssues.filter(
  (item) => item.severity === "Low"
).length;

const handleSaveCorrectiveAction = async () => {
  if (
    !selectedIssue ||
    !rootCause.trim() ||
    !correctiveAction.trim() ||
    !assignedTo ||
    !targetDate
  ) {
    alert("Please complete all required fields.");
    return;
  }

  try {
    await addDoc(collection(db, "corrective_actions"), {
      issueId: selectedIssue.issueId,
      product: selectedIssue.product,
      issue: selectedIssue.issue,
      cases: selectedIssue.cases,
      trend: selectedIssue.trend,
      severity: selectedIssue.severity,

      rootCause: rootCause.trim(),
      correctiveAction: correctiveAction.trim(),
      assignedTo,
      targetDate,
      priority,
      status: actionStatus,
      remarks: remarks.trim(),

      createdAt: serverTimestamp(),
    });

    alert("Corrective action saved successfully.");

    setRootCause("");
    setCorrectiveAction("");
    setAssignedTo("");
    setTargetDate("");
    setPriority("Medium");
    setActionStatus("Open");
    setRemarks("");
    setSelectedIssue(null);

  } catch (error) {
    console.error("Error saving corrective action:", error);
    alert("Failed to save corrective action.");
  }
};

const openCorrectiveActions = correctiveActions.filter(
  (action) => action.status === "Open"
).length;

const inProgressCorrectiveActions = correctiveActions.filter(
  (action) => action.status === "In Progress"
).length;

const completedCorrectiveActions = correctiveActions.filter(
  (action) => action.status === "Completed"
).length;


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
              className={activePage === "analytics" ? "qa-active" : ""}
              onClick={() => setActivePage("analytics")}
            >
              Quality Analytics
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
                    <p>Total Quality Issues</p>
                    <h2>{totalQualityIssues}</h2>

                    <span className="qa-red">
                    QC + Delivery issues
                    </span>
                </div>


                <div className="qa-card">
                    <p>QC Issues</p>
                    <h2>{qcIssueOrders.length}</h2>

                    <span className="qa-pink">
                    Inspection related
                    </span>
                </div>


                <div className="qa-card">
                    <p>Delivery Issues</p>
                    <h2>{deliveryIssueOrders.length}</h2>

                    <span className="qa-yellow">
                    Delivery related
                    </span>
                </div>


                <div className="qa-card">
                    <p>Products Affected</p>
                    <h2>{affectedProducts}</h2>

                    <span className="qa-blue">
                    Products with issues
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
                {recurringIssues.length > 0 ? (
                    recurringIssues.map((item, index) => (
                    <tr key={`${item.product}-${item.issue}`}>

                        <td>{`RI${String(index + 1).padStart(3, "0")}`}</td>

                        <td>{item.product}</td>

                        <td>{item.issue}</td>

                        <td>{item.cases}</td>

                        <td>
                        <span className="qa-trend-stable">
                            Recurring
                        </span>
                        </td>

                        <td>
                        <span
                            className={`qa-status ${
                            item.severity === "High"
                                ? "qa-red-status"
                                : item.severity === "Medium"
                                ? "qa-yellow-status"
                                : "qa-blue-status"
                            }`}
                        >
                            {item.severity}
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
                                issueId: `RI${String(index + 1).padStart(3, "0")}`,
                                product: item.product,
                                issue: item.issue,
                                cases: item.cases,
                                trend: "Recurring",
                                severity: item.severity,
                            });

                            setActivePage("corrective");
                            }}
                        >
                            Investigate
                        </button>
                        </td>

                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="8">
                        No recurring quality issues detected.
                    </td>
                    </tr>
                )}
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
                <p>Total Quality Issues</p>
                <h2>{totalQualityIssues}</h2>
                <span className="qa-red">
                QC + Delivery issues
                </span>
            </div>

            <div className="qa-card">
                <p>QC Issues</p>
                <h2>{qcIssueOrders.length}</h2>
                <span className="qa-pink">
                Inspection related
                </span>
            </div>

            <div className="qa-card">
                <p>Delivery Issues</p>
                <h2>{deliveryIssueOrders.length}</h2>
                <span className="qa-yellow">
                Delivery related
                </span>
            </div>

            <div className="qa-card">
                <p>Products Affected</p>
                <h2>{affectedProducts}</h2>
                <span className="qa-blue">
                Products with issues
                </span>
            </div>

            </div>


            <div className="qa-panel">

            <div className="qa-section-header">
                <div>
                <h3>Quality Issues</h3>
                <p className="qa-section-subtitle">
                    Combined quality issues from QC inspection and delivery
                </p>
                </div>
            </div>

            <table>
                <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Source</th>
                    <th>Issue</th>
                    <th>Date</th>
                </tr>
                </thead>

                <tbody>
                {[
                    ...qcIssueOrders.map((order) => ({
                    ...order,
                    issueSource: "QC",
                    issueText:
                        order.QC_Reject_Note ||
                        "QC Inspection Issue",
                    issueDate:
                        order.QC_Rejected_At ||
                        order.QC_Completed_At ||
                        "-",
                    })),

                    ...deliveryIssueOrders.map((order) => ({
                    ...order,
                    issueSource: "Delivery",
                    issueText:
                        order.Delivery_Issue_Type ||
                        order.Delivery_Status ||
                        "Delivery Issue",
                    issueDate:
                        order.Delivery_Issue_At ||
                        order.Delivery_Updated_At ||
                        "-",
                    })),
                ]
                    .sort(
                    (a, b) =>
                        new Date(b.issueDate || 0) -
                        new Date(a.issueDate || 0)
                    )
                    .map((order) => (
                    <tr key={`${order.Order_ID}-${order.issueSource}`}>
                        <td>{order.Order_ID}</td>

                        <td>
                        {(order.items || [])
                            .map((item) => item.Product_Name)
                            .join(", ") || "-"}
                        </td>

                        <td>
                        <span
                            className={`qa-status ${
                            order.issueSource === "QC"
                                ? "qa-pink-status"
                                : "qa-yellow-status"
                            }`}
                        >
                            {order.issueSource}
                        </span>
                        </td>

                        <td>{order.issueText}</td>

                        <td>
                        {order.issueDate !== "-"
                            ? new Date(order.issueDate).toLocaleString()
                            : "-"}
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>

            </div>


            {/* QUALITY TREND + OUTCOME */}

            <div className="qa-dashboard-grid">

            <div className="qa-panel">

                <h3>Monthly Quality Trend</h3>

                <p className="qa-section-subtitle">
                Number of quality issues detected over the last six months
                </p>

                <div className="qa-analytics-chart">

                    {monthlyQualityTrend.length > 0 ? (
                        monthlyQualityTrend.map((item) => (
                        <div
                            className="qa-analytics-bar-item"
                            key={`${item.year}-${item.month}`}
                        >

                            <div
                            className="qa-analytics-bar"
                            style={{
                                height: `${Math.max(
                                (item.total / maxMonthlyIssues) * 100,
                                8
                                )}%`,
                            }}
                            title={`${item.label}: ${item.total} issues`}
                            ></div>

                            <strong>{item.total}</strong>

                            <span>{item.label}</span>

                        </div>
                        ))
                    ) : (
                        <p className="qa-section-subtitle">
                        No quality issue data available.
                        </p>
                    )}

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
                    <strong>{passedInspections}</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-green"
                        style={{ width: `${passedRate}%` }}
                    ></div>
                    </div>

                </div>


                <div className="qa-outcome-item">

                    <div className="qa-outcome-header">
                    <span>Rejected</span>
                    <strong>{rejectedInspections}</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-red"
                        style={{ width: `${rejectedRate}%` }}
                    ></div>
                    </div>

                </div>


                <div className="qa-outcome-item">

                    <div className="qa-outcome-header">
                    <span>Recheck</span>
                    <strong>{recheckInspections}</strong>
                    </div>

                    <div className="qa-outcome-progress">
                    <div
                        className="qa-outcome-fill qa-outcome-yellow"
                        style={{ width: `${recheckRate}%` }}
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
                    {productQualityPerformance.length > 0 ? (
                        productQualityPerformance.map((product) => (
                        <tr key={product.product}>
                            <td>{product.product}</td>

                            <td>{product.inspected}</td>

                            <td>{product.passed}</td>

                            <td>{product.rejected}</td>

                            <td>{product.recheck}</td>

                            <td>
                            <span
                                className={`qa-status ${
                                product.issues >= 5
                                    ? "qa-red-status"
                                    : product.issues >= 2
                                    ? "qa-yellow-status"
                                    : "qa-blue-status"
                                }`}
                            >
                                {product.issues}
                            </span>
                            </td>

                            <td>{product.passRate.toFixed(1)}%</td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="7">
                            No product quality data available.
                        </td>
                        </tr>
                    )}
                    </tbody>

            </table>

            </div>


            {/* TOP PROBLEMATIC PRODUCTS */}

            <div className="qa-panel">

  <div className="qa-section-header">

    <div>
      <h3>Top Problematic Products</h3>

      <p className="qa-section-subtitle">
        Products with the highest number of QC and delivery issues
      </p>
    </div>

    <select
      value={topProductLimit}
      onChange={(e) =>
        setTopProductLimit(Number(e.target.value))
      }
    >
      <option value={3}>Top 3</option>
      <option value={5}>Top 5</option>
      <option value={10}>Top 10</option>
    </select>

  </div>


  <div className="qa-problem-ranking">

    {topProblematicProducts.length > 0 ? (

      topProblematicProducts.map((product, index) => (

        <div
          className="qa-problem-ranking-item"
          key={product.product}
        >

          <div className="qa-problem-rank">
            {index + 1}
          </div>

          <div className="qa-problem-product-detail">

            <strong>
              {product.product}
            </strong>

            <span>
              Main issue: {product.mainIssue}
            </span>

            <small>
              QC: {product.qcIssues}
              {" | "}
              Delivery: {product.deliveryIssues}
            </small>

          </div>

          <span
            className={`qa-status ${
              index === 0
                ? "qa-red-status"
                : index <= 2
                ? "qa-yellow-status"
                : "qa-blue-status"
            }`}
          >
            {product.totalIssues} Issues
          </span>

        </div>

      ))

    ) : (

      <p className="qa-section-subtitle">
        No problematic products detected.
      </p>

    )}

  </div>

</div>

{/* ALL PRODUCT ISSUE RANKING */}

<div className="qa-panel">

  <div className="qa-section-header">
    <div>
      <h3>All Product Issue Ranking</h3>

      <p className="qa-section-subtitle">
        Ranking of all products from highest to lowest number of quality issues
      </p>
    </div>
  </div>

  <div className="qa-product-ranking-chart">

    {allProductIssueRanking.map((product, index) => {

      const maxIssues =
        allProductIssueRanking[0]?.totalIssues || 1;

      const qcWidth =
        (product.qcIssues / maxIssues) * 100;

      const deliveryWidth =
        (product.deliveryIssues / maxIssues) * 100;


      return (
        <div
          className="qa-product-ranking-row"
          key={product.product}
        >

          <div className="qa-product-ranking-label">
            <span className="qa-product-ranking-number">
              {index + 1}
            </span>

            <span className="qa-product-ranking-name">
              {product.product}
            </span>
          </div>

          <div className="qa-product-ranking-bar-area">

            <div className="qa-product-ranking-track">

              <div
                className="qa-product-ranking-qc"
                style={{ width: `${qcWidth}%` }}
              ></div>

              <div
                className="qa-product-ranking-delivery"
                style={{ width: `${deliveryWidth}%` }}
              ></div>

            </div>

            <div className="qa-product-ranking-count">
              {product.totalIssues}
            </div>

          </div>

        </div>
      );
    })}

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
                    <p>Total Quality Issues</p>
                    <h2>{totalQualityIssues}</h2>

                    <span className="qa-red">
                    QC + Delivery issues
                    </span>
                </div>

                <div className="qa-card">
                    <p>QC Issues</p>
                    <h2>{qcIssueOrders.length}</h2>

                    <span className="qa-pink">
                    Inspection related
                    </span>
                </div>

                <div className="qa-card">
                    <p>Delivery Issues</p>
                    <h2>{deliveryIssueOrders.length}</h2>

                    <span className="qa-yellow">
                    Delivery related
                    </span>
                </div>

                <div className="qa-card">
                    <p>Products Affected</p>
                    <h2>{affectedProducts}</h2>

                    <span className="qa-blue">
                    Products with issues
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
                <h2>{totalRecurringIssues}</h2>

                <span className="qa-red">
                Repeated quality issues
                </span>
            </div>


            <div className="qa-card">
                <p>High Severity</p>
                <h2>{highSeverityRecurring}</h2>

                <span className="qa-red">
                Immediate attention
                </span>
            </div>


            <div className="qa-card">
                <p>Medium Severity</p>
                <h2>{mediumSeverityRecurring}</h2>

                <span className="qa-yellow">
                Needs monitoring
                </span>
            </div>


            <div className="qa-card">
                <p>Low Severity</p>
                <h2>{lowSeverityRecurring}</h2>

                <span className="qa-blue">
                Lower risk issues
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
                    {recurringIssues.length > 0 ? (
                        recurringIssues.map((item, index) => (
                        <tr key={`${item.product}-${item.issue}`}>

                            <td>
                            {`RI${String(index + 1).padStart(3, "0")}`}
                            </td>

                            <td>{item.product}</td>

                            <td>{item.issue}</td>

                            <td>{item.cases}</td>

                            <td>
                            <span className="qa-trend-stable">
                                Recurring
                            </span>
                            </td>

                            <td>
                            <span
                                className={`qa-status ${
                                item.severity === "High"
                                    ? "qa-red-status"
                                    : item.severity === "Medium"
                                    ? "qa-yellow-status"
                                    : "qa-blue-status"
                                }`}
                            >
                                {item.severity}
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
                                    issueId: `RI${String(index + 1).padStart(3, "0")}`,
                                    product: item.product,
                                    issue: item.issue,
                                    cases: item.cases,
                                    trend: "Recurring",
                                    severity: item.severity,
                                });

                                setActivePage("corrective");
                                }}
                            >
                                Investigate
                            </button>
                            </td>

                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="8">
                            No recurring quality issues detected.
                        </td>
                        </tr>
                    )}
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

            <div className="qa-summary-grid">

                <div className="qa-card">
                    <p>Total Actions</p>
                    <h2>{correctiveActions.length}</h2>

                    <span className="qa-pink">
                    All corrective actions
                    </span>
                </div>


                <div className="qa-card">
                    <p>Open</p>
                    <h2>{openCorrectiveActions}</h2>

                    <span className="qa-red">
                    Require action
                    </span>
                </div>


                <div className="qa-card">
                    <p>In Progress</p>
                    <h2>{inProgressCorrectiveActions}</h2>

                    <span className="qa-yellow">
                    Currently being handled
                    </span>
                </div>


                <div className="qa-card">
                    <p>Completed</p>
                    <h2>{completedCorrectiveActions}</h2>

                    <span className="qa-green">
                    Action completed
                    </span>
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
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        ></textarea>
                    </div>


                    <div className="qa-form-group qa-form-full">
                    <label>Corrective Action</label>

                    <textarea
                        placeholder="Describe the corrective action to be taken..."
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        ></textarea>
                    </div>


                    <div className="qa-form-group">
                    <label>Assigned To</label>

                    <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        >
                        <option value="">Select responsible person</option>
                        <option value="Operator 01">Operator 01</option>
                        <option value="Operator 02">Operator 02</option>
                        <option value="Operator 03">Operator 03</option>
                        <option value="QA Team">QA Team</option>
                        </select>
                    </div>


                    <div className="qa-form-group">
                    <label>Target Date</label>

                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>


                    <div className="qa-form-group">
                    <label>Priority</label>

                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                        </select>
                    </div>


                    <div className="qa-form-group">
                    <label>Status</label>

                    <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value)}
                        >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        </select>
                    </div>


                    <div className="qa-form-group qa-form-full">
                    <label>Remarks</label>

                    <textarea
                        placeholder="Add investigation notes or additional remarks..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
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

                    <button
                        className="qa-save-btn"
                        onClick={handleSaveCorrectiveAction}
                        >
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
                    {correctiveActions.length > 0 ? (
                        correctiveActions.map((action, index) => (
                        <tr key={action.id}>
                            <td>{`CA${String(index + 1).padStart(3, "0")}`}</td>

                            <td>{action.issueId || "-"}</td>

                            <td>{action.product || "-"}</td>

                            <td>{action.correctiveAction || "-"}</td>

                            <td>{action.assignedTo || "-"}</td>

                            <td>
                            <span
                                className={`qa-status ${
                                action.status === "Completed"
                                    ? "qa-green-status"
                                    : action.status === "In Progress"
                                    ? "qa-yellow-status"
                                    : "qa-red-status"
                                }`}
                            >
                                {action.status || "Open"}
                            </span>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="6">
                            No corrective actions recorded.
                        </td>
                        </tr>
                    )}
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