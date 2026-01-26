// ============================================
// GOOGLE APPS SCRIPT - SYNC HANDLER
// ============================================
// Deploy this script as a web app to sync dashboard data to Google Sheets

// Configuration
const SHEET_NAME = 'Students'; // Change to your sheet name
const SHEET_ID = '1nZJJGgwRgv8KrKp3EY_5X94iTPzyNxIw_hCq28yuw-k'; // Get this from your Google Sheet URL

// Main handler for incoming requests
function doPost(e) {
    try {
        const payload = JSON.parse(e.postData.contents);
        
        if (payload.action === 'updateSheet') {
            updateStudentSheet(payload.data);
            return ContentService.createTextOutput(JSON.stringify({
                status: 'success',
                message: 'Data synced successfully',
                count: payload.data.length
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Unknown action'
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function updateStudentSheet(students) {
    try {
        // Get the spreadsheet and sheet
        const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
        let sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = spreadsheet.insertSheet(SHEET_NAME);
        }
        
        // Clear existing data (keep headers if you want)
        sheet.clearContents();
        
        // Add headers
        const headers = [
            'ID', 'Name', 'Email', 'Figma Email', 'LinkedIn', 'WhatsApp', 'Location', 'Language',
            'Payment Method', 'Total Amount', 'Paid Amount', 'Remaining', 'Status', 'Cohort',
            'Note', 'Onboarding: Community', 'Onboarding: Agreement', 'Onboarding: Signed',
            'Onboarding: Drive', 'Onboarding: Figma', 'Onboarding: Master Figma', 'Figma Status', 
            'Post-Course: Feedback Form', 'Post-Course: Course Feedback', 'Post-Course: Certificate', 'Last Updated'
        ];
        
        sheet.appendRow(headers);
        
        // Add student data
        const timestamp = new Date().toLocaleString();
        const rows = students.map(student => [
            student.id,
            student.name,
            student.email,
            student.figmaEmail || '',
            student.linkedin || '',
            student.whatsapp || '',
            student.location || '',
            student.language || '',
            student.paymentMethod || '',
            student.totalAmount || 0,
            student.paidAmount || 0,
            student.remaining || 0,
            student.status || '',
            student.cohort || '',
            student.note || '',
            student.checklist?.addedCommunity ? 'Yes' : 'No',
            student.checklist?.sharedAgreement ? 'Yes' : 'No',
            student.checklist?.signedAgreement ? 'Yes' : 'No',
            student.checklist?.sharedDrive ? 'Yes' : 'No',
            student.checklist?.createdFigma ? 'Yes' : 'No',
            student.checklist?.sharedMasterFigma ? 'Yes' : 'No',
            student.checklist?.figmaStatus || 'Not started',
            student.checklist?.sharedFeedbackForm ? 'Yes' : 'No',
            student.checklist?.submittedCourseFeedback ? 'Yes' : 'No',
            student.checklist?.issuedCertificate ? 'Yes' : 'No',
            timestamp
        ]);
        
        // Insert all rows at once
        if (rows.length > 0) {
            sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        }
        
        // Auto-fit columns
        sheet.autoResizeColumns(1, headers.length);
        
        Logger.log('Successfully updated ' + students.length + ' students');
    } catch (error) {
        Logger.log('Error updating sheet: ' + error.toString());
        throw error;
    }
}

// Helper function to test the script
function testSync() {
    const testData = [{
        id: 'test1',
        name: 'Test Student',
        email: 'test@example.com',
        whatsapp: '+1 234 567 8900',
        location: 'Test City',
        language: 'English',
        status: 'Current Cohort',
        cohort: 'Cohort 1',
        totalAmount: 500,
        paidAmount: 250,
        remaining: 250,
        note: 'Test entry',
        checklist: {
            addedCommunity: true,
            sharedAgreement: false,
            signedAgreement: false,
            sharedDrive: true,
            createdFigma: false,
            sharedMasterFigma: false,
            figmaStatus: 'Not started'
        }
    }];
    
    updateStudentSheet(testData);
    Logger.log('Test sync completed');
}
