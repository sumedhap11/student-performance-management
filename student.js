// student.js
// The Student class represents one student record:
//   { id: 101, name: "Aarav", marks: { mathematics: 85, science: 91 } }

// Grading scale based on AVERAGE marks.
const GRADE_SCALE = [
  { minimum: 90, grade: "A+" },
  { minimum: 80, grade: "A" },
  { minimum: 70, grade: "B" },
  { minimum: 60, grade: "C" },
  { minimum: 50, grade: "D" },
  { minimum: 0, grade: "F" },
];

// Pass/fail rule: every subject must score at least 35 marks.
const PASS_MARKS = 35;

export default class Student {
  // The constructor receives the record with destructuring.
  constructor({ id, name, marks }) {
    this.id = id;
    this.name = name;
    this.marks = marks;
  }

  // Total marks of all subjects.
  calculateTotal() {
    return Object.values(this.marks).reduce((sum, mark) => sum + mark, 0);
  }

  // Average marks = total marks / number of subjects.
  calculateAverage() {
    const count = Object.keys(this.marks).length;
    return count > 0 ? this.calculateTotal() / count : 0;
  }

  // Grade is decided from the average using the grading scale.
  getGrade() {
    const average = this.calculateAverage();
    return GRADE_SCALE.find((rule) => average >= rule.minimum).grade;
  }

  // PASS only when every subject is 35 or more, otherwise FAIL.
  getStatus() {
    return Object.values(this.marks).every((mark) => mark >= PASS_MARKS)
      ? "PASS"
      : "FAIL";
  }

  // Plain object used when writing the record back to the JSON file.
  toJSON() {
    return { id: this.id, name: this.name, marks: this.marks };
  }
}
