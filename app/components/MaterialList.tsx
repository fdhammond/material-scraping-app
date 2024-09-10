import fs from 'fs';
import path from 'path';

type Material = {
  shop: string;
  material: string;
  title: string;
  price: string;
  discount: string;
  stock: string;
};

async function getMaterialsData(): Promise<Record<string, Material[]>> {
  const filePath = path.join(process.cwd(), 'materials.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(jsonData);
}

export default async function MaterialList() {
  const materials = await getMaterialsData();
console.log(materials);

  return (
    <div>
      <h1>Construction Materials</h1>
      {Object.entries(materials).map(([shop, materials]) => (
        <div key={shop}>
          <h2>{shop}</h2>
          {materials.map((material, index) => (
            <div key={index}>
              <h3>{material.title}</h3>
              <p>Price: {material.price}</p>
              <p>Discount: {material.discount}</p>
              <p>{material.stock ? 'In Stock' : 'Out of Stock'}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
