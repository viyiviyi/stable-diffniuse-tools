const yaml = require("js-yaml");
const fs = require("fs");

module.exports.getYamltags = function getYamltags(path) {
  const ls = [];

  const doc = yaml.load(fs.readFileSync(path, "utf8"));
  if (doc.content)
    Object.keys(doc.content).forEach((key) => {
      ls.push([key, 0, doc.name, doc.content[key].name]);
      if (Array.isArray(doc.content[key].alias)) {
        doc.content[key].alias.forEach((item) => {
          ls.push([item, 0, doc.name, doc.content[key].name]);
        });
      }
    });
  return ls;
};
