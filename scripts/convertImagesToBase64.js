const fs = require('fs');
const path = require('path');
const axios = require('axios');

const industriesPaths = [
  path.join(__dirname, '../json files/industries.json'),
  path.join(__dirname, '../json files/RetailerFlags.json'),
  path.join(__dirname, '../json files/SupplierFlags.json')
];

const outputPaths = [
  path.join(__dirname, '../json files/industries_base64.json'),
  path.join(__dirname, '../json files/RetailerFlags64.json'),
  path.join(__dirname, '../json files/SupplierFlags64.json')
];

async function encodeImageToBase64(urlOrPath, isUrl = false) {
  try {
    if (isUrl) {
      const response = await axios.get(urlOrPath, { responseType: 'arraybuffer' });
      const mimeType = response.headers['content-type'];
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } else {
      const fullPath = path.resolve(__dirname, '../images/', urlOrPath);
      const imageData = fs.readFileSync(fullPath);
      const base64 = Buffer.from(imageData).toString('base64');
      const mimeType = path.extname(fullPath).slice(1);
      return `data:image/${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error(`Failed to convert: ${urlOrPath}`, error.message);
    return urlOrPath; 
  }
}

async function convertAllImagesToBase64(industries, isUrl = false) {
  for (const industry of industries.carousel) {
    const category = Object.keys(industry)[0];
    const suppliers = industry[category];
    if (!Array.isArray(suppliers)) continue;
    for (const supplier of suppliers) {
      supplier.image = await encodeImageToBase64(supplier.image, isUrl);
    }
  }
  return industries;
}

(async () => {
  for (let i = 0; i < industriesPaths.length; i++) {
    const industries = JSON.parse(fs.readFileSync(industriesPaths[i], 'utf-8'));
    const isUrl = i === 0; 
    const updatedIndustries = await convertAllImagesToBase64(industries, isUrl);
    fs.writeFileSync(outputPaths[i], JSON.stringify(updatedIndustries, null, 2), 'utf-8');
    console.log(`✅ Base64 conversion completed. Saved as ${path.basename(outputPaths[i])}`);
  }
})();
