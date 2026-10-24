import { useState, useEffect } from "react";
import "./QADashboard.css";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

function QADashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("analytics");
  const [recurringSearch, setRecurringSearch] = useState("");
  const [recurringSeverity, setRecurringSeverity] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [qaOrders, setQaOrders] = useState([]);
  const [deliveryIssueHistory, setDeliveryIssueHistory] = useState([]);
  const [qcInspectionResults, setQcInspectionResults] = useState([]);
  const [qaProducts, setQaProducts] = useState([]);
  const [topProductLimit, setTopProductLimit] = useState(3);
  const [rankingLimit, setRankingLimit] = useState("3");
  const [customRankingLimit, setCustomRankingLimit] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("This Month");
  const [analyticsProduct, setAnalyticsProduct] = useState("All Products");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
  
const openCustomDatePopup = () => {
  setTempStartDate(customStartDate);
  setTempEndDate(customEndDate);
  setShowDatePopup(true);
};

const applyCustomDateRange = () => {
  if (!tempStartDate || !tempEndDate) {
    alert("Please select both start and end dates.");
    return;
  }

  if (tempStartDate > tempEndDate) {
    alert("Start date cannot be after end date.");
    return;
  }

  setCustomStartDate(tempStartDate);
  setCustomEndDate(tempEndDate);
  setAnalyticsPeriod("Custom");
  setShowDatePopup(false);
};

const cancelCustomDateRange = () => {
  setShowDatePopup(false);
};

const isWithinAnalyticsPeriod = (dateValue) => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (analyticsPeriod === "This Week") {
    start.setDate(start.getDate() - 6);
  } else if (analyticsPeriod === "This Month") {
    start.setDate(1);
  } else if (analyticsPeriod === "Last 3 Months") {
    start.setMonth(now.getMonth() - 2, 1);
  } else if (analyticsPeriod === "Last 6 Months") {
    start.setMonth(now.getMonth() - 5, 1);
  } else if (analyticsPeriod === "Custom") {
    if (!customStartDate || !customEndDate) return false;

    const customStart = new Date(`${customStartDate}T00:00:00`);
    const customEnd = new Date(`${customEndDate}T23:59:59.999`);

    return date >= customStart && date <= customEnd;
  }

  return date >= start && date <= end;
};


  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [correctiveActions, setCorrectiveActions] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [editingActionId, setEditingActionId] = useState(null);


useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "delivery_issues"),
    (snapshot) => {
      const issues = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setDeliveryIssueHistory(issues);
    },
    (error) => {
      console.error("Error loading delivery issues:", error);
    }
  );

  return () => unsubscribe();
}, []);


  
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "qc_inspections"),
    (snapshot) => {
      const results = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setQcInspectionResults(results);
    },
    (error) => {
      console.error("Error loading QC inspection results:", error);
    }
  );

  return () => unsubscribe();
}, []);


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

    const qcIssueOrders = qcInspectionResults.filter(
      (inspection) =>
        inspection.QC_Result === "Rejected" &&
        isWithinAnalyticsPeriod(inspection.QC_Inspected_At) &&
        (
          analyticsProduct === "All Products" ||
          (inspection.QC_Rejected_Products || []).some(
            (product) =>
              (product.Product_Name || product.productName) === analyticsProduct
          ) ||
          (
            !(inspection.QC_Rejected_Products || []).length &&
            (inspection.QC_Product_Inspections || []).some(
              (product) =>
                product.result === "Rejected" &&
                (product.productName || product.Product_Name) === analyticsProduct
            )
          )
        )
    );

        
    const deliveryIssueOrders = deliveryIssueHistory
      .filter(
        (issue) =>
          isWithinAnalyticsPeriod(issue.Delivery_Issue_At) &&
          (
            analyticsProduct === "All Products" ||
            (issue.items || []).some(
              (item) => item.Product_Name === analyticsProduct
            )
          )
      )
      .map((issue) => ({
        ...issue,
        Delivery_Status: issue.Delivery_Issue_Type,
        Delivery_Updated_At: issue.Delivery_Issue_At,
      }));


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

  const addProductIssue = (productName, source, issueType, dateValue) => {
  const name = productName || "Unknown Product";
  const rawIssue = String(issueType || "Unknown Issue").trim();
  const issue = /^(expired|expiry issue|expired product|expiry date invalid)$/i.test(rawIssue)
    ? "Expiry Issue"
    : rawIssue;

  if (!productIssueMap[name]) {
    productIssueMap[name] = {
      product: name,
      totalIssues: 0,
      qcIssues: 0,
      deliveryIssues: 0,
      issueTypes: {},
      issueDates: {},
    };
  }

  productIssueMap[name].totalIssues += 1;

  if (source === "QC") {
    productIssueMap[name].qcIssues += 1;
  } else {
    productIssueMap[name].deliveryIssues += 1;
  }

  productIssueMap[name].issueTypes[issue] =
    (productIssueMap[name].issueTypes[issue] || 0) + 1;
    const date = dateValue?.toDate?.() || new Date(dateValue || 0);

    if (!isNaN(date.getTime()) && dateValue) {
      const previous = productIssueMap[name].issueDates[issue];
      if (!previous || date > previous) {
        productIssueMap[name].issueDates[issue] = date;
      }
    }
};

// QC: Only count products actually rejected during inspection
  qcIssueOrders.forEach((inspection) => {
    const rejectedProducts = inspection.QC_Rejected_Products || [];

    if (rejectedProducts.length > 0) {
      rejectedProducts.forEach((product) => {
        const reasons = product.Rejection_Reasons || [];
        const productName = product.Product_Name || product.productName;

        if (reasons.length > 0) {
          reasons.forEach((reason) => {
            addProductIssue(
              productName, "QC", reason,
              inspection.QC_Inspected_At || inspection.QC_Rejected_At
            );
          });
        } else {
          addProductIssue(
            productName,
            "QC",
            inspection.QC_Reject_Note || "QC Inspection Issue"
          );
        }
      });
    } else {
      // Support older QC records without QC_Rejected_Products
      const failedProducts = (
        inspection.QC_Product_Inspections || []
      ).filter((product) => product.result === "Rejected");

      failedProducts.forEach((product) => {
        const reasons = product.rejectionReasons || [];

        if (reasons.length > 0) {
          reasons.forEach((reason) => {
            addProductIssue(
              product.productName || product.Product_Name,
              "QC",
              reason
            );
          });
        } else {
          addProductIssue(
            product.productName || product.Product_Name,
            "QC",
            inspection.QC_Reject_Note || "QC Inspection Issue"
          );
        }
      });
    }
  });

// Delivery: Count delivery problems from Operator

deliveryIssueOrders.forEach((issue) => {
  const issueType = issue.Delivery_Issue_Type;

  (issue.items || []).forEach((item) => {
    addProductIssue(
      item.Product_Name,
      "Delivery",
      issueType,
      issue.Delivery_Issue_At
    );
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



const today = new Date();
today.setHours(0, 0, 0, 0);

const toLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getIssueDate = (value) => {
  if (!value) return null;

  const date = value?.toDate
    ? value.toDate()
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const monthlyMode = [
  "Last 3 Months",
  "Last 6 Months",
].includes(analyticsPeriod);

const trendStart = new Date(today);
const trendEnd = new Date(today);

if (analyticsPeriod === "This Week") {
  trendStart.setDate(today.getDate() - 6);
} else if (analyticsPeriod === "This Month") {
  trendStart.setDate(1);
} else if (analyticsPeriod === "Last 3 Months") {
  trendStart.setMonth(today.getMonth() - 2, 1);
} else if (analyticsPeriod === "Last 6 Months") {
  trendStart.setMonth(today.getMonth() - 5, 1);
} else if (analyticsPeriod === "Custom") {
  if (customStartDate && customEndDate) {
    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T00:00:00`);

    if (!Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        start <= end) {
      trendStart.setTime(start.getTime());
      trendEnd.setTime(end.getTime());
    }
  }
}

const trendDifferenceDays = Math.round(
  (trendEnd - trendStart) / 86400000
);

const useMonthlyTrend =
  monthlyMode || trendDifferenceDays > 62;

const trendMap = {};

const makeTrendKey = (date) =>
  useMonthlyTrend
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    : toLocalDate(date);

const cursor = new Date(trendStart);
cursor.setHours(0, 0, 0, 0);

while (cursor <= trendEnd) {
  const key = makeTrendKey(cursor);

  if (!trendMap[key]) {
    trendMap[key] = {
      key,
      date: new Date(cursor),
      total: 0,
      qc: 0,
      delivery: 0,
    };
  }

  if (useMonthlyTrend) {
    cursor.setMonth(cursor.getMonth() + 1, 1);
  } else {
    cursor.setDate(cursor.getDate() + 1);
  }
}

const addTrendIssue = (dateValue, source) => {
  const date = getIssueDate(dateValue);
  if (!date) return;

  const key = makeTrendKey(date);
  const entry = trendMap[key];

  if (!entry) return;

  entry.total += 1;

  if (source === "QC") {
    entry.qc += 1;
  } else {
    entry.delivery += 1;
  }
};

qcIssueOrders.forEach((inspection) => {
  addTrendIssue(
    inspection.QC_Inspected_At || inspection.QC_Rejected_At,
    "QC"
  );
});

deliveryIssueOrders.forEach((issue) => {
  addTrendIssue(
    issue.Delivery_Issue_At || issue.Delivery_Updated_At,
    "Delivery"
  );
});

const qualityTrendData = Object.values(trendMap).sort(
  (a, b) => a.date - b.date
);

const maximumTrendValue = Math.max(
  1,
  ...qualityTrendData.flatMap((item) => [item.qc, item.delivery])
);

const maxVisibleDateLabels = 7;

const shouldShowTrendLabel = (index) => {
  const total = qualityTrendData.length;

  if (total <= maxVisibleDateLabels) return true;

  const positions = new Set(
    Array.from({ length: maxVisibleDateLabels }, (_, i) =>
      Math.round(
        (i * (total - 1)) / (maxVisibleDateLabels - 1)
      )
    )
  );

  return positions.has(index);
};

const trendDateLabel = (date) =>
  date.toLocaleDateString("en-GB", {
    day: useMonthlyTrend ? undefined : "numeric",
    month: "short",
  });

const trendFullDate = (date) =>
  date.toLocaleDateString("en-GB", {
    day: useMonthlyTrend ? undefined : "numeric",
    month: "long",
    year: "numeric",
  });

const filteredQCInspections = qcInspectionResults.filter(
  (inspection) =>
    isWithinAnalyticsPeriod(inspection.QC_Inspected_At) &&
    (
      analyticsProduct === "All Products" ||
      (inspection.items || []).some(
        (item) => item.Product_Name === analyticsProduct
      ) ||
      (inspection.QC_Product_Inspections || []).some(
        (product) =>
          (product.productName || product.Product_Name) === analyticsProduct
      )
    )
);

const passedInspections = filteredQCInspections.filter(
  (inspection) =>
    [
      "Passed",
      "Passed (After Recheck)",
      "Passed (After Reject)",
    ].includes(inspection.QC_Result)
).length;

const rejectedInspections = filteredQCInspections.filter(
  (inspection) => inspection.QC_Result === "Rejected"
).length;

const recheckInspections = filteredQCInspections.filter(
  (inspection) => inspection.QC_Result === "Recheck"
).length;

const totalInspections =
  passedInspections + rejectedInspections + recheckInspections;

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

const getProductPerformance = (name) => {
  const productName = name || "Unknown Product";

  if (!productPerformanceMap[productName]) {
    productPerformanceMap[productName] = {
      product: productName,
      inspected: 0,
      passed: 0,
      rejected: 0,
      issues: 0,
    };
  }

  return productPerformanceMap[productName];
};

const passedQCResults = [
  "Passed",
  "Passed (After Recheck)",
  "Passed (After Reject)",
];

filteredQCInspections.forEach((inspection) => {
  const result = inspection.QC_Result;

  const productInspections =
    inspection.QC_Product_Inspections || [];

  const rejectedProducts =
    inspection.QC_Rejected_Products || [];

  const orderItems = inspection.items || [];

  // Only count completed product inspections here.
  if (
    result !== "Rejected" &&
    !passedQCResults.includes(result)
  ) {
    return;
  }

  // Use individual QC product results when available.
  if (productInspections.length > 0) {
    productInspections.forEach((item) => {
      const name =
        item.productName || item.Product_Name;

      if (
        analyticsProduct !== "All Products" &&
        name !== analyticsProduct
      ) {
        return;
      }

      const product = getProductPerformance(name);
      const itemResult = item.result || item.Result;

      if (itemResult === "Rejected") {
        product.inspected += 1;
        product.rejected += 1;
      } else if (itemResult === "Passed") {
        product.inspected += 1;
        product.passed += 1;
      }
    });

    return;
  }

  // Fallback for completed passed orders.
  if (passedQCResults.includes(result)) {
    orderItems.forEach((item) => {
      const name =
        item.Product_Name || item.productName;

      if (
        analyticsProduct !== "All Products" &&
        name !== analyticsProduct
      ) {
        return;
      }

      const product = getProductPerformance(name);
      product.inspected += 1;
      product.passed += 1;
    });

    return;
  }

  // Fallback for rejected products when individual
  // inspection results are not available.
  if (result === "Rejected") {
    rejectedProducts.forEach((item) => {
      const name =
        item.Product_Name || item.productName;

      if (
        analyticsProduct !== "All Products" &&
        name !== analyticsProduct
      ) {
        return;
      }

      const product = getProductPerformance(name);
      product.inspected += 1;
      product.rejected += 1;
    });
  }
});

// Attach QC and Delivery issue counts.
Object.values(productIssueMap).forEach((issue) => {
  if (
    analyticsProduct !== "All Products" &&
    issue.product !== analyticsProduct
  ) {
    return;
  }

  const product = getProductPerformance(issue.product);
  product.issues = issue.totalIssues;
});

const productQualityPerformance = Object.values(
  productPerformanceMap
)
  .map((product) => ({
    ...product,
    passRate:
      product.inspected > 0
        ? (product.passed / product.inspected) * 100
        : 0,
  }))
  .sort(
    (a, b) =>
      b.inspected - a.inspected ||
      b.issues - a.issues
  );

const recurringIssues = Object.values(productIssueMap)
  .flatMap((p) =>
    Object.entries(p.issueTypes)
      .filter(([, count]) => count >= 1)
      .map(([issue, cases]) => ({
        date: p.issueDates[issue] || null,
        product: p.product,
        issue,
        cases,
        trend: "Recurring",
        severity: cases >= 5 ? "High" : cases >= 3 ? "Medium" : "Low",
        status: "Investigation Required",
      }))
  )
  .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

const filteredRecurringIssues = recurringIssues.filter((item, index) => {
  const search = recurringSearch.toLowerCase();
  const id = `RI${String(index + 1).padStart(3, "0")}`;

  return (
    [id, item.product, item.issue].some((v) =>
      v.toLowerCase().includes(search)
    ) &&
    (recurringSeverity === "All" || item.severity === recurringSeverity)
  );
});  

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

const handleViewAction = (action) => {
  setEditingActionId(action.id);
  setSelectedIssue(action);
  setRootCause(action.rootCause || "");
  setCorrectiveAction(action.correctiveAction || "");
  setAssignedTo(action.assignedTo || "");
  setTargetDate(action.completionDate || action.targetDate || "");
  setPriority(action.priority || "Medium");
  setRemarks(action.remarks || "");
};

const closeActionForm = () => {
  setSelectedIssue(null);
  setEditingActionId(null);
  setRootCause("");
  setCorrectiveAction("");
  setAssignedTo("");
  setTargetDate("");
  setPriority("Medium");
  setRemarks("");
};

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
  const data = {
    rootCause: rootCause.trim(),
    correctiveAction: correctiveAction.trim(),
    assignedTo,
    completionDate: targetDate,
    priority,
    remarks: remarks.trim(),
  };

  if (editingActionId) {
    await updateDoc(doc(db, "corrective_actions", editingActionId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "corrective_actions"), {
      ...data,
      issueId: selectedIssue.issueId,
      product: selectedIssue.product,
      issue: selectedIssue.issue,
      cases: selectedIssue.cases,
      trend: selectedIssue.trend,
      severity: selectedIssue.severity,
      createdAt: serverTimestamp(),
    });
  }

  alert(editingActionId ? "Changes saved successfully." : "Corrective action saved successfully.");
  closeActionForm();
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
              Quality Issues
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
                  <p>Total Rejected</p>
                  <h2>{rejectedInspections}</h2>

                  <span className="qa-red">
                    Rejected QC inspections
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

              <div className="qa-date-filter-wrapper">

                <select
                  value={showDatePopup ? "Custom" : analyticsPeriod}
                  onChange={(e) => {
                    const selectedPeriod = e.target.value;
                    if (selectedPeriod === "Custom") {
                      openCustomDatePopup();
                    }else {
                      setAnalyticsPeriod(selectedPeriod);
                      setShowDatePopup(false);
                    }
                  }}
                  onClick={() => {
                    if (analyticsPeriod === "Custom" && !showDatePopup) {
                      openCustomDatePopup();
                    }
                  }}
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 3 Months">Last 3 Months</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="Custom">Custom Date Range</option>
                </select>

                {showDatePopup && (
                  <div className="qa-date-popup">

                    <h4>Select Date Range</h4>

                    <div className="qa-date-popup-field">
                      <label>From</label>
                      <input
                        type="date"
                        value={tempStartDate}
                        max={tempEndDate || undefined}
                        onChange={(e) => setTempStartDate(e.target.value)}
                      />
                    </div>

                    <div className="qa-date-popup-field">
                      <label>To</label>
                      <input
                        type="date"
                        value={tempEndDate}
                        min={tempStartDate || undefined}
                        onChange={(e) => setTempEndDate(e.target.value)}
                      />
                    </div>

                    <div className="qa-date-popup-actions">
                      <button
                        type="button"
                        className="qa-date-cancel-btn"
                        onClick={cancelCustomDateRange}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="qa-date-apply-btn"
                        onClick={applyCustomDateRange}
                      >
                        Apply
                      </button>
                    </div>

                  </div>
                )}

              </div>

              <select
                value={analyticsProduct}
                onChange={(e) => setAnalyticsProduct(e.target.value)}
              >
                <option value="All Products">All Products</option>

                {allProductNames.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>

            </div>



            </div>


            {/* SUMMARY */}

            <div className="qa-summary-grid qa-summary-five">

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
              <p>Total Rejected</p>
              <h2>{rejectedInspections}</h2>
              <span className="qa-red">
                Rejected QC inspections
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

            {/* QUALITY TREND + TOP PROBLEMATIC PRODUCTS */}

            <div className="qa-dashboard-grid">

            
            <div className="qa-panel">
              <h3>Quality Issues Trend</h3>

              <p className="qa-section-subtitle">
                QC and delivery issues based on the selected period
              </p>

              <div style={{ display: "flex", gap: "20px", margin: "12px 0" }}>
                <span style={{ color: "#e52d87", fontWeight: 600 }}>
                  ● QC Issues
                </span>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                  ● Delivery Issues
                </span>
              </div>

              {qualityTrendData.length > 0 ? (
                <div className="qa-line-chart-container">
                  {(() => {
                    const width = 700;
                    const height = 260;
                    const left = 38;
                    const right = 22;
                    const top = 25;
                    const bottom = 48;

                    const chartWidth = width - left - right;
                    const chartHeight = height - top - bottom;

                    const getX = (index) =>
                      qualityTrendData.length === 1
                        ? left + chartWidth / 2
                        : left +
                          (index / (qualityTrendData.length - 1)) *
                            chartWidth;

                    const getY = (value) =>
                      top +
                      chartHeight -
                      (value / maximumTrendValue) * chartHeight;

                    const points = qualityTrendData.map((item, index) => ({
                      ...item,
                      x: getX(index),
                      y: getY(item.total),
                    }));

                    const makeLinePath = (type) =>
                      points
                        .map((point, index) =>
                          `${index === 0 ? "M" : "L"} ${point.x} ${getY(point[type])}`
                        )
                        .join(" ");

                    const activePoint =
                      hoveredTrendIndex !== null
                        ? points[hoveredTrendIndex]
                        : null;

                    return (
                      <>
                        
                    {activePoint && (
                      <div
                        className="qa-line-tooltip"
                        style={{
                          left: `${Math.max(14, Math.min(86, (activePoint.x / width) * 100))}%`,
                          top: `${(activePoint.y / height) * 100}%`,
                        }}
                      >
                        <strong>
                          {trendFullDate(activePoint.date)}
                        </strong>

                        <span>
                          Total Issues: {activePoint.total}
                        </span>

                        <span>
                          QC Issues: {activePoint.qc}
                        </span>

                        <span>
                          Delivery Issues: {activePoint.delivery}
                        </span>
                      </div>
                    )}

                        <svg
                          className="qa-line-chart"
                          viewBox={`0 0 ${width} ${height}`}
                          role="img"
                          aria-label="Quality issues trend line graph"
                          onMouseLeave={() =>
                            setHoveredTrendIndex(null)
                          }
                        >
                          {Array.from({ length: 5 }, (_, index) => {
                            const value =
                              (maximumTrendValue / 4) * index;

                            return (
                              <g key={index}>
                                <line
                                  x1={left}
                                  x2={width - right}
                                  y1={getY(value)}
                                  y2={getY(value)}
                                  stroke="#e9e9e9"
                                  strokeDasharray="4 4"
                                />

                                <text
                                  x={left - 8}
                                  y={getY(value) + 4}
                                  textAnchor="end"
                                  fontSize="12"
                                  fill="#777"
                                >
                                  {Number.isInteger(value)
                                    ? value
                                    : value.toFixed(1)}
                                </text>
                              </g>
                            );
                          })}

                          
                          <path
                            d={makeLinePath("qc")}
                            fill="none"
                            stroke="#e52d87"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />

                          <path
                            d={makeLinePath("delivery")}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />


                          {points.map((point, index) => (
                            <g key={point.key}>
                              {hoveredTrendIndex === index && (
                                <line
                                  x1={point.x}
                                  x2={point.x}
                                  y1={top}
                                  y2={height - bottom}
                                  stroke="#e52d87"
                                  strokeDasharray="4 4"
                                  opacity="0.6"
                                />
                              )}

                              
                              {["qc", "delivery"].map((type) => (
                                <circle
                                  key={type}
                                  cx={point.x}
                                  cy={getY(point[type])}
                                  r={hoveredTrendIndex === index ? 6 : 3}
                                  fill={type === "qc" ? "#e52d87" : "#f59e0b"}
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                />
                              ))}


                              {shouldShowTrendLabel(index) && (
                                <text
                                  x={point.x}
                                  y={height - 14}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fill="#777"
                                >
                                  {trendDateLabel(point.date)}
                                </text>
                              )}
                            </g>
                          ))}

                          {points.map((point, index) => {
                            const space =
                              points.length > 1
                                ? chartWidth / (points.length - 1)
                                : chartWidth;

                            return (
                              <rect
                                key={`hover-${point.key}`}
                                x={point.x - space / 2}
                                y={top}
                                width={space}
                                height={chartHeight}
                                fill="transparent"
                                onMouseEnter={() =>
                                  setHoveredTrendIndex(index)
                                }
                                onClick={() =>
                                  setHoveredTrendIndex(index)
                                }
                              />
                            );
                          })}
                        </svg>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p>No quality issues data available for this period.</p>
              )}
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
                        <strong>{product.product}</strong>

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
                <h1>Quality Issues</h1>
                <p>
                Monitor quality issues detected during QC inspections and deliveries
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
                <h2>{totalRecurringIssues}</h2>

                <span className="qa-red">
                 QC and delivery issues
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
                <h3>Quality Issues Records</h3>

                <p className="qa-section-subtitle">
                    Review reported QC rejection and delivery issues
                </p>
                </div>

            </div>

            <div className="qa-recurring-filters">

                <input
                type="text"
                placeholder="Search Issue ID, Product or Issue..."
                value={recurringSearch}
                onChange={(e) => setRecurringSearch(e.target.value)}
                />

                <select
                  value={recurringSeverity}
                  onChange={(e) => setRecurringSeverity(e.target.value)}
                >
                <option value="All">All Severity Levels</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
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
                    <th>Date</th>
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
                    {filteredRecurringIssues.length > 0 ? (
                      filteredRecurringIssues.map((item, index) => (
                        <tr key={`${item.product}-${item.issue}`}>
                          <td>
                            {item.date
                              ? item.date.toLocaleDateString("en-GB")
                              : "-"}
                          </td>

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
                        <td colSpan="9">
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
                  <p>Total Corrective Actions</p>
                  <h2>{correctiveActions.length}</h2>
                  <span className="qa-pink">
                    Recorded corrective actions
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
                      onClick={() => {
                        const wasEditing = Boolean(editingActionId);
                        closeActionForm();
                        setActivePage(wasEditing ? "corrective" : "recurring");
                      }}
                    >
                      {editingActionId ? "Back to Records" : "Back to Quality Issues"}
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

                <div className="qa-panel qa-corrective-document">

                <div className="qa-section-header">

                    <div>
                    <h3>
                      {editingActionId
                        ? "Corrective Action Record"
                        : "Record Completed Corrective Action"}
                    </h3>

                    <p className="qa-section-subtitle">
                        Record the root cause and corrective action taken after the issue has been resolved.
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
                    <label>Completion Date</label>

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
                      onClick={() => {
                        const wasEditing = Boolean(editingActionId);
                        closeActionForm();
                        setActivePage(wasEditing ? "corrective" : "recurring");
                      }}
                    >
                      Cancel
                    </button>

                    <button
                        className="qa-save-btn"
                        onClick={handleSaveCorrectiveAction}
                        >
                        {editingActionId ? "Save Changes" : "Save Corrective Action"}
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
                      <th>Priority</th>
                      <th>Completion Date</th>
                      <th>Action</th>
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
                          <td>{action.priority || "-"}</td>
                          <td>{action.completionDate || action.targetDate || "-"}</td>
                          <td>
                            <button
                              className="qa-action-btn"
                              onClick={() => handleViewAction(action)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">No corrective actions recorded.</td>
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