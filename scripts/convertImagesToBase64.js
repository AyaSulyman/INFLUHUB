const fs = require('fs');
const path = require('path');
const axios = require('axios');

const industriesPath = path.join(__dirname, '../json files/industries.json');
const outputPath = path.join(__dirname, '../json files/industries_base64.json');

const industries = JSON.parse(fs.readFileSync(industriesPath, 'utf-8'));

async function encodeImageToBase64(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'];
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to convert: ${url}`, error.message);
    return url; 
  }
}

async function convertAllImagesToBase64(industries) {
  for (const industry of industries.carousel) {
    if (!Array.isArray(industry.Suppliers)) continue;
    for (const supplier of industry.Suppliers) {
      supplier.Image = await encodeImageToBase64(supplier.Image);
    }
  }
  return industries;
}


(async () => {
  const updatedIndustries = await convertAllImagesToBase64(industries);
  fs.writeFileSync(outputPath, JSON.stringify(updatedIndustries, null, 2), 'utf-8');
  console.log('✅ Base64 conversion completed. Saved as industries_base64.json');
})();
