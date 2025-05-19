import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure your Firebase config is properly imported

export const deleteRecord = async (recordID) => {
  if (!recordID) {
    console.error("Record ID is missing!");
    return;
  }

  try {
    await deleteDoc(doc(db, "records", recordID));

    // Remove deleted record from the state
    setRecords((prevRecords) => prevRecords.filter(record => record.id !== recordID));
    
    setViewRecord(false); // Close the view modal after deletion
  } catch (error) {
    console.error("Error deleting record:", error);
  }
};
