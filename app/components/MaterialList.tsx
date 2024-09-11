import fs from 'fs';
import path from 'path';
import Chart from './Chart';

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
  const data = JSON.parse(jsonData);

  // Convert prices to numbers`
  Object.keys(data).forEach(shop => {
    data[shop].forEach((material: { price: string | number; }) => {
      material.price = parseFloat(material.price.toString().replace('$', '').replace('.', ''));
    });
  });

  return data;
}

export default async function MaterialList() {
  const materials = await getMaterialsData();
  return (
    <div className='w-full h-full justify-center align-middle bg-white'>
      <Chart materials={materials} />
    </div>
  )
}
