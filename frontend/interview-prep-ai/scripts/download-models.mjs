const downloadModelFiles = async () => {
  const modelUrls = [
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json'
  ];

  // Create models directory
  if (!fs.existsSync('./models')) {
    fs.mkdirSync('./models', { recursive: true });
  }

  for (const url of modelUrls) {
    const filename = url.split('/').pop();
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(`./models/${filename}`, Buffer.from(buffer));
    console.log(`Downloaded ${filename}`);
  }
};

downloadModelFiles().catch(console.error);
