# Project Report — Student Performance Management System Using Node.js

**Assignment 6 — Advanced JavaScript and Node.js Application Development (WPT)**
**Student:** Prathamesh Jadhav | **Roll No:** 16 | **Date:** 27-10-2026

---

## 1. Introduction

The Student Performance Management System is a command-line application built with Node.js and ES6+ JavaScript. It manages student records (ID, name, subjects, and marks), calculates academic performance, and generates formatted reports.

Records are stored as objects inside a JSON array in `data/students.json`, so the data survives between runs of the program. The application supports adding students, listing them, searching by ID, filtering by grade, sorting and ranking by average marks, and a full performance report. It also validates input and handles file-related errors such as a missing file or corrupted JSON content.

The project is split into small ES modules: a `Student` class that represents one student, a service module that searches/filters/sorts/stores data, a validation module, and a command-line entry point.

## 2. Objectives

1. Accept student names, IDs, subjects, and marks from the command line.
2. Store records using arrays and objects (JSON file storage).
3. Calculate total marks, average marks, grades, and pass/fail status.
4. Search for students by ID and filter students by grade.
5. Sort students by average marks, and rank them (equal averages share a rank).
6. Save student records to a JSON file and retrieve them later asynchronously.
7. Handle invalid inputs and file-related errors gracefully.
8. Use ES6+ features: `let`/`const`, arrow functions, template literals, destructuring, spread/rest syntax, classes, ES modules, and `async/await`.

## 3. Methodology

### 3.1 Data model

Each student is stored as a plain object (the same structure given in the assignment):

```javascript
const student = {
  id: 101,
  name: "Aarav",
  marks: {
    mathematics: 85,
    science: 91,
    programming: 96
  }
};
```

All records together form an array of these objects, which is written to `data/students.json` using `JSON.stringify` and read back with `JSON.parse`.

### 3.2 Grading scale (clearly defined)

| Average marks | Grade |
|---------------|-------|
| 90 – 100      | A+    |
| 80 – 89.99    | A     |
| 70 – 79.99    | B     |
| 60 – 69.99    | C     |
| 50 – 59.99    | D     |
| below 50      | F     |

### 3.3 Pass/fail rule (clearly defined)

A student is **PASS** only when every individual subject is 35 or more; otherwise the status is **FAIL**. This is why a student can have grade `D` and still pass, or fail with a `D` average when one subject is below 35 (for example Ishaan in the demo data: average 55.67 but mathematics 30 → FAIL).

### 3.4 Module design

| Module | Responsibility |
|--------|----------------|
| `src/student.js` | `Student` class: total, average, grade, pass/fail |
| `src/validation.js` | Pure validation functions for records and marks |
| `src/studentService.js` | Search, filter, sort, rank, add, async JSON load/save |
| `src/main.js` | Command-line commands and report formatting |

### 3.5 Commands

```text
seed, add <id> <name> <subject=marks>..., list, search <id>,
filter <grade>, sort, rank, report, help
```

## 4. Browser JavaScript vs. Node.js Analysis

This application uses Node.js instead of browser JavaScript alone for the following reasons:

### 4.1 Accessing local files through Node.js APIs

A browser page cannot open or create files on the student's computer. Node.js provides the `fs` / `fs/promises` module, which this project uses to read `data/students.json` (`readFile`) and write records back (`writeFile` followed by `rename`). Saving records permanently and loading them in the next run is only possible through these file APIs.

### 4.2 Browser security restrictions vs. server-side file access

Browsers deliberately restrict page scripts: no direct file-system access, cross-origin (CORS) rules, and a sandboxed environment — all to protect the user from malicious pages. These same restrictions would break a JSON-file-based data store. Running on the server side, Node.js has normal file-system access within the project folder, so the application can freely read and write its own data file. (The project still stays safe by only touching its own `data/` folder and validating everything it loads.)

### 4.3 The role of the runtime environment

Browser JavaScript runs inside the browser's JavaScript engine (e.g., V8 in Chrome) wrapped in a page with a DOM and `window`. Node.js runs the same V8 engine but wraps it with server-side APIs — file system, `process`, `console` in a terminal — and no DOM. Because the engine is the same, all ES6+ features used here (classes, modules, destructuring, spread/rest, arrow functions, template literals) work in both environments; only the surrounding APIs differ. Node.js is the runtime that turns JavaScript into a command-line, file-handling application.

### 4.4 How a browser interface could communicate with a Node.js backend

A website front end (HTML/CSS/React) can talk to a Node.js program through HTTP requests — `fetch()` or `axios` from the browser to REST API endpoints (`GET /students`, `POST /students`) implemented with the Express module on the server. The server would keep the same logic used in this project (`Student` class, validation, ranking) and expose it over routes; the browser would only display the results. This is exactly the client-server pattern used in the class API assignments.

### 4.5 Advantages of separating frontend and backend responsibilities

Keeping data and calculations on the backend means: (1) one copy of the data — no conflicts between users; (2) validation and grading rules enforced in one place, so results are consistent for everyone; (3) sensitive data and file access stay on the server instead of being exposed in the browser; and (4) the front end can be redesigned freely without touching the business logic. This assignment implements the backend half; an interface could be added later without changing the calculation code.

## 5. Node.js REPL Experimentation

Before building the application, five sets of experiments were run in the REPL (`node -i`). The complete transcript — every expression with the actual REPL output and an explanation — is included in **`repl-experiments.txt`**. Summary:

| # | Experiment | Key expression | Output |
|---|------------|----------------|--------|
| 1 | Grade calculation | `grade(90.67)` with a nested-ternary arrow function | `'A+'` |
| 2 | Array filtering/sorting | `students.filter((s) => s.average >= 80).map((s) => s.name)` | `[ 'Aarav', 'Saanvi' ]` |
| 2 | Array sorting | `[...students].sort((a, b) => b.average - a.average).map((s) => s.name)` | `[ 'Aarav', 'Saanvi', 'Vivaan' ]` |
| 3 | Destructuring | `const { id, name, marks: { mathematics } } = student;` | `'101 -> Aarav -> mathematics: 85'` |
| 4 | Arrow + template literal | `` `Aarav scored ${mark} in ${subject}` `` | `'Aarav scored 91 in science'` |
| 5 | Error handling | `Number("abc")`, `try { JSON.parse("{ name: Aarav }") } catch (e) { ... }` | `NaN`, caught JSON error message |

Total and average for the assignment's example student were also confirmed in the REPL: `total → 272`, average → `'90.67'`. The mark range checks `-5 >= 0 && -5 <= 100 → false` and `105 >= 0 && 105 <= 100 → false` became the validation rule `mark >= 0 && mark <= 100`.

## 6. Implementation Challenge

The tasks from the assignment, and how each one is implemented:

1. **Calculate the student's average marks** — `Student.calculateTotal()` uses `Object.values(this.marks).reduce((sum, mark) => sum + mark, 0)` and `calculateAverage()` divides the total by the number of subjects. For Aarav: total 272, average 90.67.
2. **Determine a grade using a clearly defined scale** — `Student.getGrade()` looks the average up in the `GRADE_SCALE` array (section 3.2).
3. **Create a reusable Student class** — `src/student.js` exports `class Student` with a destructuring constructor `constructor({ id, name, marks })` and methods used everywhere else in the program.
4. **Write a function that ranks students by average marks** — `rankStudents()` in `src/studentService.js` sorts a copy of the list and assigns competition ranks: equal averages receive the same rank (1, 2, 2, 4 style).
5. **Save multiple student records to a JSON file** — `saveStudents()` validates the list, writes it with `JSON.stringify(records, null, 2)` to a temporary file, then renames it over `students.json`.
6. **Load the records asynchronously and display a formatted report** — `loadStudents()` uses `await readFile(...)` plus `JSON.parse`, converts each record back into a `Student`, and the `report` command prints the formatted report with template literals.
7. **Handle missing files, malformed JSON, and invalid marks** — a missing file returns an empty list (first run), malformed JSON throws a clear "malformed JSON" message, non-array content and invalid records are rejected during load, and `saveStudents()` refuses to write invalid or duplicate data.

## 7. How Each ES6+ Feature Is Used

| ES6+ feature | Where it is used |
|--------------|------------------|
| `let` and `const` | Everywhere — e.g. `previousAverage`/`previousRank` (`let`) in `rankStudents`, module constants like `GRADE_SCALE` and `dataPath` (`const`) |
| Arrow functions | All calculations and transformations: `reduce` for totals, `filter` for grades, `map` for rows, `sort` comparators, `isValidMark`, `parseSubjectMark` |
| Template literals | The performance report, the usage menu, every confirmation and error message (`Added ${name} (ID ${id}) - Total: ...`) |
| Destructuring | `Student` constructor `constructor({ id, name, marks })`; the `search` command `const { id: studentId, name, marks } = student`; `const [command = "help", ...args] = process.argv.slice(2)`; `const [subject, markText] = pair.split("=")` |
| Spread syntax | `[...students]` before sorting and in `addStudent` (`[...students, new Student(record)]`) so original arrays are never changed |
| Rest syntax | `(...args)` collects the `subject=marks` pairs in the `add` command; `const [idText, name, ...pairTexts] = args` |
| Classes and constructors | `class Student` in `src/student.js` |
| ES Modules | `import`/`export` between `main.js`, `student.js`, `studentService.js`, and `validation.js` (`"type": "module"` in `package.json`) |
| Promises / async-await | `await readFile(...)` and `await writeFile(...)` in `loadStudents()`/`saveStudents()`, called with top-level `await` in `main.js` |

## 8. Testing and Evaluation

The test script `test/runTests.js` (run with `npm test`) covers every case required by the assignment. **Result: 27 checks passed, 0 failed.** Full captured output is in `outputs/test-results.txt`.

| Case | Expected result | How the program handles it | Status |
|------|-----------------|----------------------------|--------|
| Valid student records | Records load; totals/averages/grades computed correctly | `loadStudents` returns `Student` objects; Aarav: total 272, average 90.67, grade A+, status PASS | PASS |
| Duplicate student IDs | Rejected on load and on add | Load throws "duplicate student IDs"; `addStudent` throws "Duplicate student ID: 101" | PASS |
| Marks below 0 or above 100 | Rejected by validation | `isValidMark` rejects −5 and 105, accepts 0 and 100; `addStudent` throws "Invalid student record" | PASS |
| Empty student lists | No crash; friendly message | Missing/empty list → `list`/`report` print "No student records found"; sort/rank/filter return empty arrays safely | PASS |
| Missing JSON file | Treated as an empty list (first run) | `readFile` error with `code === "ENOENT"` returns `[]` instead of crashing | PASS |
| Corrupted JSON file | Friendly error, no crash | `JSON.parse` inside `try/catch` throws "contains malformed JSON"; non-array JSON is also rejected; `saveStudents` refuses invalid records | PASS |
| Equal average marks | Both students listed; same rank | Anaya and Reyansh both average 78.33 → both rank 4; next student gets rank 6 | PASS |
| Save + load round trip | Records unchanged after reload | Records keep their order and values after `saveStudents` → `loadStudents` | PASS |

## 9. Sample Program Execution

Real console captures are stored in the `outputs/` folder:

- `outputs/sample-run.txt` — `list`, `search 101`, `filter A`, `sort`, `rank`, `report`, and the error cases (duplicate ID, marks 150, invalid grade, unknown ID).
- `outputs/test-results.txt` — the complete test run (27 checks).
- `outputs/lint.txt` — ESLint result (no errors).

Extract from `report` (note the shared rank 4 and the FAIL status for Ishaan):

```text
==================== STUDENT PERFORMANCE REPORT ====================
Records : 9
Passed  : 8
Failed  : 1
Topper  : Aarav (average 90.67)

  1. Aarav (ID 101)  Total: 272  Average: 90.67  Grade: A+  PASS
  2. Saanvi (ID 103)  Total: 266  Average: 88.67  Grade: A  PASS
  3. Kabir (ID 105)  Total: 247  Average: 82.33  Grade: A  PASS
  4. Anaya (ID 108)  Total: 235  Average: 78.33  Grade: B  PASS
  4. Reyansh (ID 109)  Total: 235  Average: 78.33  Grade: B  PASS
  6. Vivaan (ID 102)  Total: 215  Average: 71.67  Grade: B  PASS
  7. Riya (ID 104)  Total: 206  Average: 68.67  Grade: C  PASS
  8. Meera (ID 106)  Total: 175  Average: 58.33  Grade: D  PASS
  9. Ishaan (ID 107)  Total: 167  Average: 55.67  Grade: D  FAIL
=====================================================================
```

Error handling examples from the same capture:

```text
Error: Duplicate student ID: 101. IDs must be unique.
Error: Invalid marks for "mathematics": "150". Marks must be a number from 0 to 100.
Error: Grade must be one of: A+, A, B, C, D, F.
Error: No student found with ID 999.
```

## 10. Conclusion

The Student Performance Management System fulfils every requirement of the assignment: it accepts student data, stores it as arrays and objects in a JSON file, calculates totals, averages, grades, and pass/fail status, searches by ID, filters by grade, sorts and ranks by average marks, and loads the data back asynchronously in later runs. Invalid input (duplicate IDs, marks outside 0–100, bad command arguments) and file problems (missing file, malformed JSON) are all handled with clear messages instead of crashes.

Building it practiced all required ES6+ features — classes, modules, destructuring, spread/rest syntax, arrow functions, template literals, `let`/`const`, and `async/await` — and the REPL experiments confirmed each feature before it was used in the code. The separation between the `Student` class, the service layer, validation, and the CLI also shows why Node.js is the right runtime for this kind of data-processing application, and how a browser interface could later be added on top of the same logic through a REST API.
