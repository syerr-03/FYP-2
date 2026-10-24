import { useState, useEffect, useRef } from "react";
import "./QCDashboard.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
  addDoc,
  setDoc,
} from "firebase/firestore";

function QCDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [productChecklists, setProductChecklists] = useState({});
  const [productInspectionResults, setProductInspectionResults] = useState({});
  const inspectionFormRef = useRef(null);
  const [inspectionStatuses, setInspectionStatuses] = useState({});
  const [qcOrders, setQcOrders] = useState([]);
  const [pendingSearch, setPendingSearch] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [resultStatusFilter, setResultStatusFilter] = useState("All");
  const [pendingStatusFilter, setPendingStatusFilter] = useState("All");
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState({
    correctProduct: false,
    correctQuantity: false,
    productConditionGood: false,
    packagingGood: false,
    expiryDateValid: false,
  });

const [recheckNote, setRecheckNote] = useState("");
const [showRejectReason, setShowRejectReason] = useState(false);
const [inspectionResults, setInspectionResults] = useState([]);
const [qualityHistory, setQualityHistory] = useState([]);
const [showRecurringDetails, setShowRecurringDetails] = useState(false);
const [historySearch, setHistorySearch] = useState("");
const [historyResultFilter, setHistoryResultFilter] = useState("All");
const [historyIssueFilter, setHistoryIssueFilter] = useState("All");
const emptyProductChecklist = () => ({
  correctProduct: false,
  correctQuantity: false,
  productConditionGood: false,
  packagingGood: false,
  expiryDateValid: false,
});

const updateProductChecklist = (field, checked) => {
  setProductChecklists((prev) => ({
    ...prev,
    [selectedProductIndex]: {
      ...(prev[selectedProductIndex] || emptyProductChecklist()),
      [field]: checked,
    },
  }));

  setProductInspectionResults((prev) => {
    const updated = { ...prev };
    delete updated[selectedProductIndex];
    return updated;
  });
};

const currentProductChecklist =
  productChecklists[selectedProductIndex] ||
  emptyProductChecklist();

const currentProduct =
  selectedInspection?.items?.[selectedProductIndex] || null;
 
 const saveProductInspection = (result) => {
  if (!currentProduct) return;

  const checklist = currentProductChecklist;

  if (
    result === "Passed" &&
    !Object.values(checklist).every(Boolean)
  ) {
    alert("Please complete all checklist items before passing this product.");
    return;
  }

  setProductInspectionResults((prev) => ({
    ...prev,
    [selectedProductIndex]: {
      productName: currentProduct.Product_Name,
      quantity: currentProduct.Quantity,
      result,
      checklist,
      rejectionReasons,
    },
  }));
}; 

const getProductRejectionReasons = (checklist) => {
  const reasons = [];

  if (!checklist.correctProduct) {
    reasons.push("Wrong Product");
  }

  if (!checklist.correctQuantity) {
    reasons.push("Quantity Mismatch");
  }

  if (!checklist.productConditionGood) {
    reasons.push("Product Damaged");
  }

  if (!checklist.packagingGood) {
    reasons.push("Damaged Packaging");
  }

  if (!checklist.expiryDateValid) {
    reasons.push("Expiry Issue");
  }

  return reasons;
};

const handleContinueProduct = () => {
  if (!selectedInspection) return;

  const totalProducts = selectedInspection.items.length;

  const checklist = {
    ...currentProductChecklist,
  };

  const allPassed = Object.values(checklist).every(
    (value) => value === true
  );

  const result = allPassed ? "Passed" : "Rejected";

  const rejectionReasons = allPassed
  ? []
  : getProductRejectionReasons(checklist);

  
  const updatedResults = {
    ...productInspectionResults,
    [selectedProductIndex]: {
      productName: currentProduct.Product_Name,
      quantity: currentProduct.Quantity,
      result,
      checklist,
      rejectionReasons,
    },
  };


  setProductInspectionResults(updatedResults);

  if (selectedProductIndex < totalProducts - 1) {
    setSelectedProductIndex(selectedProductIndex + 1);
  }
};

const rejectedProducts = Object.values(
  productInspectionResults
).filter((item) => item.result === "Rejected");


useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "orders"),

    (querySnapshot) => {
      const orders = querySnapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter(
          (order) =>
            order.Order_Status === "Waiting QC" &&
            ["Pending", "Inspecting", "Recheck"].includes(
              order.QC_Status
            )
        );

      setQcOrders(orders);
    },

    (error) => {
      console.error("Error listening to QC orders:", error);
    }
  );

  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "qc_inspections"),
    (snapshot) => {
      const results = snapshot.docs.map((document) => {
        const record = document.data();

        return {
          id: document.id,
          orderId: record.Order_ID || "-",
          customer: record.Customer_Name || "-",

          product: (record.items || [])
            .map((item) => item.Product_Name || "-")
            .join(", "),

          qty: (record.items || []).reduce(
            (total, item) => total + Number(item.Quantity || 0),
            0
          ),

          result: record.QC_Result || "-",
          inspectedAt: record.QC_Inspected_At || "-",

          remarks:
            record.QC_Reject_Note ||
            (record.QC_Result === "Passed"
              ? "All quality checks passed"
              : record.QC_Result === "Passed (After Reject)"
              ? "Issue corrected after rejection"
              : record.QC_Result === "Passed (After Recheck)"
              ? "Issue corrected after recheck"
              : "-"),
        };
      });

      setInspectionResults(results);
    },
    (error) => {
      console.error("Error loading QC inspection history:", error);
    }
  );

  return () => unsubscribe();
}, []);


useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "qc_inspections"),
    (snapshot) => {
      const history = snapshot.docs.map((document) => {
        const record = document.data();
        const result = record.QC_Result || "-";

        const qualityIssue =
          result === "Rejected" || result === "Recheck"
            ? record.QC_Reject_Note || "-"
            : result === "Passed"
            ? "No Issue"
            : "Issue Corrected";

        return {
          id: document.id,
          date: record.QC_Inspected_At || "-",
          orderId: record.Order_ID || "-",
          rejectedProducts: record.QC_Rejected_Products || [],
          productInspections: record.QC_Product_Inspections || [],

          product: (record.items || [])
            .map((item) => item.Product_Name || "-")
            .join(", "),

          operator: "Operator 01",
          result,
          qualityIssue,
          inspector: record.Inspector || "QC 01",
        };
      });

      setQualityHistory(history);
    },
    (error) => {
      console.error("Error loading Quality History:", error);
    }
  );

  return () => unsubscribe();
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
    record.result === "Rejected" ||
    record.result === "Recheck"
).length;


const recurringIssueData = {};

qualityHistory
  .filter((record) => record.result === "Rejected")
  .forEach((record) => {
    const failedProducts = (record.productInspections || [])
      .filter((product) => product.result === "Rejected");

    failedProducts.forEach((product) => {
      const name = product.productName;
      if (!name) return;

      const checklist = product.checklist || {};
      const reasons = [];

      if (checklist.correctProduct === false)
        reasons.push("Wrong Product");
      if (checklist.correctQuantity === false)
        reasons.push("Quantity Mismatch");
      if (checklist.productConditionGood === false)
        reasons.push("Product Damaged");
      if (checklist.packagingGood === false)
        reasons.push("Damaged Packaging");
      if (checklist.expiryDateValid === false)
        reasons.push("Expiry Issue");

      if (reasons.length === 0) {
        reasons.push(...(product.rejectionReasons || []));
      }

      reasons.forEach((reason) => {
        const key = JSON.stringify([name, reason]);

        if (!recurringIssueData[key]) {
          recurringIssueData[key] = {
            productName: name,
            issue: reason,
            orderIds: new Set(),
          };
        }

        recurringIssueData[key].orderIds.add(record.orderId);
      });
    });

    (record.rejectedProducts || []).forEach((product) => {
      const name = product.Product_Name;
      if (!name) return;

      const hasInspection = failedProducts.some(
        (item) => item.productName === name
      );

      if (hasInspection) return;

      (product.Rejection_Reasons || []).forEach((reason) => {
        const key = JSON.stringify([name, reason]);

        if (!recurringIssueData[key]) {
          recurringIssueData[key] = {
            productName: name,
            issue: reason,
            orderIds: new Set(),
          };
        }

        recurringIssueData[key].orderIds.add(record.orderId);
      });
    });
  });

const recurringIssueList = Object.values(recurringIssueData)
  .filter((item) => item.orderIds.size >= 2)
  .map((item) => ({
    productName: item.productName,
    issue: item.issue,
    count: item.orderIds.size,
  }))
  .sort((a, b) => b.count - a.count);

const recurringIssues = recurringIssueList.length;



const productIssueCounts = qualityHistory.reduce((acc, record) => {
  if (record.result !== "Rejected") return acc;

  (record.rejectedProducts || []).forEach((product) => {
    const productName = product.Product_Name;

    if (!productName) return;

    if (!acc[productName]) {
      acc[productName] = {
        count: 0,
        issues: {},
        rejectedCount: 0,
        passedAfterRecheckCount: 0,
      };
    }

    acc[productName].count += 1;
    acc[productName].rejectedCount += 1;

    const inspection = (record.productInspections || []).find(
      (item) => item.productName === productName
    );

    const checklist = inspection?.checklist;
    const reasons = [];

    if (checklist) {
      if (checklist.correctProduct === false)
        reasons.push("Wrong Product");

      if (checklist.correctQuantity === false)
        reasons.push("Quantity Mismatch");

      if (checklist.productConditionGood === false)
        reasons.push("Product Damaged");

      if (checklist.packagingGood === false)
        reasons.push("Damaged Packaging");

      if (checklist.expiryDateValid === false)
        reasons.push("Expiry Issue");
    }

    const finalReasons =
      reasons.length > 0
        ? reasons
        : product.Rejection_Reasons || [];

    finalReasons.forEach((reason) => {
      acc[productName].issues[reason] =
        (acc[productName].issues[reason] || 0) + 1;
    });
  });

  return acc;
}, {});

const highestIssueCount = Math.max(
  0,
  ...Object.values(productIssueCounts).map((product) => product.count)
);

const mostProblematicProducts = Object.entries(productIssueCounts)
  .filter(([, data]) => data.count === highestIssueCount)
  .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

const mostProblematicProductCount = highestIssueCount;

const mostCommonIssue = (() => {
  const issues = {};

  mostProblematicProducts.forEach(([, data]) => {
    Object.entries(data.issues).forEach(([reason, count]) => {
      issues[reason] = (issues[reason] || 0) + count;
    });
  });

  return (
    Object.entries(issues).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
  );
})();

const mostProblematicRejectedCount = new Set(
  qualityHistory
    .filter(
      (record) =>
        record.result === "Rejected" &&
        (record.rejectedProducts || []).some((product) =>
          mostProblematicProducts.some(
            ([name]) => name === product.Product_Name
          )
        )
    )
    .map((record) => record.orderId)
).size;

const mostProblematicRecheckPassedCount = qualityHistory.filter(
  (record) =>
    record.result === "Passed (After Recheck)" &&
    mostProblematicProducts.some(([name]) =>
      record.product.split(", ").includes(name)
    )
).length;



const commonIssueCounts = qualityHistory.reduce((acc, record) => {
  if (record.result !== "Rejected") return acc;

  const orderReasons = new Set();

  const getReasonsFromChecklist = (checklist) => {
    if (!checklist) return [];

    const reasons = [];

    if (checklist.correctProduct === false)
      reasons.push("Wrong Product");

    if (checklist.correctQuantity === false)
      reasons.push("Quantity Mismatch");

    if (checklist.productConditionGood === false)
      reasons.push("Product Damaged");

    if (checklist.packagingGood === false)
      reasons.push("Damaged Packaging");

    if (checklist.expiryDateValid === false)
      reasons.push("Expiry Issue");

    return reasons;
  };

  // Baca semua produk Rejected dalam inspection
  const failedInspections = (record.productInspections || [])
    .filter((product) => product.result === "Rejected");

  failedInspections.forEach((product) => {
    const reasons = getReasonsFromChecklist(product.checklist);

    const finalReasons = reasons.length > 0
      ? reasons
      : product.rejectionReasons || [];

    finalReasons.forEach((reason) => orderReasons.add(reason));
  });

  // Sokong rekod lama yang ada QC_Rejected_Products
  (record.rejectedProducts || []).forEach((product) => {
    const inspection = (record.productInspections || []).find(
      (item) => item.productName === product.Product_Name
    );

    const reasons = inspection
      ? getReasonsFromChecklist(inspection.checklist)
      : [];

    const finalReasons = reasons.length > 0
      ? reasons
      : product.Rejection_Reasons || [];

    finalReasons.forEach((reason) => orderReasons.add(reason));
  });

  // Setiap jenis masalah dikira sekali bagi setiap order
  orderReasons.forEach((reason) => {
    acc[reason] = (acc[reason] || 0) + 1;
  });

  return acc;
}, {});

const getQualityIssueReasons = (record) => {
  const reasons = new Set();

  (record.productInspections || [])
    .filter((product) => product.result === "Rejected")
    .forEach((product) => {
      const checklist = product.checklist || {};

      if (checklist.correctProduct === false)
        reasons.add("Wrong Product");

      if (checklist.correctQuantity === false)
        reasons.add("Quantity Mismatch");

      if (checklist.productConditionGood === false)
        reasons.add("Product Damaged");

      if (checklist.packagingGood === false)
        reasons.add("Damaged Packaging");

      if (checklist.expiryDateValid === false)
        reasons.add("Expiry Issue");

      (product.rejectionReasons || []).forEach((reason) =>
        reasons.add(reason)
      );
    });

  (record.rejectedProducts || []).forEach((product) => {
    (product.Rejection_Reasons || []).forEach((reason) =>
      reasons.add(reason)
    );
  });

  return [...reasons];
};

const getQualityIssueDisplay = (record) => {
  if (record.result === "Passed") return "No Issue";

  let reasons = getQualityIssueReasons(record);

  // Untuk Passed After Recheck, baca rekod Rejected terdahulu
  if (record.result === "Passed (After Recheck)") {
    reasons = [
      ...new Set(
        qualityHistory
          .filter(
            (previous) =>
              previous.orderId === record.orderId &&
              previous.result === "Rejected" &&
              new Date(previous.date).getTime() <
                new Date(record.date).getTime()
          )
          .flatMap(getQualityIssueReasons)
      ),
    ];
  }

  return reasons.length > 0
    ? reasons.join(", ")
    : "Reason not recorded";
};



const filteredQualityHistory = qualityHistory.filter((record) => {
  if (!["Passed", "Rejected", "Passed (After Recheck)"].includes(record.result)) {
  return false;
}
  const issueReasons = new Set();

  (record.productInspections || [])
    .filter((product) => product.result === "Rejected")
    .forEach((product) => {
      const checklist = product.checklist || {};

      if (checklist.correctProduct === false)
        issueReasons.add("Wrong Product");

      if (checklist.correctQuantity === false)
        issueReasons.add("Quantity Mismatch");

      if (checklist.productConditionGood === false)
        issueReasons.add("Product Damaged");

      if (checklist.packagingGood === false)
        issueReasons.add("Damaged Packaging");

      if (checklist.expiryDateValid === false)
        issueReasons.add("Expiry Issue");

      (product.rejectionReasons || []).forEach((reason) =>
        issueReasons.add(reason)
      );
    });

  (record.rejectedProducts || []).forEach((product) => {
    (product.Rejection_Reasons || []).forEach((reason) =>
      issueReasons.add(reason)
    );
  });

  const qualityIssue = String(record.qualityIssue || "");

  const searchText = historySearch.trim().toLowerCase();

  const matchesSearch =
    String(record.orderId || "").toLowerCase().includes(searchText) ||
    String(record.product || "").toLowerCase().includes(searchText) ||
    qualityIssue.toLowerCase().includes(searchText) ||
    [...issueReasons].some((reason) =>
      reason.toLowerCase().includes(searchText)
    );

  const matchesResult =
    historyResultFilter === "All" ||
    record.result === historyResultFilter;

  const matchesIssue =
    historyIssueFilter === "All" ||
    (historyIssueFilter === "No Issue"
      ? record.result === "Passed" || qualityIssue === "No Issue"
      : issueReasons.has(historyIssueFilter) ||
        qualityIssue.toLowerCase().includes(
          historyIssueFilter.toLowerCase()
        ));

  return matchesSearch && matchesResult && matchesIssue;
});




const waitingInspectionCount = qcOrders.filter(
  (order) => order.QC_Status === "Pending"
).length;

const inspectingCount = qcOrders.filter(
  (order) => order.QC_Status === "Inspecting"
).length;

const recheckRequiredCount = qcOrders.filter(
  (order) => order.QC_Status === "Recheck"
).length;

const priorityOrders = qcOrders.filter((order) => {
  // Recheck sent by Operator = urgent
  if (order.QC_Status === "Recheck") {
    return true;
  }

  // Only pending orders can become overdue
  if (
    order.QC_Status !== "Pending" ||
    !order.Sent_To_QC_At
  ) {
    return false;
  }

  const sentTime = new Date(order.Sent_To_QC_At).getTime();

  if (Number.isNaN(sentTime)) {
    return false;
  }

  const waitingHours =
    (Date.now() - sentTime) / (1000 * 60 * 60);

  return waitingHours >= 48;
});

const priorityInspectionCount = priorityOrders.length;

const filteredQCOrders = qcOrders.filter((order) => {
  const searchText = pendingSearch.toLowerCase();

  const productNames = (order.items || [])
    .map((item) => item.Product_Name || "")
    .join(" ")
    .toLowerCase();

  const matchesSearch =
  String(order.Order_ID || "")
    .toLowerCase()
    .includes(searchText) ||
  String(order.Customer_Name || order.Customer || "")
    .toLowerCase()
    .includes(searchText) ||
  productNames.includes(searchText);

const matchesStatus =
  pendingStatusFilter === "All" ||
  order.QC_Status === pendingStatusFilter;

const matchesPriority =
  !showPriorityOnly ||
  priorityOrders.some(
    (priorityOrder) =>
      priorityOrder.Order_ID === order.Order_ID
  );

return matchesSearch && matchesStatus && matchesPriority;
});

useEffect(() => {
  if (selectedInspection && inspectionFormRef.current) {
    inspectionFormRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [selectedInspection]);

const totalInspectionResults = inspectionResults.length;

const passedInspectionResults = inspectionResults.filter(
  (result) =>
    result.result === "Passed" ||
    result.result === "Passed (After Recheck)"
).length;

const rejectedInspectionResults = inspectionResults.filter(
  (result) => result.result === "Rejected"
).length;

const recheckInspectionResults = inspectionResults.filter(
  (result) => result.result === "Recheck"
).length;

const filteredInspectionResults = inspectionResults.filter((result) => {
  const searchText = resultSearch.trim().toLowerCase();

  const matchesSearch =
    String(result.orderId || "").toLowerCase().includes(searchText) ||
    String(result.customer || "").toLowerCase().includes(searchText) ||
    String(result.product || "").toLowerCase().includes(searchText);

  const matchesStatus =
    resultStatusFilter === "All" ||
    result.result === resultStatusFilter;

  return matchesSearch && matchesStatus;
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
        ><h2>Logout</h2>
          
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
                  </tr>
                </thead>

                <tbody>
                  {[...qcOrders]
                    .sort(
                      (a, b) =>
                        new Date(a.Sent_To_QC_At || 0) -
                        new Date(b.Sent_To_QC_At || 0)
                    )
                    .map((order) => (
                      <tr key={order.Order_ID}>
                        <td>{order.Order_ID}</td>

                        <td>{order.Customer_Name || order.Customer || "-"}</td>

                        <td>
                          {(order.items || []).map((item, index) => (
                            <div key={index} style={{ marginBottom: "8px" }}>
                              {item.Product_Name || "-"}
                            </div>
                          ))}
                        </td>

                        <td>
                          {(order.items || []).map((item, index) => (
                            <div key={index} style={{ marginBottom: "8px" }}>
                              {item.Quantity || 0}
                            </div>
                          ))}
                        </td>

                        <td>Operator 01</td>

                        <td>
                          <span className="qc-status qc-yellow-status">
                            {order.QC_Status === "Pending"
                              ? "Waiting QC"
                              : order.QC_Status === "Recheck"
                              ? "Recheck Required"
                              : order.QC_Status}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {qcOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No pending inspections.
                      </td>
                    </tr>
                  )}
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
                <h2>{waitingInspectionCount}</h2>

                <span className="qc-pink">
                  Pending QC
                </span>
              </div>


              <div className="qc-card">
                <p>Inspecting</p>
                <h2>{inspectingCount}</h2>

                <span className="qc-blue">
                  In progress
                </span>
              </div>


              <div className="qc-card">
                <p>Recheck Required</p>
                <h2>{recheckRequiredCount}</h2>

                <span className="qc-yellow">
                  Needs reinspection
                </span>
              </div>


              <div
                className="qc-card"
                onClick={() => {
                  setShowPriorityOnly((prev) => !prev);
                  setPendingSearch("");
                  setPendingStatusFilter("All");
                }}
                style={{
                  cursor: "pointer",
                  outline: showPriorityOnly ? "2px solid #d62c87" : "none",
                }}
              >
                <p>Priority Inspection</p>
                <h2>{priorityInspectionCount}</h2>

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
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                />

                <select
                  value={pendingStatusFilter}
                  onChange={(e) => setPendingStatusFilter(e.target.value)}
                >
                  <option value="All">All Inspection Status</option>
                  <option value="Pending">Waiting QC</option>
                  <option value="Inspecting">Inspecting</option>
                  <option value="Recheck">Recheck</option>
                </select>

              </div>


              <table>

                <thead>

                  <tr>
                    <th>Sent to QC</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Operator</th>
                    <th>Inspection Status</th>

                    {showPriorityOnly && (
                      <th>Priority Reason</th>
                    )}

                    <th>Action</th>
                  </tr>

                </thead>


                <tbody>
                  {[...filteredQCOrders]
                    .sort(
                      (a, b) =>
                        new Date(a.Sent_To_QC_At || 0) -
                        new Date(b.Sent_To_QC_At || 0)
                    )
                    .map((order) => (
                      <tr key={order.Order_ID}>

                        <td>
                          {order.Sent_To_QC_At
                            ? new Date(order.Sent_To_QC_At).toLocaleString("en-GB")
                            : "-"}
                        </td>

                        <td>{order.Order_ID}</td>

                      <td>
                        {order.Customer_Name || order.Customer || "-"}
                      </td>

                      <td>
                        {(order.items || []).map((item, index) => (
                          <div
                            key={index}
                            style={{ marginBottom: "8px" }}
                          >
                            {item.Product_Name || "-"}
                          </div>
                        ))}
                      </td>

                      <td>
                        {(order.items || []).map((item, index) => (
                          <div
                            key={index}
                            style={{ marginBottom: "8px" }}
                          >
                            {item.Quantity || 0}
                          </div>
                        ))}
                      </td>

                      <td>Operator 01</td>

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

                      {showPriorityOnly && (
                        <td>
                          {order.QC_Status === "Recheck" ? (
                            <span className="qc-status qc-red-status">
                              Recheck Required
                            </span>
                          ) : (
                            <span className="qc-status qc-yellow-status">
                              Overdue - 48 Hours
                            </span>
                          )}
                        </td>
                      )}

                      <td>
                        <button
                          className="qc-action-btn"
                          onClick={async () => {
                            try {
                              const isRecheck = order.QC_Status === "Recheck";
                              setSelectedProductIndex(0);

                              if (isRecheck && Array.isArray(order.QC_Checklist)) {
                                const previousChecklists = {};

                                order.QC_Checklist.forEach((checklist, index) => {
                                  previousChecklists[index] = {
                                    ...emptyProductChecklist(),
                                    ...checklist,
                                  };
                                });

                                setProductChecklists(previousChecklists);
                              } else {
                                setProductChecklists({});
                              }

                              setProductInspectionResults({});
                              setShowRejectReason(false);

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

                                setRecheckNote("");
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
                                items: order.items || [],

                                operator: "Operator 01",

                                isRecheck: isRecheck,

                                previousOutcome:
                                  order.QC_Previous_Outcome ||
                                  (order.QC_Rejected_At ? "Rejected" : null),

                                previousRecheckNote:
                                  order.QC_Recheck_Note || "",

                                previousRejectedProducts:
                                 order.QC_Rejected_Products || [], 
                                previousRejectReason:
                                 order.QC_Reject_Note || "",
                                operatorCorrectionNote:
                                 order.Operator_Correction_Note || "",
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
          <div
            ref={inspectionFormRef}
            className="qc-panel qc-inspection-panel"
          >

            <div className="qc-section-header">

              <div>
                <h3>Inspection Checklist</h3>

                <p className="qc-section-subtitle">
                  Complete the quality inspection for this order
                </p>
              </div>

              <button
                className="qc-close-btn"
                onClick={() => {
                  setSelectedInspection(null);
                  setShowRejectReason(false);
                }}
              >
                Close
              </button>

            </div>


    {/* ORDER INFORMATION */}

    {(selectedInspection.items || []).length > 1 && (
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Select Product to Inspect
        </label>

        <select
          value={selectedProductIndex}
          onChange={(e) =>
            setSelectedProductIndex(Number(e.target.value))
          }
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          {(selectedInspection.items || []).map((item, index) => (
            <option key={index} value={index}>
              {item.Product_Name || "Unknown Product"}
            </option>
          ))}
        </select>
      </div>
    )}
    
    <div className="qc-inspection-info">

      <div>
        <span>Order ID</span>
        <strong>{selectedInspection.orderId}</strong>
      </div>

      <div>
        <span>Customer</span>
        <strong>{selectedInspection.customer}</strong>
      </div>

      <div className="qc-inspection-products">
        <div className="qc-products-header">
          <span>Product</span>
          <span>Qty</span>
        </div>

        {(selectedInspection.items || []).map((item, index) => (
          <div className="qc-products-row" key={index}>
            <span>{item.Product_Name || "-"}</span>
            <strong>{item.Quantity || 0}</strong>
          </div>
        ))}
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

    {selectedInspection.isRecheck &&
      selectedInspection.previousRejectedProducts?.length > 0 && (
        <div className="qc-previous-recheck-note">
          <strong>Previously Rejected Products</strong>

          {selectedInspection.previousRejectedProducts.map((product, index) => (
            <p key={index}>
              {product.Product_Name} — Qty: {product.Quantity}
            </p>
          ))}
        </div>
      )}

      {selectedInspection.isRecheck && (
        <div className="qc-previous-recheck-note">
          <strong>Operator Correction Note</strong>

          <p>
            {selectedInspection.operatorCorrectionNote ||
              "No correction note provided."}
          </p>
        </div>
      )}

      {selectedInspection.isRecheck && (
        <div className="qc-previous-recheck-note">
          <strong>Previous Rejection Reason</strong>

          <p>
            {selectedInspection.previousRejectReason ||
              "No previous rejection reason recorded."}
          </p>
        </div>
      )}

    {/* CHECKLIST */}

    <div className="qc-checklist-grid">
      {[
        ["correctProduct", "Correct Product"],
        ["correctQuantity", "Correct Quantity"],
        ["productConditionGood", "Product Condition Good"],
        ["packagingGood", "Packaging Good"],
        ["expiryDateValid", "Expiry Date Valid"],
      ].map(([field, label]) => (
        <label key={field}>
          <input
            type="checkbox"
            checked={
              productChecklists[selectedProductIndex]?.[field] || false
            }
            onChange={(e) =>
              updateProductChecklist(field, e.target.checked)
            }
          />
          <span>{label}</span>
        </label>
      ))}
    </div>

    <div style={{ marginTop: "20px", marginBottom: "20px" }}>

      {/* BUTTON PINK */}
      <button
        type="button"
        className="qc-action-btn"
        onClick={handleContinueProduct}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
        }}
      >
        {selectedProductIndex === selectedInspection.items.length - 1
          ? "Save Last Product"
          : "Continue to Next Product"}
      </button>

      {/* PRODUCT INSPECTION PROGRESS */}
      <p style={{ fontWeight: "600", marginBottom: "12px" }}>
        Product Inspection Progress:{" "}
        {Object.keys(productInspectionResults).length} /{" "}
        {selectedInspection.items.length} Completed
      </p>

      <div style={{ marginBottom: "15px" }}>
        {selectedInspection.items.map((item, index) => {
          const result = productInspectionResults[index]?.result;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                marginBottom: "6px",
                borderRadius: "8px",
                background: "#f9f9f9",
              }}
            >
              <span>{item.Product_Name || "-"}</span>

              <strong
                style={{
                  color:
                    result === "Passed"
                      ? "green"
                      : result === "Rejected"
                      ? "red"
                      : "#999",
                }}
              >
                {result || "Not Inspected"}
              </strong>
            </div>
          );
        })}
      </div>

    </div>

    {/* INSPECTION ACTION */}

    
<div className="qc-inspection-actions">
  <button
    type="button"
    className="qc-pass-btn"
    style={{ width: "100%" }}
    onClick={async () => {
      if (!selectedInspection) return;

      const items = selectedInspection.items || [];

      if (items.length === 0) {
        alert("No products found in this order.");
        return;
      }

      const allProductsInspected = items.every(
        (_, index) => productInspectionResults[index]
      );

      if (!allProductsInspected) {
        alert("Please complete inspection for all products first.");
        return;
      }

      const productResults = items.map(
        (_, index) => productInspectionResults[index]
      );

      const failedProducts = productResults.filter(
        (product) => product.result === "Rejected"
      );

      const hasRejectedProducts = failedProducts.length > 0;

      const finalResult = hasRejectedProducts
        ? "Rejected"
        : selectedInspection.isRecheck
        ? "Passed (After Recheck)"
        : "Passed";

      const inspectedAt = new Date().toISOString();

      const checklistData = productResults.map(
        (product) => product.checklist
      );

      const rejectedProductData = failedProducts.map((product) => ({
        Product_Name: product.productName,
        Quantity: Number(product.quantity || 0),
        Rejection_Reasons: product.rejectionReasons || [],
      }));

      try {
        const orderRef = doc(
          db,
          "orders",
          selectedInspection.orderId
        );

        const inspectionData = {
          Order_ID: selectedInspection.orderId,
          Customer_Name: selectedInspection.customer,
          items,
          QC_Result: finalResult,
          QC_Inspected_At: inspectedAt,
          QC_Reject_Note: hasRejectedProducts
            ? failedProducts
                .map(
                  (product) =>
                    `${product.productName}: ${(product.rejectionReasons || []).join(", ")}`
                )
                .join("; ")
            : "",
          QC_Rejected_Products: rejectedProductData,
          QC_Product_Inspections: productResults,
          QC_Checklist: checklistData,
          Inspector: "QC 01",
        };

        if (hasRejectedProducts) {
          await updateDoc(orderRef, {
            QC_Status: "Rejected",
            QC_Result: "Rejected",
            Order_Status: "Rejected by QC",
            QC_Reject_Note: inspectionData.QC_Reject_Note,
            QC_Rejected_At: inspectedAt,
            QC_Rejected_Products: rejectedProductData,
            QC_Product_Inspections: productResults,
            QC_Checklist: checklistData,
          });
        } else {
          await updateDoc(orderRef, {
            QC_Status: "Approved",
            QC_Result: finalResult,
            Order_Status: "QC Approved",
            Delivery_Status: "Pending Delivery",
            QC_Product_Inspections: productResults,
            QC_Final_Checklist: checklistData,
            QC_Completed_At: inspectedAt,
          });
        }

        await addDoc(
          collection(db, "qc_inspections"),
          inspectionData
        );

        setQcOrders((prevOrders) =>
          prevOrders.filter(
            (order) =>
              order.Order_ID !== selectedInspection.orderId
          )
        );

        setInspectionStatuses((prev) => ({
          ...prev,
          [selectedInspection.orderId]: finalResult,
        }));

        setSelectedInspection(null);
        setRecheckNote("");
        setProductChecklists({});
        setProductInspectionResults({});
        setSelectedProductIndex(0);

        alert(
          hasRejectedProducts
            ? "Order rejected and sent back to Operator."
            : "Order passed QC inspection successfully."
        );
      } catch (error) {
        console.error("Error completing QC inspection:", error);
        alert("Failed to save QC inspection. Please try again.");
      }
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
                <h2>{totalInspectionResults}</h2>
            </div>


            <div className="qc-card">
                <p>Passed</p>
                <h2>{passedInspectionResults}</h2>
            </div>


            <div className="qc-card">
                <p>Rejected</p>
                <h2>{rejectedInspectionResults}</h2>
            </div>


            <div className="qc-card">
                <p>Recheck</p>
                <h2>{recheckInspectionResults}</h2>
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
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
              />

              <select
                value={resultStatusFilter}
                onChange={(e) => setResultStatusFilter(e.target.value)}
              >
                <option value="All">All Results</option>
                <option value="Passed">Passed</option>
                <option value="Passed (After Recheck)">Passed (After Recheck)</option>
                <option value="Rejected">Rejected</option>
                <option value="Recheck">Recheck</option>
              </select>

            </div>

            <table>

                <thead>

                <tr>
                    <th>Inspected At</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Result</th>
                    <th>Remarks</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                  {[...filteredInspectionResults]
                    .sort(
                      (a, b) =>
                        new Date(b.inspectedAt || 0) -
                        new Date(a.inspectedAt || 0)
                    )
                    .map((result, index) => (
                    <tr key={`${result.orderId}-${index}`}>

                      <td>
                        {result.inspectedAt &&
                        !Number.isNaN(new Date(result.inspectedAt).getTime())
                          ? new Date(result.inspectedAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </td>

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

                      <td>{result.remarks}</td>

                      <td>
                        <button className="qc-action-btn">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

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


            
            <div
              className="qc-card"
              onClick={() => setShowRecurringDetails(!showRecurringDetails)}
              style={{ cursor: "pointer" }}
            >
              <p>Recurring Issues</p>
              <h2>{recurringIssues}</h2>

              <span className="qc-yellow">
                {showRecurringDetails ? "Click to close" : "Click to view repeated defects"}
              </span>
            </div>


            </div>

            
            {showRecurringDetails && (
              <div className="qc-panel" style={{ marginBottom: "24px" }}>
                <h3>Recurring Quality Issues</h3>

                <p className="qc-section-subtitle">
                  Products with the same quality issue detected in multiple orders
                </p>

                {recurringIssueList.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Repeated Issue</th>
                        <th>Orders Affected</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recurringIssueList.map((item) => (
                        <tr key={`${item.productName}-${item.issue}`}>
                          <td>{item.productName}</td>
                          <td>{item.issue}</td>
                          <td>{item.count} Orders</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ marginTop: "16px" }}>
                    No recurring quality issues detected.
                  </p>
                )}
              </div>
            )}


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

                    <div className="qc-problem-product-list">
                      {mostProblematicProducts.length > 0 ? (
                        mostProblematicProducts.map(([productName], index) => (
                          <h2 key={productName} style={{ marginBottom: "12px" }}>
                            {mostProblematicProducts.length > 1
                              ? `${index + 1}. ${productName}`
                              : productName}
                          </h2>
                        ))
                      ) : (
                        <h2>No quality issues detected</h2>
                      )}
                    </div>
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
    value={historySearch}
    onChange={(e) => setHistorySearch(e.target.value)}
  />

  <select
    value={historyResultFilter}
    onChange={(e) => setHistoryResultFilter(e.target.value)}
  >
    <option value="All">All Results</option>
    <option value="Passed">Passed</option>
    <option value="Rejected">Rejected</option>
    <option value="Passed (After Recheck)">
      Passed (After Recheck)
    </option>
  </select>

  <select
    value={historyIssueFilter}
    onChange={(e) => setHistoryIssueFilter(e.target.value)}
  >
    <option value="All">All Issue Types</option>
    <option value="Damaged Packaging">Damaged Packaging</option>
    <option value="Quantity Mismatch">Quantity Mismatch</option>
    <option value="Wrong Product">Wrong Product</option>
    <option value="Product Damaged">Product Damaged</option>
    <option value="Expiry Issue">Expiry Issue</option>
    <option value="No Issue">No Issue</option>
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

                  {filteredQualityHistory.length > 0 ? (
                    [...filteredQualityHistory]
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
                              record.result === "Passed"
                                ? "qc-issue-badge qc-issue-ok"
                                : "qc-issue-badge qc-issue-problem"
                            }
                          >
                            {getQualityIssueDisplay(record)}
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
                        No matching quality records found.
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