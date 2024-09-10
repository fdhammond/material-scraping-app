import { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

type Material = {
  shop: string;
  material: string;
  title: string;
  price: string;
  discount: string;
  stock: string;
  date: string;
};

type MaterialsByShop = {
  [shop: string]: Material[]
};

// Configuration for URLs and material names
const MATERIALS_CONFIG: { shop: string; url: string; materialName: string }[] = [
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
const fetchHtml = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
};

// Extract material data based on the structure of the website
const extractMaterials = ($: cheerio.CheerioAPI, materialName: string, shop: string): Material[] => {
  const materialData: Material[] = [];

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
const writeToJson = async (data: MaterialsByShop, filePath: string): Promise<void> => {
  let existingData: MaterialsByShop = {};

  // Read existing data from JSON file if it exists
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    existingData = JSON.parse(rawData);
  }

  // Merge new data into the existing data
  for (const shop in data) {
    if (existingData[shop]) {
      // If shop already exists, concatenate the arrays
      existingData[shop].push(...data[shop]);
    } else {
      // If shop does not exist, create a new array for it
      existingData[shop] = data[shop];
    }
  }

  // Write updated data back to the JSON file
  const jsonData = JSON.stringify(existingData, null, 2);
  try {
    await fs.writeFileSync(filePath, jsonData);
  } catch (error) {
    console.error(`Error writing JSON file:`, error);
  }
};

// Main function to fetch materials and write to files
const getMaterial = async (): Promise<void> => {
  const allMaterials: MaterialsByShop = {};

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

  // Define the path for the materials.json file
  const filePath = path.join(process.cwd(), 'materials.json');

  // Write to files
  await writeToJson(allMaterials, filePath);
  console.log(`JSON file has been written successfully`);
};

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await getMaterial();
    res.status(200).json({ message: 'Scraping executed successfully' });
  } catch (error) {
    console.error(`Error during scraping:`, error);
    res.status(500).json({ error: 'An error occurred during scraping' });
  }
}
