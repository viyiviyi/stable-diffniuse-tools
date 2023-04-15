const fs = require("fs");
const join = require("path").join;
const axios = require("axios");
const path = require("path");
const resolve = require("path").resolve;

const basePath = join(
  "F:/stable-diffusion-webui",
  "models",
  "Stable-diffusion"
);

async function saveImage(base64, saveName, dataType = "base64") {
  try {
    fs.writeFileSync(saveName, base64, dataType);
    console.log("save file: " + saveName);
    return saveName;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getImage(modelName, saveName) {
  await await axios
    .post(
      "http://index233:Index666@127.0.0.1:8210/sdapi/v1/txt2img",
      stableDiffusionArg({
        model: modelName,
      })
    )
    .then((d) => d.data)
    .then(async (data) => {
      if (!data.images) return console.error("error");
      if (!Array.isArray(data.images) || data.images.length == 0)
        return console.error("error");
      return saveImage(data.images[0], saveName);
    })
    .catch(async (err) => console.error(err));
}

function getFiles(path, suffix) {
  let fileList = [];
  if (!fs.existsSync(path)) return fileList;
  let files = fs.readdirSync(path);
  files.forEach((file) => {
    let fPath = join(path, file);
    let state = fs.statSync(fPath);
    if (!state.isDirectory()) {
      if (fPath.endsWith(suffix)) fileList.push(fPath);
    } else {
      fileList.push(...getFiles(fPath, suffix));
    }
  });
  return fileList;
}
main();
async function main() {
  // 获取 embedding 文件列表
  let embFileList = getFiles(basePath, ".ckpt");
  embFileList.push(...getFiles(basePath, ".safetensors"));
  let embFilesNoSuffix = embFileList.map((v) => v);
  console.log(embFilesNoSuffix);
  for (let i = 0; i < embFilesNoSuffix.length; i++) {
    const fullName = resolve(embFilesNoSuffix[i]);
    const file = path.parse(fullName);
    const parent = path.parse(file.dir);
    const pngName = file.name + ".preview.png";
    const modelPath = join(parent.name, file.base);
    if (!fs.existsSync(resolve(file.dir, pngName))) {
      await getImage(modelPath, resolve(file.dir, pngName));
    //   return; // 测试
    }
  }
}
function stableDiffusionArg(option = {}) {
  option = {
    prompt:
      option.prompts ||
      "masterpiece, best quality, 1girl, purple eyes, wavy hair, dress, delicate, beautiful, colorful, vividcolor, lighting, hyper detailed, ultra-detailed",
    steps: 24,
    cfg_scale: 9,
    width: option.width || 512,
    height: option.height || 768,
    seed: 123456789,
    negative_prompt:
      option.negative_prompt ||
      "( lowres, worst quality, low quality, normal quality)",
    sampler_index: option.sampler || "DPM++ 2M Karras",
    override_settings: {
      CLIP_stop_at_last_layers: 2,
      sd_model_checkpoint: option.model,
    },
  };
  console.log(option);
  return option;
}
module.exports = {
  saveImage,
};
