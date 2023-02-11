const fs = require("fs");
const join = require("path").join;
const axios = require("axios");

const basePath = join(
  "F:/stable-diffusion-webui",
  "models",
  "Stable-diffusion"
);

async function saveImage(base64, fileDir, fileName, dataType = "base64") {
  try {
    var dir = join(fileDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let filePath = join(dir, fileName);
    fs.writeFileSync(filePath, base64, dataType);
    console.log("save file: " + filePath);
    return filePath;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getImage(modelName, fileDir, fileName) {
  await await axios
    .post(
      "http://127.0.0.1:8210/sdapi/v1/txt2img",
      stableDiffusionArg({
        model: modelName,
      })
    )
    .then((d) => d.data)
    .then(async (data) => {
      if (!data.images) return console.error("error");
      if (!Array.isArray(data.images) || data.images.length == 0)
        return console.error("error");
      return saveImage(data.images[0], fileDir, fileName);
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
      if (fPath.endsWith(suffix)) fileList.push(file);
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
    const fullName = embFilesNoSuffix[i];
    const modelName = fullName.substring(0, fullName.lastIndexOf("."));
    const pngName = modelName + ".preview.png";
    if (!fs.existsSync(join(basePath, pngName))) {
      await getImage(fullName, basePath, pngName);
      // return; // 测试
    }
  }
}
function stableDiffusionArg(option = {}) {
  console.log(option);
  return {
    prompt:
      option.prompts ||
      "masterpiece, best quality, clavicle, crop top, purple hair, pink eyes, under boob, cleavage, short sleeves, covered nipples, hand on chest, pond, in the water, cum on breasts, dripping water, shot, upper body, delicate face, delicate girl, delicate, beautiful, beautiful face, beautiful eyes, beautiful girl",
    steps: 24,
    cfg_scale: 9,
    width: option.width || 512,
    height: option.height || 768,
    seed: 123456789,
    negative_prompt:
      option.negative_prompt ||
      "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, on ground, nipple, ground, floor",
    sampler_index: option.sampler || "DPM++ 2M Karras",
    override_settings: {
      CLIP_stop_at_last_layers: 2,
      sd_model_checkpoint: option.model,
    },
  };
}
