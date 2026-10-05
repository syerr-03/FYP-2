import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs
} from "firebase/firestore";
import "./OperatorDashboard.css";

function OperatorDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [importedOrders, setImportedOrders] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));

      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setImportedOrders(orders);

    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  fetchOrders();
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
                  {importedOrders.length}
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

                  {importedOrders.length > 0 ? (

                    importedOrders.map(
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

                              {order.items.length}{" "}

                              {order.items.length === 1
                                ? "Product"
                                : "Products"}

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


            <table>

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

                <tr>

                    <td>ORD1070</td>
                    <td>Aina</td>
                    <td>Serum A</td>
                    <td>2</td>

                    <td>
                    25/09/2026
                    <br />
                    10:10 AM
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Reserved
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-blue-status">
                        Processing
                    </span>
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        Start Preparing
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ORD1068</td>
                    <td>Nadia</td>
                    <td>Cleanser B</td>
                    <td>2</td>

                    <td>
                    25/09/2026
                    <br />
                    09:50 AM
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Reserved
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-yellow-status">
                        Preparing
                    </span>
                    </td>

                    <td>
                    <button className="operator-action-btn">
                        Mark Prepared
                    </button>
                    </td>

                </tr>


                <tr>

                    <td>ORD1067</td>
                    <td>Hana</td>
                    <td>Toner E</td>
                    <td>3</td>

                    <td>
                    25/09/2026
                    <br />
                    09:25 AM
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
                        Reserved
                    </span>
                    </td>

                    <td>
                    <span className="operator-status operator-green-status">
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

                    <td>ORD1066</td>
                    <td>Amir</td>
                    <td>Product C</td>
                    <td>5</td>

                    <td>
                    25/09/2026
                    <br />
                    09:15 AM
                    </td>

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
                <h2>48</h2>

                <span className="operator-pink">
                Active products
                </span>
            </div>


            <div className="operator-card">
                <p>Available Stock</p>
                <h2>2,450</h2>

                <span className="operator-green">
                Ready for orders
                </span>
            </div>


            <div className="operator-card">
                <p>Low Stock</p>
                <h2>7</h2>

                <span className="operator-yellow">
                Monitor closely
                </span>
            </div>


            <div className="operator-card">
                <p>Out of Stock</p>
                <h2>3</h2>

                <span className="operator-red">
                Cannot process orders
                </span>
            </div>

            </div>


            {/* STOCK ALERTS */}

            <div className="operator-dashboard-grid">

            <div className="operator-panel">

                <h3>Stock Overview</h3>

                <div className="operator-inventory-list">

                <div className="operator-inventory-item">

                    <div>
                    <strong>Serum A</strong>
                    <p>PRD001</p>
                    </div>

                    <span className="operator-status operator-green-status">
                    120 Available
                    </span>

                </div>


                <div className="operator-inventory-item">

                    <div>
                    <strong>Cleanser B</strong>
                    <p>PRD002</p>
                    </div>

                    <span className="operator-status operator-yellow-status">
                    35 Low Stock
                    </span>

                </div>


                <div className="operator-inventory-item">

                    <div>
                    <strong>Product C</strong>
                    <p>PRD003</p>
                    </div>

                    <span className="operator-status operator-red-status">
                    8 Critical
                    </span>

                </div>

                </div>

            </div>


            <div className="operator-panel">

                <h3>Inventory Alerts</h3>

                <div className="operator-alert operator-danger-alert">
                <strong>Critical Stock</strong>

                <p>
                    Product C has only 8 units available.
                </p>
                </div>


                <div className="operator-alert operator-warning-alert">
                <strong>Low Stock Warning</strong>

                <p>
                    Cleanser B is approaching minimum stock level.
                </p>
                </div>


                <div className="operator-alert operator-success-alert">
                <strong>Stock Stable</strong>

                <p>
                    Most products currently have sufficient stock.
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
                />


                <select>

                <option>
                    All Stock Status
                </option>

                <option>
                    In Stock
                </option>

                <option>
                    Low Stock
                </option>

                <option>
                    Critical
                </option>

                <option>
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

                <tr>
                    <td>PRD001</td>
                    <td>Serum A</td>
                    <td>150</td>
                    <td>30</td>
                    <td>120</td>
                    <td>40</td>

                    <td>
                    <span className="operator-status operator-green-status">
                        In Stock
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    10:00 AM
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
                    <span className="operator-status operator-yellow-status">
                        Low Stock
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:50 AM
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
                    <span className="operator-status operator-red-status">
                        Critical
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:45 AM
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
                    <span className="operator-status operator-red-status">
                        Out of Stock
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:30 AM
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
                    <span className="operator-status operator-green-status">
                        In Stock
                    </span>
                    </td>

                    <td>
                    25/09/2026
                    <br />
                    09:20 AM
                    </td>
                </tr>

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