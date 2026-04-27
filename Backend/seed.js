/**
 * seed.js — Pobla DynamoDB Local con productos deportivos de ejemplo.
 * Lee imágenes desde assets/products/ y las sube a MinIO (S3 local).
 * Uso: node seed.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ScanCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES, createTablesIfNotExist } = require('./src/config/dynamodb');
const { uploadFile, ensureBucketExists } = require('./src/config/minio');

const ASSETS_DIR = path.join(__dirname, 'assets', 'products');

// Productos con imageUrl pública de MinIO 
const products = [
  // ── Fútbol ──────────────────────────────────────────────────────
  { name: 'Balón Nike FZ2976-100',          category: 'futbol',     price:  599.99, stock: 30, imageUrl: 'http://localhost:9000/products/Balón%20Nike%20FZ2976-100.jpg' },
  { name: 'Balón Adidas Champions League',  category: 'futbol',     price:  649.99, stock: 25, imageUrl: 'http://localhost:9000/products/Balón%20Adidas%20Champions%20League.jpg' },
  { name: 'Puma Orbita 2 Thermo Bonded',    category: 'futbol',     price:  549.00, stock: 20, imageUrl: 'http://localhost:9000/products/Puma%20Orbita%202%20Thermo%20Bonded.jpg' },
  { name: 'Voit Balón Morph Rosa',          category: 'futbol',     price:  419.00, stock: 35, imageUrl: 'http://localhost:9000/products/Voit%20Balón%20Morph%20Rosa.jpg' },
  { name: 'Botines Nike Mercurial Vapor',   category: 'futbol',     price: 1799.00, stock: 18, imageUrl: 'http://localhost:9000/products/Botines%20Nike%20Mercurial%20Vapor.jpg' },
  { name: 'Botines Adidas Predator Edge',   category: 'futbol',     price: 1599.00, stock: 14, imageUrl: 'http://localhost:9000/products/Botines%20Adidas%20Predator%20Edge.jpg' },
  { name: 'Portería de Entrenamiento',      category: 'futbol',     price: 1249.00, stock:  8, imageUrl: 'http://localhost:9000/products/Portería%20de%20Entrenamiento.jpg' },
  { name: 'Guantes Portero Reusch',         category: 'futbol',     price:  749.00, stock: 20, imageUrl: 'http://localhost:9000/products/Guantes%20Portero%20Reusch.jpg' },
  { name: 'Espinilleras Nike Mercurial',    category: 'futbol',     price:  249.00, stock: 60, imageUrl: 'http://localhost:9000/products/Espinilleras%20Nike%20Mercurial.jpg' },
  { name: 'Red de Portería',                category: 'futbol',     price:  380.00, stock: 22, imageUrl: 'http://localhost:9000/products/Red%20de%20Portería.jpg' },

  // ── Calzado ─────────────────────────────────────────────────────
  { name: 'Tenis Nike Air Zoom Pegasus',    category: 'calzado',    price: 1899.00, stock: 15, imageUrl: 'http://localhost:9000/products/Tenis%20Nike%20Air%20Zoom%20Pegasus.jpg' },
  { name: 'Tenis Adidas Ultraboost 23',     category: 'calzado',    price: 2199.00, stock: 12, imageUrl: 'http://localhost:9000/products/Tenis%20Adidas%20Ultraboost%2023.jpg' },
  { name: 'Tenis New Balance Foam X Hierro',category: 'calzado',    price: 2499.00, stock:  9, imageUrl: 'http://localhost:9000/products/Tenis%20New%20Balance%20Foam%20X%20Hierro.jpg' },
  { name: 'Tenis ASICS Gel-Nimbus 25',      category: 'calzado',    price: 2799.00, stock:  7, imageUrl: 'http://localhost:9000/products/Tenis%20ASICS%20Gel-Nimbus%2025.jpg' },
  { name: 'Tenis Puma Deviate Elite',       category: 'calzado',    price: 1699.00, stock: 16, imageUrl: 'http://localhost:9000/products/Tenis%20Puma%20Deviate%20Elite.jpg' },
  { name: 'Tenis Saucony Endorphin Pro',    category: 'calzado',    price: 3199.00, stock:  6, imageUrl: 'http://localhost:9000/products/Tenis%20Saucony%20Endorphin%20Pro.jpg' },
  { name: 'Sandalias Nike Benassi',          category: 'calzado',    price:  449.00, stock: 30, imageUrl: 'http://localhost:9000/products/Sandalias%20Nike%20Benassi.jpg' },
  { name: 'Tenis Under Armour HOVR',        category: 'calzado',    price: 1999.00, stock: 11, imageUrl: 'http://localhost:9000/products/Tenis%20Under%20Armour%20HOVR.jpg' },
  { name: 'Tenis Nike Court Air Zoom',      category: 'calzado',      price: 1799.00, stock: 13, imageUrl: 'http://localhost:9000/products/Tenis%20Nike%20Court%20Air%20Zoom.jpg' },
  // ── Ropa ────────────────────────────────────────────────────────
  { name: 'Camiseta Nike Dri-FIT',          category: 'ropa',       price:  399.00, stock: 50, imageUrl: 'http://localhost:9000/products/Camiseta%20Nike%20Dri-FIT.jpg' },
  { name: 'Short Adidas Climalite',         category: 'ropa',       price:  299.00, stock: 40, imageUrl: 'http://localhost:9000/products/Short%20Adidas%20Climalite.jpg' },
  { name: 'Pants Nike Tech Fleece',         category: 'ropa',       price:  899.00, stock: 25, imageUrl: 'http://localhost:9000/products/Pants%20Nike%20Tech%20Fleece.jpg' },
  { name: 'Sudadera Under Armour Rival',    category: 'ropa',       price:  749.00, stock: 20, imageUrl: 'http://localhost:9000/products/Sudadera%20Under%20Armour%20Rival.jpg' },
  { name: 'Jersey Adidas México 2026',      category: 'ropa',       price:  699.00, stock: 45, imageUrl: 'http://localhost:9000/products/Jersey%20Adidas%20México%202026.jpg' },
  { name: 'Leggings Nike Pro Women',        category: 'ropa',       price:  549.00, stock: 35, imageUrl: 'http://localhost:9000/products/Leggings%20Nike%20Pro%20Women.jpg' },
  { name: 'Chamarra Nike Windrunner',       category: 'ropa',       price: 1199.00, stock: 18, imageUrl: 'http://localhost:9000/products/Chamarra%20Nike%20Windrunner.jpg' },
  { name: 'Playera Compresión Under Armour',category: 'ropa',       price:  479.00, stock: 38, imageUrl: 'http://localhost:9000/products/Playera%20Compresión%20Under%20Armour.jpg' },

  // ── Accesorios ──────────────────────────────────────────────────
  { name: 'Pasamontañas Pro Hyperwarm',     category: 'accesorios', price:  249.00, stock: 60, imageUrl: 'http://localhost:9000/products/Pasamontañas%20Pro%20Hyperwarm.jpg' },
  { name: 'Mochila Nike Academy Team',      category: 'accesorios', price:  649.00, stock: 22, imageUrl: 'http://localhost:9000/products/Mochila%20Nike%20Academy%20Team.jpg' },
  { name: 'Botella Nike HyperFuel',         category: 'accesorios', price:  329.00, stock: 55, imageUrl: 'http://localhost:9000/products/Botella%20Nike%20HyperFuel.jpg' },
  { name: 'Rodillera McDavid Pro',          category: 'accesorios', price:  389.00, stock: 28, imageUrl: 'http://localhost:9000/products/Rodillera%20McDavid%20Pro.jpg' },
  { name: 'Cuerda de Saltar Crossrope',     category: 'accesorios', price:  499.00, stock: 33, imageUrl: 'http://localhost:9000/products/Cuerda%20de%20Saltar%20Crossrope.jpg' },
  { name: 'Gorra Nike Dri-FIT',             category: 'accesorios', price:  249.00, stock: 70, imageUrl: 'http://localhost:9000/products/Gorra%20Nike%20Dri-FIT.jpg' },
  { name: 'Medias Compresión Nike Elite',   category: 'accesorios', price:  179.00, stock: 80, imageUrl: 'http://localhost:9000/products/Medias%20Compresión%20Nike%20Elite.jpg' },
  { name: 'Tobillera Nike Sport',           category: 'accesorios', price:  219.00, stock: 45, imageUrl: 'http://localhost:9000/products/Tobillera%20Nike%20Sport.jpg' },

  // ── Tenis ───────────────────────────────────────────────────────
  { name: 'Raqueta Wilson Pro Staff 97',    category: 'tenis',      price: 2999.00, stock:  8, imageUrl: 'http://localhost:9000/products/Raqueta%20Wilson%20Pro%20Staff%2097.jpg' },
  { name: 'Raqueta Babolat Pure Aero',      category: 'tenis',      price: 3299.00, stock:  6, imageUrl: 'http://localhost:9000/products/Raqueta%20Babolat%20Pure%20Aero.jpg' },
  { name: 'Raqueta Head Radical MP',        category: 'tenis',      price: 2799.00, stock:  9, imageUrl: 'http://localhost:9000/products/Raqueta%20Head%20Radical%20MP.jpg' },
  { name: 'Pelota Wilson US Open x3',       category: 'tenis',      price:  199.00, stock: 50, imageUrl: 'http://localhost:9000/products/Pelota%20Wilson%20US%20Open%20x3.jpg' },
  { name: 'Bolsa Tenis Wilson Tour',        category: 'tenis',      price:  799.00, stock: 14, imageUrl: 'http://localhost:9000/products/Bolsa%20Tenis%20Wilson%20Tour.jpg' },

  // ── Ciclismo ────────────────────────────────────────────────────
  { name: 'Casco Ciclismo Bell Stratus',    category: 'ciclismo',   price:  899.00, stock: 18, imageUrl: 'http://localhost:9000/products/Casco%20Ciclismo%20Bell%20Stratus.jpg' },
  { name: 'Casco Giro Synthe MIPS',         category: 'ciclismo',   price: 1699.00, stock:  7, imageUrl: 'http://localhost:9000/products/Casco%20Giro%20Synthe%20MIPS.webp' },
  { name: 'Guantes Ciclismo Pearl Izumi',   category: 'ciclismo',   price:  449.00, stock: 25, imageUrl: 'http://localhost:9000/products/Guantes%20Ciclismo%20Pearl%20Izumi.jpg' },
  { name: 'Shorts Ciclismo Castelli',       category: 'ciclismo',   price:  899.00, stock: 19, imageUrl: 'http://localhost:9000/products/Shorts%20Ciclismo%20Castelli.jpg' },
  { name: 'Luces LED Bicicleta Cateye',     category: 'ciclismo',   price:  349.00, stock: 40, imageUrl: 'http://localhost:9000/products/Luces%20LED%20Bicicleta%20Cateye.jpg' },
  { name: 'Computador Ciclismo Garmin',     category: 'ciclismo',   price: 2499.00, stock:  5, imageUrl: 'http://localhost:9000/products/Computador%20Ciclismo%20Garmin.jpg' },
  { name: 'Sillín Fizik Antares R3',        category: 'ciclismo',   price: 1299.00, stock: 10, imageUrl: 'http://localhost:9000/products/Sillín%20Fizik%20Antares%20R3.jpg' },
];


const seed = async () => {
  console.log('⏳ Creando tablas si no existen...');
  await createTablesIfNotExist();
  console.log('✅ Tablas listas.\n');

  // Limpiar productos existentes
  console.log('🗑️  Limpiando productos existentes...');
  const existing = await documentClient.send(new ScanCommand({ TableName: TABLES.PRODUCTS }));
  for (const item of existing.Items) {
    await documentClient.send(new DeleteCommand({ TableName: TABLES.PRODUCTS, Key: { id: item.id } }));
  }
  console.log(`   Eliminados ${existing.Items.length} productos.\n`);

  //  bucketMinIO
  await ensureBucketExists();
  console.log('🪣  Bucket MinIO listo.\n');

  const now = new Date().toISOString();

  for (const p of products) {
    let imageUrl = p.imageUrl || null;
    // Si la imagen es de MinIO, recodifica el nombre del archivo correctamente
    if (imageUrl && imageUrl.startsWith('http://localhost:9000/products/')) {
      const base = 'http://localhost:9000/products/';
      // Extrae el nombre real del archivo 
      const nombreArchivo = decodeURIComponent(imageUrl.replace(base, ''));
      imageUrl = base + encodeURIComponent(nombreArchivo);
    }

    const item = {
      id: uuidv4(),
      name: p.name,
      category: p.category.toLowerCase(),
      price: p.price,
      stock: p.stock,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    };
    await documentClient.send(new PutCommand({ TableName: TABLES.PRODUCTS, Item: item }));
    console.log(`  ➕ ${item.name} [${item.category}] — $${item.price} → ${imageUrl}`);
  }

  console.log(`\n✅ Seed completo. ${products.length} productos insertados.`);
};

seed().catch((err) => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});
