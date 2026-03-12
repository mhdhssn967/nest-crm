import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { isAdmin } from "./fetchNames";

// ─── Fetch all distributors (admin = all, employee = own) ───────────────────
export const fetchDistributors = async (companyId, userId) => {
    
  try {
    if (!companyId || !userId) return [];

    const ref = collection(db, "userData", companyId, "distributors");
    const adminStatus = await isAdmin(userId);

    const q = adminStatus
      ? query(ref, orderBy("createdAt", "desc"))
      : query(ref, where("addedBy", "==", userId), orderBy("createdAt", "desc"));

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
    const ref = collection(
      db,
      "userData", companyId,
      "distributors", distributorId,
      "customers"
    );
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
};

// ─── Add enrolled customer (name + notes only) ─────────────────────────────
export const addEnrolledCustomer = async (companyId, distributorId, data) => {
  try {
    const ref = collection(
      db,
      "userData", companyId,
      "distributors", distributorId,
      "customers"
    );
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