$urls = @(
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1",
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json"
)

$outputDir = "public/models"

# Create the output directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $outputDir

foreach ($url in $urls) {
    $fileName = Split-Path $url -Leaf
    $outputPath = Join-Path $outputDir $fileName
    Write-Host "Downloading $fileName..."
    Invoke-WebRequest -Uri $url -OutFile $outputPath
}
