// runTests.js
// Test script for the Student Performance Management System.
// Run with: npm test   (or: node test/runTests.js)
//
// The assignment requires testing with:
//   1. Valid student records
//   2. Duplicate student IDs
//   3. Marks below zero or above 100
//   4. Empty student lists
//   5. Missing or corrupted JSON files
//   6. Students with equal average marks
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Student from "../src/student.js";
import * as svc from "../src/studentService.js";
import { validateStudent } from "../src/validation.js";

// Tiny assertion helpers (no testing framework needed).
let passed = 0;
let failed = 0;

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    console.log(`PASS : ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL : ${label}`);
  }
};

// Used for operations that MUST throw an error.
const checkRejects = async (label, promise, message) => {
  try {
    await promise;
    check(label, false);
  } catch (error) {
    check(label, error.message.includes(message));
  }
};

// A private temporary folder keeps these tests away from the real data file.
const tempDir = await mkdtemp(join(tmpdir(), "spm-test-"));

// ---------------------------------------------------------------- Test 1
// Valid student records: loading, searching and performance calculation.
console.log("\n--- Test 1: valid student records ---");
const validPath = join(tempDir, "valid.json");
await writeFile(
  validPath,
  JSON.stringify([
    { id: 101, name: "Aarav", marks: { mathematics: 85, science: 91, programming: 96 } },
    { id: 102, name: "Vivaan", marks: { mathematics: 72, science: 68, programming: 75 } },
  ]),
  "utf8",
);
const validStudents = await svc.loadStudents(validPath);
check("valid records are loaded", validStudents.length === 2);

const aarav = svc.findStudentById(validStudents, 101);
check("search by ID finds Aarav", aarav !== null && aarav.name === "Aarav");
check("search for unknown ID returns null", svc.findStudentById(validStudents, 999) === null);
check("total marks = 272", aarav.calculateTotal() === 272);
check("average = 90.67 (rounded)", aarav.calculateAverage().toFixed(2) === "90.67");
check("grade A+ for average above 90", aarav.getGrade() === "A+");
check("status PASS when every subject is 35 or more", aarav.getStatus() === "PASS");

// ---------------------------------------------------------------- Test 2
// Duplicate student IDs must be rejected everywhere.
console.log("\n--- Test 2: duplicate student IDs ---");
const duplicatePath = join(tempDir, "duplicate.json");
await writeFile(
  duplicatePath,
  JSON.stringify([
    { id: 101, name: "Aarav", marks: { mathematics: 85 } },
    { id: 101, name: "Imposter", marks: { mathematics: 90 } },
  ]),
  "utf8",
);
await checkRejects(
  "duplicate IDs inside the JSON file are rejected",
  svc.loadStudents(duplicatePath),
  "duplicate",
);
try {
  svc.addStudent(validStudents, { id: 101, name: "Fake", marks: { mathematics: 50 } });
  check("addStudent rejects a duplicate ID", false);
} catch (error) {
  check("addStudent rejects a duplicate ID", error.message.includes("Duplicate"));
}

// ---------------------------------------------------------------- Test 3
// Marks below zero or above 100 must be rejected.
console.log("\n--- Test 3: marks below zero or above 100 ---");
check("mark -5 is rejected", !validateStudent({ id: 1, name: "X", marks: { math: -5 } }));
check("mark 105 is rejected", !validateStudent({ id: 1, name: "X", marks: { math: 105 } }));
check("mark 0 is accepted", validateStudent({ id: 1, name: "X", marks: { math: 0 } }));
check("mark 100 is accepted", validateStudent({ id: 1, name: "X", marks: { math: 100 } }));
try {
  svc.addStudent(validStudents, { id: 999, name: "Bad", marks: { mathematics: 150 } });
  check("addStudent rejects out-of-range marks", false);
} catch (error) {
  check("addStudent rejects out-of-range marks", error.message.includes("Invalid"));
}

// ---------------------------------------------------------------- Test 4
// Empty student lists must never crash the program.
console.log("\n--- Test 4: empty student list ---");
const emptyStudents = await svc.loadStudents(join(tempDir, "does-not-exist.json"));
check("empty list loads safely", Array.isArray(emptyStudents) && emptyStudents.length === 0);
check("sorting an empty list is safe", svc.sortByAverage([]).length === 0);
check("ranking an empty list is safe", svc.rankStudents([]).length === 0);
check("filtering an empty list is safe", svc.filterByGrade([], "A").length === 0);

// ---------------------------------------------------------------- Test 5
// Missing and corrupted JSON files.
console.log("\n--- Test 5: missing or corrupted JSON files ---");
check(
  "missing file is treated as an empty list (first run)",
  (await svc.loadStudents(join(tempDir, "missing.json"))).length === 0,
);
const corruptPath = join(tempDir, "corrupt.json");
await writeFile(corruptPath, "{ this is not valid json ]", "utf8");
await checkRejects(
  "corrupted JSON gives a friendly error",
  svc.loadStudents(corruptPath),
  "malformed",
);
const wrongShapePath = join(tempDir, "wrong-shape.json");
await writeFile(wrongShapePath, JSON.stringify({ id: 101 }), "utf8");
await checkRejects(
  "JSON that is not an array is rejected",
  svc.loadStudents(wrongShapePath),
  "array",
);
await checkRejects(
  "saveStudents refuses invalid records",
  svc.saveStudents(join(tempDir, "never.json"), [
    new Student({ id: 1, name: "Bad", marks: { mathematics: 500 } }),
  ]),
  "Refusing",
);

// ---------------------------------------------------------------- Test 6
// Students with equal average marks share the same rank.
console.log("\n--- Test 6: students with equal average marks ---");
const topper = new Student({ id: 200, name: "Topper", marks: { mathematics: 95, science: 95, programming: 95 } });
const equalA = new Student({ id: 201, name: "Anaya", marks: { mathematics: 70, science: 80, programming: 85 } });
const equalB = new Student({ id: 202, name: "Reyansh", marks: { mathematics: 78, science: 76, programming: 81 } });
check("Anaya and Reyansh really have the same average", equalA.calculateAverage() === equalB.calculateAverage());
const ranked = svc.rankStudents([equalB, equalA, topper]);
check("highest average is ranked 1", ranked[0].name === "Topper" && ranked[0].rank === 1);
check("equal averages receive the same rank", ranked[1].rank === ranked[2].rank);
check("both equal-average students are still listed", ranked.length === 3);

// ---------------------------------------------------------------- Round trip
// Save and load must preserve every record.
console.log("\n--- Bonus: save + load round trip ---");
const roundTripPath = join(tempDir, "roundtrip.json");
await svc.saveStudents(roundTripPath, [equalB, equalA, topper]);
const reloaded = await svc.loadStudents(roundTripPath);
check(
  "records survive a save + load round trip",
  reloaded.length === 3 &&
    reloaded[0].name === "Reyansh" &&
    reloaded[2].name === "Topper",
);

// ---------------------------------------------------------------- Summary
console.log(`\nResult: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
await rm(tempDir, { recursive: true, force: true });
