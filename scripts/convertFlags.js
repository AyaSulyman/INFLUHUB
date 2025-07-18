const fs = require('fs');
const path = require('path');

const industriesPath = path.join(__dirname, '../json files/Flags.json');
const outputPath = path.join(__dirname, '../json files/Flags64.json');

const industries = JSON.parse(fs.readFileSync(industriesPath, 'utf-8'));

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

async function convertAllImagesToBase64(industries) {
  for (const industry of industries.carousel) {
    const category = Object.keys(industry)[0]; 
    const suppliers = industry[category]; 
    if (!Array.isArray(suppliers)) continue;
    for (const supplier of suppliers) {
      supplier.image = await encodeImageToBase64(supplier.image); 
    }
  }
  return industries;
}

(async () => {
  const updatedIndustries = await convertAllImagesToBase64(industries);
  fs.writeFileSync(outputPath, JSON.stringify(updatedIndustries, null, 2), 'utf-8');
  console.log('✅ Base64 conversion completed. Saved as Flags64.json');
})();
