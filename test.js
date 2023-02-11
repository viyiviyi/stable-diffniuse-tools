/*eslint no-unused-vars: "off"*/

const { getArg, getImage } = require("./app/image");
const { promptsRandom: promptsRdom, upload, updatePrompts } = require("./app/data/prompts");
const { setBg } = require("./app/utils/utils");
const { server } = require("./app/config");

// console.log(promptsRdom())
// console.log(getArg(server[3]))
// // setBg("E:\\projects\\nodejs\\windowBgImageAI\\images\\1665983526066.png");
getImage();

// console.log(require.main.path)
// updatePrompts()
