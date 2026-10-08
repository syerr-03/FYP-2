import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs
} from "firebase/firestore";
import "./OperatorDashboard.css";

function OperatorDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [importedOrders, setImportedOrders] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // =========================
        // FETCH ORDERS
        // =========================
        const orderSnapshot = await getDocs(
          collection(db, "orders")
        );

        const orders = orderSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setImportedOrders(orders);


        // =========================
        // FETCH INVENTORY
        // =========================
        const inventorySnapshot = await getDocs(
          collection(db, "inventory")
        );

        const inventory = inventorySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Inventory from Firebase:", inventory);

        setInventoryData(inventory);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

const formatExcelDate = (value) => {
  if (!value) return "-";

  const numericValue = Number(value);

    if (!isNaN(numericValue) && numericValue > 40000) {
      const excelEpoch = new Date(1899, 11, 30);

      const date = new Date(
        excelEpoch.getTime() +
        numericValue * 24 * 60 * 60 * 1000
      );

      return date.toISOString().split("T")[0];
    }

    return value;
  };

  const newOrders = importedOrders.filter(
  (order) => (order.Order_Status || "New Order") === "New Order"
);

const processingOrders = importedOrders.filter((order) =>
  [
    "Processing",
    "Preparing",
    "Prepared",
    "Waiting QC",
    "QC Approved",
    "Hold",
  ].includes(order.Order_Status)
);

const handleProcessOrder = async () => {
  if (!selectedOrder) return;

  try {
    let enoughStock = true;

    // Check every product in the order
    for (const item of selectedOrder.items) {
      const productRef = doc(
        db,
        "inventory",
        String(item.Product_Code)
      );

      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        enoughStock = false;
        break;
      }

      const stockData = productSnap.data();

      const availableStock =
        Number(stockData.Available_Stock || 0);

      const orderQty =
        Number(item.Quantity || 0);

      if (availableStock < orderQty) {
        enoughStock = false;
        break;
      }
    }

    const processedAt = new Date().toISOString();

    // =========================
    // STOCK ENOUGH
    // =========================
    if (enoughStock) {

      for (const item of selectedOrder.items) {
        const productRef = doc(
          db,
          "inventory",
          String(item.Product_Code)
        );

        const productSnap = await getDoc(productRef);
        const stockData = productSnap.data();

        const qty = Number(item.Quantity || 0);

        const newReserved =
          Number(stockData.Reserved_Stock || 0) + qty;

        const newAvailable =
          Number(stockData.Available_Stock || 0) - qty;

        await setDoc(
          productRef,
          {
            Reserved_Stock: newReserved,
            Available_Stock: newAvailable,
          },
          { merge: true }
        );
      }

      await setDoc(
        doc(db, "orders", selectedOrder.Order_ID),
        {
          Order_Status: "Processing",
          Stock_Status: "Reserved",
          Processed_At: processedAt,
        },
        { merge: true }
      );

      setImportedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.Order_ID === selectedOrder.Order_ID
            ? {
                ...order,
                Order_Status: "Processing",
                Stock_Status: "Reserved",
                Processed_At: processedAt,
              }
            : order
        )
      );

    }

    // =========================
    // STOCK NOT ENOUGH
    // =========================
    else {

      await setDoc(
        doc(db, "orders", selectedOrder.Order_ID),
        {
          Order_Status: "Hold",
          Stock_Status: "Waiting Stock",
          Processed_At: processedAt,
        },
        { merge: true }
      );

      setImportedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.Order_ID === selectedOrder.Order_ID
            ? {
                ...order,
                Order_Status: "Hold",
                Stock_Status: "Waiting Stock",
                Processed_At: processedAt,
              }
            : order
        )
      );
    }

    setSelectedOrder(null);
    setActivePage("processing");

  } catch (error) {
    console.error("Error processing order:", error);
  }
};


const importInventoryFromMaster = async () => {
  try {
    const response = await fetch(
      "/data/FYP_Master_All_43_Products_Related.xlsx"
    );

    const arrayBuffer = await response.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
    });

    const worksheet = workbook.Sheets["Stock_Model_Input"];

    const stockData = XLSX.utils.sheet_to_json(worksheet);

    // Cari latest year dan month untuk setiap product
    const latestStock = {};

    stockData.forEach((row) => {
      const productCode = row.Product_Code;

      if (!productCode) return;

      const currentKey =
        Number(row.Year) * 100 +
        Number(row.Month_Number);

      const existingKey = latestStock[productCode]
        ? Number(latestStock[productCode].Year) * 100 +
          Number(latestStock[productCode].Month_Number)
        : 0;

      if (currentKey > existingKey) {
        latestStock[productCode] = row;
      }
    });

    const inventoryList = Object.values(latestStock);

    for (const item of inventoryList) {
      const currentStock = Number(item.Ending_Stock || 0);

      await setDoc(
        doc(db, "inventory", String(item.Product_Code)),
        {
          Product_Code: String(item.Product_Code),
          Product_Name: item.Product_Name || "",
          Current_Stock: currentStock,
          Reserved_Stock: 0,
          Available_Stock: currentStock,
          Reorder_Level: Number(item.Reorder_Level || 0),
          Safety_Stock: Number(item.Safety_Stock || 0),
          Lead_Time_Days: Number(item.Lead_Time_Days || 0),
          Stock_Year: Number(item.Year),
          Stock_Month: Number(item.Month_Number),
        },
        { merge: true }
      );
    }

    console.log(
      `${inventoryList.length} inventory products uploaded successfully`
    );

  } catch (error) {
    console.error("Error importing inventory:", error);
  }
};

const syncInventoryToFirebase = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/inventory");
    const result = await response.json();

    const inventoryData = result.data || result;

    for (const item of inventoryData) {
      await setDoc(
        doc(db, "inventory", item.Product_Code),
        {
          Product_Code: item.Product_Code,
          Product_Name: item.Product_Name,
          Current_Stock: item.Current_Stock,
          Reserved_Stock: item.Reserved_Stock,
          Available_Stock: item.Available_Stock,
          Reorder_Level: item.Reorder_Level,
          Safety_Stock: item.Safety_Stock,
          Lead_Time_Days: item.Lead_Time_Days,
          Stock_Year: item.Stock_Year,
          Stock_Month: item.Stock_Month,
        },
        { merge: true }
      );
    }

    console.log("Inventory synced to Firebase successfully");
    alert("Inventory synced successfully");
  } catch (error) {
    console.error("Error syncing inventory:", error);
    alert("Failed to sync inventory");
  }
};

const handleStartPreparing = async (order) => {
  try {
    const preparingAt = new Date().toISOString();

    await setDoc(
      doc(db, "orders", order.Order_ID),
      {
        Order_Status: "Preparing",
        Preparing_At: preparingAt,
      },
      { merge: true }
    );

    setImportedOrders((prevOrders) =>
      prevOrders.map((item) =>
        item.Order_ID === order.Order_ID
          ? {
              ...item,
              Order_Status: "Preparing",
              Preparing_At: preparingAt,
            }
          : item
      )
    );

  } catch (error) {
    console.error("Error starting preparation:", error);
  }
};

const handleMarkPrepared = async (order) => {
  try {
    const preparedAt = new Date().toISOString();

    await setDoc(
      doc(db, "orders", order.Order_ID),
      {
        Order_Status: "Prepared",
        Prepared_At: preparedAt,
      },
      { merge: true }
    );

    setImportedOrders((prevOrders) =>
      prevOrders.map((item) =>
        item.Order_ID === order.Order_ID
          ? {
              ...item,
              Order_Status: "Prepared",
              Prepared_At: preparedAt,
            }
          : item
      )
    );

  } catch (error) {
    console.error("Error marking order as prepared:", error);
  }
};

const handleSendToQC = async (order) => {
  try {
    const orderRef = doc(db, "orders", order.Order_ID);

    const sentTime = new Date().toISOString();

    await setDoc(
      orderRef,
      {
        Order_Status: "Waiting QC",
        QC_Status: "Pending",
        Sent_To_QC_At: sentTime,
        QC_Viewed: false,
      },
      { merge: true }
    );

    setImportedOrders((prevOrders) =>
      prevOrders.map((item) =>
        item.Order_ID === order.Order_ID
          ? {
              ...item,
              Order_Status: "Waiting QC",
              QC_Status: "Pending",
              Sent_To_QC_At: sentTime,
              QC_Viewed: false,
            }
          : item
      )
    );

    alert(`${order.Order_ID} has been sent to QC.`);
  } catch (error) {
    console.error("Error sending order to QC:", error);
    alert("Failed to send order to QC.");
  }
};

const totalProducts = inventoryData.length;

const totalAvailableStock = inventoryData.reduce(
  (total, item) => total + Number(item.Available_Stock || 0),
  0
);

const lowStockCount = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  return available > 0 && available <= reorder;
}).length;

const outOfStockCount = inventoryData.filter(
  (item) => Number(item.Available_Stock || 0) <= 0
).length;

const filteredInventory = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);
  const safety = Number(item.Safety_Stock || 0);

  let status = "Available";

  if (available <= 0) {
    status = "Out of Stock";
  } else if (available <= safety) {
    status = "Critical";
  } else if (available <= reorder) {
    status = "Low Stock";
  }

  const matchesSearch =
    item.Product_Name?.toLowerCase().includes(
      inventorySearch.toLowerCase()
    ) ||
    item.Product_Code?.toLowerCase().includes(
      inventorySearch.toLowerCase()
    );

  const matchesFilter =
    stockFilter === "All" ||
    status === stockFilter;

  return matchesSearch && matchesFilter;
});


  return (
    <div className="operator-layout">

      <aside className="operator-sidebar">
        <div>
          <h2 className="operator-brand">OrderAI</h2>

          <nav>

            <a
              className={
                activePage === "dashboard"
                  ? "operator-active"
                  : ""
              }
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </a>

            <a
              className={
                activePage === "newOrders"
                  ? "operator-active"
                  : ""
              }
              onClick={() => setActivePage("newOrders")}
            >
              New Orders
            </a>

            <a
                className={
                    activePage === "processing"
                    ? "operator-active"
                    : ""
                }
                onClick={() => setActivePage("processing")}
                >
                Order Processing
                </a>
            <a
                className={
                    activePage === "inventory"
                    ? "operator-active"
                    : ""
                }
                onClick={() => setActivePage("inventory")}
                >
                Inventory
                </a>
            <a
                className={
                    activePage === "delivery"
                    ? "operator-active"
                    : ""
                }
                onClick={() => setActivePage("delivery")}
                >
                Delivery Status
                </a>
            <a
                className={
                    activePage === "alerts"
                    ? "operator-active"
                    : ""
                }
                onClick={() => setActivePage("alerts")}
                >
                Alerts
                </a>
            <a
                className={
                    activePage === "reports"
                    ? "operator-active"
                    : ""
                }
                onClick={() => setActivePage("reports")}
                >
                Reports
                </a>

          </nav>
        </div>

        <button
          className="operator-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </aside>


      <main className="operator-main">

        {/* =========================
            DASHBOARD
        ========================== */}

        {activePage === "dashboard" && (
          <>
            <div className="operator-topbar">

              <div>
                <h1>Operator Dashboard</h1>
                <p>
                  Daily Order Processing & Inventory Operations
                </p>
              </div>

              <div className="operator-profile">

                <div className="operator-profile-circle">
                  O
                </div>

                <div>
                  <strong>Operator</strong>
                  <p>operator001</p>
                </div>

              </div>
            </div>


            <div className="operator-summary-grid">

              <div className="operator-card">
                <p>New Orders</p>
                <h2>18</h2>

                <span className="operator-pink">
                  Waiting to process
                </span>
              </div>


              <div className="operator-card">
                <p>Processing</p>
                <h2>12</h2>

                <span className="operator-blue">
                  In progress
                </span>
              </div>


              <div className="operator-card">
                <p>Waiting for QC</p>
                <h2>9</h2>

                <span className="operator-yellow">
                  Pending inspection
                </span>
              </div>


              <div className="operator-card">
                <p>Low Stock Alerts</p>
                <h2>4</h2>

                <span className="operator-red">
                  Attention required
                </span>
              </div>

            </div>


            <div className="operator-dashboard-grid">

              <div className="operator-panel">

                <h3>
                  Order Processing Flow
                </h3>

                <div className="operator-flow">

                  <div className="flow-step flow-new">
                    <span>18</span>
                    <p>New Orders</p>
                  </div>

                  <div className="flow-arrow">
                    →
                  </div>

                  <div className="flow-step flow-processing">
                    <span>12</span>
                    <p>Processing</p>
                  </div>

                  <div className="flow-arrow">
                    →
                  </div>

                  <div className="flow-step flow-prepared">
                    <span>9</span>
                    <p>Prepared</p>
                  </div>

                  <div className="flow-arrow">
                    →
                  </div>

                  <div className="flow-step flow-qc">
                    <span>9</span>
                    <p>Waiting QC</p>
                  </div>

                </div>

              </div>


              <div className="operator-panel">

                <h3>
                  Operational Alerts
                </h3>

                <div className="operator-alert operator-danger-alert">
                  <strong>Low Stock</strong>

                  <p>
                    Product A has only 8 units available.
                  </p>
                </div>


                <div className="operator-alert operator-warning-alert">
                  <strong>Order Pending</strong>

                  <p>
                    3 orders have been pending for more than 2 hours.
                  </p>
                </div>


                <div className="operator-alert operator-success-alert">
                  <strong>Stock Updated</strong>

                  <p>
                    Inventory for Product C was successfully updated.
                  </p>
                </div>

              </div>

            </div>


            <div className="operator-panel">

              <div className="operator-section-header">

                <h3>
                  Current Orders
                </h3>

                <button className="operator-add-btn">
                  + New Order
                </button>

              </div>


              <table>

                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>


                <tbody>

                  <tr>

                    <td>ORD1058</td>
                    <td>Aina</td>
                    <td>Serum A</td>
                    <td>2</td>

                    <td>
                      <span className="operator-status operator-green-status">
                        Available
                      </span>
                    </td>

                    <td>
                      <span className="operator-status operator-pink-status">
                        New Order
                      </span>
                    </td>

                    <td>
                      <button className="operator-action-btn">
                        Process
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1059</td>
                    <td>Farah</td>
                    <td>Cleanser B</td>
                    <td>1</td>

                    <td>
                      <span className="operator-status operator-green-status">
                        Available
                      </span>
                    </td>

                    <td>
                      <span className="operator-status operator-blue-status">
                        Processing
                      </span>
                    </td>

                    <td>
                      <button className="operator-action-btn">
                        Update
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1060</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>4</td>

                    <td>
                      <span className="operator-status operator-yellow-status">
                        Low Stock
                      </span>
                    </td>

                    <td>
                      <span className="operator-status operator-yellow-status">
                        Prepared
                      </span>
                    </td>

                    <td>
                      <button className="operator-action-btn">
                        Send to QC
                      </button>
                    </td>

                  </tr>


                  <tr>

                    <td>ORD1061</td>
                    <td>Sofia</td>
                    <td>Product D</td>
                    <td>5</td>

                    <td>
                      <span className="operator-status operator-red-status">
                        Insufficient
                      </span>
                    </td>

                    <td>
                      <span className="operator-status operator-red-status">
                        Hold
                      </span>
                    </td>

                    <td>
                      <button
                        className="operator-action-btn disabled-btn"
                        disabled
                      >
                        Waiting Stock
                      </button>
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>
          </>
        )}



        {/* =========================
            NEW ORDERS
        ========================== */}

        {activePage === "newOrders" && (
          <>

            <div className="operator-topbar">

              <div>
                <h1>New Orders</h1>

                <p>
                  Review newly received customer orders before processing
                </p>
              </div>


              <div className="operator-profile">

                <div className="operator-profile-circle">
                  O
                </div>

                <div>
                  <strong>Operator</strong>
                  <p>operator001</p>
                </div>

              </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

              <div className="operator-card">
                <p>New Orders</p>

                <h2>
                  {newOrders.length}
                </h2>

                <span className="operator-pink">
                  Waiting to process
                </span>
              </div>


              <div className="operator-card">
                <p>Total Products</p>

                <h2>
                  {importedOrders.reduce(
                    (total, order) => total + order.items.length,
                    0
                  )}
                </h2>

                <span className="operator-green">
                  Imported products
                </span>
              </div>


              <div className="operator-card">
                <p>Total Items</p>

                <h2>
                  {importedOrders.reduce(
                    (orderTotal, order) =>
                      orderTotal +
                      order.items.reduce(
                        (itemTotal, item) =>
                          itemTotal + item.Quantity,
                        0
                      ),
                    0
                  )}
                </h2>

                <span className="operator-yellow">
                  Items received
                </span>
              </div>


              <div className="operator-card">
                <p>Imported File</p>

                <h2>
                  {importFileName ? "1" : "0"}
                </h2>

                <span className="operator-red">
                  {importFileName
                    ? "File imported"
                    : "No file imported"}
                </span>
              </div>

            </div>


            {/* NEW ORDER TABLE */}

            <div className="operator-panel">

              <div className="operator-section-header">

                <div>
                  <h3>Incoming Orders</h3>

                  <p className="operator-section-subtitle">
                    Review imported customer orders before processing
                  </p>
                </div>


                <div className="operator-import-area">

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    id="order-file-input"
                    style={{ display: "none" }}
                    onChange={(e) => {

                      const file = e.target.files[0];

                      if (!file) return;

                      setImportFileName(file.name);

                      const reader = new FileReader();


                      reader.onload = async (event) => {

                        const data =
                          new Uint8Array(event.target.result);


                        const workbook =
                          XLSX.read(data, {
                            type: "array",
                          });


                        const firstSheetName =
                          workbook.SheetNames[0];


                        const worksheet =
                          workbook.Sheets[firstSheetName];


                        const jsonData =
                          XLSX.utils.sheet_to_json(
                            worksheet
                          );


                        const groupedOrders =
                          Object.values(

                            jsonData.reduce(
                              (acc, row) => {

                                const orderId =
                                  row.Order_ID;


                                if (!orderId) {
                                  return acc;
                                }


                                if (!acc[orderId]) {

                                  acc[orderId] = {

                                    Order_ID:
                                      orderId,

                                    Customer_Name:
                                      row.Customer_Name,

                                    Phone_Number:
                                      row.Phone_Number,

                                    Address:
                                      row.Address,

                                    Order_Date:
                                      row.Order_Date,

                                    Order_Time:
                                      row.Order_Time,

                                    Platform:
                                      row.Platform,

                                    items: [],

                                  };
                                }


                                acc[orderId].items.push({

                                  Product_Code:
                                    row.Product_Code,

                                  Product_Name:
                                    row.Product_Name,

                                  Quantity:
                                    Number(
                                      row.Quantity
                                    ) || 0,

                                });


                                return acc;

                              },
                              {}
                            )

                          );


                        console.log(
                          "Grouped Orders:",
                          groupedOrders
                        );


                        setImportedOrders(
                          groupedOrders
                        );
                        for (const order of groupedOrders) {
                          await setDoc(doc(db, "orders", order.Order_ID), {
                            Order_ID: order.Order_ID,
                            Customer_Name: order.Customer_Name || "",
                            Phone_Number: order.Phone_Number || "",
                            Address: order.Address || "",
                            Order_Date: formatExcelDate(order.Order_Date),
                            Order_Time: order.Order_Time || "",
                            Platform: order.Platform || "",
                            items: order.items || [],
                            Order_Status: "New Order",
                          });
                        }

                      };


                      reader.readAsArrayBuffer(
                        file
                      );

                    }}
                  />


                  <label
                    htmlFor="order-file-input"
                    className="operator-import-btn"
                  >
                    Import Orders
                  </label>

                </div>

              </div>


              {/* SELECTED FILE */}

              {importFileName && (

                <div className="operator-import-file">

                  Selected file: {importFileName}

                </div>

              )}


              {/* FILTER */}

              <div className="operator-new-order-filters">

                <input
                  type="text"
                  placeholder="Search Order ID or Customer..."
                />


                <select>

                  <option>
                    All Platforms
                  </option>

                  <option>
                    Shopee
                  </option>

                  <option>
                    TikTok
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>


              {/* TABLE */}

              <table>

                <thead>

                  <tr>

                    <th>
                      Order ID
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Products
                    </th>

                    <th>
                      Total Items
                    </th>

                    <th>
                      Order Date
                    </th>

                    <th>
                      Order Time
                    </th>

                    <th>
                      Platform
                    </th>

                    <th>
                      Order Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {newOrders.length > 0 ? (
                    newOrders.map(
                      (order) => {

                        const totalItems =
                          order.items.reduce(

                            (total, item) =>
                              total +
                              item.Quantity,

                            0

                          );


                        return (

                          <tr
                            key={order.Order_ID}
                          >

                            <td>
                              {order.Order_ID}
                            </td>


                            <td>
                              {order.Customer_Name ||
                                "-"}
                            </td>


                            <td>
                              {order.items
                                .map((item) => item.Product_Name)
                                .join(", ")}
                            </td>


                            <td>
                              {totalItems}
                            </td>


                            <td>
                              {formatExcelDate(order.Order_Date)}
                            </td>


                            <td>
                              {order.Order_Time ||
                                "-"}
                            </td>


                            <td>
                              {order.Platform ||
                                "-"}
                            </td>


                            <td>

                              <span className="operator-status operator-pink-status">

                                New Order

                              </span>

                            </td>


                            <td>

                              <button

                                className="operator-action-btn"

                                onClick={() =>
                                  setSelectedOrder(
                                    order
                                  )
                                }

                              >

                                View

                              </button>

                            </td>

                          </tr>

                        );

                      }
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                        }}
                      >

                        No orders imported yet.

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>


    {/* =========================
        ORDER DETAILS MODAL
    ========================== */}

    {selectedOrder && (

      <div className="operator-modal-overlay">


        <div className="operator-modal">


          {/* MODAL HEADER */}

          <div className="operator-modal-header">

            <h3>
              Order Details
            </h3>


            <button

              className="operator-modal-close"

              onClick={() =>
                setSelectedOrder(null)
              }

            >

              ×

            </button>

          </div>


          {/* CUSTOMER INFORMATION */}

          <div className="operator-modal-info">

            <p>
              <strong>
                Order ID:
              </strong>{" "}

              {selectedOrder.Order_ID}
            </p>


            <p>
              <strong>
                Customer:
              </strong>{" "}

              {selectedOrder.Customer_Name ||
                "-"}
            </p>


            <p>
              <strong>
                Phone:
              </strong>{" "}

              {selectedOrder.Phone_Number ||
                "-"}
            </p>


            <p>
              <strong>
                Platform:
              </strong>{" "}

              {selectedOrder.Platform ||
                "-"}
            </p>


            <p>
              <strong>
                Date:
              </strong>{" "}

              {formatExcelDate(selectedOrder.Order_Date)}
            </p>


            <p>
              <strong>
                Time:
              </strong>{" "}

              {selectedOrder.Order_Time ||
                "-"}
            </p>

          </div>


          {/* ADDRESS */}

          <div className="operator-modal-address">

            <p>

              <strong>
                Delivery Address:
              </strong>

            </p>

            <p>

              {selectedOrder.Address ||
                "-"}

            </p>

          </div>


          {/* ORDER ITEMS */}

          <h4>
            Order Items
          </h4>


          <table className="operator-modal-table">

            <thead>

              <tr>

                <th>
                  Product Code
                </th>

                <th>
                  Product
                </th>

                <th>
                  Qty
                </th>

              </tr>

            </thead>


            <tbody>

              {selectedOrder.items?.map(
                (item, index) => (

                  <tr key={index}>

                    <td>
                      {item.Product_Code ||
                        "-"}
                    </td>

                    <td>
                      {item.Product_Name ||
                        "-"}
                    </td>

                    <td>
                      {item.Quantity}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>


          {/* MODAL FOOTER */}

          <div className="operator-modal-footer">

            <strong>

              Total Items:{" "}

              {selectedOrder.items?.reduce(

                (total, item) =>
                  total +
                  item.Quantity,

                0

              )}

            </strong>


            <div className="operator-modal-actions">

              <button

                className="operator-modal-cancel"

                onClick={() =>
                  setSelectedOrder(null)
                }

              >

                Close

              </button>


              <button
                className="operator-action-btn"
                onClick={handleProcessOrder}
              >
                Process Order
              </button>

            </div>

          </div>


        </div>

      </div>

    )}

  </>
)}

        {/* =========================
            ORDER PROCESSING
        ========================== */}

        {activePage === "processing" && (
        <>
            <div className="operator-topbar">

            <div>
                <h1>Order Processing</h1>

                <p>
                Manage orders currently being prepared for quality inspection
                </p>
            </div>


            <div className="operator-profile">

                <div className="operator-profile-circle">
                O
                </div>

                <div>
                <strong>Operator</strong>
                <p>operator001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

            <div className="operator-card">
                <p>Processing</p>
                <h2>12</h2>

                <span className="operator-blue">
                In progress
                </span>
            </div>


            <div className="operator-card">
                <p>Preparing</p>
                <h2>7</h2>

                <span className="operator-yellow">
                Being prepared
                </span>
            </div>


            <div className="operator-card">
                <p>Prepared</p>
                <h2>9</h2>

                <span className="operator-green">
                Ready for QC
                </span>
            </div>


            <div className="operator-card">
                <p>On Hold</p>
                <h2>3</h2>

                <span className="operator-red">
                Requires attention
                </span>
            </div>

            </div>


            {/* PROCESSING TABLE */}

            <div className="operator-panel">

            <div className="operator-section-header">

                <div>
                <h3>Active Order Processing</h3>

                <p className="operator-section-subtitle">
                    Update order progress before sending the order to QC
                </p>
                </div>

            </div>


            <div className="operator-processing-filters">

                <input
                type="text"
                placeholder="Search Order ID or Customer..."
                />


                <select>

                <option>
                    All Processing Status
                </option>

                <option>
                    Processing
                </option>

                <option>
                    Preparing
                </option>

                <option>
                    Prepared
                </option>

                <option>
                    Hold
                </option>

                </select>

            </div>


            <table className="operator-processing-table">

                <thead>

                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Processed At</th>
                    <th>Stock Status</th>
                    <th>Processing Status</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                  {processingOrders.length > 0 ? (
                    processingOrders.map((order) => {
                      const totalQty =
                        order.items?.reduce(
                          (total, item) => total + Number(item.Quantity || 0),
                          0
                        ) || 0;

                      const productNames =
                        order.items
                          ?.map((item) => item.Product_Name)
                          .filter(Boolean)
                          .join(", ") || "-";

                      const processedDate = order.Processed_At
                        ? new Date(order.Processed_At)
                        : null;

                      return (
                        <tr key={order.Order_ID}>

                          <td>{order.Order_ID}</td>

                          <td>
                            {order.Customer_Name || "-"}
                          </td>

                          <td>
                            {productNames}
                          </td>

                          <td>
                            {totalQty}
                          </td>

                          <td>
                            {processedDate ? (
                              <>
                                {processedDate.toLocaleDateString("en-GB")}
                                <br />
                                {processedDate.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                order.Stock_Status === "Reserved"
                                  ? "operator-status operator-green-status"
                                  : "operator-status operator-red-status"
                              }
                            >
                              {order.Stock_Status || "-"}
                            </span>
                          </td>

                          <td>
                            <span className="operator-status operator-blue-status">
                              {order.Order_Status}
                            </span>
                          </td>

                         <td>
                            {order.Order_Status === "Processing" && (
                              <button
                                className="operator-action-btn"
                                onClick={() => handleStartPreparing(order)}
                                disabled={order.Stock_Status !== "Reserved"}
                              >
                                Start Preparing
                              </button>
                            )}

                            {order.Order_Status === "Preparing" && (
                              <button
                                className="operator-action-btn"
                                onClick={() => handleMarkPrepared(order)}
                              >
                                Mark Prepared
                              </button>
                            )}

                            {order.Order_Status === "Prepared" && (
                              <button
                                className="operator-action-btn"
                                onClick={() => handleSendToQC(order)}
                              >
                                Send to QC
                              </button>
                            )}

                            {order.Order_Status === "Waiting QC" && (
                              <button
                                className="operator-action-btn"
                                disabled
                                style={{
                                  backgroundColor: "#d1d5db",
                                  color: "#6b7280",
                                  cursor: "not-allowed",
                                }}
                              >
                                Sent to QC
                              </button>
                            )}

                            {order.Order_Status === "Hold" && (
                              <button
                                className="operator-action-btn disabled-btn"
                                disabled
                              >
                                Waiting Stock
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center" }}
                      >
                        No orders currently being processed.
                      </td>
                    </tr>
                  )}
                </tbody>

            </table>

            </div>
        </>
        )}

        {/* =========================
            INVENTORY
        ========================== */}

        {activePage === "inventory" && (
        <>
            <div className="operator-topbar">

            <div>
              <h1>Inventory</h1>

              <p>
                Check current stock availability for order processing
              </p>

              <button
                className="operator-action-btn"
                onClick={syncInventoryToFirebase}
              >
                Sync Inventory
              </button>
            </div>


            <div className="operator-profile">

                <div className="operator-profile-circle">
                O
                </div>

                <div>
                <strong>Operator</strong>
                <p>operator001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

            <div className="operator-card">
                <p>Total Products</p>
                <h2>{totalProducts}</h2>

                <span className="operator-pink">
                Active products
                </span>
            </div>


            <div className="operator-card">
                <p>Available Stock</p>
                <h2>{totalAvailableStock}</h2>

                <span className="operator-green">
                Ready for orders
                </span>
            </div>


            <div className="operator-card">
                <p>Low Stock</p>
                <h2>{lowStockCount}</h2>

                <span className="operator-yellow">
                Monitor closely
                </span>
            </div>


            <div className="operator-card">
                <p>Out of Stock</p>
                <h2>{outOfStockCount}</h2>

                <span className="operator-red">
                Cannot process orders
                </span>
            </div>

            </div>


            {/* STOCK ALERTS */}

            <div className="operator-dashboard-grid">

            <div className="operator-panel">

                <h3>Stock Overview</h3>

                <div className="operator-inventory-filters">

                  <input
                    type="text"
                    placeholder="Search Product ID or Product Name..."
                    value={inventorySearch}
                    onChange={(e) =>
                      setInventorySearch(e.target.value)
                    }
                  />

                  <select
                    value={stockFilter}
                    onChange={(e) =>
                      setStockFilter(e.target.value)
                    }
                  >
                    <option value="All">All Stock Status</option>
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Critical">Critical</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>

                </div>

                <div className="operator-inventory-list">
                  {filteredInventory.map((item) => {
                    const available = Number(item.Available_Stock || 0);
                    const reorder = Number(item.Reorder_Level || 0);
                    const safety = Number(item.Safety_Stock || 0);

                    let statusText = "Available";
                    let statusClass = "operator-green-status";

                    if (available <= 0) {
                      statusText = "Out of Stock";
                      statusClass = "operator-red-status";
                    } else if (available <= safety) {
                      statusText = "Critical";
                      statusClass = "operator-red-status";
                    } else if (available <= reorder) {
                      statusText = "Low Stock";
                      statusClass = "operator-yellow-status";
                    }

                    return (
                      <div
                        className="operator-inventory-item"
                        key={item.Product_Code}
                      >
                        <div>
                          <strong>{item.Product_Name}</strong>
                          <p>{item.Product_Code}</p>
                        </div>

                        <span
                          className={`operator-status ${statusClass}`}
                        >
                          {available} {statusText}
                        </span>
                      </div>
                    );
                    })}
                </div>

                </div>


                <div className="operator-panel">

                  <h3>Inventory Alerts</h3>

                  <div className="operator-alert operator-danger-alert">
                    <strong>Critical Stock</strong>
                    <p>
                      Products with critically low stock require attention.
                    </p>
                  </div>

                  <div className="operator-alert operator-warning-alert">
                    <strong>Low Stock Warning</strong>
                    <p>
                      Some products are approaching their reorder level.
                    </p>
                  </div>

                  <div className="operator-alert operator-success-alert">
                    <strong>Stock Stable</strong>
                    <p>
                      Other products currently have sufficient stock.
                    </p>
                  </div>

                </div>

                </div>


                {/* INVENTORY TABLE */}

            <div className="operator-panel">

            <div className="operator-section-header">

                <div>
                <h3>Product Inventory</h3>

                <p className="operator-section-subtitle">
                    View available and reserved stock for active products
                </p>
                </div>

            </div>


            <div className="operator-inventory-filters">

              <input
                type="text"
                placeholder="Search Product ID or Product Name..."
                value={inventorySearch}
                onChange={(e) =>
                  setInventorySearch(e.target.value)
                }
              />

              <select
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(e.target.value)
                }
              >
                <option value="All">
                  All Stock Status
                </option>

                <option value="Available">
                  Available
                </option>

                <option value="Low Stock">
                  Low Stock
                </option>

                <option value="Critical">
                  Critical
                </option>

                <option value="Out of Stock">
                  Out of Stock
                </option>
              </select>

            </div>


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
                </tr>

                </thead>


                <tbody>
                  {filteredInventory.map((item) => {
                    const current = Number(item.Current_Stock || 0);
                    const reserved = Number(item.Reserved_Stock || 0);
                    const available = Number(item.Available_Stock || 0);
                    const reorder = Number(item.Reorder_Level || 0);
                    const safety = Number(item.Safety_Stock || 0);

                    let statusText = "In Stock";
                    let statusClass = "operator-green-status";

                    if (available <= 0) {
                      statusText = "Out of Stock";
                      statusClass = "operator-red-status";
                    } else if (available <= safety) {
                      statusText = "Critical";
                      statusClass = "operator-red-status";
                    } else if (available <= reorder) {
                      statusText = "Low Stock";
                      statusClass = "operator-yellow-status";
                    }

                    return (
                      <tr key={item.Product_Code}>
                        <td>{item.Product_Code}</td>
                        <td>{item.Product_Name}</td>
                        <td>{current}</td>
                        <td>{reserved}</td>
                        <td>{available}</td>
                        <td>{reorder}</td>

                        <td>
                          <span className={`operator-status ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>

                        <td>
                          {item.Stock_Month}/{item.Stock_Year}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

            </table>

            </div>
        </>
        )}

        {/* =========================
            DELIVERY STATUS
        ========================== */}

        {activePage === "delivery" && (
        <>
            <div className="operator-topbar">

            <div>
                <h1>Delivery Status</h1>

                <p>
                Monitor delivery progress for completed and approved orders
                </p>
            </div>


            <div className="operator-profile">

                <div className="operator-profile-circle">
                O
                </div>

                <div>
                <strong>Operator</strong>
                <p>operator001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

            <div className="operator-card">
                <p>Ready for Delivery</p>
                <h2>8</h2>

                <span className="operator-pink">
                Awaiting dispatch
                </span>
            </div>


            <div className="operator-card">
                <p>Out for Delivery</p>
                <h2>14</h2>

                <span className="operator-blue">
                In transit
                </span>
            </div>


            <div className="operator-card">
                <p>Delivered Today</p>
                <h2>21</h2>

                <span className="operator-green">
                Successfully delivered
                </span>
            </div>


            <div className="operator-card">
                <p>Delayed</p>
                <h2>3</h2>

                <span className="operator-red">
                Requires attention
                </span>
            </div>

            </div>


            {/* DELIVERY OVERVIEW */}

            <div className="operator-dashboard-grid">

            <div className="operator-panel">

                <h3>Delivery Progress</h3>

                <div className="operator-delivery-list">

                <div className="operator-delivery-item">

                    <div>
                    <strong>ORD1065</strong>
                    <p>Aina - Ready for dispatch</p>
                    </div>

                    <span className="operator-status operator-pink-status">
                    Ready
                    </span>

                </div>


                <div className="operator-delivery-item">

                    <div>
                    <strong>ORD1063</strong>
                    <p>Farah - Delivery in progress</p>
                    </div>

                    <span className="operator-status operator-blue-status">
                    Out for Delivery
                    </span>

                </div>


                <div className="operator-delivery-item">

                    <div>
                    <strong>ORD1057</strong>
                    <p>Hana - Delivered successfully</p>
                    </div>

                    <span className="operator-status operator-green-status">
                    Delivered
                    </span>

                </div>

                </div>

            </div>


            <div className="operator-panel">

                <h3>Delivery Alerts</h3>

                <div className="operator-alert operator-danger-alert">
                <strong>Delivery Delay</strong>

                <p>
                    ORD1059 has exceeded the expected delivery time.
                </p>
                </div>


                <div className="operator-alert operator-warning-alert">
                <strong>Pending Dispatch</strong>

                <p>
                    8 approved orders are waiting to be dispatched.
                </p>
                </div>


                <div className="operator-alert operator-success-alert">
                <strong>Delivery Completed</strong>

                <p>
                    21 orders were successfully delivered today.
                </p>
                </div>

            </div>

            </div>


            {/* DELIVERY TABLE */}

            <div className="operator-panel">

            <div className="operator-section-header">

                <div>
                <h3>Delivery Orders</h3>

                <p className="operator-section-subtitle">
                    Track delivery progress and update shipment status
                </p>
                </div>

            </div>


            <div className="operator-delivery-filters">

                <input
                type="text"
                placeholder="Search Order ID or Customer..."
                />


                <select>

                <option>
                    All Delivery Status
                </option>

                <option>
                    Ready for Delivery
                </option>

                <option>
                    Out for Delivery
                </option>

                <option>
                    Delivered
                </option>

                <option>
                    Delayed
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
                    <th>QC Status</th>
                    <th>Delivery Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                <tr>
                    <td>ORD1065</td>
                    <td>Aina</td>
                    <td>Serum A</td>
                    <td>2</td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-pink-status">
                        Ready for Delivery
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    10:20 AM
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        Dispatch
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>ORD1063</td>
                    <td>Farah</td>
                    <td>Cleanser B</td>
                    <td>1</td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-blue-status">
                        Out for Delivery
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:45 AM
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        Mark Delivered
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>ORD1059</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>3</td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-red-status">
                        Delayed
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    08:30 AM
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        Update
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>ORD1057</td>
                    <td>Hana</td>
                    <td>Toner E</td>
                    <td>2</td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Passed
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Delivered
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    08:10 AM
                    </td>

                    <td>
                    <button
                        className="operator-action-btn disabled-btn"
                        disabled
                    >
                        Completed
                    </button>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>
        </>
        )}

        {/* =========================
            ALERTS
        ========================== */}

        {activePage === "alerts" && (
        <>
            <div className="operator-topbar">

            <div>
                <h1>Alerts</h1>

                <p>
                Monitor operational issues that require operator attention
                </p>
            </div>


            <div className="operator-profile">

                <div className="operator-profile-circle">
                O
                </div>

                <div>
                <strong>Operator</strong>
                <p>operator001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

            <div className="operator-card">
                <p>Total Alerts</p>
                <h2>14</h2>

                <span className="operator-pink">
                Active notifications
                </span>
            </div>


            <div className="operator-card">
                <p>Critical</p>
                <h2>4</h2>

                <span className="operator-red">
                Immediate attention
                </span>
            </div>


            <div className="operator-card">
                <p>Warnings</p>
                <h2>7</h2>

                <span className="operator-yellow">
                Monitor closely
                </span>
            </div>


            <div className="operator-card">
                <p>Resolved Today</p>
                <h2>9</h2>

                <span className="operator-green">
                Completed actions
                </span>
            </div>

            </div>


            {/* ALERT OVERVIEW */}

            <div className="operator-dashboard-grid">

            <div className="operator-panel">

                <h3>Alert Categories</h3>

                <div className="operator-alert-category-list">

                <div className="operator-alert-category-item">

                    <div>
                    <strong>Stock Issues</strong>
                    <p>Low, critical or insufficient inventory</p>
                    </div>

                    <span className="operator-status operator-red-status">
                    5 Alerts
                    </span>

                </div>


                <div className="operator-alert-category-item">

                    <div>
                    <strong>Order Delay</strong>
                    <p>Orders taking longer than expected to process</p>
                    </div>

                    <span className="operator-status operator-yellow-status">
                    4 Alerts
                    </span>

                </div>


                <div className="operator-alert-category-item">

                    <div>
                    <strong>Delivery Delay</strong>
                    <p>Orders delayed during delivery</p>
                    </div>

                    <span className="operator-status operator-yellow-status">
                    3 Alerts
                    </span>

                </div>


                <div className="operator-alert-category-item">

                    <div>
                    <strong>QC Return</strong>
                    <p>Orders returned for correction or recheck</p>
                    </div>

                    <span className="operator-status operator-red-status">
                    2 Alerts
                    </span>

                </div>

                </div>

            </div>


            <div className="operator-panel">

                <h3>Priority Alerts</h3>

                <div className="operator-alert operator-danger-alert">
                <strong>Insufficient Stock</strong>

                <p>
                    ORD1072 cannot continue because Product C stock is insufficient.
                </p>
                </div>


                <div className="operator-alert operator-danger-alert">
                <strong>QC Recheck Required</strong>

                <p>
                    ORD1064 was returned by QC and requires correction.
                </p>
                </div>


                <div className="operator-alert operator-warning-alert">
                <strong>Processing Delay</strong>

                <p>
                    ORD1068 has been in processing for more than 2 hours.
                </p>
                </div>

            </div>

            </div>


            {/* ALERT TABLE */}

            <div className="operator-panel">

            <div className="operator-section-header">

                <div>
                <h3>Operational Alerts</h3>

                <p className="operator-section-subtitle">
                    Review alerts and take the required operational action
                </p>
                </div>

            </div>


            <div className="operator-alert-filters">

                <input
                type="text"
                placeholder="Search Alert ID or Order ID..."
                />


                <select>

                <option>
                    All Alert Types
                </option>

                <option>
                    Stock Issue
                </option>

                <option>
                    Order Delay
                </option>

                <option>
                    Delivery Delay
                </option>

                <option>
                    QC Return
                </option>

                </select>


                <select>

                <option>
                    All Status
                </option>

                <option>
                    Active
                </option>

                <option>
                    Monitoring
                </option>

                <option>
                    Resolved
                </option>

                </select>

            </div>


            <table>

                <thead>

                <tr>
                    <th>Alert ID</th>
                    <th>Order ID</th>
                    <th>Alert Type</th>
                    <th>Message</th>
                    <th>Priority</th>
                    <th>Detected At</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                <tr>

                    <td>ALT001</td>
                    <td>ORD1072</td>
                    <td>Stock Issue</td>

                    <td>
                    Product C stock is insufficient
                    </td>

                    <td>
                    <span className="operator-status operator-red-status">
                        Critical
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    10:20 AM
                    </td>

                    <td>
                    <span className="operator-status operator-red-status">
                        Active
                    </span>
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ALT002</td>
                    <td>ORD1064</td>
                    <td>QC Return</td>

                    <td>
                    Packaging issue requires correction
                    </td>

                    <td>
                    <span className="operator-status operator-red-status">
                        Critical
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:50 AM
                    </td>

                    <td>
                    <span className="operator-status operator-yellow-status">
                        Monitoring
                    </span>
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ALT003</td>
                    <td>ORD1068</td>
                    <td>Order Delay</td>

                    <td>
                    Order processing exceeded 2 hours
                    </td>

                    <td>
                    <span className="operator-status operator-yellow-status">
                        Warning
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:30 AM
                    </td>

                    <td>
                    <span className="operator-status operator-yellow-status">
                        Monitoring
                    </span>
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ALT004</td>
                    <td>ORD1059</td>
                    <td>Delivery Delay</td>

                    <td>
                    Expected delivery time has been exceeded
                    </td>

                    <td>
                    <span className="operator-status operator-yellow-status">
                        Warning
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    08:45 AM
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Resolved
                    </span>
                    </td>

                    <td>
                    <button
                        className="operator-action-btn disabled-btn"
                        disabled
                    >
                        Resolved
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
        ========================== */}

        {activePage === "reports" && (
        <>
            <div className="operator-topbar">

            <div>
                <h1>Reports</h1>

                <p>
                View operational activity and order processing reports
                </p>
            </div>


            <div className="operator-profile">

                <div className="operator-profile-circle">
                O
                </div>

                <div>
                <strong>Operator</strong>
                <p>operator001</p>
                </div>

            </div>

            </div>


            {/* SUMMARY */}

            <div className="operator-summary-grid">

            <div className="operator-card">
                <p>Orders Processed Today</p>
                <h2>34</h2>

                <span className="operator-green">
                Daily activity
                </span>
            </div>


            <div className="operator-card">
                <p>Sent to QC</p>
                <h2>21</h2>

                <span className="operator-blue">
                Quality inspection
                </span>
            </div>


            <div className="operator-card">
                <p>Stock Issues</p>
                <h2>5</h2>

                <span className="operator-yellow">
                Inventory attention
                </span>
            </div>


            <div className="operator-card">
                <p>Resolved Alerts</p>
                <h2>9</h2>

                <span className="operator-pink">
                Completed actions
                </span>
            </div>

            </div>


            {/* REPORT TYPES */}

            <div className="operator-report-grid">

            <div className="operator-report-card">

                <h3>
                Order Processing Report
                </h3>

                <p>
                Summary of new orders, processed orders,
                prepared orders and orders sent to QC.
                </p>

                <button className="operator-action-btn">
                View Report
                </button>

            </div>


            <div className="operator-report-card">

                <h3>
                Inventory Activity Report
                </h3>

                <p>
                Summary of reserved stock, available stock
                and stock issues during order processing.
                </p>

                <button className="operator-action-btn">
                View Report
                </button>

            </div>


            <div className="operator-report-card">

                <h3>
                Delivery Activity Report
                </h3>

                <p>
                Summary of dispatched, delivered
                and delayed orders.
                </p>

                <button className="operator-action-btn">
                View Report
                </button>

            </div>


            <div className="operator-report-card">

                <h3>
                Alert Report
                </h3>

                <p>
                Summary of operational alerts,
                warnings and resolved issues.
                </p>

                <button className="operator-action-btn">
                View Report
                </button>

            </div>

            </div>


            {/* REPORT HISTORY */}

            <div className="operator-panel">

            <div className="operator-section-header">

                <div>
                <h3>Report History</h3>

                <p className="operator-section-subtitle">
                    View previously generated operational reports
                </p>
                </div>

            </div>


            <div className="operator-report-filters">

                <input
                type="text"
                placeholder="Search Report ID or Report Name..."
                />


                <select>

                <option>
                    All Report Types
                </option>

                <option>
                    Order Processing
                </option>

                <option>
                    Inventory Activity
                </option>

                <option>
                    Delivery Activity
                </option>

                <option>
                    Alert Report
                </option>

                </select>

            </div>


            <table>

                <thead>

                <tr>
                    <th>Report ID</th>
                    <th>Report Name</th>
                    <th>Report Type</th>
                    <th>Period</th>
                    <th>Generated Date</th>
                    <th>Generated By</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                <tr>
                    <td>OPR001</td>
                    <td>Daily Order Processing</td>
                    <td>Order Processing</td>
                    <td>Daily</td>

                    <td>
                    25/09/2026
                    <br />
                    05:00 PM
                    </td>

                    <td>Operator 01</td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>OPR002</td>
                    <td>Stock Activity Summary</td>
                    <td>Inventory Activity</td>
                    <td>Daily</td>

                    <td>
                    24/09/2026
                    <br />
                    05:00 PM
                    </td>

                    <td>Operator 01</td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>OPR003</td>
                    <td>Delivery Status Summary</td>
                    <td>Delivery Activity</td>
                    <td>Weekly</td>

                    <td>
                    23/09/2026
                    <br />
                    04:30 PM
                    </td>

                    <td>Operator 01</td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>
                </tr>


                <tr>
                    <td>OPR004</td>
                    <td>Operational Alert Summary</td>
                    <td>Alert Report</td>
                    <td>Weekly</td>

                    <td>
                    22/09/2026
                    <br />
                    03:45 PM
                    </td>

                    <td>Operator 01</td>

                    <td>
                    <button className="operator-action-btn">
                        View
                    </button>
                    </td>
                </tr>

                </tbody>

            </table>

            </div>
        </>
        )}

      </main>

    </div>
  );
}

export default OperatorDashboard;