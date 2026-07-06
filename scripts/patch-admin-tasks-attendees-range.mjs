import fs from "fs";

const path = "src/AdminTasksPagePreview.tsx";
let text = fs.readFileSync(path, "utf8");

const from = `      const uniqueDates = Array.from(
        new Set(
          [...tasks.map((t) => t.date), ...nonCleaning.map((t) => t.date)].filter(
            Boolean
          )
        )
      );`;

const to = `      const relevantTasks = tasks.filter((t) => {
        const d = normalizeIsoDate(t.date);
        if (viewMode === "TODAY") return d === baseDate;
        if (viewMode === "FUTURE") return isFutureDate(d);
        return d === selectedDate;
      });
      const relevantNonCleaning = nonCleaning.filter((t) => {
        const d = normalizeIsoDate(t.date);
        if (viewMode === "TODAY") return d === baseDate;
        if (viewMode === "FUTURE") return isFutureDate(d);
        return d === selectedDate;
      });
      const uniqueDates = Array.from(
        new Set(
          [...relevantTasks.map((t) => t.date), ...relevantNonCleaning.map((t) => t.date)].filter(
            Boolean
          )
        )
      );`;

if (text.includes(from)) {
  text = text.replace(from, to);
}

fs.writeFileSync(path, text);
console.log("patched admin tasks attendee date range");
