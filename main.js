// main.js
// Command-line entry point of the Student Performance Management System.
//
// Commands:
//   node src/main.js help
//   node src/main.js seed
//   node src/main.js add <id> <name> <subject=marks> ...
//   node src/main.js list
//   node src/main.js search <id>
//   node src/main.js filter <grade>
//   node src/main.js sort
//   node src/main.js rank
//   node src/main.js report
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Student from "./student.js";
import * as svc from "./studentService.js";
import { parseSubjectMark } from "./validation.js";

// Path of the JSON data file.
// (ESM way of writing __dirname, same technique as in the class notes.)
const dataPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../data/students.json",
);

// Demo records written by the "seed" command.
// Student 101 is the example record given in the assignment.
const seedRecords = [
  {
    id: 101,
    name: "Aarav",
    marks: { mathematics: 85, science: 91, programming: 96 },
  },
  {
    id: 102,
    name: "Vivaan",
    marks: { mathematics: 72, science: 68, programming: 75 },
  },
  {
    id: 103,
    name: "Saanvi",
    marks: { mathematics: 91, science: 88, programming: 87 },
  },
  {
    id: 104,
    name: "Riya",
    marks: { mathematics: 66, science: 71, programming: 69 },
  },
  {
    id: 105,
    name: "Kabir",
    marks: { mathematics: 84, science: 79, programming: 84 },
  },
  {
    id: 106,
    name: "Meera",
    marks: { mathematics: 58, science: 62, programming: 55 },
  },
  {
    id: 107,
    name: "Ishaan",
    marks: { mathematics: 30, science: 71, programming: 66 },
  },
  {
    id: 108,
    name: "Anaya",
    marks: { mathematics: 70, science: 80, programming: 85 },
  },
  {
    id: 109,
    name: "Reyansh",
    marks: { mathematics: 78, science: 76, programming: 81 },
  },
];

// Grades accepted by the "filter" command.
const VALID_GRADES = ["A+", "A", "B", "C", "D", "F"];

const USAGE = `Student Performance Management System
Usage: node src/main.js <command> [arguments]

Commands:
  seed                              Reset data/students.json with demo records
  add <id> <name> <subject=marks>   Add one student (repeat subject=marks as needed)
  list                              Show every student with total, average, grade, status
  search <id>                       Search one student by ID with subject-wise marks
  filter <grade>                    Show students who received a grade (${VALID_GRADES.join(", ")})
  sort                              Show students sorted by average marks (high to low)
  rank                              Show students ranked by average (equal averages share a rank)
  report                            Show the full formatted performance report
  help                              Show this help message

Example:
  node src/main.js add 110 Ananya mathematics=88 science=92 programming=85`;

// Convert a Student object into one printable table row.
const toRow = (student) => ({
  ID: student.id,
  Name: student.name,
  Total: student.calculateTotal(),
  Average: student.calculateAverage().toFixed(2),
  Grade: student.getGrade(),
  Status: student.getStatus(),
});

// Print an array of rows as a table, or a friendly message when empty.
const printRows = (rows, emptyMessage) => {
  if (rows.length === 0) {
    console.log(emptyMessage);
    return;
  }
  console.table(rows);
};

// Full performance report formatted with template literals.
const printReport = (students) => {
  if (students.length === 0) {
    console.log("No student records found. Run \"seed\" or \"add\" first.");
    return;
  }
  const ranked = svc.rankStudents(students);
  const passed = students.filter((student) => student.getStatus() === "PASS");
  const lines = ranked.map(
    (row) =>
      `  ${row.rank}. ${row.name} (ID ${row.id})  Total: ${row.total}  Average: ${row.average}  Grade: ${row.grade}  ${row.status}`,
  );
  console.log(`==================== STUDENT PERFORMANCE REPORT ====================
Records : ${students.length}
Passed  : ${passed.length}
Failed  : ${students.length - passed.length}
Topper  : ${ranked[0].name} (average ${ranked[0].average})

${lines.join("\n")}
=====================================================================`);
};

// Handle one command. Every command reads the data file first,
// except "seed" (which rewrites it) and "help".
const runCommand = async (command, args) => {
  if (command === "help") {
    console.log(USAGE);
    return;
  }

  if (command === "seed") {
    await svc.saveStudents(
      dataPath,
      seedRecords.map((record) => new Student(record)),
    );
    console.log(
      `Saved ${seedRecords.length} demo student records to data/students.json.`,
    );
    return;
  }

  const students = await svc.loadStudents(dataPath);

  switch (command) {
    case "add": {
      const [idText, name, ...pairTexts] = args;
      const id = Number(idText);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Student ID must be a positive whole number.");
      }
      if (!name || name.trim() === "") {
        throw new Error("Student name is required.");
      }
      if (pairTexts.length === 0) {
        throw new Error(
          "Enter at least one subject=marks pair, e.g. mathematics=85",
        );
      }
      // Object.fromEntries builds the marks object from ["subject", mark] pairs.
      const marks = Object.fromEntries(pairTexts.map(parseSubjectMark));
      const updated = svc.addStudent(students, { id, name: name.trim(), marks });
      await svc.saveStudents(dataPath, updated);
      const added = svc.findStudentById(updated, id);
      console.log(
        `Added ${added.name} (ID ${added.id}) - Total: ${added.calculateTotal()}, Average: ${added.calculateAverage().toFixed(2)}, Grade: ${added.getGrade()}, Status: ${added.getStatus()}`,
      );
      break;
    }

    case "list":
      printRows(
        students.map(toRow),
        "No student records found. Run \"seed\" or \"add\" first.",
      );
      break;

    case "search": {
      const id = Number(args[0]);
      const student = svc.findStudentById(students, id);
      if (!student) {
        throw new Error(`No student found with ID ${args[0] ?? "(missing)"}.`);
      }
      // Destructure the student to build the report.
      const { id: studentId, name, marks } = student;
      const subjectLines = Object.entries(marks).map(
        ([subject, mark]) => `  ${subject.padEnd(12)} : ${mark}`,
      );
      console.log(`Student ID : ${studentId}
Name       : ${name}
${subjectLines.join("\n")}
Total      : ${student.calculateTotal()}
Average    : ${student.calculateAverage().toFixed(2)}
Grade      : ${student.getGrade()}
Status     : ${student.getStatus()}`);
      break;
    }

    case "filter": {
      const grade = (args[0] ?? "").toUpperCase();
      if (!VALID_GRADES.includes(grade)) {
        throw new Error(`Grade must be one of: ${VALID_GRADES.join(", ")}.`);
      }
      printRows(
        svc.filterByGrade(students, grade).map(toRow),
        `No students found with grade ${grade}.`,
      );
      break;
    }

    case "sort":
      printRows(
        svc.sortByAverage(students).map(toRow),
        "No student records found to sort.",
      );
      break;

    case "rank":
      printRows(
        svc.rankStudents(students),
        "No student records found to rank.",
      );
      break;

    case "report":
      printReport(students);
      break;

    default:
      console.log(USAGE);
  }
};

// Read the command from the command line and run it.
const [command = "help", ...args] = process.argv.slice(2);
try {
  await runCommand(command, args);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
