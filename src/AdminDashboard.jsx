import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "./AdminDashboard.css";

function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  // ORDER MANAGEMENT SEARCH & FILTER
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderRiskFilter, setOrderRiskFilter] = useState("All");
  const [orderDateFilter, setOrderDateFilter] = useState("All");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDatePopup, setShowCustomDatePopup] = useState(true);
  const [orders, setOrders] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [showAllStockPredictions, setShowAllStockPredictions] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("All");
  const [customerSegmentation, setCustomerSegmentation] = useState([]);
  const [customerSegmentCounts, setCustomerSegmentCounts] = useState({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState("All");
  const [showAttentionDetails, setShowAttentionDetails] = useState(false);
  const [customerIssueFilter, setCustomerIssueFilter] = useState("All");
  const [anomalyData, setAnomalyData] = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyError, setAnomalyError] = useState("");
  const [anomalyReviewStatuses, setAnomalyReviewStatuses] = useState({});
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [anomalySaving, setAnomalySaving] = useState(false);
  const [anomalyTotalTransactions, setAnomalyTotalTransactions] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInventoryData(
          products.sort((a, b) =>
            String(a.Product_Name || "").localeCompare(
              String(b.Product_Name || "")
            )
          )
        );
      },
      (error) => {
        console.error("Error fetching admin inventory:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortedOrders = orderList.sort((a, b) => {
          const dateA = new Date(
            `${a.Order_Date || ""} ${a.Order_Time || "00:00"}`
          );

          const dateB = new Date(
            `${b.Order_Date || ""} ${b.Order_Time || "00:00"}`
          );

          return (dateB.getTime() || 0) - (dateA.getTime() || 0);
        });

        setOrders(sortedOrders);
      },
      (error) => {
        console.error("Error fetching admin orders:", error);
      }
    );

    return () => unsubscribe();
  }, []);
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastMonths, setForecastMonths] = useState(3);
  const [selectedForecastProduct, setSelectedForecastProduct] = useState("all");
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
        if (qty >= 100) return "High";
        if (qty >= 50) return "Medium";
        return "Low";
      };

      const highDemandCount = forecastSummary.filter(
        (item) => item.Predicted_Quantity >= 100
      ).length;

      const mediumDemandCount = forecastSummary.filter(
        (item) =>
          item.Predicted_Quantity >= 50 &&
          item.Predicted_Quantity < 100
      ).length;

      const lowDemandCount = forecastSummary.filter(
        (item) => item.Predicted_Quantity < 50
      ).length;

      const highestDemandProduct = forecastSummary[0];


    
    const monthlyForecast = Object.values(
        forecastData.reduce((acc, item) => {
          const date = item.Date;
          if (!date) return acc;

          if (!acc[date]) {
            acc[date] = {
              date,
              quantity: 0,
            };
          }

          acc[date].quantity += Number(item.Predicted_Quantity) || 0;

          return acc;
        }, {})
      ).sort((a, b) => a.date.localeCompare(b.date));

      const maxMonthlyDemand = Math.max(
        ...monthlyForecast.map((item) => item.quantity),
        1
      );
      const chartMax = 100;

    const topProducts = forecastSummary;

    const highestMonthlyProduct =
  highestDemandProduct?.Product_Code || "-";

// OPERATIONAL RISK - DATA FROM FIREBASE
const operationalRisks = orders.flatMap((order) => {
  const risks = [];

  if (order.Delivery_Status === "Canceled") {
    risks.push({
      Order_ID: order.Order_ID,
      Customer_Name: order.Customer_Name || "-",
      Risk_Type: "Order Cancellation",
      Risk_Level: "High",
      Date_Detected: order.Delivery_Updated_At || "",
      Status: "Active",
    });
  }

  if (order.Delivery_Status === "Delivery Delayed") {
    risks.push({
      Order_ID: order.Order_ID,
      Customer_Name: order.Customer_Name || "-",
      Risk_Type: "Delivery Delay",
      Risk_Level: "Medium",
      Date_Detected: order.Delivery_Updated_At || "",
      Status: "Active",
    });
  }

  if (order.Order_Status === "Hold") {
    risks.push({
      Order_ID: order.Order_ID,
      Customer_Name: order.Customer_Name || "-",
      Risk_Type: "Stock Shortage",
      Risk_Level: "High",
      Date_Detected: order.Processed_At || "",
      Status: "Active",
    });
  }

  if (order.Delivery_Status === "Returned") {
    risks.push({
      Order_ID: order.Order_ID,
      Customer_Name: order.Customer_Name || "-",
      Risk_Type: "Returns",
      Risk_Level: "Medium",
      Date_Detected: order.Delivery_Updated_At || "",
      Status: "Active",
    });
  }

  return risks;
});

// CUSTOMER ANALYTICS - GROUP CUSTOMER ORDERS
const customerMap = new Map();

orders.forEach((order) => {
  const customerName = String(order.Customer_Name || "").trim();
  const phone = String(order.Phone_Number || "").trim();

  if (!customerName) return;

  const customerKey = phone || customerName.toLowerCase();

  if (!customerMap.has(customerKey)) {
    customerMap.set(customerKey, {
      Customer_ID: customerKey,
      Customer_Name: customerName,
      Total_Orders: 0,
      Cancelled_Orders: 0,
      Returned_Orders: 0,
      Last_Order: "",
    });
  }

  const customer = customerMap.get(customerKey);

  customer.Total_Orders += 1;

  if (
    ["Canceled", "Cancelled"].includes(order.Delivery_Status) ||
    ["Canceled", "Cancelled"].includes(order.Order_Status)
  ) {
    customer.Cancelled_Orders += 1;
  }

  if (order.Delivery_Status === "Returned") {
    customer.Returned_Orders += 1;
  }

  const orderDate = String(order.Order_Date || "");

  if (orderDate > customer.Last_Order) {
    customer.Last_Order = orderDate;
  }
});

const customerData = Array.from(customerMap.values());


const stockPredictions = inventoryData
  .map((product) => {
    const productCode = String(product.Product_Code || "")
      .trim()
      .toUpperCase();

    const nextMonth = forecastData
      .filter(
        (item) =>
          String(item.Product_Code || "").trim().toUpperCase() ===
          productCode
      )
      .sort((a, b) => a.Date.localeCompare(b.Date))[0];

    if (!nextMonth) return null;

    const predictedDemand = Math.max(
      0,
      Math.ceil(Number(nextMonth.Predicted_Quantity) || 0)
    );

    const availableStock = Number(product.Available_Stock) || 0;
    const safetyStock = Number(product.Safety_Stock) || 0;

    const restock = Math.max(
      0,
      predictedDemand + safetyStock - availableStock
    );

    return {
      Product_Code: product.Product_Code,
      Product_Name: product.Product_Name,
      Restock: restock,
    };
  })
  .filter((item) => item !== null && item.Restock > 0)
  .sort((a, b) => b.Restock - a.Restock);


const filteredInventory = inventoryData.filter((item) => {
  const keyword = inventorySearch.trim().toLowerCase();

  const matchesSearch =
    String(item.Product_Code || "").toLowerCase().includes(keyword) ||
    String(item.Product_Name || "").toLowerCase().includes(keyword);

  const available = Number(item.Available_Stock || 0);
  const safety = Number(item.Safety_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  let status = "In Stock";

  if (available <= 0) {
    status = "Out of Stock";
  } else if (available <= safety) {
    status = "Critical";
  } else if (available <= reorder) {
    status = "Low Stock";
  }

  return (
    matchesSearch &&
    (inventoryStatusFilter === "All" ||
      inventoryStatusFilter === status)
  );
});

useEffect(() => {
  const fetchCustomerSegmentation = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/customer-segmentation"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customer segmentation");
      }

      const result = await response.json();

      setCustomerSegmentation(result.data || []);
      setCustomerSegmentCounts(result.segment_counts || {});
    } catch (error) {
      console.error("Customer Segmentation API Error:", error);
    }
  };

  fetchCustomerSegmentation();

  const interval = setInterval(() => {
    fetchCustomerSegmentation();
  }, 10000);

  return () => clearInterval(interval);
  }, []);

const filteredCustomerSegmentation = customerSegmentation.filter((customer) => {
  const keyword = customerSearch.toLowerCase().trim();

  const matchSearch = String(customer.Customer_Name || "")
    .toLowerCase()
    .includes(keyword);

  let matchCategory = false;

  if (customerIssueFilter === "Normal") {
    matchCategory = customer.Segment === "Normal Customers";
  } else if (customerIssueFilter === "Anomalies") {
    matchCategory = customer.Order_Anomalies === true;
  } else if (customerIssueFilter === "DeliveryIssues") {
    matchCategory = customer.Order_Delivery_Issues === true;
  }

  return matchSearch && matchCategory;
});

useEffect(() => {
  const fetchAnomalies = async () => {
    setAnomalyLoading(true);
    setAnomalyError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/anomaly-detection-v2"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch anomaly detection results");
      }

      const result = await response.json();

      setAnomalyData(result.data || []);
      setAnomalyTotalTransactions(result.total_orders || 0);
    } catch (error) {
      console.error("Anomaly Detection API Error:", error);
      setAnomalyError(error.message);
    } finally {
      setAnomalyLoading(false);
    }
  };

  fetchAnomalies();
}, []);

useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "anomaly_reviews"),
    (snapshot) => {
      const statuses = {};

      snapshot.forEach((document) => {
        statuses[document.id] = document.data().Status || "Detected";
      });

      setAnomalyReviewStatuses(statuses);
    },
    (error) => {
      console.error("Anomaly Reviews Firebase Error:", error);
    }
  );

  return () => unsubscribe();
}, []);

const anomalyCategoryCounts = {
  quantity: anomalyData.filter((item) =>
    item.Anomaly_Reason?.includes("Unusually high order quantity")
  ).length,

  frequency: anomalyData.filter((item) =>
    item.Anomaly_Reason?.includes("Frequent orders within 7 days")
  ).length,

  combined: anomalyData.filter((item) =>
    item.Anomaly_Reason?.includes("Unusually high order quantity") &&
    item.Anomaly_Reason?.includes("Frequent orders within 7 days")
  ).length,

  other: anomalyData.filter((item) =>
    item.Anomaly_Reason === "Unusual order pattern"
  ).length,
};

const updateAnomalyStatus = async (anomaly, newStatus) => {
  const anomalyId = String(anomaly.Order_ID || "").trim();

  if (!anomalyId || anomalySaving) return;

  try {
    setAnomalySaving(true);

    await setDoc(
      doc(db, "anomaly_reviews", anomalyId),
      {
        Order_ID: anomalyId,
        Status: newStatus,
        Updated_At: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to update anomaly status:", error);
    alert("Failed to update anomaly status.");
  } finally {
    setAnomalySaving(false);
  }
};

const anomalyUnderReviewCount = anomalyData.filter(
  (anomaly) =>
    anomalyReviewStatuses[String(anomaly.Order_ID)] === "Under Review"
).length;

const anomalyResolvedCount = anomalyData.filter(
  (anomaly) =>
    anomalyReviewStatuses[String(anomaly.Order_ID)] === "Resolved"
).length;

return (
  <div className="admin-layout">
      <aside className="sidebar">
        <div>
          <h2 className="brand">OrderAI</h2>

          
          <nav>
            {[
              ["dashboard", "Dashboard"],
              ["orders", "Order Management"],
              ["inventory", "Inventory Management"],
              ["forecast", "Demand Forecasting"],
              ["customer", "Customer Analytics"],
              ["anomaly", "Anomaly Detection"],
              ["risk", "Operational Risk"],
            ].map(([page, label]) => (
              <a
                key={page}
                className={activePage === page ? "active" : ""}
                onClick={() => setActivePage(page)}
              >
                {label}
              </a>
            ))}
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
              </div>


              <div className="order-filters">

                <input
                  type="text"
                  placeholder="Search Order ID, Customer or Product..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="New Order">New Order</option>
                  <option value="Processing">Processing</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Prepared">Prepared</option>
                  <option value="Waiting QC">Waiting QC</option>
                  <option value="Hold">Waiting Stock</option>
                  <option value="Rejected by QC">Rejected by QC</option>
                  <option value="QC Approved">QC Approved</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Canceled">Canceled</option>
                </select>

                <select
                  value={orderRiskFilter}
                  onChange={(e) => setOrderRiskFilter(e.target.value)}
                >
                  <option value="All">All Risk</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>

                <select
                  value={orderDateFilter}
                  onChange={(e) => {
                    setOrderDateFilter(e.target.value);
                    setShowCustomDatePopup(true);
                  }}
                >
                  <option value="All">All Dates</option>
                  <option value="1week">Last 1 Week</option>
                  <option value="1month">Last 1 Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="Custom">Custom Date</option>
                </select>

                {orderDateFilter === "Custom" && showCustomDatePopup && (
                  <div className="custom-date-popup">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />

                    <label>End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />

                  <button
                    type="button"
                    className="custom-date-done"
                    onClick={() => setShowCustomDatePopup(false)}
                  >
                    Done
                  </button>

                  </div>
                )}

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
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center" }}>
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders
                  .filter((order) => {
                    const keyword = orderSearch.trim().toLowerCase();

                    const matchesStatus =
                      orderStatusFilter === "All" ||
                      order.Order_Status === orderStatusFilter ||
                      (orderStatusFilter === "Delivered" &&
                        order.Delivery_Status === "Delivered") ||
                      (orderStatusFilter === "Canceled" &&
                        order.Delivery_Status === "Canceled");

                    const matchesRisk =
                      orderRiskFilter === "All" ||
                      String(order.Risk_Level || "")
                        .toLowerCase() === orderRiskFilter.toLowerCase();

                    // DATE FILTER
                    const orderDate = new Date(`${order.Order_Date}T00:00:00`);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let matchesDate = true;

                    if (orderDateFilter !== "All") {
                      if (Number.isNaN(orderDate.getTime())) {
                        matchesDate = false;
                      } else if (orderDateFilter === "Custom") {
                        const startDate = customStartDate
                          ? new Date(`${customStartDate}T00:00:00`)
                          : null;

                        const endDate = customEndDate
                          ? new Date(`${customEndDate}T00:00:00`)
                          : null;

                        matchesDate =
                          (!startDate || orderDate >= startDate) &&
                          (!endDate || orderDate <= endDate);

                      } else {
                        const startDate = new Date(today);

                        if (orderDateFilter === "1week") {
                          startDate.setDate(startDate.getDate() - 7);
                        } else if (orderDateFilter === "1month") {
                          startDate.setMonth(startDate.getMonth() - 1);
                        } else if (orderDateFilter === "3months") {
                          startDate.setMonth(startDate.getMonth() - 3);
                        } else if (orderDateFilter === "6months") {
                          startDate.setMonth(startDate.getMonth() - 6);
                        }

                        matchesDate = orderDate >= startDate && orderDate <= today;
                      }
                    }

                    const productNames = (order.items || [])
                      .map((item) =>
                        `${item.Product_Name || ""} ${item.Product_Code || ""}`
                      )
                      .join(" ")
                      .toLowerCase();

                    return (
                      (
                        String(order.Order_ID || order.id || "").toLowerCase().includes(keyword) ||
                        String(order.Customer_Name || "").toLowerCase().includes(keyword) ||
                        productNames.includes(keyword)
                      ) &&
                      matchesStatus &&
                      matchesRisk &&
                      matchesDate
                      );
                  })
                  .map((order) => (
                        <tr key={order.id}>
                          <td>{order.Order_ID || order.id}</td>
                          <td>{order.Customer_Name || "-"}</td>
                          <td>
                            {(order.items || [])
                              .map((item) => item.Product_Name || item.Product_Code)
                              .join(", ") || "-"}
                          </td>
                          <td>
                            {(order.items || []).reduce(
                              (total, item) => total + Number(item.Quantity || 0),
                              0
                            )}
                          </td>
                          <td>{order.Order_Date || "-"}</td>
                          <td>{order.Order_Time || "-"}</td>
                          <td>
                            <span className="status yellow">
                              {order.Order_Status || "New Order"}
                            </span>
                          </td>
                          <td>{order.Delivery_Status || "-"}</td>
                          <td>{order.Risk_Level || "-"}</td>
                          <td>
                            <button className="table-action-btn">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
                <h2>{inventoryData.length}</h2>
                <span className="normal">
                  Active products
                </span>
              </div>

              <div className="inventory-summary-card">
                <p>Stock Available</p>
                <h2>
                  {inventoryData.reduce(
                    (total, item) => total + Number(item.Available_Stock || 0),
                    0
                  )}
                </h2>
                <span className="normal">
                  Total available units
                </span>
              </div>

              <div className="inventory-summary-card">
                <h2>
                {inventoryData.filter((item) => {
                  const available = Number(item.Available_Stock || 0);
                  const safety = Number(item.Safety_Stock || 0);
                  const reorder = Number(item.Reorder_Level || 0);

                  return available > safety && available <= reorder;
                }).length}
              </h2>
                <span className="warning">
                  Restock soon
                </span>
              </div>

              <div className="inventory-summary-card">
                <h2>
                  {inventoryData.filter((item) => {
                    const available = Number(item.Available_Stock || 0);
                    const safety = Number(item.Safety_Stock || 0);

                    return available > 0 && available <= safety;
                  }).length}
                </h2>
                <span className="danger">
                  Immediate attention
                </span>
              </div>

            </div>


            {/* INVENTORY ALERTS */}

            <div className="dashboard-grid">

              <div className="panel">

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%"
                }}>
                  <h3 style={{ margin: 0, whiteSpace: "nowrap" }}>
                    AI Stock Prediction – Next Month
                  </h3>

                  <button
                    onClick={() => setShowAllStockPredictions(!showAllStockPredictions)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#d82d83",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginLeft: "auto",
                      flexShrink: 0,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {showAllStockPredictions ? "See Less" : "See More"}
                  </button>
                </div>

                <p style={{ color: "#777", marginBottom: "20px" }}>
                  Recommended stock replenishment for{" "}
                    {forecastStart
                      ? new Date(`${forecastStart}T00:00:00`).toLocaleDateString(
                          "en-US",
                          { month: "long", year: "numeric" }
                        )
                      : "the next forecast month"}
                </p>

                <div className="inventory-stock-list">

                  {(showAllStockPredictions
                    ? stockPredictions
                    : stockPredictions.slice(0, 3)
                  ).map((item) => (

                    <div className="inventory-stock-item" key={item.Product_Code}>

                      <div>
                        <strong>{item.Product_Name}</strong>
                        <p>SKU: {item.Product_Code}</p>
                      </div>

                      <span className="status yellow">
                        +{item.Restock} units
                      </span>

                    </div>

                  ))}

                </div>

              </div>


              <div className="panel">
                <h3>Inventory Alerts</h3>

                
                {(() => {
                  const criticalProducts = inventoryData.filter((item) => {
                    const available = Number(item.Available_Stock || 0);
                    const safety = Number(item.Safety_Stock || 0);
                    return available <= 0 || available <= safety;
                  });

                  const lowStockProducts = inventoryData.filter((item) => {
                    const available = Number(item.Available_Stock || 0);
                    const safety = Number(item.Safety_Stock || 0);
                    const reorder = Number(item.Reorder_Level || 0);
                    return available > safety && available <= reorder;
                  });

                  const stableProducts = inventoryData.filter((item) => {
                    return Number(item.Available_Stock || 0) >
                      Number(item.Reorder_Level || 0);
                  });

                  return (
                    <>
                      <div className="alert danger-alert">
                        <strong>Critical / Out of Stock</strong>
                        <p>
                          {criticalProducts.length} products require immediate attention.
                        </p>
                      </div>

                      <div className="alert warning-alert">
                        <strong>Low Stock Warning</strong>
                        <p>
                          {lowStockProducts.length} products are approaching reorder level.
                        </p>
                      </div>

                      <div className="alert success-alert">
                        <strong>Inventory Stable</strong>
                        <p>
                          {stableProducts.length} products have sufficient available stock.
                        </p>
                      </div>
                    </>
                  );
                })()}

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
                  placeholder="Search Product Code or Product Name..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />

                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                >
                  <option value="All">All Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Critical">Critical Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
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
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const available = Number(item.Available_Stock || 0);
                        const safety = Number(item.Safety_Stock || 0);
                        const reorder = Number(item.Reorder_Level || 0);

                        let status = "In Stock";
                        let statusClass = "green";

                        if (available <= 0) {
                          status = "Out of Stock";
                          statusClass = "red";
                        } else if (available <= safety) {
                          status = "Critical";
                          statusClass = "red";
                        } else if (available <= reorder) {
                          status = "Low Stock";
                          statusClass = "yellow";
                        }

                        return (
                          <tr key={item.id}>
                            <td>{item.Product_Code || item.id}</td>
                            <td>{item.Product_Name || "-"}</td>
                            <td>{Number(item.Current_Stock || 0)}</td>
                            <td>{Number(item.Reserved_Stock || 0)}</td>
                            <td>{available}</td>
                            <td>{reorder}</td>

                            <td>
                              <span className={`status ${statusClass}`}>
                                {status}
                              </span>
                            </td>

                            <td>
                              {item.Last_Updated
                                ? new Date(item.Last_Updated).toLocaleString("en-GB")
                                : "-"}
                            </td>

                            <td>
                              <button className="table-action-btn">
                                View
                              </button>
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
                <h2>{operationalRisks.length}</h2>
                <span className="warning">
                This month
                </span>
            </div>

            <div className="risk-summary-card">
                <p>High Risk</p>
                <h2>
                  {operationalRisks.filter(
                    (risk) => risk.Risk_Level === "High"
                  ).length}
                </h2>
                <span className="danger">
                Immediate attention
                </span>
            </div>

            <div className="risk-summary-card">
                <p>Medium Risk</p>
                <h2>
                  {operationalRisks.filter(
                    (risk) => risk.Risk_Level === "Medium"
                  ).length}
                </h2>
                <span className="warning">
                Monitor closely
                </span>
            </div>

            <div className="risk-summary-card">
                <p>Low Risk</p>
                <h2>
                  {operationalRisks.filter(
                    (risk) => risk.Risk_Level === "Low"
                  ).length}
                </h2>
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
                  {[
                    { name: "Order Cancellation", color: "red" },
                    { name: "Delivery Delay", color: "yellow" },
                    { name: "Stock Shortage", color: "red" },
                    { name: "Returns", color: "yellow" },
                  ].map((category) => {
                    const count = operationalRisks.filter(
                      (risk) => risk.Risk_Type === category.name
                    ).length;

                    return (
                      <div className="risk-category-item" key={category.name}>
                        <div>
                          <strong>{category.name}</strong>
                          <p>
                            {category.name === "Order Cancellation"
                              ? "Cancelled customer orders"
                              : category.name === "Delivery Delay"
                              ? "Orders experiencing delivery delays"
                              : category.name === "Stock Shortage"
                              ? "Orders waiting for sufficient stock"
                              : "Returned customer orders"}
                          </p>
                        </div>

                        <span className={`status ${category.color}`}>
                          {count} Alerts
                        </span>
                      </div>
                    );
                  })}
                </div>

            </div>


            <div className="panel">
                <h3>Recent Risk Alerts</h3>

                
                {[...operationalRisks]
                  .sort(
                    (a, b) =>
                      (Date.parse(b.Date_Detected) || 0) -
                      (Date.parse(a.Date_Detected) || 0)
                  )
                  .slice(0, 3)
                  .map((risk, index) => (
                    <div
                      key={`${risk.Order_ID}-${risk.Risk_Type}-${index}`}
                      className={`alert ${
                        risk.Risk_Level === "High"
                          ? "danger-alert"
                          : "warning-alert"
                      }`}
                    >
                      <strong>{risk.Risk_Type}</strong>
                      <p>
                        Order {risk.Order_ID} — {risk.Customer_Name}
                      </p>
                    </div>
                  ))}

                {operationalRisks.length === 0 && (
                  <div className="alert success-alert">
                    <strong>No Active Risk Alerts</strong>
                    <p>No operational risks detected from current order statuses.</p>
                  </div>
                )}

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
                  {operationalRisks.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No operational risks detected.
                      </td>
                    </tr>
                  ) : (
                    [...operationalRisks]
                      .sort(
                        (a, b) =>
                          (Date.parse(b.Date_Detected) || 0) -
                          (Date.parse(a.Date_Detected) || 0)
                      )
                      .map((risk, index) => (
                        <tr key={`${risk.Order_ID}-${risk.Risk_Type}`}>
                          <td>{`RSK${String(index + 1).padStart(4, "0")}`}</td>

                          <td>{risk.Order_ID || "-"}</td>

                          <td>{risk.Customer_Name || "-"}</td>

                          <td>{risk.Risk_Type}</td>

                          <td>
                            <span
                              className={`status ${
                                risk.Risk_Level === "High"
                                  ? "red"
                                  : risk.Risk_Level === "Medium"
                                  ? "yellow"
                                  : "green"
                              }`}
                            >
                              {risk.Risk_Level}
                            </span>
                          </td>

                          <td>
                            {risk.Date_Detected
                              ? new Date(risk.Date_Detected).toLocaleString("en-GB")
                              : "-"}
                          </td>

                          <td>
                            <span className="status red">
                              {risk.Status || "Active"}
                            </span>
                          </td>

                          <td>
                            <button className="table-action-btn">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
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

            <div className="forecast-filter-bar">
              <div className="forecast-filter-item">
                <span>Forecast Period</span>

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

              <span className="forecast-date-range">
                {forecastLoading
                  ? "Loading..."
                  : forecastStart && forecastEnd
                  ? `${forecastStart} - ${forecastEnd}`
                  : ""}
              </span>
            </div>

            <div className="forecast-summary-grid">

              <div className="forecast-summary-card">
                <p>Total Products</p>
                <h2>{forecastSummary.length}</h2>
                <span className="normal">Forecasted products</span>
              </div>

              <div className="forecast-summary-card">
                <p>High Demand Products</p>
                <h2>{highDemandCount}</h2>
                <span className="danger">≥ 100 units</span>
              </div>

              <div className="forecast-summary-card">
                <p>Medium Demand Products</p>
                <h2>{mediumDemandCount}</h2>
                <span className="normal">50 - 99 units</span>
              </div>

              <div className="forecast-summary-card">
                <p>Low Demand Products</p>
                <h2>{lowDemandCount}</h2>
                <span className="warning">Below 50 units</span>
              </div>

            </div>


            
            {/* FORECAST CHART + INSIGHTS */}

            <div className="dashboard-grid">

              
              <div className="panel">
                <div className="forecast-chart-header">
                  <h3>Predicted Demand Trend</h3>

                  <select
                    className="forecast-product-select"
                    value={selectedForecastProduct}
                    onChange={(e) => setSelectedForecastProduct(e.target.value)}
                  >
                    <option value="all">All Products</option>

                    {[...new Set(forecastData.map((item) => item.Product_Code))]
                      .sort()
                      .map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                  </select>
                </div>

                
                <div className="forecast-chart-new">
                  {forecastData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 15, left: 0 }}>
                        <CartesianGrid stroke="#f3dbe7" strokeDasharray="3 3" />

                        <XAxis
                          type="number"
                          dataKey="monthIndex"
                          domain={[-0.3, monthlyForecast.length - 0.7]}
                          ticks={monthlyForecast.map((_, i) => i)}
                          tickFormatter={(value) => {
                            const item = monthlyForecast[value];
                            if (!item) return "";
                            return new Date(`${item.date}T00:00:00`)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              });
                          }}
                          tick={{ fontSize: 11 }}
                          allowDecimals={false}
                        />

                        <YAxis
                          type="number"
                          dataKey="quantity"
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 11 }}
                        />

                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;

                            const item = payload[0].payload;

                            return (
                              <div style={{
                                background: "#fff",
                                padding: "10px 14px",
                                border: "1px solid #f4c6dc",
                                borderRadius: 8,
                                fontSize: 12,
                              }}>
                                <strong>{item.product}</strong>
                                <div>{item.month}</div>
                                <div>{item.quantity.toFixed(2)} units</div>
                              </div>
                            );
                          }}
                        />

                        <Scatter
                          name="Predicted Demand"
                          data={forecastData
                            .filter(
                              (item) =>
                                selectedForecastProduct === "all" ||
                                item.Product_Code === selectedForecastProduct
                            )
                            .map((item) => {
                              const index = monthlyForecast.findIndex(
                                (month) => month.date === item.Date
                              );

                              return {
                                monthIndex: index,
                                month: item.Month,
                                product: item.Product_Code,
                                quantity: Number(item.Predicted_Quantity) || 0,
                              };
                            })
                            .filter((item) => item.monthIndex >= 0)}
                          fill="#d92b83"
                          line={false}
                        />

                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>{forecastLoading ? "Loading..." : "No forecast data available."}</p>
                  )}
                </div>

              </div>


              <div className="panel">
                <h3>Key Findings</h3>

                <div className="alert danger-alert">
                  <strong>Highest Demand</strong>

                  <p>
                    {highestDemandProduct
                      ? `${highestDemandProduct.Product_Code} during the selected forecast period ${Math.round(
                          highestDemandProduct.Predicted_Quantity
                        ).toLocaleString()} units.`
                      : "Forecast data is loading."}
                  </p>
                </div>


                <div className="alert warning-alert">
                  <strong>Stock Planning</strong>

                  <p>
                    {highestDemandProduct
                      ? `Additional stock preparation should be considered for ${highestDemandProduct.Product_Code} due to its high predicted demand.`
                      : "Forecast data is loading."}
                  </p>
                </div>


                <div className="alert success-alert">
                  <strong>Demand Overview</strong>

                  <p>
                    {highDemandCount} products are classified as high demand,
                    while {mediumDemandCount} are medium demand and{" "}
                    {lowDemandCount} are low demand during the selected forecast period.
                  </p>
                </div>

              </div>

            </div>


            {/* FORECAST TABLE */}

            <div className="panel">

              <div className="forecast-page-header">
                <div>
                  <h3>Product Demand Forecast</h3>
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
                <h2>{customerSegmentation.length}</h2>
                <span className="normal">
                Historical customers analysed
                </span>
            </div>

            <div className="customer-summary-card">
                <p>Customers Requiring Attention</p>
                <h2>{customerSegmentCounts["Customers Requiring Attention"] || 0}</h2>
                <span className="danger">Requires monitoring</span>
            </div>

            <div className="customer-summary-card">
                <p>Normal Customers</p>
                <h2>{customerSegmentCounts["Normal Customers"] || 0}</h2>
                <span className="normal">No recurring issues detected</span>
            </div>

            <div className="customer-summary-card">
                <p>AI Segments</p>
                <h2>{Object.keys(customerSegmentCounts).length}</h2>
                <span className="danger">
                AI-based customer groups
                </span>
            </div>

            </div>


            {/* CUSTOMER SEGMENTS */}

            <div className="dashboard-grid">

            <div className="panel">
                <h3>Customer Segments</h3>

                <div className="customer-segment-list">
                  <div
                    className="customer-segment-item"
                    onClick={() =>
                      setCustomerIssueFilter(
                        customerIssueFilter === "Normal" ? "All" : "Normal"
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong>Normal Customers</strong>
                      <p>Customers without detected anomalies or recurring delivery issues</p>
                    </div>
                    <span className="status green">
                      {customerSegmentCounts["Normal Customers"] || 0}
                    </span>
                  </div>

                  <div
                    className="customer-segment-item"
                    onClick={() => setShowAttentionDetails(!showAttentionDetails)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong>Customers Requiring Attention</strong>
                      <p>Customers with unusual orders or recurring delivery issues</p>
                    </div>

                    <span className="status yellow">
                      {customerSegmentCounts["Customers Requiring Attention"] || 0}
                    </span>
                  </div>

                  {showAttentionDetails && (
                    <div style={{ padding: "12px 20px", background: "#fff5fa", borderRadius: "10px" }}>
                      <div
                        className="customer-segment-item"
                        onClick={() =>
                          setCustomerIssueFilter(
                            customerIssueFilter === "Anomalies" ? "All" : "Anomalies"
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <strong>Order Anomalies</strong>
                          <p>Customers with unusual order patterns detected by AI</p>
                        </div>
                        <span className="status yellow">
                          {customerSegmentation.filter(
                            (customer) => customer.Order_Anomalies === true
                          ).length}
                        </span>
                      </div>

                      <div
                        className="customer-segment-item"
                        onClick={() =>
                          setCustomerIssueFilter(
                            customerIssueFilter === "DeliveryIssues" ? "All" : "DeliveryIssues"
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <strong>Order & Delivery Issues</strong>
                          <p>Customers with two or more problematic orders</p>
                        </div>
                        <span className="status red">
                          {customerSegmentation.filter(
                            (customer) => customer.Order_Delivery_Issues === true
                          ).length}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
            </div>


            <div className="panel">
              <h3>Customer Insights</h3>

              <div className="alert success-alert">
                <strong>Normal Customers</strong>
                <p>
                  {customerSegmentCounts["Normal Customers"] || 0} customers
                  have no detected order anomalies or recurring delivery issues.
                </p>
              </div>

              <div className="alert warning-alert">
                <strong>Unusual Order Patterns</strong>
                <p>
                  {customerSegmentation.filter(
                    (customer) => customer.Order_Anomalies === true
                  ).length} customers have unusual order patterns
                  identified through AI anomaly detection.
                </p>
              </div>

              <div className="alert danger-alert">
                <strong>Recurring Order & Delivery Issues</strong>
                <p>
                  {customerSegmentation.filter(
                    (customer) => customer.Order_Delivery_Issues === true
                  ).length} customers have experienced two or more
                  problematic orders and require monitoring.
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
                    View AI-based customer segments and historical purchasing behaviour
                </p>
                </div>
            </div>


            <div className="customer-filters">

                <input
                type="text"
                placeholder="Search Customer Name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                />

                <select
                  value={customerSegmentFilter}
                  onChange={(e) => setCustomerSegmentFilter(e.target.value)}
                >
                  <option value="All">All Segments</option>
                  <option value="Normal Customers">Normal Customers</option>
                  <option value="Customers Requiring Attention">
                    Customers Requiring Attention
                  </option>
                </select>

            </div>


            <div className="bottom-panel">

                <table>

                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Segment</th>
                    <th>Total Orders</th>
                    <th>Anomaly Orders</th>
                    <th>Delivery Issue Orders</th>
                  </tr>
                </thead>


                <tbody>
                  {filteredCustomerSegmentation.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        No customer segmentation data available.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerSegmentation.map((customer, index) => (
                      <tr key={`${customer.Customer_Key}-${index}`}>
                        <td>{customer.Customer_Name}</td>
                        <td>{customer.Segment}</td>
                        <td>{customer.Total_Orders}</td>
                        <td>{customer.Anomaly_Orders}</td>
                        <td>{customer.Issue_Orders}</td>
                      </tr>
                    ))
                  )}
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
                <p>Total Orders</p>
                <h2>
                  {anomalyLoading ? "..." : anomalyTotalTransactions.toLocaleString()}
                </h2>
                <span className="normal">
                  Orders monitored
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Anomalies Detected</p>
                <h2>{anomalyLoading ? "..." : anomalyData.length.toLocaleString()}</h2>
                <span className="danger">
                Requires review
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Under Review</p>
                <h2>{anomalyUnderReviewCount.toLocaleString()}</h2>
                <span className="warning">
                Pending investigation
                </span>
            </div>

            <div className="anomaly-summary-card">
                <p>Resolved</p>
                <h2>{anomalyResolvedCount.toLocaleString()}</h2>
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
                    <strong>High Order Quantity</strong>
                    <p>Orders with unusually large quantities</p>
                  </div>
                  <span className="status red">
                    {anomalyCategoryCounts.quantity} Detected
                  </span>
                </div>

                <div className="anomaly-category-item">
                  <div>
                    <strong>Frequent Orders</strong>
                    <p>Customers placing frequent orders within 7 days</p>
                  </div>
                  <span className="status yellow">
                    {anomalyCategoryCounts.frequency} Detected
                  </span>
                </div>

                <div className="anomaly-category-item">
                  <div>
                    <strong>Combined Patterns</strong>
                    <p>Orders with both high quantity and frequent ordering</p>
                  </div>
                  <span className="status red">
                    {anomalyCategoryCounts.combined} Detected
                  </span>
                </div>

                <div className="anomaly-category-item">
                  <div>
                    <strong>Other Anomalies</strong>
                    <p>Unusual ordering patterns detected by AI</p>
                  </div>
                  <span className="status yellow">
                    {anomalyCategoryCounts.other} Detected
                  </span>
                </div>
              </div>
            </div>


            <div className="panel">
  <h3>Recent Anomaly Alerts</h3>

  {[...anomalyData]
    .sort((a, b) => {
      const dateA = new Date(a.Order_Date || 0);
      const dateB = new Date(b.Order_Date || 0);

      return dateB - dateA;
    })
    .slice(0, 3)
    .map((anomaly, index) => {
      const anomalyType =
        anomaly.Anomaly_Reason || "Unusual order pattern";

      return (
        <div
          className={`alert ${
            Number(anomaly.Anomaly_Score) < -0.1
              ? "danger-alert"
              : "warning-alert"
          }`}
          key={`${anomaly.Order_ID}-${index}`}
        >
          <strong>{anomalyType}</strong>

          <p>
            Order {anomaly.Order_ID || "-"} was flagged by AI
            on {anomaly.Order_Date || "-"}.
          </p>

          <p>
            Anomaly Score:{" "}
            {Number(anomaly.Anomaly_Score).toFixed(4)}
          </p>
        </div>
      );
    })}

  {!anomalyLoading &&
    !anomalyError &&
    anomalyData.length === 0 && (
      <div className="alert success-alert">
        <strong>No Anomaly Alerts</strong>
        <p>No anomalies detected in the analyzed dataset.</p>
      </div>
    )}

  {anomalyLoading && <p>Loading anomaly alerts...</p>}

  {anomalyError && <p>{anomalyError}</p>}
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
                  {anomalyLoading ? (
                    <tr>
                      <td colSpan="8">Loading anomaly data...</td>
                    </tr>
                  ) : anomalyError ? (
                    <tr>
                      <td colSpan="8">{anomalyError}</td>
                    </tr>
                  ) : anomalyData.length === 0 ? (
                    <tr>
                      <td colSpan="8">No anomalies detected.</td>
                    </tr>
                  ) : (
                    anomalyData.map((anomaly, index) => {
                      const status =
                        anomalyReviewStatuses[String(anomaly.Order_ID)] || "Detected";

                      return (
                        <tr key={`${anomaly.Order_ID}-${index}`}>
                          <td>{`ANM${String(index + 1).padStart(4, "0")}`}</td>

                          <td>{anomaly.Order_ID || "-"}</td>

                          <td>{anomaly.Customer_Name || "-"}</td>

                          <td>{anomaly.Anomaly_Reason || "Unusual order pattern"}</td>

                          <td>
                            {Number(anomaly.Anomaly_Score).toFixed(4)}
                          </td>

                          <td>{anomaly.Order_Date || "-"}</td>

                          <td>
                            <span
                              className={`status ${
                                status === "Resolved"
                                  ? "green"
                                  : status === "Under Review"
                                  ? "yellow"
                                  : "red"
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            <button
                              className="table-action-btn"
                              onClick={() => setSelectedAnomaly(anomaly)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                </table>

            </div>

            </div>

            
            {/* ANOMALY DETAILS MODAL */}
            {selectedAnomaly && (() => {
              const orderId = String(selectedAnomaly.Order_ID || "");
              const status = anomalyReviewStatuses[orderId] || "Detected";

              const reasons = selectedAnomaly.Anomaly_Reason || "";
              const reasonTags = [];

              if (reasons.includes("Unusually high order quantity")) {
                reasonTags.push("High Order Quantity");
              }

              if (reasons.includes("Frequent orders within 7 days")) {
                reasonTags.push("Frequent Orders");
              }

              if (reasonTags.length === 0) {
                reasonTags.push("Unusual Order Pattern");
              }

              const details = [
                ["Order ID", selectedAnomaly.Order_ID || "-"],
                ["Customer", selectedAnomaly.Customer_Name || "-"],
                ["Quantity", `${selectedAnomaly.Quantity ?? 0} units`],
                ["Previous 7 Days", `${selectedAnomaly.Order_Frequency_7D ?? 0} orders`],
                ["Order Date", selectedAnomaly.Order_Date || "-"],
                ["Anomaly Score", Number(selectedAnomaly.Anomaly_Score).toFixed(4)]
              ];

              return (
                <div
                  className="anomaly-modal-overlay"
                  onClick={() => setSelectedAnomaly(null)}
                >
                  <div
                    className="anomaly-modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >

                    <div className="anomaly-modal-header">
                      <div>
                        <h3>Anomaly Details</h3>
                        <p>Review flagged order information</p>
                      </div>

                      <button
                        className="anomaly-modal-close"
                        onClick={() => setSelectedAnomaly(null)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="anomaly-details-grid">
                      {details.map(([label, value]) => (
                        <div className="anomaly-detail-item" key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="anomaly-detection-reason">
                      <span className="anomaly-section-label">
                        Detection Reason
                      </span>

                      <div className="anomaly-reason-tags">
                        {reasonTags.map((reason) => (
                          <span className="anomaly-reason-tag" key={reason}>
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="anomaly-review-row">
                      <span>Review Status</span>

                      <span className={`status ${
                        status === "Resolved"
                          ? "green"
                          : status === "Under Review"
                          ? "yellow"
                          : "red"
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="anomaly-modal-actions">
                      <button
                        className="anomaly-btn-close"
                        onClick={() => setSelectedAnomaly(null)}
                      >
                        Close
                      </button>

                      {status === "Detected" && (
                        <button
                          disabled={anomalySaving}
                          onClick={() =>
                            updateAnomalyStatus(selectedAnomaly, "Under Review")
                          }
                        >
                          Start Review
                        </button>
                      )}

                      {status === "Under Review" && (
                        <button
                          disabled={anomalySaving}
                          onClick={() =>
                            updateAnomalyStatus(selectedAnomaly, "Resolved")
                          }
                        >
                          Resolve
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}
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