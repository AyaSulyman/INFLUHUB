const fs = require('fs');
const path = require('path');
const axios = require('axios');

const filePaths = [
  { 
    input: path.join(__dirname, '../json files/industries.json'),
    output: path.join(__dirname, '../json files/industries_base64.json')
  },
  {
    input: path.join(__dirname, '../json files/RetailerFlags.json'),
    output: path.join(__dirname, '../json files/RetailerFlags64.json')
  },
  {
    input: path.join(__dirname, '../json files/SupplierFlags.json'),
    output: path.join(__dirname, '../json files/SupplierFlags64.json')
  }
];

async function encodeImageToBase64(urlOrPath, isUrl = false) {
  try {
    if (isUrl) {
      const response = await axios.get(urlOrPath, { responseType: 'arraybuffer' });
      const mimeType = response.headers['content-type'];
      const base64 = Buffer.from(response.data).toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } else {
      const fullPath = path.resolve(__dirname, '../images/', urlOrPath.replace('../images/', ''));
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ File not found: ${fullPath}`);
        return null;
      }
      const imageData = fs.readFileSync(fullPath);
      const base64 = imageData.toString('base64');
      const extension = path.extname(fullPath).substring(1);
      return `data:image/${extension};base64,${base64}`;
    }
  } catch (error) {
    console.error(`Failed to convert image: ${urlOrPath}`, error.message);
    return null;
  }
}

async function processJsonFile(inputPath, outputPath) {
  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const jsonData = JSON.parse(rawData);


    if (jsonData.carousel) {
      for (const industry of jsonData.carousel) {
        if (industry.Suppliers) {
          for (const supplier of industry.Suppliers) {
            if (supplier.Image) {
              supplier.Image = await encodeImageToBase64(supplier.Image, false);
            }
          }
        }
      }
    }

  
    if (jsonData.carousel && Array.isArray(jsonData.carousel)) {
      for (const section of jsonData.carousel) {
        for (const key in section) {
          if (Array.isArray(section[key])) {
            for (const item of section[key]) {
              if (item.image) {
                item.image = await encodeImageToBase64(item.image, false);
              }
            }
          }
        }
      }
    }

    if (Array.isArray(jsonData)) {
      for (const item of jsonData) {
        if (item.Suppliers) {
          for (const supplier of item.Suppliers) {
            if (supplier.Image) {
              supplier.Image = await encodeImageToBase64(supplier.Image, false);
            }
          }
        }
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Successfully processed ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
  }
}

(async () => {
  for (const file of filePaths) {
    await processJsonFile(file.input, file.output);
  }
})();
