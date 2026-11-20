import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc
} from "firebase/firestore";

import { db } from "./firebase";

export async function cleanupTestOrders(fileHash, confirmDelete = false) {
  const q = query(
    collection(db, "order_import_keys"),
    where("File_Hash", "==", fileHash)
  );

  const snapshot = await getDocs(q);

  const records = snapshot.docs.map((record) => ({
    keyId: record.id,
    orderId: record.data().Order_ID
  }));

  console.table(records);
  console.log("Total orders found:", records.length);

  if (!confirmDelete) {
    console.log("Preview only. No orders deleted.");
    return;
  }

  if (records.length !== 173) {
    throw new Error(
      `Expected 173 records, found ${records.length}. Deletion cancelled.`
    );
  }

  const batch = writeBatch(db);

  for (const record of records) {
    batch.delete(doc(db, "orders", record.orderId));
    batch.delete(doc(db, "order_import_keys", record.keyId));
  }

  await batch.commit();

  console.log("173 testing orders deleted successfully.");
}