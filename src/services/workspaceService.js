import { db } from "../firebaseConfig"; // Import Firebase database instance
import {
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection
} from "firebase/firestore";

/**
 * Add a new workspace document
 */
export async function addWorkspaceDocument(companyId, userId, docName) {
  if (!companyId || !userId || !docName) throw new Error("Missing IDs");

  const docRef = doc(
    db,
    "userData",
    String(companyId),
    "workspace",
    String(userId),
    "documents",
    String(docName)
  );

  await setDoc(docRef, {
    name: docName,
    clients: []
  });

  return docRef.id;
}

/**
 * Fetch all workspace documents for a user
 */
export async function fetchWorkspaceDocuments(companyId, userId) {
  const colRef = collection(
    db,
    "userData",
    String(companyId),
    "workspace",
    String(userId),
    "documents"
  );

  const snapshot = await getDocs(colRef);
  const docs = [];
  snapshot.forEach((docSnap) => {
    docs.push({ id: docSnap.id, ...docSnap.data() });
  });
  return docs;
}

/**
 * Update a document with new data
 */
export async function updateWorkspaceDocument(companyId, userId, docName, updatedData) {
  const docRef = doc(
    db,
    "userData",
    String(companyId),
    "workspace",
    String(userId),
    "documents",
    String(docName)
  );

  await updateDoc(docRef, updatedData);
}

/**
 * Delete a workspace document
 */
export async function deleteWorkspaceDocument(companyId, userId, docName) {
  const docRef = doc(
    db,
    "userData",
    String(companyId),
    "workspace",
    String(userId),
    "documents",
    String(docName)
  );

  await deleteDoc(docRef);
}