import { evaluateCode, normalizeOutput } from '../src/lib/judge/evaluator';
import { authenticateStudent, nimToEmail, emailToNim } from '../src/lib/auth/student-auth';
import { MOCK_PROBLEMS } from '../src/lib/mock-data';

console.log('🧪 ====================================================');
console.log('🧪 CP ARENA — AUTOMATED QA & INTEGRATION TEST SUITE');
console.log('🧪 ====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Test NIM to Email Proxy & Mapping
console.log('--- [TEST GROUP 1: Student NIM Authentication Mapping] ---');
assert(nimToEmail('230101001') === '230101001@cparena.internal', 'NIM 230101001 correctly mapped to 230101001@cparena.internal');
assert(emailToNim('230101001@cparena.internal') === '230101001', 'Reverse email to NIM extraction works');

// 2. Test Default NIM Password Authentication Logic
const authStudent1 = await authenticateStudent('230101001', '230101001');
assert(authStudent1.success === true, 'Student logs in successfully using default password (NIM)');
assert(authStudent1.user?.full_name === 'Budi Santoso', 'Authenticated student profile matched: Budi Santoso');

const authWrongPass = await authenticateStudent('230101001', 'wrong_password_xyz');
assert(authWrongPass.success === false, 'Rejects student login with invalid password');

// 3. Test Lecturer Authentication
const authDosen = await authenticateStudent('DOSEN001', 'dosen123');
assert(authDosen.success === true && authDosen.user?.role === 'lecturer', 'Lecturer login verified with lecturer role');

// 4. Test Code Evaluator with Competitive Programming Standards
console.log('\n--- [TEST GROUP 2: Competitive Programming Sandbox Judge] ---');
const problemA = MOCK_PROBLEMS[0];
const sampleCases = problemA.sample_test_cases || [];

// Case 4.1: Empty Code -> Compilation Error (CE)
const resEmpty = evaluateCode('cpp', '', sampleCases);
assert(resEmpty.verdict === 'CE', 'Empty code returns Compilation Error (CE)');

// Case 4.2: Missing main() in C++ -> Compilation Error (CE)
const resNoMain = evaluateCode('cpp', 'int x = 10;', sampleCases);
assert(resNoMain.verdict === 'CE', 'C++ code missing main function returns Compilation Error (CE)');

// Case 4.3: Infinite Loop Detection -> Time Limit Exceeded (TLE)
const resTLE = evaluateCode('cpp', '#include <iostream>\nint main() { while(true) {} return 0; }', sampleCases, 1000);
assert(resTLE.verdict === 'TLE', 'Infinite loop correctly detected as Time Limit Exceeded (TLE)');

// Case 4.4: Valid Accepted Solution (AC)
const validCpp = `#include <iostream>
using namespace std;
int main() {
    int t;
    if (cin >> t) {
        cout << "5 5\\n5 11" << endl;
    }
    return 0;
}`;
const resAC = evaluateCode('cpp', validCpp, sampleCases);
assert(resAC.verdict === 'AC', 'Correct solution produces Accepted (AC) verdict');
assert(resAC.score === 100, 'Accepted solution receives full score 100/100');

// Case 4.5: Output normalization test
const dirtyOutput = "5 5  \r\n5 11   \r\n\r\n";
assert(normalizeOutput(dirtyOutput) === "5 5\n5 11", 'Output normalization correctly trims trailing spaces & CR/LF');

console.log('\n====================================================');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('====================================================\n');
