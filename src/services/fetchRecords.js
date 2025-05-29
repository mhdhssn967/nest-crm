import { collection, query, where, getDocs, orderBy, collectionGroup } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { isAdmin } from "./fetchNames";

export const fetchCRMRecords = async (companyId, userId) => {
  try {
    const crmDataRef = collection(db, 'userData', companyId, 'CRMdata');

    // Check if the CRMdata collection has any documents
    const testSnapshot = await getDocs(crmDataRef);
    if (testSnapshot.empty) {
      return []; // No documents in CRMdata
    }

    // Check if the user is an admin
    const adminStatus = await isAdmin(userId);

    let q;
    if (adminStatus) {
      // Admin: fetch all documents, ordered by creation
      q = query(crmDataRef, orderBy('createdAt', 'desc'));
    } else {
      // Non-admin: fetch only user-specific records
      q = query(
        crmDataRef,
        where('associate', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error fetching CRM records:', error);
    return [];
  }
};





export const getUserCompanyDetails = async (userid) => {
  try {
    // Query the 'allemployees' collection directly
    const q = query(
      collection(db, 'allEmployees'),
      where('uid', '==', userid)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();

      return {
        companyId: docData.companyId || '',
        companyName: docData.companyName || ''
      };
    } else {
      console.warn('No employee found in allemployees for this UID.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
};

// fetch employees

export const fetchAllEmployees = async (companyId) => {
  try {
    const employeesRef = collection(db, 'userData', companyId, 'employees');
    const snapshot = await getDocs(employeesRef);

    if (snapshot.empty) {
      return []; // No employee records
    }

    const employees = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid, 
        empName: data.empName || '',
        empSuperVisor: data.empSuperVisor || ''
      };
    });

    return employees;

  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};