const axios = require('axios');
const fs = require('fs');
const path = require('path');

const modelFiles = [
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const outputDir = path.join(__dirname, 'public', 'models');

async function downloadFile(filename) {
  const url = `${baseUrl}/${filename}`;
  const outputPath = path.join(outputDir, filename);
  
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync(outputPath, response.data);
    console.log(`Downloaded ${filename}`);
  } catch (error) {
    console.error(`Error downloading ${filename}:`, error.message);
  }
}

async function downloadAllModels() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const file of modelFiles) {
    await downloadFile(file);
  }
}

downloadAllModels().then(() => {
  console.log('All models downloaded');
}).catch(console.error);
