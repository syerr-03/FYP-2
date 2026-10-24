import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  runTransaction,
} from "firebase/firestore";
import "./OperatorDashboard.css";

function OperatorDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [importedOrders, setImportedOrders] = useState([]);
  const [importFileName, setImportFileName] = useState(
    localStorage.getItem("lastImportedFile") || ""
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRejectedOrder, setSelectedRejectedOrder] = useState(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionCompleted, setCorrectionCompleted] = useState(false);
  const [sendingForRecheck, setSendingForRecheck] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [newOrderSearch, setNewOrderSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [processingSearch, setProcessingSearch] = useState("");
  const [processingStatusFilter, setProcessingStatusFilter] = useState("All");
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [addStockQty, setAddStockQty] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("All");
  const [openAlert, setOpenAlert] = useState(null);

  useEffect(() => {
  let unsubscribeOrders;

  const fetchData = async () => {
    try {
      // =========================
      // REAL-TIME ORDERS
      // =========================
      unsubscribeOrders = onSnapshot(
        collection(db, "orders"),
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setImportedOrders(orders);
        },
        (error) => {
          console.error("Error listening to orders:", error);
        }
      );

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

  return () => {
    if (unsubscribeOrders) {
      unsubscribeOrders();
    }
  };
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

const filteredNewOrders = newOrders.filter((order) => {
  const searchText = newOrderSearch.toLowerCase();

  const matchesSearch =
    String(order.Order_ID || "")
      .toLowerCase()
      .includes(searchText) ||
    String(order.Customer_Name || "")
      .toLowerCase()
      .includes(searchText);

  const matchesPlatform =
    platformFilter === "All" ||
    order.Platform === platformFilter;

  return matchesSearch && matchesPlatform;
});

const processingOrders = importedOrders.filter((order) =>
  [
    "Processing",
    "Preparing",
    "Prepared",
    "Waiting QC",
    "Rejected by QC",
    "Hold",
  ].includes(order.Order_Status)
);

const filteredProcessingOrders = processingOrders.filter((order) => {
  const searchText = processingSearch.toLowerCase();

  const matchesSearch =
    String(order.Order_ID || "")
      .toLowerCase()
      .includes(searchText) ||
    String(order.Customer_Name || "")
      .toLowerCase()
      .includes(searchText);

  const matchesStatus =
    processingStatusFilter === "All" ||
    order.Order_Status === processingStatusFilter;

  return matchesSearch && matchesStatus;
});

const deliveryOrders = importedOrders.filter((order) => {
  const qcPassed =
    order.QC_Status === "Approved" ||
    order.QC_Result === "Passed" ||
    order.QC_Result === "Passed (After Recheck)";

  const approvedOrderStatus =
    order.Order_Status === "QC Approved" ||
    order.Order_Status === "Ready for Delivery";

  const validDeliveryStatus = [
    "Ready",
    "Pending Delivery",
    "Out for Delivery",
    "Delivered",
    "Delivery Delayed",
    "Not Received",
    "Returned",
    "Canceled",
  ].includes(order.Delivery_Status);

  return qcPassed || approvedOrderStatus || validDeliveryStatus;
});


const filteredDeliveryOrders = deliveryOrders.filter((order) => {
  const searchText = deliverySearch.trim().toLowerCase();

  const productNames = (order.items || [])
    .map((item) => item.Product_Name || "")
    .join(" ")
    .toLowerCase();

  const matchesSearch =
    String(order.Order_ID || "").toLowerCase().includes(searchText) ||
    String(order.Customer_Name || "").toLowerCase().includes(searchText) ||
    productNames.includes(searchText);

  const deliveryStatus =
    order.Delivery_Status === "Pending Delivery"
      ? "Ready"
      : order.Delivery_Status ||
        (order.QC_Status === "Approved" ||
        order.QC_Result === "Passed" ||
        order.QC_Result === "Passed (After Recheck)" ||
        order.Order_Status === "QC Approved" ||
        order.Order_Status === "Ready for Delivery"
          ? "Ready"
          : "-");

  const matchesStatus =
    deliveryStatusFilter === "All" ||
    deliveryStatus === deliveryStatusFilter;

  return matchesSearch && matchesStatus;
});


const updateInventoryStock = async (inventoryItem, stockUpdates) => {
  const updatedAt = new Date().toISOString();

  const productRef = doc(
    db,
    "inventory",
    inventoryItem.id
  );

  await setDoc(
    productRef,
    {
      ...stockUpdates,
      Last_Updated: updatedAt,
    },
    { merge: true }
  );

  const updatedSnap = await getDoc(productRef);

  if (updatedSnap.exists()) {
    const updatedProduct = {
      id: updatedSnap.id,
      ...updatedSnap.data(),
    };

    setInventoryData((prevInventory) =>
      prevInventory.map((stock) =>
        stock.id === updatedProduct.id
          ? updatedProduct
          : stock
      )
    );
  }
};

const handleProcessOrder = async (
  orderToProcess = selectedOrder,
  inventorySource = inventoryData
) => {
  if (!orderToProcess) return;

  const orderItems = Array.isArray(orderToProcess.items)
  ? orderToProcess.items
  : [
      {
        Product_Code: orderToProcess.Product_Code || "",
        Product_Name: orderToProcess.Product_Name || "",
        Quantity: Number(orderToProcess.Quantity || 0),
      },
    ];

  try {
    let enoughStock = true;

    // Check every product in the order
    for (const item of orderItems) {
      const orderProductCode = String(
        item.Product_Code || ""
      )
        .trim()
        .toUpperCase();

      const inventoryItem = inventorySource.find((stock) => {
        const stockCode = String(stock.Product_Code || "")
          .trim()
          .toUpperCase();

        const stockName = String(stock.Product_Name || "")
          .trim()
          .toUpperCase();

        const orderName = String(item.Product_Name || "")
          .trim()
          .toUpperCase();

        return (
          stockCode === orderProductCode ||
          stockName === orderName
        );
      });

      if (!inventoryItem) {
        console.log(
          "Inventory product not found:",
          item.Product_Code
        );

        enoughStock = false;
        break;
      }

      const availableStock = Number(
        inventoryItem.Available_Stock || 0
      );

      const orderQty = Number(item.Quantity || 0);

      console.log("STOCK CHECK:", {
        productCode: item.Product_Code,
        availableStock,
        orderQty,
      });

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

      for (const item of orderItems) {
        const orderProductCode = String(
          item.Product_Code || ""
        )
          .trim()
          .toUpperCase();

        const inventoryItem = inventorySource.find((stock) => {
          const stockCode = String(stock.Product_Code || "")
            .trim()
            .toUpperCase();

          const stockName = String(stock.Product_Name || "")
            .trim()
            .toUpperCase();

          const orderName = String(item.Product_Name || "")
            .trim()
            .toUpperCase();

          return (
            stockCode === orderProductCode ||
            stockName === orderName
          );
        });

        if (!inventoryItem) {
          throw new Error(
            `Inventory not found for ${item.Product_Code}`
          );
        }

        const productRef = doc(
          db,
          "inventory",
          inventoryItem.id
        );

        const stockData = inventoryItem;

        const qty = Number(item.Quantity || 0);

        const newReserved =
          Number(stockData.Reserved_Stock || 0) + qty;

        const newAvailable =
          Number(stockData.Available_Stock || 0) - qty;

        await updateInventoryStock(inventoryItem, {
          Reserved_Stock: newReserved,
          Available_Stock: newAvailable,
        });

      }

      await setDoc(
        doc(db, "orders", orderToProcess.Order_ID),
        {
          Order_Status: "Processing",
          Stock_Status: "Reserved",
          Processed_At: processedAt,
        },
        { merge: true }
      );


      setImportedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.Order_ID === orderToProcess.Order_ID
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
        doc(db, "orders", orderToProcess.Order_ID),
        {
          Order_Status: "Hold",
          Stock_Status: "Waiting Stock",
          Processed_At: processedAt,
        },
        { merge: true }
      );

      setImportedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.Order_ID === orderToProcess.Order_ID
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

const handleSendBackToQC = async (order) => {
  try {
    const sentTime = new Date().toISOString();

    await setDoc(
      doc(db, "orders", order.Order_ID),
      {
        Order_Status: "Waiting QC",
        QC_Status: "Recheck",
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
              QC_Status: "Recheck",
              Sent_To_QC_At: sentTime,
              QC_Viewed: false,
            }
          : item
      )
    );

    setSelectedOrder(null);

    alert(`${order.Order_ID} has been sent back to QC for recheck.`);
  } catch (error) {
    console.error("Error sending order back to QC:", error);
    alert("Failed to send order back to QC.");
  }
};

const handleDeliveryStatus = async (order, newStatus) => {
  try {
    const updatedAt = new Date().toISOString();

    if (newStatus === "Delivered") {
      for (const item of order.items || []) {
        const inventoryItem = inventoryData.find((stock) => {
          const stockCode = String(stock.Product_Code || "")
            .trim()
            .toUpperCase();

          const stockName = String(stock.Product_Name || "")
            .trim()
            .toUpperCase();

          const orderCode = String(item.Product_Code || "")
            .trim()
            .toUpperCase();

          const orderName = String(item.Product_Name || "")
            .trim()
            .toUpperCase();

          return stockCode === orderCode || stockName === orderName;
        });

        if (!inventoryItem) continue;

        const qty = Number(item.Quantity || 0);

        const currentStock = Number(
          inventoryItem.Current_Stock || 0
        );

        const reservedStock = Number(
          inventoryItem.Reserved_Stock || 0
        );

        const newCurrentStock = Math.max(
          0,
          currentStock - qty
        );

        const newReservedStock = Math.max(
          0,
          reservedStock - qty
        );

        const newAvailableStock =
          newCurrentStock - newReservedStock;

        const productRef = doc(
          db,
          "inventory",
          inventoryItem.id
        );

        await setDoc(
          productRef,
          {
            Current_Stock: newCurrentStock,
            Reserved_Stock: newReservedStock,
            Available_Stock: newAvailableStock,
            Last_Updated: updatedAt,          },
          { merge: true }
        );

        setInventoryData((prevInventory) =>
          prevInventory.map((stock) =>
            stock.id === inventoryItem.id
              ? {
                  ...stock,
                  Current_Stock: newCurrentStock,
                  Reserved_Stock: newReservedStock,
                  Available_Stock: newAvailableStock,
                  Last_Updated: updatedAt,
                }
              : stock
          )
        );
      }
    }

    await setDoc(
      doc(db, "orders", order.Order_ID),
      {
        Delivery_Status: newStatus,
        Delivery_Updated_At: updatedAt,
      },
      { merge: true }
    );

    
if (
  [
    "Delivery Delayed",
    "Not Received",
    "Returned",
    "Canceled",
  ].includes(newStatus) &&
  order.Delivery_Status !== newStatus
) {
  await addDoc(collection(db, "delivery_issues"), {
    Order_ID: order.Order_ID,
    Customer_Name: order.Customer_Name || "-",
    items: order.items || [],
    Delivery_Issue_Type: newStatus,
    Delivery_Issue_At: updatedAt,
    Source: "Operator",
  });
}


    setImportedOrders((prevOrders) =>
      prevOrders.map((item) =>
        item.Order_ID === order.Order_ID
          ? {
              ...item,
              Delivery_Status: newStatus,
              Delivery_Updated_At: updatedAt,
            }
          : item
      )
    );
  } catch (error) {
    console.error("Error updating delivery status:", error);
    alert("Failed to update delivery status.");
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

const criticalStockCount = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const safety = Number(item.Safety_Stock || 0);

  return available > 0 && available <= safety;
}).length;

const lowOnlyStockCount = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const safety = Number(item.Safety_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  return available > safety && available <= reorder;
}).length;

const stableStockCount = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  return available > reorder;
}).length;

const waitingQCCount = importedOrders.filter(
  (order) => order.Order_Status === "Waiting QC"
).length;


const readyDeliveryCount = deliveryOrders.filter(
  (order) =>
    order.Delivery_Status === "Ready" ||
    order.Delivery_Status === "Pending Delivery" ||
    (!order.Delivery_Status &&
      (order.QC_Status === "Approved" ||
        order.Order_Status === "QC Approved"))
).length;

const outForDeliveryCount = deliveryOrders.filter(
  (order) => order.Delivery_Status === "Out for Delivery"
).length;

const deliveredCount = deliveryOrders.filter(
  (order) => order.Delivery_Status === "Delivered"
).length;


const lowStockAlertCount = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  return available <= reorder;
}).length;


const outOfStockProducts = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  return available <= 0;
});

const lowStockProducts = inventoryData.filter((item) => {
  const available = Number(item.Available_Stock || 0);
  const reorder = Number(item.Reorder_Level || 0);

  return available > 0 && available <= reorder;
});

const pendingOrders = importedOrders.filter((order) => {
  if (order.Order_Status !== "New Order") return false;

  const orderDate = formatExcelDate(order.Order_Date);
  const orderTime = order.Order_Time || "00:00";
  const receivedAt = new Date(`${orderDate} ${orderTime}`);

  if (Number.isNaN(receivedAt.getTime())) return false;

  const hoursWaiting =
    (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60);

  return hoursWaiting > 2;
});

const deliveryProblemStatuses = [
  "Delivery Delayed",
  "Not Received",
  "Returned",
  "Canceled",
];

const deliveryProblemOrders = importedOrders.filter((order) =>
  deliveryProblemStatuses.includes(order.Delivery_Status)
);

const qcRejectedOrders = importedOrders.filter(
  (order) => order.Order_Status === "Rejected by QC"
);

const recentlyUpdatedStock = inventoryData
  .filter((item) => item.Last_Updated)
  .sort(
    (a, b) =>
      new Date(b.Last_Updated) - new Date(a.Last_Updated)
  )[0];


const processingCount = processingOrders.filter(
  (order) => order.Order_Status === "Processing"
).length;

const preparingCount = processingOrders.filter(
  (order) => order.Order_Status === "Preparing"
).length;

const preparedCount = processingOrders.filter(
  (order) => order.Order_Status === "Prepared"
).length;

const holdCount = processingOrders.filter(
  (order) => order.Order_Status === "Hold"
).length;

const rejectedByQCCount = processingOrders.filter(
  (order) => order.Order_Status === "Rejected by QC"
).length;

const handleAddStock = async () => {
  if (!selectedStockItem) return;

  const qtyToAdd = Number(addStockQty);

  if (!qtyToAdd || qtyToAdd <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  try {
    const currentStock = Number(
      selectedStockItem.Current_Stock || 0
    );

    const reservedStock = Number(
      selectedStockItem.Reserved_Stock || 0
    );

    const newCurrentStock = currentStock + qtyToAdd;

    const newAvailableStock =
      newCurrentStock - reservedStock;

    await updateInventoryStock(selectedStockItem, {
      Current_Stock: newCurrentStock,
      Available_Stock: newAvailableStock,
    });

    const latestInventory = inventoryData.map((item) =>
  item.id === selectedStockItem.id
    ? {
        ...item,
        Current_Stock: newCurrentStock,
        Available_Stock: newAvailableStock,
      }
    : item
);

await recheckHoldOrders(latestInventory);

    alert(
      `${qtyToAdd} unit(s) added to ${selectedStockItem.Product_Name}.`
    );

    setSelectedStockItem(null);
    setAddStockQty("");

  } catch (error) {
    console.error("Error adding stock:", error);
    alert("Failed to add stock.");
  }
};

const recheckHoldOrders = async (latestInventory) => {
  const holdOrders = importedOrders.filter(
    (order) => order.Order_Status === "Hold"
  );

  for (const order of holdOrders) {
    const orderItems = order.items || [];

    const enoughStock = orderItems.every((item) => {
      const inventoryItem = latestInventory.find((stock) => {
        const stockCode = String(stock.Product_Code || "")
          .trim()
          .toUpperCase();

        const stockName = String(stock.Product_Name || "")
          .trim()
          .toUpperCase();

        const orderCode = String(item.Product_Code || "")
          .trim()
          .toUpperCase();

        const orderName = String(item.Product_Name || "")
          .trim()
          .toUpperCase();

        return (
          stockCode === orderCode ||
          stockName === orderName
        );
      });

      if (!inventoryItem) return false;

      return (
        Number(inventoryItem.Available_Stock || 0) >=
        Number(item.Quantity || 0)
      );
    });

    if (enoughStock) {
      await handleProcessOrder(order, latestInventory);
    }
  }
};

const handleSendForRecheck = async () => {
  if (!selectedRejectedOrder || sendingForRecheck) return;

  if (!correctionNote.trim() || !correctionCompleted) {
    alert("Please describe and confirm the corrections first.");
    return;
  }

  setSendingForRecheck(true);

  try {
    const orderRef = doc(
      db,
      "orders",
      selectedRejectedOrder.Order_ID
    );

    await updateDoc(orderRef, {
      Order_Status: "Waiting QC",
      QC_Status: "Recheck",
      QC_Result: "Recheck",

      QC_Viewed: false,

      Operator_Correction_Note: correctionNote.trim(),
      Operator_Corrected_At: new Date().toISOString(),

      Sent_To_QC_At: new Date().toISOString(),
    });

    await addDoc(collection(db, "qc_inspections"), {
      Order_ID: selectedRejectedOrder.Order_ID,
      Customer_Name: selectedRejectedOrder.Customer_Name || "-",
      items: selectedRejectedOrder.items || [],

      QC_Result: "Recheck",
      QC_Inspected_At: new Date().toISOString(),

      QC_Reject_Note: selectedRejectedOrder.QC_Reject_Note || "",
      Operator_Correction_Note: correctionNote.trim(),

      QC_Rejected_Products:
        selectedRejectedOrder.QC_Rejected_Products || [],

      Inspector: "Pending QC Reinspection",
    });

    setImportedOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.Order_ID === selectedRejectedOrder.Order_ID
          ? {
              ...order,
              Order_Status: "Waiting QC",
              QC_Status: "Recheck",
              QC_Result: "Recheck",
              Operator_Correction_Note: correctionNote.trim(),
            }
          : order
      )
    );

    setSelectedRejectedOrder(null);
    setCorrectionNote("");
    setCorrectionCompleted(false);

    alert("Order successfully sent to QC for reinspection.");
  } catch (error) {
    console.error("Error sending order for recheck:", error);
    alert("Failed to send order for recheck.");
  } finally {
    setSendingForRecheck(false);
  }
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
                <h2>{newOrders.length}</h2>

                <span className="operator-pink">
                  Waiting to process
                </span>
              </div>


              <div className="operator-card">
                <p>Processing</p>
                <h2>{processingCount}</h2>

                <span className="operator-blue">
                  In progress
                </span>
              </div>


              <div className="operator-card">
                <p>Waiting for QC</p>
                <h2>{waitingQCCount}</h2>

                <span className="operator-yellow">
                  Pending inspection
                </span>
              </div>


              <div className="operator-card">
                <p>Low Stock Alerts</p>
                <h2>{lowStockAlertCount}</h2>

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

              <div
                className="operator-flow"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "20px",
                  alignItems: "center",
                }}
              >
                  
              {[
                { label: "New Orders", count: newOrders.length, color: "#fce7f3", text: "#be185d", col: 1, row: 1, arrow: "right" },
                { label: "Processing", count: processingCount, color: "#dbeafe", text: "#1d4ed8", col: 2, row: 1, arrow: "right" },
                { label: "Preparing", count: preparingCount, color: "#fef3c7", text: "#92400e", col: 3, row: 1, arrow: "down" },
                { label: "Waiting QC", count: waitingQCCount, color: "#ede9fe", text: "#6d28d9", col: 3, row: 2, arrow: "left" },
                { label: "Ready for Delivery", count: readyDeliveryCount, color: "#fce7f3", text: "#be185d", col: 2, row: 2, arrow: "left" },
                { label: "Out for Delivery", count: outForDeliveryCount, color: "#dbeafe", text: "#1d4ed8", col: 1, row: 2, arrow: "down" },
                { label: "Delivered", count: deliveredCount, color: "#dcfce7", text: "#166534", col: 1, row: 3, arrow: null },
              ]

                .map((step) => (
                  <div
                    key={step.label}
                    style={{
                      gridColumn: step.col,
                      gridRow: step.row,
                      position: "relative",
                      background: step.color,
                      color: step.text,
                      borderRadius: "12px",
                      padding: "20px 8px",
                      textAlign: "center",
                      minWidth: 0,
                    }}
                  >
                    <h2 style={{ margin: "0 0 8px" }}>{step.count}</h2>

                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>
                      {step.label}
                    </p>

                    {step.arrow === "right" && (
                      <span
                        style={{
                          position: "absolute",
                          right: "-12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "18px",
                          color: "#888",
                          zIndex: 2,
                        }}
                      >
                        →
                      </span>
                    )}

                    {step.arrow === "left" && (
                      <span
                        style={{
                          position: "absolute",
                          left: "-12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "18px",
                          color: "#888",
                          zIndex: 2,
                        }}
                      >
                        ←
                      </span>
                    )}

                    {step.arrow === "down" && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-17px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "22px",
                          color: "#888",
                          zIndex: 2,
                        }}
                      >
                        ↓
                      </span>
                    )}
                  </div>
                ))}
              </div>




              </div>


              <div className="operator-panel">

                
              <h3>Operational Alerts</h3>

              
              {deliveryProblemOrders.length > 0 && (
                <div className="operator-alert operator-danger-alert">
                  <div
                    className="operator-alert-header"
                    onClick={() =>
                      setOpenAlert(
                        openAlert === "deliveryProblems" ? null : "deliveryProblems"
                      )
                    }
                  >
                    <div>
                      <strong>Delivery Problems: </strong>
                      <span>
                        {deliveryProblemOrders.length} order(s) have delivery problems.
                      </span>
                    </div>

                    <span className="operator-alert-toggle">
                      {openAlert === "deliveryProblems" ? "−" : "+"}
                    </span>
                  </div>

                  {openAlert === "deliveryProblems" && (
                    <ul className="operator-alert-list">
                      {deliveryProblemOrders.map((order) => (
                        <li key={order.Order_ID}>
                          <strong>{order.Order_ID}</strong>
                          {" — "}
                          {order.Customer_Name || "-"}
                          {" — "}
                          <span style={{ color: "#dc3545" }}>
                            {order.Delivery_Status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}


              
              {outOfStockProducts.length === 0 &&
              lowStockProducts.length === 0 &&
              pendingOrders.length === 0 &&
              deliveryProblemOrders.length === 0 &&
              qcRejectedOrders.length === 0 &&
              !recentlyUpdatedStock ? (

                <div className="operator-alert operator-success-alert">
                  <strong>No Active Alerts</strong>
                  <p>All operations are currently running smoothly.</p>
                </div>
              ) : (
                <>

                
              {qcRejectedOrders.length > 0 && (
                <div className="operator-alert operator-danger-alert">
                  <div
                    className="operator-alert-header"
                    onClick={() =>
                      setOpenAlert(
                        openAlert === "qcRejected" ? null : "qcRejected"
                      )
                    }
                  >
                    <div>
                      <strong>QC Rejected Orders: </strong>
                      <span>
                        {qcRejectedOrders.length} order(s) require correction.
                      </span>
                    </div>

                    <span className="operator-alert-toggle">
                      {openAlert === "qcRejected" ? "−" : "+"}
                    </span>
                  </div>

                  {openAlert === "qcRejected" && (
                    <ul className="operator-alert-list">
                      {qcRejectedOrders.map((order) => (
                        <li key={order.Order_ID}>
                          <strong>{order.Order_ID}</strong>
                          {" — "}
                          {order.Customer_Name || "-"}
                          {" — "}
                          <span style={{ color: "#dc3545" }}>
                            Rejected by QC
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}


                  {outOfStockProducts.length > 0 && (
                    <div className="operator-alert operator-danger-alert">
                      <div
                        className="operator-alert-header"
                        onClick={() =>
                          setOpenAlert(openAlert === "outOfStock" ? null : "outOfStock")
                        }
                      >
                        <div>
                          <strong>Out of Stock: </strong>
                          <span>
                            {outOfStockProducts.length} product(s) are out of stock.
                          </span>
                        </div>

                        <span className="operator-alert-toggle">
                          {openAlert === "outOfStock" ? "−" : "+"}
                        </span>
                      </div>

                      {openAlert === "outOfStock" && (
                        <ul className="operator-alert-list">
                          {outOfStockProducts.map((item) => (
                            <li key={item.id || item.Product_Code}>
                              {item.Product_Name || item.Product_Code} — 0 units available
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {lowStockProducts.length > 0 && (
                    <div className="operator-alert operator-danger-alert">
                      <div
                        className="operator-alert-header"
                        onClick={() =>
                          setOpenAlert(openAlert === "lowStock" ? null : "lowStock")
                        }
                      >
                        <div>
                          <strong>Low Stock: </strong>
                          <span>
                            {lowStockProducts.length} product(s) are running low.
                          </span>
                        </div>

                        <span className="operator-alert-toggle">
                          {openAlert === "lowStock" ? "−" : "+"}
                        </span>
                      </div>

                      {openAlert === "lowStock" && (
                        <ul className="operator-alert-list">
                          {lowStockProducts.map((item) => (
                            <li key={item.id || item.Product_Code}>
                              {item.Product_Name || item.Product_Code} —{" "}
                              {Number(item.Available_Stock || 0)} units available
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {pendingOrders.length > 0 && (
                    <div className="operator-alert operator-warning-alert">
                      <div
                        className="operator-alert-header"
                        onClick={() =>
                          setOpenAlert(openAlert === "pendingOrders" ? null : "pendingOrders")
                        }
                      >
                        
                    <div>
                      <strong>Order Pending: </strong>
                      <span>
                        {pendingOrders.length} order(s) have been waiting for more than 2 hours.
                      </span>
                    </div>


                        <span className="operator-alert-toggle">
                          {openAlert === "pendingOrders" ? "−" : "+"}
                        </span>
                      </div>

                      {openAlert === "pendingOrders" && (
                        <ul className="operator-alert-list">
                          {pendingOrders.map((order) => (
                            <li key={order.Order_ID}>
                              {order.Order_ID} — {order.Customer_Name || "Unknown Customer"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {recentlyUpdatedStock && (
                    <div className="operator-alert operator-success-alert">
                      <div
                        className="operator-alert-header"
                        onClick={() =>
                          setOpenAlert(openAlert === "stockUpdated" ? null : "stockUpdated")
                        }
                      >
                        
                    <div>
                      <strong>Stock Updated: </strong>
                      <span>1 recent stock update detected.</span>
                    </div>


                        <span className="operator-alert-toggle">
                          {openAlert === "stockUpdated" ? "−" : "+"}
                        </span>
                      </div>

                      {openAlert === "stockUpdated" && (
                        <ul className="operator-alert-list">
                          <li>
                            {recentlyUpdatedStock.Product_Name ||
                              recentlyUpdatedStock.Product_Code}{" "}
                            — updated on{" "}
                            {new Date(recentlyUpdatedStock.Last_Updated).toLocaleString("en-GB")}
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}

              {recentlyUpdatedStock && (
                <div className="operator-alert operator-success-alert">
                  <strong>Stock Updated</strong>

                  <p>
                    Inventory for{" "}
                    {recentlyUpdatedStock.Product_Name ||
                      recentlyUpdatedStock.Product_Code}{" "}
                    was last updated on{" "}
                    {new Date(
                      recentlyUpdatedStock.Last_Updated
                    ).toLocaleString("en-GB")}.
                  </p>
                </div>
              )}


              </div>

            </div>


            <div className="operator-panel">

              <div className="operator-section-header">

                <h3>
                  Current Orders
                </h3>

              </div>


              
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Order Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {
                      const currentOrders = importedOrders
                        .filter((order) => {
                          const completedStatuses = ["Delivered", "Canceled"];

                          return (
                            !completedStatuses.includes(order.Order_Status) &&
                            !completedStatuses.includes(order.Delivery_Status)
                          );
                        })
                        .sort((a, b) => {
                          const dateA = new Date(
                            `${formatExcelDate(a.Order_Date)} ${a.Order_Time || "00:00"}`
                          );

                          const dateB = new Date(
                            `${formatExcelDate(b.Order_Date)} ${b.Order_Time || "00:00"}`
                          );

                          return (dateB.getTime() || 0) - (dateA.getTime() || 0);
                        })
                        .slice(0, 5);

                      return currentOrders.length > 0 ? (
                        currentOrders.map((order) => {
                          const productNames = (order.items || [])
                            .map((item) => item.Product_Name)
                            .filter(Boolean)
                            .join(", ");

                          const status =
                            order.Delivery_Status === "Out for Delivery"
                              ? "Out for Delivery"
                              : ["Ready", "Pending Delivery"].includes(order.Delivery_Status)
                              ? "Ready for Delivery"
                              : order.Order_Status === "QC Approved"
                              ? "Ready for Delivery"
                              : order.Order_Status || "New Order";

                          return (
                            <tr key={order.id || order.Order_ID}>
                              <td>{order.Order_ID}</td>

                              <td>{order.Customer_Name || "-"}</td>

                              <td>{productNames || order.Product_Name || "-"}</td>

                              <td>
                                <span className="operator-status operator-blue-status">
                                  {status}
                                </span>
                              </td>

                              <td>{formatExcelDate(order.Order_Date)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                            No active orders.
                          </td>
                        </tr>
                      );
                    })()}
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
                      localStorage.setItem("lastImportedFile", file.name);

                      const reader = new FileReader();


                      
                      reader.onload = async (event) => {
                        try {
                          const data = new Uint8Array(event.target.result);
                          const workbook = XLSX.read(data, { type: "array" });
                          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            defval: "",
                          });

                          // Kenal pasti fail Excel berdasarkan kandungannya
                          const fileHashBuffer = await crypto.subtle.digest(
                            "SHA-256",
                            data
                          );

                          const fileHash = Array.from(
                            new Uint8Array(fileHashBuffer)
                          )
                            .map((byte) => byte.toString(16).padStart(2, "0"))
                            .join("");

                          if (jsonData.length === 0) {
                            alert("Excel file is empty.");
                            return;
                          }

                          // Group existing Order IDs. Blank IDs are separate orders.
                          const groupedMap = new Map();

                          jsonData.forEach((row, index) => {
                            const existingId = String(row.Order_ID ?? "").trim();

                            const groupKey = existingId
                              ? `EXISTING:${existingId}`
                              : `AUTO:${index}`;

                            if (!groupedMap.has(groupKey)) {
                              groupedMap.set(groupKey, {
                                Order_ID: existingId,
                                Customer_Name: row.Customer_Name || "",
                                Phone_Number: row.Phone_Number || "",
                                Address: row.Address || "",
                                Order_Date: row.Order_Date,
                                Order_Time: row.Order_Time || "",
                                Platform: row.Platform || "",
                                items: [],
                              });
                            }

                            groupedMap.get(groupKey).items.push({
                              Product_Code: row.Product_Code || "",
                              Product_Name: row.Product_Name || "",
                              Quantity: Number(row.Quantity) || 0,
                            });
                          });

                          const groupedOrders = Array.from(groupedMap.values());

                          const ordersSnapshot = await getDocs(collection(db, "orders"));
                          let maxOrderNumber = 0;

                          const updateMax = (id) => {
                            const match = /^ORD(\d+)$/i.exec(String(id || ""));
                            if (match) {
                              maxOrderNumber = Math.max(
                                maxOrderNumber,
                                Number(match[1])
                              );
                            }
                          };

                          ordersSnapshot.forEach((snapshot) => {
                            updateMax(snapshot.id);
                            updateMax(snapshot.data().Order_ID);
                          });

                          groupedOrders.forEach((order) => updateMax(order.Order_ID));

                          const counterRef = doc(db, "system_counters", "order_id");

                          let importedCount = 0;
                          let skippedCount = 0;

                          // Import orders with supplied IDs first.
                          const orderedImports = [
                            ...groupedOrders.filter((order) => order.Order_ID),
                            ...groupedOrders.filter((order) => !order.Order_ID),
                          ];

                          for (const [importIndex, order] of orderedImports.entries()) {
                            const result = await runTransaction(db, async (transaction) => {
                              if (order.Order_ID) {
                                const orderRef = doc(db, "orders", order.Order_ID);
                                const existing = await transaction.get(orderRef);

                                if (existing.exists()) return null;

                                transaction.set(orderRef, {
                                  ...order,
                                  Order_Date: formatExcelDate(order.Order_Date),
                                  Order_Status: "New Order",
                                  QC_Status: "Not Started",
                                });

                                return order.Order_ID;
                              }

                              // Semak sama ada order daripada fail ini pernah diimport
                              const importRef = doc(
                                db,
                                "order_import_keys",
                                `${fileHash}_${importIndex}`
                              );

                              const importedSnap = await transaction.get(importRef);

                              if (importedSnap.exists()) {
                                return null;
                              }

                              const counterSnapshot = await transaction.get(counterRef);

                              const previousNumber = counterSnapshot.exists()
                                ? Number(counterSnapshot.data().lastNumber || 0)
                                : 0;

                              let nextNumber =
                                Math.max(previousNumber, maxOrderNumber) + 1;

                              let newOrderRef = null;
                              let generatedId = "";

                              for (let attempt = 0; attempt < 1000; attempt++) {
                                const candidate = `ORD${String(nextNumber).padStart(4, "0")}`;
                                const candidateRef = doc(db, "orders", candidate);

                                const candidateSnap = await transaction.get(candidateRef);

                                if (!candidateSnap.exists()) {
                                  newOrderRef = candidateRef;
                                  generatedId = candidate;
                                  break;
                                }

                                nextNumber++;
                              }

                              if (!newOrderRef) {
                                throw new Error("Unable to generate a unique Order ID.");
                              }

                              transaction.set(counterRef, { lastNumber: nextNumber });

                              // Simpan rekod supaya order tidak diimport dua kali
                              transaction.set(importRef, {
                                Order_ID: generatedId,
                                File_Hash: fileHash,
                                Import_Index: importIndex,
                                Imported_At: new Date().toISOString(),
                              });

                              transaction.set(newOrderRef, {
                                ...order,
                                Order_ID: generatedId,
                                Order_Date: formatExcelDate(order.Order_Date),
                                Order_Status: "New Order",
                                QC_Status: "Not Started",
                              });

                              return generatedId;
                            });

                            if (result) {
                              importedCount++;
                              updateMax(result);
                            } else {
                              skippedCount++;
                            }
                          }

                          alert(
                            `Import completed!\n` +
                            `New orders: ${importedCount}\n` +
                            `Existing orders skipped: ${skippedCount}`
                          );

                        } catch (error) {
                          console.error("Excel import error:", error);
                          alert("Import failed. Check console for details.");
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
                  value={newOrderSearch}
                  onChange={(e) => setNewOrderSearch(e.target.value)}
                />


                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="All">All Platforms</option>
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Website">Website</option>
                </select>

              </div>


              {/* TABLE */}

              <table>

                <thead>

                  <tr>
                    <th>No.</th>
                    <th>Order Date</th>
                    <th>Order Time</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total Items</th>
                    <th>Platform</th>
                    <th>Order Status</th>
                    <th>Action</th>

                  </tr>

                </thead>


                <tbody>

                  {filteredNewOrders.length > 0 ? (
                    [...filteredNewOrders]
                      .sort((a, b) => {
                        const dateA = new Date(
                          `${formatExcelDate(a.Order_Date)} ${a.Order_Time || "00:00"}`
                        );

                        const dateB = new Date(
                          `${formatExcelDate(b.Order_Date)} ${b.Order_Time || "00:00"}`
                        );

                        return dateA - dateB;
                      })
                      .map((order, index) => {

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

                            <td>{index + 1}</td>

                            <td>
                              {formatExcelDate(order.Order_Date)}
                            </td>

                            <td>
                              {order.Order_Time || "-"}
                            </td>

                            <td>
                              {order.Order_ID}
                            </td>

                            <td>
                              {order.Customer_Name || "-"}
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
                        colSpan="10"
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
              {selectedOrder.Address || "-"}
            </p>

          </div>


          {selectedOrder.Order_Status === "Rejected by QC" && (
            <div className="operator-qc-reject-box">
              <strong>QC Rejection Reason</strong>
              <p>{selectedOrder.QC_Reject_Note || "-"}</p>
            </div>
          )}


{/* ORDER ITEMS */}


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


              {selectedOrder.Order_Status !== "Rejected by QC" && (
                <button
                  className="operator-action-btn"
                  onClick={() => handleProcessOrder(selectedOrder)}
                >
                  Process Order
                </button>
              )}

              {selectedOrder.Order_Status === "Rejected by QC" && (
                <button
                  className="operator-action-btn"
                  onClick={() => handleSendBackToQC(selectedOrder)}
                >
                  Send Back to QC
                </button>
              )}

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
              <h2>{processingCount}</h2>
              <span className="operator-blue">In progress</span>
            </div>

            <div className="operator-card">
              <p>Preparing</p>
              <h2>{preparingCount}</h2>
              <span className="operator-yellow">Being prepared</span>
            </div>

            <div className="operator-card">
              <p>Prepared</p>
              <h2>{preparedCount}</h2>
              <span className="operator-green">Ready for QC</span>
            </div>

            <div className="operator-card">
              <p>On Hold</p>
              <h2>{holdCount}</h2>
              <span className="operator-red">Requires attention</span>
            </div>

            <div className="operator-card">
              <p>Rejected by QC</p>
              <h2>{rejectedByQCCount}</h2>
              <span className="operator-red">Requires recheck</span>
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
                  value={processingSearch}
                  onChange={(e) => setProcessingSearch(e.target.value)}
                />


                <select
                  value={processingStatusFilter}
                  onChange={(e) => setProcessingStatusFilter(e.target.value)}
                >
                  <option value="All">All Processing Status</option>
                  <option value="Processing">Processing</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Prepared">Prepared</option>
                  <option value="Hold">Hold</option>
                  <option value="Waiting QC">Waiting QC</option>
                  <option value="Rejected by QC">Rejected by QC</option>
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
                    <th>QC Rejected At</th>
                    <th>Action</th>
                </tr>

                </thead>


                <tbody>

                  {filteredProcessingOrders.length > 0 ? (
                    [...filteredProcessingOrders]
                      .sort((a, b) => {
                        const aRejected = a.Order_Status === "Rejected by QC";
                        const bRejected = b.Order_Status === "Rejected by QC";

                        if (aRejected !== bRejected) {
                          return aRejected ? -1 : 1;
                        }

                        if (aRejected && bRejected) {
                          return (
                            new Date(b.QC_Rejected_At || 0) -
                            new Date(a.QC_Rejected_At || 0)
                          );
                        }

                        return (
                          new Date(b.Processed_At || 0) -
                          new Date(a.Processed_At || 0)
                        );
                      })
                      .map((order) => {

                        const itemStockStatus = (order.items || []).map((item) => {
                          const inventoryItem = inventoryData.find((stock) => {
                            const stockCode = String(stock.Product_Code || "")
                              .trim()
                              .toUpperCase();

                            const stockName = String(stock.Product_Name || "")
                              .trim()
                              .toUpperCase();

                            const orderCode = String(item.Product_Code || "")
                              .trim()
                              .toUpperCase();

                            const orderName = String(item.Product_Name || "")
                              .trim()
                              .toUpperCase();

                            return (
                              stockCode === orderCode ||
                              stockName === orderName
                            );
                          });

                          const available = Number(
                            inventoryItem?.Available_Stock || 0
                          );

                          const qty = Number(item.Quantity || 0);

                          let status = "Available";

                          if (!inventoryItem || available <= 0) {
                            status = "Out of Stock";
                          } else if (available < qty) {
                            status = "Insufficient";
                          }

                          return {
                            ...item,
                            available,
                            status,
                          };
                        });

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

                          <td>
                            {processedDate ? (
                              <>
                                {processedDate.toLocaleDateString("en-GB")}
                                <div>
                                  {processedDate.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            {itemStockStatus.map((item, index) => (
                              <div
                                key={index}
                                style={{ marginBottom: "8px" }}
                              >
                                <span
                                  className={
                                    item.status === "Available"
                                      ? "operator-status operator-green-status"
                                      : "operator-status operator-red-status"
                                  }
                                >
                                  {item.status === "Available"
                                    ? `Available (${item.available})`
                                    : item.status === "Out of Stock"
                                    ? "Out of Stock"
                                    : `Insufficient (${item.available})`}
                                </span>
                              </div>
                            ))}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <span
                              className={
                                order.Order_Status === "Rejected by QC"
                                  ? "operator-status operator-red-status"
                                  : order.Order_Status === "Prepared"
                                  ? "operator-status operator-green-status"
                                  : order.Order_Status === "Waiting QC"
                                  ? "operator-status operator-yellow-status"
                                  : "operator-status operator-blue-status"
                              }
                            >
                              {order.Order_Status === "Waiting QC" &&
                              order.QC_Status === "Recheck"
                                ? "Recheck Sent to QC"
                                : order.Order_Status}
                            </span>
                          </td>

                          <td>
                            {order.QC_Rejected_At &&
                            order.Order_Status === "Rejected by QC" ? (
                              <>
                                {new Date(order.QC_Rejected_At).toLocaleDateString("en-GB")}
                                <div>
                                  {new Date(order.QC_Rejected_At).toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              </>
                            ) : (
                              "-"
                            )}
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
                                {order.QC_Status === "Recheck"
                                  ? "Recheck Sent"
                                  : "Sent to QC"}
                              </button>
                            )}

                            {order.Order_Status === "Rejected by QC" && (
                              <button
                                className="operator-action-btn"
                                onClick={() => {
                                  setSelectedRejectedOrder(order);
                                  setCorrectionNote("");
                                  setCorrectionCompleted(false);
                                }}
                              >
                                View Details
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

        {/* ORDER REJECTION DETAILS MODAL */}

        {selectedRejectedOrder && (
          <div className="operator-modal-overlay">
            <div className="operator-modal">

              <div className="operator-modal-header">
                <h3>Order Rejection Details</h3>

                <button
                  className="operator-modal-close"
                  onClick={() => setSelectedRejectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div className="operator-modal-info">
                <p>
                  <strong>Order ID:</strong>{" "}
                  {selectedRejectedOrder.Order_ID}
                </p>

                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedRejectedOrder.Customer_Name || "-"}
                </p>

                <p>
                  <strong>QC Status:</strong> Rejected by QC
                </p>

                <p>
                  <strong>Rejected At:</strong>{" "}
                  {selectedRejectedOrder.QC_Rejected_At
                    ? new Date(
                        selectedRejectedOrder.QC_Rejected_At
                      ).toLocaleString("en-GB")
                    : "-"}
                </p>
              </div>

              <h4>Products in Order</h4>

              <div className="operator-rejection-products">
                {(selectedRejectedOrder.items || []).map((item, index) => (
                  <div key={index} className="operator-rejection-product-row">
                    <span>{item.Product_Name || "-"}</span>
                    <strong>{item.Quantity || 0}</strong>
                  </div>
                ))}
              </div>

              
              <h4>Products Rejected by QC</h4>

              <div className="operator-rejection-products">
                {(selectedRejectedOrder.QC_Rejected_Products || []).length > 0 ? (
                  selectedRejectedOrder.QC_Rejected_Products.map((product, index) => {
                    const inspection = (
                      selectedRejectedOrder.QC_Product_Inspections || []
                    ).find(
                      (item) => item.productName === product.Product_Name
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

                    const rejectionReason =
                      reasons.length > 0
                        ? reasons.join(", ")
                        : (product.Rejection_Reasons || []).join(", ") ||
                          "No specific reason recorded";

                    return (
                      <div
                        key={index}
                        style={{
                          backgroundColor: "#fff0f3",
                          borderLeft: "4px solid #dc3545",
                          padding: "14px",
                          borderRadius: "8px",
                          marginBottom: "10px",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "16px",
                          }}
                        >
                          <strong style={{ flex: 1 }}>
                            {product.Product_Name || "-"}
                          </strong>

                          <strong
                            style={{
                              color: "#dc3545",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Qty: {product.Quantity || 0} — Rejected
                          </strong>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <strong style={{ flexShrink: 0 }}>
                            Rejection Reason:
                          </strong>

                          <span style={{ color: "#dc3545", flex: 1 }}>
                            {rejectionReason}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No product-specific rejection details recorded.</p>
                )}
              </div>


              <h4>QC Inspection Checklist</h4>

              {(selectedRejectedOrder.QC_Product_Inspections || []).length > 0 ? (
                selectedRejectedOrder.QC_Product_Inspections.map((product, index) => (
                  <div key={index} style={{ marginBottom: "20px" }}>

                    <h4>
                      {product.productName || "Unknown Product"} —{" "}
                      {product.result}
                    </h4>

                    <div className="operator-rejection-checklist">
                      {[
                        ["Correct Product", "correctProduct"],
                        ["Correct Quantity", "correctQuantity"],
                        ["Product Condition Good", "productConditionGood"],
                        ["Packaging Good", "packagingGood"],
                        ["Expiry Date Valid", "expiryDateValid"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <span>{label}</span>

                          <strong
                            style={{
                              color: product.checklist?.[key]
                                ? "green"
                                : "red",
                            }}
                          >
                            {product.checklist?.[key]
                              ? "Passed"
                              : "Failed"}
                          </strong>
                        </div>
                      ))}
                    </div>

                  </div>
                ))
              ) : (
                <p>No product-specific inspection checklist recorded.</p>
              )}

              <h4>Operator Correction</h4>

              <textarea
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Describe the corrections made to this order..."
                rows={4}
                style={{ width: "100%", padding: "12px" }}
              />

              <label className="operator-correction-confirm">
                <input
                  type="checkbox"
                  checked={correctionCompleted}
                  onChange={(e) => setCorrectionCompleted(e.target.checked)}
                />

                <span>
                  I confirm that the order corrections have been completed.
                </span>
              </label>

              <div className="operator-recheck-actions">

                <button
                  className="operator-recheck-close-btn"
                  onClick={() => setSelectedRejectedOrder(null)}
                >
                  Close
                </button>

                <button
                  className="operator-recheck-send-btn"
                  onClick={handleSendForRecheck}
                  disabled={
                    !correctionCompleted ||
                    !correctionNote.trim() ||
                    sendingForRecheck
                  }
                >
                  Send for Recheck
                </button>

              </div>

            </div>
          </div>
        )}

        {/* =========================
            INVENTORY
        ========================== */}

        {activePage === "inventory" && (
        <>

        {selectedStockItem && (
          <div className="operator-modal-overlay">
            <div className="operator-modal">

              <div className="operator-modal-header">
                <h3>Add Stock</h3>

                <button
                  className="operator-modal-close"
                  onClick={() => {
                    setSelectedStockItem(null);
                    setAddStockQty("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="operator-modal-info">
                <p>
                  <strong>Product:</strong>{" "}
                  {selectedStockItem.Product_Name}
                </p>

                <p>
                  <strong>Product ID:</strong>{" "}
                  {selectedStockItem.Product_Code}
                </p>

                <p>
                  <strong>Current Stock:</strong>{" "}
                  {selectedStockItem.Current_Stock || 0}
                </p>

                <p>
                  <strong>Available Stock:</strong>{" "}
                  {selectedStockItem.Available_Stock || 0}
                </p>
              </div>

              <div style={{ marginTop: "20px" }}>
                <label>
                  <strong>Add Quantity</strong>
                </label>

                <input
                  type="number"
                  min="1"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  placeholder="Enter quantity"
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                  }}
                />
              </div>

              <div className="operator-modal-actions" style={{ marginTop: "20px" }}>
                <button
                  className="operator-modal-cancel"
                  onClick={() => {
                    setSelectedStockItem(null);
                    setAddStockQty("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="operator-action-btn"
                  onClick={handleAddStock}
                >
                  Add Stock
                </button>
              </div>

            </div>
          </div>
        )}
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


            {/* INVENTORY TOP SECTION */}

            <div className="operator-inventory-top-grid">

              {/* LEFT - SUMMARY CARDS */}
              <div className="operator-inventory-summary-grid">

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

              <div className="operator-import-area">

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  id="stock-file-input"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    const reader = new FileReader();

                    
                    reader.onload = async (event) => {
                      try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: "array" });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                        const stockData = XLSX.utils.sheet_to_json(worksheet);

                        for (const item of stockData) {
                          const productCode = String(item.Product_Code || "").trim();

                          if (!productCode) continue;

                          const productRef = doc(db, "inventory", productCode);

                          await setDoc(
                            productRef,
                            {
                              Product_Code: productCode,
                              Product_Name: item.Product_Name || "",
                              Current_Stock: Number(item.Current_Stock || 0),
                              Reserved_Stock: Number(item.Reserved_Stock || 0),
                              Available_Stock: Number(item.Available_Stock || 0),
                              Reorder_Level: Number(item.Reorder_Level || 0),
                            },
                            { merge: true }
                          );
                        }

                        alert("Stock imported successfully.");
                      } catch (error) {
                        console.error("Stock import error:", error);
                        alert("Failed to import stock.");
                      }
                    };

                    reader.readAsArrayBuffer(file);

                  }}
                />

                <label
                  htmlFor="stock-file-input"
                  className="operator-import-btn"
                >
                  Import Stock Excel
                </label>

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
                    <th>Add Stock</th>
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
                          {item.Last_Updated ? (
                            <>
                              {new Date(item.Last_Updated).toLocaleDateString("en-GB")}
                              <br />
                              {new Date(item.Last_Updated).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <button
                            className="operator-action-btn"
                            onClick={() => setSelectedStockItem(item)}
                          >
                            + Add
                          </button>
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
                placeholder="Search Order ID, Customer or Product..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
              />

              <select
                value={deliveryStatusFilter}
                onChange={(e) => setDeliveryStatusFilter(e.target.value)}
              >
                <option value="All">All Delivery Status</option>
                <option value="Ready">Ready</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Delivery Delayed">Delivery Delayed</option>
                <option value="Not Received">Not Received</option>
                <option value="Returned">Returned</option>
                <option value="Canceled">Canceled</option>
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
                 {filteredDeliveryOrders.length > 0 ? (
                   
                  [...filteredDeliveryOrders]
                    .sort((a, b) => {
                      const dateA = new Date(
                        `${formatExcelDate(a.Order_Date)} ${a.Order_Time || "00:00"}`
                      );

                      const dateB = new Date(
                        `${formatExcelDate(b.Order_Date)} ${b.Order_Time || "00:00"}`
                      );

                      return dateA - dateB;
                    })
                    .map((order) => {

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

                      const deliveryStatus =
                        order.Delivery_Status === "Pending Delivery"
                          ? "Ready"
                          : order.Delivery_Status ||
                            (order.QC_Status === "Approved" ||
                            order.QC_Result === "Passed" ||
                            order.QC_Result === "Passed (After Recheck)" ||
                            order.Order_Status === "QC Approved" ||
                            order.Order_Status === "Ready for Delivery"
                              ? "Ready"
                              : "-");

                      const lastUpdated =
                        order.Delivery_Updated_At ||
                        order.QC_Completed_At ||
                        order.Sent_To_QC_At ||
                        order.Processed_At ||
                        null;

                      return (
                        <tr key={order.Order_ID}>
                          <td>{order.Order_ID}</td>

                          <td>{order.Customer_Name || "-"}</td>

                          <td>{productNames}</td>

                          <td>{totalQty}</td>

                          <td>
                            <span className="operator-status operator-green-status">
                              {order.QC_Result || "Passed"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                deliveryStatus === "Delivered"
                                  ? "operator-status operator-green-status"
                                  : deliveryStatus === "Out for Delivery"
                                  ? "operator-status operator-blue-status"
                                  : deliveryStatus === "Ready"
                                  ? "operator-status operator-pink-status"
                                  : deliveryStatus === "Delivery Delayed"
                                  ? "operator-status operator-yellow-status"
                                  : "operator-status operator-red-status"
                              }
                            >
                              {deliveryStatus}
                            </span>
                          </td>

                          <td>
                            {lastUpdated ? (
                              <>
                                {new Date(lastUpdated).toLocaleDateString("en-GB")}
                                <br />
                                {new Date(lastUpdated).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            {deliveryStatus === "Ready" && (
                              <button
                                className="operator-action-btn"
                                onClick={() => handleDeliveryStatus(order, "Out for Delivery")}
                              >
                                Out for Delivery
                              </button>
                            )}

                            
                            {deliveryStatus === "Out for Delivery" && (
                              <div
                                className="operator-delivery-actions"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexWrap: "nowrap",
                                }}
                              >
                                <button
                                  className="operator-action-btn"
                                  style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                                  onClick={() => handleDeliveryStatus(order, "Delivered")}
                                >
                                  Delivered
                                </button>

                                <select
                                  className="operator-delivery-problem-select"
                                  style={{
                                    width: "115px",
                                    minWidth: "115px",
                                    flexShrink: 0,
                                  }}
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleDeliveryStatus(order, e.target.value);
                                    }
                                  }}
                                >
                                  <option value="">Problem</option>
                                  <option value="Delivery Delayed">Delivery Delayed</option>
                                  <option value="Not Received">Not Received</option>
                                  <option value="Returned">Returned</option>
                                  <option value="Canceled">Canceled</option>
                                </select>
                              </div>
                            )}


                            {deliveryStatus === "Delivery Delayed" && (
                              <>
                                <button
                                  className="operator-action-btn"
                                  onClick={() =>
                                    handleDeliveryStatus(order, "Out for Delivery")
                                  }
                                >
                                  Resume Delivery
                                </button>

                                <select
                                  className="operator-delivery-problem-select"
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleDeliveryStatus(order, e.target.value);
                                    }
                                  }}
                                >
                                  <option value="">Update Problem</option>
                                  <option value="Not Received">
                                    Not Received
                                  </option>
                                  <option value="Returned">
                                    Returned
                                  </option>
                                  <option value="Canceled">
                                    Canceled
                                  </option>
                                </select>
                              </>
                            )}

                            {[
                              "Delivered",
                              "Not Received",
                              "Returned",
                              "Canceled",
                            ].includes(deliveryStatus) && (
                              <button
                                className="operator-action-btn disabled-btn"
                                disabled
                              >
                                Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No delivery orders available.
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