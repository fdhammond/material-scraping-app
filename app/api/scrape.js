import { kv } from '@vercel/kv';
import * as cheerio from 'cheerio';

// Configuration for URLs and material names
const MATERIALS_CONFIG = [
  { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2665-cemento', materialName: 'cemento' },
  { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2723-hierro', materialName: 'hierro' },
  { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2646-aridos', materialName: 'bolson' },
  { shop: 'Sagosa', url: 'https://www.sagosa.com.ar/2755-malla', materialName: 'malla' },
  { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/hierro', materialName: 'hierro' },
  { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/mallas/', materialName: 'malla' },
  { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/aridos/', materialName: 'bolsón' },
  { shop: 'Mottesi', url: 'https://mottesimateriales.com.ar/construccion/cementicios/', materialName: 'cemento' },
  { shop: 'NeoMat', url: 'https://www.neomat.com.ar/obra-gruesa/cementicio', materialName: 'cemento' },
  { shop: 'NeoMat', url: 'https://www.neomat.com.ar/obra-gruesa/fierrera', materialName: 'hierro nervado' },
  { shop: 'NeoMat', url: 'https://www.neomat.com.ar/obra-gruesa/fierrera', materialName: 'malla' },
];

// Fetch HTML from the URL
const fetchHtml = async (url) => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
};

// Extract material data based on the structure of the website
const extractMaterials = ($, materialName, shop) => {
  const materialData = [];

  $('.product-title, .item-name').each((index, element) => {
    const title = $(element).text().toLowerCase().trim();
    if (title.includes(materialName)) {
      const price = $('.price, .item-price').eq(index).text().trim();
      const discount = $('.discount-percentage.discount-product').eq(index).text().trim();
      const noStockLabel = $('.label.label-default, #product-availability-grid').eq(index).text().trim();
      const noStock = noStockLabel.includes('Sin stock') || noStockLabel.includes('Fuera de stock');
      const date = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

      materialData.push({
        shop,
        material: materialName,
        title,
        price,
        discount: discount || '',
        stock: noStock ? 'Sin stock' : '',
        date: date
      });
    }
  });

  return materialData;
};

// Write data to JSON file by date
const writeToKV = async (data) => {
  try {
    const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const key = `materials_${date}`;

    // Get existing data for today (if any)
    const existingData = await kv.get(key) || {};

    // Merge new data into existing data
    for (const shop in data) {
      if (existingData[shop]) {
        existingData[shop].push(...data[shop]);
      } else {
        existingData[shop] = data[shop];
      }
    }

    // Store updated data in Vercel KV
    await kv.set(key, existingData);
    console.log(`Data stored successfully in Vercel KV for ${date}`);
  } catch (error) {
    console.error(`Error storing data in Vercel KV:`, error);
  }
};

// Main function to fetch materials and write to files
const getMaterial = async () => {
  const allMaterials = {};

  for (const { shop, url, materialName } of MATERIALS_CONFIG) {
    const html = await fetchHtml(url);
    if (html) {
      const $ = cheerio.load(html);
      const materials = extractMaterials($, materialName, shop);

      // Group materials by shop
      if (!allMaterials[shop]) {
        allMaterials[shop] = [];
      }
      allMaterials[shop].push(...materials);
    }
  }

  // Write to files
  await writeToKV(allMaterials);
  console.log(`JSON file has been written successfully`);
};

// For App Router
export async function GET() {
  try {
    await getMaterial();
    return new Response(JSON.stringify({ message: 'Scraping executed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error during scraping:`, error);
    return new Response(JSON.stringify({ error: 'An error occurred during scraping' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
