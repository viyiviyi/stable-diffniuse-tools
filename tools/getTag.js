// eslint-disable-next-line no-unused-vars
const axios = require("axios");
const fs = require("fs");
const { join, resolve } = require("path");
const { getYamltags } = require("./getYaml");

// eslint-disable-next-line no-unused-vars
const baseUrl = "https://chart.dawnmark.cn";
// eslint-disable-next-line no-unused-vars
async function delay() {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, 200);
  });
}
const danboorus = [];
const danboorusHash = {};
let ls = [];
const translations = [];
const tags = new Set();

function addTags(tag, name, type = 0, hotCount = 0) {
  let d = danboorusHash[tag]; // danboorus.find((f) => f[0] == tag || f[3].includes(tag));
  if (d) {
    type = d.type;
    hotCount = d.hotCount;
  }
  name = name.replace(/_/g, "");
  if (tag == "upper_body") {
    console.log(!tags.has(tag));
  }
  if (!tags.has(tag)) {
    tags.add(tag);
    ls.push([tag, type, hotCount, [name]]);
    translations.push([tag, [name]]);
  } else {
    let idx = ls.findIndex((f) => f[0] == tag);
    if (idx > -1) {
      name.split(",").forEach((v) => {
        if (ls[idx][3].findIndex((f) => f.includes(v)) == -1) {
          ls[idx][3].push(v);
          translations[idx][1].push(v);
        }
      });
    }
  }
}
async function main() {
  let list = fs
    .readFileSync(resolve(__dirname, "./data", "./danbooru.csv"))
    .toString()
    .split("\n");
  let ts = list.map((v) => {
    let row = v
      .toLowerCase()
      .replace(/"/g, "")
      .split(",")
      .map((v) => v.trim());
    return [row[0], row[1], row[2], row.slice(3)];
  });
  ts.forEach((v) => {
    danboorus.push(v);
    danboorusHash[v[0]] = {
      type: Number(v[1]),
      hotCount: Number(v[2]),
    };
    v[3].forEach((alias, idx) => {
      danboorusHash[alias] = {
        type: Number(v[1]),
        hotCount: Number(v[2]) - idx - 1,
      };
    });
  });

  // tags.translation.csv
  let def = fs
    .readFileSync(resolve(__dirname, "./data", "translation.sort.csv"))
    .toString()
    .split("\n");
  def = def.filter((v) => v);
  def
    .map((v) => v.trim())
    .forEach((v) => {
      let l = v
        .toLowerCase()
        .replace(/"/g, "")
        .split(",")
        .map((v) => v.trim());
      let tag = l[0].replace(/\s+/g, "_");
      let names = l.slice(1);
      names.forEach((name) => {
        addTags(tag, name);
      });
    });
  console.log('tags.translation' ,def.length);
  // https://chart.dawnmark.cn/tag/nai-categories
  let val = await axios
    .get(baseUrl + "/tag/nai-categories")
    .then((d) => d.data)
    .then(async (val) => {
      if (Array.isArray(val)) {
        return val;
      }
    });
  for (let i = 0; i < val.length; i++) {
    const item = val[i];
    if (Array.isArray(item.children)) {
      for (let index = 0; index < item.children.length; index++) {
        const cate = item.children[index];
        await axios
          .get(baseUrl + "/tag/nai-tags?categoryId=" + cate.id)
          .then((d) => d.data)
          .then((res) => {
            if (Array.isArray(res)) {
              res.forEach((v) => {
                let tag = v.englishName
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "_");
                let name = v.name.trim().replace(/\s+/g, "");
                addTags(tag, name);
              });
            }
          });
        await delay();
      }
    }
  }

  // yamltags
  let ys = getFiles(
    resolve(
      __dirname,
      "./data",
      "./danbooru-diffusion-prompt-builder/data/tags"
    )
  );
  console.log("yamltags files " + ys.length);
  let count = 0;
  ys.forEach((vPath) => {
    let list = getYamltags(vPath);
    count += list.length;
    list.forEach((v) => {
      let tag = v[0].toLowerCase().trim().replace(/\s+/g, "_");
      let name = v[3].trim().replace(/\s+/g, "");
      addTags(tag, name);
    });
  });
  console.log("yamltags " + count);
  // danboorus
  danboorus.forEach((v) => {
    // add alias
    let idx = ls.find((f) => f[0] == v[0] || v[3].includes(f[0]));
    if (idx > -1) {
      ls[idx][3].unshift(...v[3].filter((f) => !tags.has(f)));
    }
  });
  
  // sort
  ls = ls.sort((v, n) => n[2] - v[2]);

  // save
  fs.writeFileSync(
    resolve(__dirname, "./dist", "tags.csv"),
    ls
      .map((v) => {
        v[3] = '"' + v[3].filter((v) => v).join(",") + '"';
        return v.join(",");
      })
      .join("\n")
  );
  fs.writeFileSync(
    resolve(__dirname, "./dist", "translation.csv"),
    translations
      .map((v) => {
        v[1] = '"' + v[1].filter((v) => v).join(",") + '"';
        return v.join(",");
      })
      .join("\n")
  );
}
main();

function getFiles(path) {
  let fileList = [];
  let files = fs.readdirSync(path);
  files.forEach((file) => {
    let fPath = join(path, file);
    let state = fs.statSync(fPath);
    if (state.isDirectory()) {
      fileList.push(...getFiles(fPath));
    } else {
      if (fPath.endsWith("yaml")) fileList.push(fPath);
    }
  });
  return fileList;
}
