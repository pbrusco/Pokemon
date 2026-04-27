import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../src/data/maps');

// Original Red/Blue dimensions (in 2x2 blocks). Our tiles are 1x1, so we multiply by 2.
const kantoDimensions = {
  ROUTE_11: { w: 30, h: 9 },
  ROUTE_12: { w: 10, h: 54 },
  ROUTE_13: { w: 30, h: 9 },
  ROUTE_14: { w: 10, h: 27 },
  ROUTE_15: { w: 30, h: 9 },
  ROUTE_16: { w: 20, h: 9 },
  ROUTE_17: { w: 10, h: 72 },
  ROUTE_18: { w: 25, h: 9 },
  ROUTE_19: { w: 10, h: 27 },
  ROUTE_20: { w: 50, h: 9 },
  ROUTE_21: { w: 10, h: 45 },
  ROUTE_22: { w: 20, h: 9 },
  ROUTE_23: { w: 10, h: 72 },
  ROUTE_24: { w: 10, h: 18 },
  ROUTE_25: { w: 30, h: 9 },
  INDIGO_PLATEAU: { w: 10, h: 9 }
};

for (const [id, dims] of Object.entries(kantoDimensions)) {
  const fileName = id.toLowerCase() + '.json';
  const filePath = path.join(MAPS_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    const width = dims.w * 2;
    const height = dims.h * 2;
    
    // Create a generic placeholder with trees around the edge and paths inside
    const rows = [];
    for (let y = 0; y < height; y++) {
      if (y === 0 || y === height - 1) {
        rows.push('T'.repeat(width));
      } else {
        rows.push('T' + 'P'.repeat(width - 2) + 'T');
      }
    }
    
    const json = {
      rows,
      warps: []
    };
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`Created ${fileName} (${width}x${height})`);
  } else {
    console.log(`Skipped ${fileName} (already exists)`);
  }
}
