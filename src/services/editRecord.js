import { db } from "../firebaseConfig"; // Import Firebase database instance
import { doc, updateDoc } from "firebase/firestore";

/**
 * Updates a record in Firebase Firestore.
 * @param {string} id - The document ID of the record to update.
 * @param {Object} updatedData - The new data to update in the record.
 * @returns {Promise<void>} A promise that resolves when the update is successful.
 */
const updateRecord = async (id, updatedData) => {
  try {
    const recordRef = doc(db, "records", id); // Reference to the document
    await updateDoc(recordRef, updatedData); // Update the document in Firestore
    console.log("Record updated successfully!");
  } catch (error) {
    console.error("Error updating record:", error);
    throw error;
  }
};

export default updateRecord;
