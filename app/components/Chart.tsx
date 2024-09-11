'use client'
import dynamic from 'next/dynamic';
import 'chart.js/auto';

type Material = {
  shop: string;
  material: string;
  title: string;
  price: string;
  discount: string;
  stock: string;
};

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
});

export default function chart({ materials }: { materials: Record<string, Material[]> }) {
    const materialsData = Object.entries(materials).map(([shop, materials]) => ({
        label: shop,
        data: materials.map((material) => ({
            x: material.title,
            y: material.price,
            r: material.discount,
            fill: material.stock ? 'green' : 'red',
            stroke: material.stock ? 'green' : 'red',
            strokeWidth: 12
        }))
    }))
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Bar data={{ labels: materialsData.map((dataset) => dataset.label), datasets: materialsData }} />
        </div>
    );
}