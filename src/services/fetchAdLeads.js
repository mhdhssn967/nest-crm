import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ─── Fetch leads ────────────────────────────────────────────────────────────
// Admin → all leads
// Employee → only leads where assignedToUid == their uid
export const fetchAdLeads = async (companyId, currentUser, adminStatus) => {
  try {
    const ref = collection(db, "userData", companyId, "adLeads");
    const uid = currentUser?.uid;

    const q = adminStatus
      ? query(ref, orderBy("createdAt", "desc"))
      : query(ref, where("assignedToUid", "==", uid), orderBy("createdAt", "desc"));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("fetchAdLeads error:", err);
    return [];
  }
};

// ─── Add a new lead (+ first timeline entry) ────────────────────────────────
export const addLead = async (companyId, data, authorName) => {
  try {
    const ref = collection(db, "userData", companyId, "adLeads");
    const now = new Date();
    const docRef = await addDoc(ref, {
      ...data,
      currentStatus: "New",
      createdAt: now,
      updatedAt: now,
      addedByName: authorName,
    });

    // Auto first timeline entry
    const histRef = collection(
      db, "userData", companyId,
      "adLeads", docRef.id, "statusHistory"
    );
    await addDoc(histRef, {
      status: "New",
      note: `Added to Leads by ${authorName}${
        data.assignedToName ? ` · Assigned to ${data.assignedToName}` : ""
      }`,
      updatedByName: authorName,
      timestamp: now,
    });

    return docRef.id;
  } catch (err) {
    console.error("addLead error:", err);
    throw err;
  }
};

// ─── Update lead status + timeline entry ────────────────────────────────────
export const updateLeadStatus = async (
  companyId, leadId, status, note, updatedByName, followUpDate = null
) => {
  try {
    const now = new Date();
    const leadRef = doc(db, "userData", companyId, "adLeads", leadId);
    const payload = { currentStatus: status, updatedAt: now };
    if (followUpDate !== null) payload.followUpDate = followUpDate;
    await updateDoc(leadRef, payload);

    const histRef = collection(
      db, "userData", companyId,
      "adLeads", leadId, "statusHistory"
    );
    await addDoc(histRef, {
      status, note, updatedByName,
      followUpDate: followUpDate || null,
      timestamp: now,
    });
  } catch (err) {
    console.error("updateLeadStatus error:", err);
    throw err;
  }
};

// ─── Update remarks ─────────────────────────────────────────────────────────
export const updateLeadRemarks = async (companyId, leadId, remarks) => {
  try {
    const ref = doc(db, "userData", companyId, "adLeads", leadId);
    await updateDoc(ref, { remarks, updatedAt: new Date() });
  } catch (err) {
    console.error("updateLeadRemarks error:", err);
    throw err;
  }
};

// ─── Fetch status history ───────────────────────────────────────────────────
export const fetchStatusHistory = async (companyId, leadId) => {
  try {
    const ref = collection(
      db, "userData", companyId,
      "adLeads", leadId, "statusHistory"
    );
    const q = query(ref, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("fetchStatusHistory error:", err);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE INDEX NOTE:
// Employee query: composite index on assignedToUid (Asc) + createdAt (Desc)
// If Firestore throws "requires an index", click the auto-link in the console.
// ─────────────────────────────────────────────────────────────────────────────