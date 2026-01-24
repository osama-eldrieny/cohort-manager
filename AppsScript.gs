// ============================================
// GOOGLE APPS SCRIPT FOR COURSE DASHBOARD
// Add this code to your Google Sheets Apps Script
// ============================================

const SHEET_NAME = 'Students';
const CHECKLIST_SHEET_NAME = 'Checklists';

function doPost(e) {
    try {
        const params = JSON.parse(e.postData.contents);
        const action = params.action;

        switch(action) {
            case 'getStudents':
                return ContentService.createTextOutput(JSON.stringify(getStudents()))
                    .setMimeType(ContentService.MimeType.JSON);
            
            case 'saveStudent':
                saveStudent(params.student);
                return ContentService.createTextOutput(JSON.stringify({ success: true }))
                    .setMimeType(ContentService.MimeType.JSON);
            
            case 'deleteStudent':
                deleteStudent(params.id);
                return ContentService.createTextOutput(JSON.stringify({ success: true }))
                    .setMimeType(ContentService.MimeType.JSON);
            
            default:
                return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
                    .setMimeType(ContentService.MimeType.JSON);
        }
    } catch(error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function getStudents() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        initializeSheets();
        return [];
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const students = [];

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === '') continue; // Skip empty rows

        const student = {
            id: data[i][0],
            name: data[i][1],
            email: data[i][2],
            whatsapp: data[i][3],
            location: data[i][4],
            language: data[i][5],
            status: data[i][6],
            cohort: data[i][7],
            totalAmount: parseFloat(data[i][8]) || 0,
            paidAmount: parseFloat(data[i][9]) || 0,
            remaining: parseFloat(data[i][10]) || 0,
            note: data[i][11]
        };

        // Get checklist if Current Cohort
        if (student.status === 'Current Cohort') {
            student.checklist = getStudentChecklist(student.id);
        }

        students.push(student);
    }

    return students;
}

function saveStudent(student) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        initializeSheets();
        sheet = ss.getSheetByName(SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    
    // Check if student exists
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === student.id) {
            rowIndex = i + 1; // Sheets are 1-indexed
            break;
        }
    }

    const rowData = [
        student.id,
        student.name,
        student.email,
        student.whatsapp,
        student.location,
        student.language,
        student.status,
        student.cohort,
        student.totalAmount,
        student.paidAmount,
        student.remaining,
        student.note
    ];

    if (rowIndex > 0) {
        // Update existing
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
        // Add new
        sheet.appendRow(rowData);
    }

    // Save checklist if Current Cohort
    if (student.status === 'Current Cohort' && student.checklist) {
        saveStudentChecklist(student.id, student.checklist);
    }
}

function deleteStudent(id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }

    // Delete checklist
    deleteStudentChecklist(id);
}

function getStudentChecklist(studentId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CHECKLIST_SHEET_NAME);
    
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === studentId) {
            return {
                addedCommunity: data[i][1] === true || data[i][1] === 'TRUE',
                sharedAgreement: data[i][2] === true || data[i][2] === 'TRUE',
                signedAgreement: data[i][3] === true || data[i][3] === 'TRUE',
                sharedDrive: data[i][4] === true || data[i][4] === 'TRUE',
                createdFigma: data[i][5] === true || data[i][5] === 'TRUE',
                sharedMasterFigma: data[i][6] === true || data[i][6] === 'TRUE',
                figmaStatus: data[i][7] || 'Not started'
            };
        }
    }

    return null;
}

function saveStudentChecklist(studentId, checklist) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CHECKLIST_SHEET_NAME);
    
    if (!sheet) {
        sheet = ss.insertSheet(CHECKLIST_SHEET_NAME);
        sheet.appendRow(['Student ID', 'Added to Community', 'Shared Agreement', 'Signed Agreement', 
                        'Shared Drive', 'Created Figma', 'Shared Master Figma', 'Figma Status']);
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === studentId) {
            rowIndex = i + 1;
            break;
        }
    }

    const checklistData = [
        studentId,
        checklist.addedCommunity,
        checklist.sharedAgreement,
        checklist.signedAgreement,
        checklist.sharedDrive,
        checklist.createdFigma,
        checklist.sharedMasterFigma,
        checklist.figmaStatus
    ];

    if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, checklistData.length).setValues([checklistData]);
    } else {
        sheet.appendRow(checklistData);
    }
}

function deleteStudentChecklist(studentId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CHECKLIST_SHEET_NAME);
    
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === studentId) {
            sheet.deleteRow(i + 1);
            break;
        }
    }
}

function initializeSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create Students sheet
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(['ID', 'Name', 'Email', 'WhatsApp', 'Location', 'Language', 'Status', 
                        'Cohort', 'Total Amount', 'Paid Amount', 'Remaining', 'Note']);
    }

    // Create Checklists sheet
    let checklistSheet = ss.getSheetByName(CHECKLIST_SHEET_NAME);
    if (!checklistSheet) {
        checklistSheet = ss.insertSheet(CHECKLIST_SHEET_NAME);
        checklistSheet.appendRow(['Student ID', 'Added to Community', 'Shared Agreement', 'Signed Agreement', 
                                 'Shared Drive', 'Created Figma', 'Shared Master Figma', 'Figma Status']);
    }
}

// Function to add sample data (run this once)
function addSampleData() {
    const sampleStudents = [
        {
            id: '1',
            name: 'Ahmed Hassan',
            email: 'ahmed@example.com',
            whatsapp: '+20 123 456 7890',
            location: 'Egypt',
            language: 'Arabic',
            status: 'Current Cohort',
            cohort: 'Cohort 1 - Jan 2024',
            totalAmount: 500,
            paidAmount: 500,
            remaining: 0,
            note: 'Excellent student, very engaged',
            checklist: {
                addedCommunity: true,
                sharedAgreement: true,
                signedAgreement: true,
                sharedDrive: true,
                createdFigma: true,
                sharedMasterFigma: true,
                figmaStatus: 'Approved'
            }
        },
        {
            id: '2',
            name: 'Layla Mohamed',
            email: 'layla@example.com',
            whatsapp: '+966 123 456 7890',
            location: 'Saudi Arabia',
            language: 'Arabic',
            status: 'Current Cohort',
            cohort: 'Cohort 1 - Jan 2024',
            totalAmount: 500,
            paidAmount: 250,
            remaining: 250,
            note: 'Needs payment plan',
            checklist: {
                addedCommunity: true,
                sharedAgreement: true,
                signedAgreement: false,
                sharedDrive: true,
                createdFigma: false,
                sharedMasterFigma: false,
                figmaStatus: 'Submitted'
            }
        }
    ];

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initializeSheets();

    sampleStudents.forEach(student => {
        saveStudent(student);
    });

    Logger.log('Sample data added successfully!');
}
