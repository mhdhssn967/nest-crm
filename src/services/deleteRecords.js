import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure your Firebase config is properly imported

export const deleteRecord = async (recordID,companyId) => {
  if (!recordID) {
    console.error("Record ID is missing!");
    return;
  }

  try {
    await deleteDoc(doc(db, "userData", companyId,"CRMdata",recordID));    
  } catch (error) {
    console.error("Error deleting record:", error);
  }
};
