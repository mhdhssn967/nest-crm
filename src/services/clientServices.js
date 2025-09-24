import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const fetchServices = async (companyId) => {

  try {
    const prefRef = doc(db, "userData", companyId, "finances", "preferences");
    const prefSnap = await getDoc(prefRef);

    if (prefSnap.exists()) {
      const data = prefSnap.data();
      // 👇 grab services from nested fields
      if (data.fields && data.fields.service) {
        return data.fields.service; // array of services
      }
      console.warn("No Service field found inside fields");
      return [];
    } else {
      console.log("No preferences found!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};


/**
 * Add a new client for a company
 * @param {string} companyId - Company document ID
 * @param {object} clientData - { name, category, total, received, notes }
 */
export const addClient = async (companyId, clientData) => {
  try {
    // reference to clientsData subcollection
    const clientsRef = collection(db, "userData", companyId, "clientsData");

    // calculate pending automatically
    const clientWithPending = {
      ...clientData,
      createdAt: new Date(), // optional timestamp
    };

    const docRef = await addDoc(clientsRef, clientWithPending);
    console.log("Client added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};


/**
 * Fetch all clients for a given company
 * @param {string} companyId - ID of the company
 * @returns {Promise<Array>} - Array of client objects
 */
export const fetchClients = async (companyId) => {
  try {
    const clientsRef = collection(db, "userData", companyId, "clientsData");
    const snapshot = await getDocs(clientsRef);

    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return clients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};


// clientServices.js


export const updateClientPayments = async (companyId, clientId, paymentObj) => {
  const clientRef = doc(db, "userData", companyId, "clientsData", clientId);
  await updateDoc(clientRef, {
    received: arrayUnion(paymentObj),
    pending: (paymentObj.total || 0) - paymentObj.amount, // optional fallback, can recalc in client
  });
};


/**
 * Update the remarks of a client
 * @param {string} companyId - ID of the company
 * @param {string} clientId - ID of the client document
 * @param {string} remarks - New remarks to save
 */
export const updateClientRemarks = async (companyId, clientId, remarks) => {
  try {
    const clientRef = doc(db, "userData", companyId, "clientsData", clientId);
    await updateDoc(clientRef, { remarks });
    console.log("Remarks updated successfully");
  } catch (error) {
    console.error("Error updating remarks:", error);
    throw error;
  }
};
/**
 * Update the key-value client information
 * @param {string} companyId - ID of the company
 * @param {string} clientId - ID of the client document
 * @param {object} clientInformation - Object containing key-value info to save
 */
export const updateClientInformation = async (companyId, clientId, clientInformation) => {
  try {
    const clientRef = doc(db, "userData", companyId, "clientsData", clientId);
    await updateDoc(clientRef, { clientInformation });
    console.log("Client information updated successfully");
  } catch (error) {
    console.error("Error updating client information:", error);
    throw error;
  }
};

/**
 * Delete a client document
 * @param {string} companyId - ID of the company
 * @param {string} clientId - ID of the client document
 */
export const deleteClient = async (companyId, clientId) => {
  try {
    const clientRef = doc(db, "userData", companyId, "clientsData", clientId);
    await deleteDoc(clientRef);
    console.log("Client deleted successfully");
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};