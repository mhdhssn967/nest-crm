import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { isAdmin } from "./fetchNames";

// ─── Fetch all distributors (admin = all, employee = own) ───────────────────
export const fetchDistributors = async (companyId, userId) => {
  try {
    if (!companyId || !userId) return [];

    const ref = collection(db, "userData", companyId, "distributors");
    const uid = userId?.uid ?? userId;
    const adminStatus = await isAdmin(uid);

    const q = adminStatus
      ? query(ref, orderBy("createdAt", "desc"))
      : query(ref, where("addedBy", "==", uid), orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching distributors:", err);
    return [];
  }
};

// ─── Add a new distributor ──────────────────────────────────────────────────
export const addDistributor = async (companyId, data) => {
  try {
    const ref = collection(db, "userData", companyId, "distributors");
    const docRef = await addDoc(ref, {
      ...data,
      addedBy: auth.currentUser.uid,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Error adding distributor:", err);
    throw err;
  }
};

// ─── Update distributor ─────────────────────────────────────────────────────
export const updateDistributor = async (companyId, distributorId, data) => {
  try {
    const ref = doc(db, "userData", companyId, "distributors", distributorId);
    await updateDoc(ref, { ...data, updatedAt: new Date() });
  } catch (err) {
    console.error("Error updating distributor:", err);
    throw err;
  }
};

// ─── Fetch enrolled customers for a distributor ─────────────────────────────
export const fetchEnrolledCustomers = async (companyId, distributorId) => {
  try {
    const ref = collection(db, "userData", companyId, "distributors", distributorId, "customers");
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
};

// ─── Add enrolled customer ──────────────────────────────────────────────────
export const addEnrolledCustomer = async (companyId, distributorId, data) => {
  try {
    const ref = collection(db, "userData", companyId, "distributors", distributorId, "customers");
    await addDoc(ref, {
      customerName: data.customerName || "",
      notes: data.notes || "",
      addedAt: new Date(),
    });
  } catch (err) {
    console.error("Error adding customer:", err);
    throw err;
  }
};

// ─── Fetch contact log ──────────────────────────────────────────────────────
// Path: userData/{companyId}/distributors/{distributorId}/contactLog
export const fetchContactLog = async (companyId, distributorId, uid, isAdminUser) => {
  try {
    const logRef = collection(
      db,
      "userData", companyId,
      "distributors", distributorId,
      "contactLog"
    );

    const q = isAdminUser
      ? query(logRef, orderBy("createdAt", "desc"))
      : query(logRef, where("authorUid", "==", uid), orderBy("createdAt", "desc"));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("fetchContactLog error:", err);
    return [];
  }
};

// ─── Add contact log entry ──────────────────────────────────────────────────
export const addContactLogEntry = async (companyId, distributorId, entry) => {
  try {
    const logRef = collection(
      db,
      "userData", companyId,
      "distributors", distributorId,
      "contactLog"
    );
    await addDoc(logRef, entry);
  } catch (err) {
    console.error("addContactLogEntry error:", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE INDEX NOTE:
// The non-admin query on contactLog uses a composite index:
//   Collection: contactLog
//   Fields:     authorUid (Ascending) + createdAt (Descending)
//
// If Firestore throws a "requires an index" error, click the link in the
// console error to auto-create it in Firebase Console.
// ─────────────────────────────────────────────────────────────────────────────