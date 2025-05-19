import { getAuth } from "firebase/auth"
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore"

const fetchChildBDAs=async()=>{
    try{
        const db=getFirestore()
        const auth=getAuth()
        const user=auth.currentUser;

        if(!user){
            console.log("Please login to continue");
            return[]
        }
        
        const bdaQuery = query(collection(db,"BDAs"), where("parentBDA","==",user.uid))
        const snapshot = await getDocs(bdaQuery)

        const childBDAids = snapshot.docs.map(doc=>doc.id)
        
        return(childBDAids)
    }catch(err){
        console.log("Error fetching child BDAs",err);
        return[]
    }
}


export default fetchChildBDAs;