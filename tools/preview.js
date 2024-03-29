const fs = require("fs");
const join = require("path").join;
const path = require("path");
const axios = require("axios");
const { saveImage } = require("./preview-model");

const loraPath = join("F:/stable-diffusion-webui", "models", "Lora");
const embeddingsPath = join("F:/stable-diffusion-webui", "embeddings");
const hypernetworksPath = join(
  "F:/stable-diffusion-webui",
  "models",
  "hypernetworks"
);

async function getImage(prompt, pngPath) {
  await await axios
    .post(
      "http://index233:Index666@127.0.0.1:8210/sdapi/v1/txt2img",
      stableDiffusionArg({
        prompts:
          "masterpiece, best quality,solo," +
          (prompt ? prompt + "," : "") +
          "delicate, beautiful,colorful, vividcolor, lighting, hyper detailed, ultra-detailed",
        model: "融合\\pvc-zero.safetensors",
      })
    )
    .then((d) => d.data)
    .then(async (data) => {
      if (!data.images) return console.error("error");
      if (!Array.isArray(data.images) || data.images.length == 0)
        return console.error("error");
      return saveImage(data.images[0], pngPath);
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
async function start() {
  await main(loraPath, "<lora:$model:1>");
  await main(embeddingsPath, "$model");
  await main(hypernetworksPath, "<hypernet:$model:1>");
}
start();
async function main(basePath, template = "") {
  // 获取 embedding 文件列表
  let embFileList = getFiles(basePath, ".pt");
  embFileList.push(...getFiles(basePath, ".webp"));
  embFileList.push(...getFiles(basePath, ".ckpt"));
  embFileList.push(...getFiles(basePath, ".safetensors"));
  let embFilesNoSuffix = embFileList.map((v) => v);
  console.log(embFilesNoSuffix);
  for (let i = 0; i < embFilesNoSuffix.length; i++) {
    const fullName = embFilesNoSuffix[i];
    const file = path.parse(fullName);
    const modelName = file.name;
    const dir = file.dir;
    const pngName = modelName + ".preview.png";
    const prompt =
      modelName.lastIndexOf("+") > -1
        ? modelName.substring(modelName.lastIndexOf("+") + 1)
        : "";
    if (!fs.existsSync(join(dir, pngName))) {
      await getImage(
        template.replace("$model", modelName) +
          "," +
          prompt.replace("(", "\\(").replace(")", "\\)"),
        path.resolve(dir, pngName)
      );
      // return; // 测试
    }
  }
}
function stableDiffusionArg(option = {}) {
  console.log(option);
  return {
    prompt: option.prompts,
    steps: 24,
    cfg_scale: 9,
    width: option.width || 512,
    height: option.height || 768,
    seed: 123456789,
    negative_prompt:
      option.negative_prompt ||
      "(lowres, worst quality, low quality, normal quality)",
    sampler_index: option.sampler || "DPM++ 2M Karras",
    override_settings: {
      CLIP_stop_at_last_layers: 2,
      sd_model_checkpoint: option.model,
    },
  };
}
