import React from 'react'
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { fetchCRMRecords } from '../services/fetchRecords';




const DownloadData = (companyId) => {
    

    const exportCRMDataToExcel = async (companyId) => {    
        console.log(companyId);
        
  try {
    // Fetch data using your function
    const data = await fetchCRMRecords(companyId.companyId, companyId.currentUser);

    if (!data || data.length === 0) {
      alert("No CRM Data found to export.");
      return;
    }

    // Convert data JSON → Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CRM Data Backup");

    // Create buffer and save file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const fileBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(fileBlob, `CRM_Backup_${companyId.employeeName}.xlsx`);

    console.log("Excel downloaded successfully!");
  } catch (error) {
    console.error("Error exporting CRM data:", error);
  }
};
  return (
    <div>
        <button style={{backgroundColor:'black',borderRadius:'5px',color:'white',fontWeight:'800',margin:'10px',padding:'5px',border:'solid 2px'}} onClick={()=>exportCRMDataToExcel(companyId)}>Download Excel</button>
    </div>
  )
}

export default DownloadData