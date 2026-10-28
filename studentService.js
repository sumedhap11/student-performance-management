// studentService.js
// Service layer: search, filter, sort, rank and JSON file storage.
import { readFile, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import Student from "./student.js";
import { validateStudent } from "./validation.js";

// Return a copy of the list so the original array is never changed.
export const listStudents = (students) => [...students];

// Search one student by ID, returns null when the ID is not found.
export const findStudentById = (students, id) =>
  students.find((student) => student.id === id) ?? null;

// Filter the students who received a particular grade.
export const filterByGrade = (students, grade) =>
  students.filter((student) => student.getGrade() === grade);

// Sort students by average marks, highest first.
// The spread syntax copies the array before sorting.
export const sortByAverage = (students) =>
  [...students].sort((a, b) => b.calculateAverage() - a.calculateAverage());

// Rank students by average marks.
// Students with EQUAL average marks receive the SAME rank (1, 2, 2, 4 style).
export const rankStudents = (students) => {
  const sorted = sortByAverage(students);
  let previousAverage = null;
  let previousRank = 0;
  return sorted.map((student, index) => {
    const average = student.calculateAverage();
    const rank = average === previousAverage ? previousRank : index + 1;
    previousAverage = average;
    previousRank = rank;
    return {
      rank,
      id: student.id,
      name: student.name,
      total: student.calculateTotal(),
      average: average.toFixed(2),
      grade: student.getGrade(),
      status: student.getStatus(),
    };
  });
};

// Add a student after validation and duplicate-ID check.
// Returns a NEW array, the original list is not changed.
export function addStudent(students, record) {
  if (!validateStudent(record)) {
    throw new Error(
      "Invalid student record. Check the ID, name and that every mark is between 0 and 100.",
    );
  }
  if (findStudentById(students, record.id)) {
    throw new Error(`Duplicate student ID: ${record.id}. IDs must be unique.`);
  }
  return [...students, new Student(record)];
}

// Load all students from the JSON file (asynchronous, using async/await).
export async function loadStudents(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    // Missing file is not an error: it simply means "no records yet".
    if (error.code === "ENOENT") return [];
    throw new Error(`Could not read ${path}: ${error.message}`);
  }

  let records;
  try {
    records = JSON.parse(text);
  } catch {
    throw new Error(
      `${path} contains malformed JSON. Fix or delete the file and try again.`,
    );
  }

  if (!Array.isArray(records)) {
    throw new Error(`${path} must contain an array of student records.`);
  }
  if (records.some((record) => !validateStudent(record))) {
    throw new Error(
      `${path} contains an invalid student record. Check that every mark is between 0 and 100.`,
    );
  }
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error(`${path} contains duplicate student IDs.`);
  }
  // Convert every plain record back into a Student object.
  return records.map((record) => new Student(record));
}

// Save all students to the JSON file (asynchronous).
// A temporary file is written first and then renamed, so the data file
// is never left half-written if the program stops in the middle.
export async function saveStudents(path, students) {
  const records = students.map((student) => student.toJSON());
  if (records.some((record) => !validateStudent(record))) {
    throw new Error("Refusing to save: the list contains an invalid record.");
  }
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error("Refusing to save: duplicate student IDs detected.");
  }
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}
