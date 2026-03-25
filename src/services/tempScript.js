/**
 * importDistributors.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to bulk-import distributor data from Sakeer and Navaneeth's
 * PDFs into Firestore under userData/{companyId}/distributors
 *
 * HOW TO RUN:
 *   1. Fill in your Firebase config values below (from Firebase Console →
 *      Project Settings → General → Your apps → Firebase SDK snippet)
 *   2. Make sure Firestore is in TEST MODE (allow read, write: if true)
 *   3. Install the Firebase client SDK:
 *        npm install firebase
 *   4. Run:
 *        node importDistributors.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ─── Firebase config — paste values from your Firebase Console ────────────────


// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  companyId: "Ovq274qYz5f065l6zbzMRafVFfl1",
  sakeerUid: "ZwvDE1Rb5QXtg64xlAcFcR1P3KH2",
  navaneethUid: "MQxxoO20V3cFnZf9IFZZARq1SYZ2",
};
// ─────────────────────────────────────────────────────────────────────────────

const now = Timestamp.now();

// ─── SAKEER'S DATA ────────────────────────────────────────────────────────────
const sakeerData = [
  // ── CHENNAI (Tamil Nadu) ──
  { distributorName: "Omkar Medical Distributors Pvt Ltd", contactNumber: "91 98417 44483", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Singex Medtech", contactNumber: "91 88700 00275", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Cook India Medical Devices Pvt Ltd", contactNumber: "91 44 61993000", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response", remarks: "First call attended, after no response. ~30% prospect." },
  { distributorName: "Carewell Healthcare Solutions", contactNumber: "91 9677222671", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "HSA Pharma Pvt Ltd", contactNumber: "91 81220 00105", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Kamalam Medical Corporation", contactNumber: "91 74011 99990", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Life Care Pharmaceuticals", contactNumber: "91 44 2811 1099", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Palepu Pharma Private Limited", contactNumber: "91 99405 85378", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Purani Hospital Supplies Limited", contactNumber: "91 44 2440 4750", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Santhi Pharma", contactNumber: "91 89254 13562", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Cnergy Incorporation", contactNumber: "91-44-4006 7974", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Contacted", remarks: "Will connect after some time. ~30% prospect." },
  { distributorName: "HMS Medical Systems", contactNumber: "91-44-2476 6576", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "To Follow Up", remarks: "Meeting done, after no response. ~50% prospect." },
  { distributorName: "UMS Physiotherapy Equipments (Unique Care)", contactNumber: "91-98 845 84525", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "To Follow Up", remarks: "Meeting done, after no response. ~50% prospect." },
  { distributorName: "Divine Physiotherapy Equipments", contactNumber: "080-4860 337488", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "Called, no response" },
  { distributorName: "Kumaravel Distributor Chennai", contactNumber: "91 99622 21662", state: "Tamil Nadu", region: "Tamil Nadu", currentStatus: "To Follow Up", remarks: "Meeting done. Will take hardware when enquiry comes. ~50%." },

  // ── MUMBAI (Maharashtra) ──
  { distributorName: "Medico Distributors", contactNumber: "917777016144", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "All India Healthcare", contactNumber: "9833503360", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Shraddha Pharma & Surgical", contactNumber: "022-2201-8772", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "CR Medisystems Pvt. Ltd.", contactNumber: "022-23004930", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Maharashtra Health Care (Medical Equipments)", contactNumber: "91-9004783045", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Hansraj Nayyar Medical India Pvt. Ltd.", contactNumber: "91-9326672042", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Meher Distributors Pvt. Ltd.", contactNumber: "022-61312000", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Suyog Pharmaceutical Distributors", contactNumber: "022-2404-3497", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "J & J Medical and Distributors", contactNumber: "91-9537069002", state: "Maharashtra", region: "Maharashtra", currentStatus: "To Follow Up", remarks: "Meeting done, after no response. ~50% prospect." },
  { distributorName: "M.A Surgical Distributors", contactNumber: "070292 02279", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Metro Medical Agencies", contactNumber: "0712-2770466", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Mahadev Agencies", contactNumber: "0253-2577750", state: "Maharashtra", region: "Maharashtra", currentStatus: "Called, no response" },
  { distributorName: "Life Line Pharma", contactNumber: "9604146001", state: "Maharashtra", region: "Maharashtra", currentStatus: "Contacted", remarks: "Contacted but not responding. ~30%." },

  // ── MADHYA PRADESH ──
  { distributorName: "Biohope Healthcare", contactNumber: "9165699916", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Naresh Medicals", contactNumber: "0755-2534137", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Sai Medical & Surgical", contactNumber: "8401174595", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "To Follow Up", remarks: "Meeting done, after no response. ~40% prospect." },
  { distributorName: "Kottakkal Ayurveda & Orthopaedic Solutions", contactNumber: "91 98935 52893", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Meditek", contactNumber: "91 98985 86810", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "Contacted", remarks: "Busy, will connect after some time. ~30%." },
  { distributorName: "Osteocare Medical Pvt Ltd", contactNumber: "91 79356 71408", state: "Madhya Pradesh", region: "Madhya Pradesh", currentStatus: "Called, no response" },

  // ── RAJASTHAN ──
  { distributorName: "D. Vijay Pharma Pvt. Ltd.", contactNumber: "9372336524", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Enjay Enterprise", contactNumber: "9867681523", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Exa Specialities & Lifecare Pvt. Ltd.", contactNumber: "8097882211", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Om Sai Distributors", contactNumber: "9146189681", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Padmashree Medical Distributors", contactNumber: "9923023555", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Shree Venkatesh Agencies", contactNumber: "9420636332", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "J Rana & Company", contactNumber: "8657980698", state: "Rajasthan", region: "Rajasthan", currentStatus: "Called, no response" },
  { distributorName: "Dr. Manuj Joshi", contactNumber: "8875555265", state: "Rajasthan", region: "Rajasthan", currentStatus: "Inactive", remarks: "Meeting done but not interested. ~40%." },

  // ── KERALA ──
  { distributorName: "Sarath Distributor Kerala", contactNumber: "91 73566 67440", state: "Kerala", region: "Kerala", currentStatus: "Contacted", remarks: "Will be joining this month end. ~90%." },
  { distributorName: "Sajith Tvm Medical Distributor", contactNumber: "91 99956 65834", state: "Kerala", region: "Kerala", currentStatus: "Doing Sales", remarks: "Currently selling our product. 100%." },
  { distributorName: "Dr. Praful Lifecare Distributor", contactNumber: "91 98097 11674", state: "Kerala", region: "Kerala", currentStatus: "Doing Sales", remarks: "Selling our product but not yet formally registered as distributor. 100%." },

  // ── DELHI ──
  { distributorName: "Rehman Distributor PSRI Delhi", contactNumber: "91 95606 43129", state: "Delhi", region: "Delhi", currentStatus: "To Follow Up", remarks: "Waiting for order, 1 order running. ~90%." },
  { distributorName: "Manoj Jha Distributor Delhi", contactNumber: "91 98189 02465", state: "Delhi", region: "Delhi", currentStatus: "To Follow Up", remarks: "Demo finished, no order yet. ~70%." },
  { distributorName: "Kumareshan Cenergy Delhi", contactNumber: "8760951130", state: "Delhi", region: "Delhi", currentStatus: "To Follow Up", remarks: "Sending leads when available. ~50%." },
  { distributorName: "Nitin Bio Tronics Distributor Delhi", contactNumber: "91 90152 51243", state: "Delhi", region: "Delhi", currentStatus: "Contacted", remarks: "Contacted but not much response. ~40%." },
  { distributorName: "Pradeep Distributor PSRI Delhi", contactNumber: "91 92533 31333", state: "Delhi", region: "Delhi", currentStatus: "To Follow Up", remarks: "Working like a distributor but not registered yet. ~70%." },
  { distributorName: "Mr. Prem Supertech Surgical", contactNumber: "91 98115 64804", state: "Delhi", region: "Delhi", currentStatus: "Contacted", remarks: "Talking details, connected to his son. ~60%." },
  { distributorName: "Bio Tronics Nithin Delhi", contactNumber: "9015251243", state: "Delhi", region: "Delhi", currentStatus: "Contacted", remarks: "Talking details, waiting for product availability. ~60%." },
  { distributorName: "D and D Surgicals", contactNumber: "9207077881", state: "Delhi", region: "Delhi", currentStatus: "To Follow Up", remarks: "Meeting done, after no response. ~50%." },
];

// ─── NAVANEETH'S DATA ─────────────────────────────────────────────────────────
const navaneethData = [
  // ── AHMEDABAD (Gujarat) ──
  { distributorName: "Life Care Physio Medical Instruments - Physiotherapy Equipment", contactNumber: "9824445294", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Prayas Physiotherapy Services", contactNumber: "9428135047", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Archplus Healthcare Pvt. Ltd.", contactNumber: "9723111128", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Chirag Electronics Pvt Ltd", contactNumber: "7948931001", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Medinza Healthcare Ahmedabad", contactNumber: "8619344161", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Mahavir Surgicals", contactNumber: "8128800123", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Om Health Care Instruments", contactNumber: "9824257085", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Param Medical Devices", contactNumber: "9974311340", state: "Gujarat", region: "Gujarat", currentStatus: "Called, no response" },
  { distributorName: "PLS - Trained Attendant in Physiotherapy Surgical items Ahmedabad", contactNumber: "8141269967", state: "Gujarat", region: "Gujarat", currentStatus: "Called, no response" },
  { distributorName: "Arrowmed India - Medicine & Surgical Equipment & Instruments Supp", contactNumber: "9898226884", state: "Gujarat", region: "Gujarat", currentStatus: "Called, no response" },
  { distributorName: "MARUTI SURGICAL SUPPLY", contactNumber: "9824114970", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },
  { distributorName: "Jignesh Rehab", contactNumber: "", state: "Gujarat", region: "Gujarat", currentStatus: "Contacted" },

  // ── LUCKNOW (Uttar Pradesh) ──
  { distributorName: "PARADOX MEDITECH PRIVATE LIMITED", contactNumber: "8840413700", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Matrix Medical Technology Private Limited Lucknow", contactNumber: "9793045444", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Contacted", remarks: "Market Study" },
  { distributorName: "S. MEDICAL DEVICES", contactNumber: "9335164189", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Allied Surgical Emporium", contactNumber: "9044310222", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "MG Medicare", contactNumber: "8737062200", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Apex Healthcare Solutions", contactNumber: "9956810656", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Inactive", remarks: "Not interested" },
  { distributorName: "Medical Equipment Dealer | BiPAP and CPAP Machine", contactNumber: "8400600800", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "Indionix Healthcare | Medical Equipment Supplier | (Indira Nagar)", contactNumber: "7230993300", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Contacted", remarks: "Market Study" },
  { distributorName: "Healthy Jeena Sikho", contactNumber: "9876978488", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },
  { distributorName: "ArjoHuntleigh Healthcare India Pvt Ltd", contactNumber: "7619995111", state: "Uttar Pradesh", region: "Uttar Pradesh", currentStatus: "Called, no response" },

  // ── BHUBANESWAR (Odisha) ──
  { distributorName: "Savera Health Care | Best Medical Equipment dealer", contactNumber: "9853024404", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "ERICA HEALTHCARE | Medical Equipment Supplier in Bhubaneswar", contactNumber: "7606024195", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "PL Enterprises Physiotherapy Solutions", contactNumber: "7008131522", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "KALINGA BIOMEDICAL", contactNumber: "9668834183", state: "Odisha", region: "Odisha", currentStatus: "Contacted", remarks: "Market Study" },
  { distributorName: "Arati Medicare", contactNumber: "7894227358", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "Medro medical Systems Pvt Ltd", contactNumber: "9078230209", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "Respion Healthcare Pvt Ltd, Bhubaneswar", contactNumber: "9937000606", state: "Odisha", region: "Odisha", currentStatus: "Contacted", remarks: "Market Study" },
  { distributorName: "BHABANI SHANKAR AGENCIES", contactNumber: "9438913359", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "Universal Medisystems Pvt. Ltd.", contactNumber: "9437164950", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },
  { distributorName: "EVINCE ENTERPRISES", contactNumber: "9114490696", state: "Odisha", region: "Odisha", currentStatus: "Called, no response" },

  // ── KOLKATA (West Bengal) ──
  { distributorName: "EIA MEDICA SYSTEM", contactNumber: "8981464582", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "WORLD HEALTHCARE SOLUTION", contactNumber: "8045479585", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "HERTZ MEDICAL EQUIPMENTS PVT. LTD", contactNumber: "3322360075", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "MEDITECH INDIA", contactNumber: "8045359574", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Riya Medical Supply Agency", contactNumber: "6289614002", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Alka Surgical", contactNumber: "9875433872", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Relax India Surgical pvt Ltd", contactNumber: "8047623552", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Grace Care", contactNumber: "9932954382", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "P. Bhoglal Pvt.Ltd.", contactNumber: "3340280000", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Tara Medical Enterprise | ResMed Authorised Service Center & Sales Partner", contactNumber: "9163621222", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },
  { distributorName: "Bharat Medical Equipment", contactNumber: "7063845883", state: "West Bengal", region: "West Bengal", currentStatus: "Called, no response" },

  // ── JALANDHAR (Punjab) ──
  { distributorName: "Medisearch Systems Pvt.Ltd. - Hospital Equipment | Hospital Equipment Suppliers", contactNumber: "9855449410", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "Modern Surgical House", contactNumber: "7710400448", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "Hindustan Traders - Surgical Instruments Manufacturer in Jalandhar, India", contactNumber: "8699668040", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "Medical Elaborate Concept Pvt Ltd", contactNumber: "1812258003", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "Global Medical Solutions", contactNumber: "9996955548", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "JALANDHAR ENTERPRISES SURGICAL INDUSTRIES", contactNumber: "9871432046", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },
  { distributorName: "HEALTHCARE MEDICAL EQUIPMENTS", contactNumber: "9990585651", state: "Punjab", region: "Punjab", currentStatus: "Called, no response" },

  // ── HYDERABAD (Telangana) ──
  { distributorName: "Dr Sayani's Healthworld KPHB", contactNumber: "9885167864", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "TECHNO HEALTH CARE SYSTEMS", contactNumber: "9133355596", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "Dr H Care", contactNumber: "6301954072", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "eSmart Healthcare", contactNumber: "9666595595", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "Healthcareneeds", contactNumber: "9885378287", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "Enshrine Healthcare Systems", contactNumber: "7702071900", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "RS meditech enterprises", contactNumber: "9399006678", state: "Telangana", region: "Telangana", currentStatus: "Contacted", remarks: "Market Study" },
  { distributorName: "Physiostore", contactNumber: "", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "Health Life Surgicals manikonda", contactNumber: "9030083003", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "KOMFY SURGICALS", contactNumber: "9885303123", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
  { distributorName: "Startoon Labs Pvt. Ltd", contactNumber: "9398772387", state: "Telangana", region: "Telangana", currentStatus: "Contacted" },
];

// ─── Build Firestore documents ────────────────────────────────────────────────

const buildDoc = (entry, employeeName, uid) => ({
  distributorName: entry.distributorName || "",
  contactNumber: entry.contactNumber || "",
  contactPersonName: "",
  email: "",
  address: "",
  gstNumber: "",
  state: entry.state || "",
  region: entry.region || "",
  exclusive: "",
  teamSize: "",
  establishedYear: "",
  productLinesHandled: "",
  territoryDescription: "",
  currentStatus: entry.currentStatus || "Called, no response",
  lastMeetingDate: "",
  nextFollowUp: "",
  remarks: entry.remarks || "",
  addedBy: uid,
  addedByName: employeeName,
  companyId: CONFIG.companyId,
  createdAt: now,
  updatedAt: now,
});

// ─── Import function ──────────────────────────────────────────────────────────

async function importAll() {
  const ref = collection(db, "userData", CONFIG.companyId, "distributors");

  const allDocs = [
    ...sakeerData.map(e => buildDoc(e, "Sakeer Shamsudheen", CONFIG.sakeerUid)),
    ...navaneethData.map(e => buildDoc(e, "Navaneeth K n", CONFIG.navaneethUid)),
  ];

  console.log(`\n📦 Preparing to import ${allDocs.length} distributors...`);
  console.log(`   Sakeer:    ${sakeerData.length} records`);
  console.log(`   Navaneeth: ${navaneethData.length} records\n`);

  const chunkSize = 400;
  let total = 0;

  for (let i = 0; i < allDocs.length; i += chunkSize) {
    const chunk = allDocs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(docData => {
      const newRef = doc(ref); // auto-ID
      batch.set(newRef, docData);
    });
    await batch.commit();
    total += chunk.length;
    console.log(`✅ Committed batch: ${total}/${allDocs.length}`);
  }

  console.log(`\n🎉 Done! ${total} distributors imported to:`);
  console.log(`   userData/${CONFIG.companyId}/distributors\n`);
  process.exit(0);
}

importAll().catch(err => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});

export default importAll;