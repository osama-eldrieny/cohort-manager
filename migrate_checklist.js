import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STUDENTS_JSON = path.join(__dirname, 'students.json');
const COMPLETION_JSON = path.join(__dirname, 'student_checklist_completion.json');

console.log('🔄 Starting checklist migration...\n');

try {
    // Read students file
    const studentsData = fs.readFileSync(STUDENTS_JSON, 'utf-8');
    const students = JSON.parse(studentsData);
    
    console.log(`📊 Found ${students.length} students to migrate`);
    
    let completions = [];
    
    // Mapping of old field names to new checklist item IDs
    const fieldToItemId = {
        'addedCommunity': 1,
        'sharedAgreement': 2,
        'respondStudentGrouping': 3,
        'sharedDrive': 4,
        'sharedMasterFigma': 5,
        'signedAgreement': 6,
        'respondedStudentGrouping': 7,
        'createdFigma': 8,
        'sharedFeedbackForm': 13,
        'submittedCourseFeedback': 14,
        'issuedCertificate': 15
    };
    
    // Figma status mapping
    const figmaStatusMap = {
        'Not started': 9,
        'Submitted': 10,
        'Under review': 11,
        'Approved': 12
    };
    
    // Process each student
    let migratedCount = 0;
    students.forEach((student, index) => {
        if (!student.checklist) {
            console.log(`  ⚠️  Student ${index + 1} (${student.name}): No checklist data`);
            return;
        }
        
        const checklist = student.checklist;
        const studentId = student.id;
        let itemsMigrated = 0;
        
        // Migrate old checkbox fields
        Object.entries(fieldToItemId).forEach(([fieldName, itemId]) => {
            if (checklist[fieldName] === true) {
                completions.push({
                    student_id: studentId,
                    checklist_item_id: itemId,
                    completed_at: new Date().toISOString()
                });
                itemsMigrated++;
            }
        });
        
        // Migrate figma status
        if (checklist.figmaStatus && figmaStatusMap[checklist.figmaStatus]) {
            completions.push({
                student_id: studentId,
                checklist_item_id: figmaStatusMap[checklist.figmaStatus],
                completed_at: new Date().toISOString()
            });
            itemsMigrated++;
        }
        
        if (itemsMigrated > 0) {
            console.log(`  ✅ Student ${index + 1} (${student.name}): Migrated ${itemsMigrated} items`);
            migratedCount++;
        }
    });
    
    // Save completions
    fs.writeFileSync(COMPLETION_JSON, JSON.stringify(completions, null, 2));
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   - Migrated ${migratedCount}/${students.length} students`);
    console.log(`   - Created ${completions.length} completion records`);
    console.log(`   - Saved to: ${path.relative(__dirname, COMPLETION_JSON)}`);
    console.log('\n💡 You can now remove the old checklist field from students.json if needed.');
    
} catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
}
