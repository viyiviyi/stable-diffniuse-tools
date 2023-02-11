const fs = require("fs");
const translations = [];

let def = fs.readFileSync("translation.input.csv").toString().split("\n");
def
  .filter((v) => v)
  .map((v) => v.trim())
  .forEach((v) => {
    let l = v.replace(/"/g,"").split(",").map((v) => v.trim());
    let tag = l[0].toLowerCase().trim().replace(/\s+/g, "_");
    let name = l.slice(1);
    translations.push([tag, name]);
  });
fs.writeFileSync(
  "translation.sort.csv",
  translations
    .sort((v, n) => (v[0] > n[0] ? 1 : v[0] < n[0] ? -1 : 0))
    .map((v) => {
      v[1] = '"' + v[1].filter((v) => v).join(",") + '"'.trim().replace(/\s+/g, "_").replace(/\|/g, ",");
      return v.join(",");
    })
    .join("\n")
);
