// validation.js
// Pure validation functions for student records.
// A student record looks like:
//   { id: 101, name: "Aarav", marks: { mathematics: 85, science: 91 } }

// Marks must be a real number between 0 and 100 (both included).
export const isValidMark = (mark) =>
  typeof mark === "number" &&
  Number.isFinite(mark) &&
  mark >= 0 &&
  mark <= 100;

// A record must have a positive whole-number ID, a non-empty name,
// and at least one valid subject mark.
export function validateStudent(record) {
  return Boolean(
    record &&
      Number.isInteger(record.id) &&
      record.id > 0 &&
      typeof record.name === "string" &&
      record.name.trim() !== "" &&
      record.marks &&
      typeof record.marks === "object" &&
      !Array.isArray(record.marks) &&
      Object.keys(record.marks).length > 0 &&
      Object.values(record.marks).every(isValidMark),
  );
}

// Parse one "subject=marks" pair typed on the command line,
// for example: mathematics=85  ->  ["mathematics", 85]
export const parseSubjectMark = (pair) => {
  if (typeof pair !== "string" || !pair.includes("=")) {
    throw new Error(
      `Invalid entry: "${pair}". Use the form subject=marks, e.g. mathematics=85.`,
    );
  }
  const [subject, markText] = pair.split("=");
  if (subject.trim() === "" || markText.trim() === "") {
    throw new Error(
      `Invalid entry: "${pair}". Subject name and marks are both required.`,
    );
  }
  const mark = Number(markText);
  if (!isValidMark(mark)) {
    throw new Error(
      `Invalid marks for "${subject.trim()}": "${markText}". Marks must be a number from 0 to 100.`,
    );
  }
  return [subject.trim().toLowerCase(), mark];
};
