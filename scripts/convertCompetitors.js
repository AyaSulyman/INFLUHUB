const fs = require('fs');
const path = require('path');

const competitorsPath = path.join(__dirname, '../json files/Competitors.json');
const outputPath = path.join(__dirname, '../json files/Competitors64.json');

const competitors = JSON.parse(fs.readFileSync(competitorsPath, 'utf-8'));

async function encodeImageToBase64(imagePath) {
  try {
    const fullPath = path.resolve(__dirname, '../images/', imagePath);
    const imageData = fs.readFileSync(fullPath);
    const base64 = Buffer.from(imageData).toString('base64');
    const mimeType = path.extname(fullPath).slice(1); 
    return `data:image/${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to convert: ${imagePath}`, error.message);
    return imagePath; 
  }
}

async function convertAllImagesToBase64(competitors) {
  for (const category of competitors.carousel) {
    const categoryName = Object.keys(category)[0]; 
    const items = category[categoryName]; 
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (item.image) {
        item.image = await encodeImageToBase64(item.image); 
      }
    }
  }
  return competitors;
}

(async () => {
  const updatedCompetitors = await convertAllImagesToBase64(competitors);
  fs.writeFileSync(outputPath, JSON.stringify(updatedCompetitors, null, 2), 'utf-8');
  console.log('✅ Base64 conversion completed. Saved as Competitors64.json');
})();
