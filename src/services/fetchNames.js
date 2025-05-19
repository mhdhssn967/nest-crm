import { getDoc, getFirestore, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // Adjust the path if needed
import { collection, query, where, getDocs } from 'firebase/firestore';



// const db=getFirestore();

/**
 * Fetches the BDA name corresponding to a given BDA ID.
 * @param {string} BDAid - The ID of the BDA.
 * @returns {Promise<string>} - A promise that resolves to the BDA name or "Not Found".
 */

const getBDAName = async(BDAid)=>{
    try{
        const BDARef=doc(db, 'BDAs',BDAid)
        const BDASnap = await getDoc(BDARef)

        if(BDASnap.exists()){
            return BDASnap.data().name;
        }else{
            return "Not Found"
        }
    }catch(err){
        console.log("Error fetching BDA name",err);
        return "Error"
    }
}
export default getBDAName;




export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // stop listening once we get the user

      if (user) {
        resolve(user);
      } else {
        resolve(null);
      }
    }, reject);
  });
};



export const getEmployeeName = async (userId) => {
  try {
    const employeeDocRef = doc(db, 'allEmployees', userId);
    const docSnap = await getDoc(employeeDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.empName || null;
    } else {
      console.warn('Employee document not found.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching employee name:', error);
    return null;
  }
};



export const fetchAdminName = async (userId) => {
  try {
    const adminDocRef = doc(db, 'userData', userId);
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
      const data = adminDocSnap.data();
      return data.companyName || "Admin";
    } else {
      return null; // Not an admin
    }
  } catch (error) {
    console.error("Error fetching admin name:", error);
    return null;
  }
};

export const isAdmin=async(userId)=>{
  try{
    const adminDocRef = doc(db, 'userData', userId);
    const adminDocSnap = await getDoc(adminDocRef)
    if (adminDocSnap.exists()){
      return true
    }else{
      return false
    }
  }catch(err){
    console.log('Error in checking if admin');
    
  }
}


// fetch employees

