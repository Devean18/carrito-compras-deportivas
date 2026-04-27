const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'products';

/**
 * Asegura que el bucket exista y sea de acceso público.
 */
const ensureBucketExists = async () => {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    // Política pública de lectura
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    });
    await minioClient.setBucketPolicy(BUCKET_NAME, policy);
  }
};

/**
 * Sube un archivo y retorna la URL pública.
 * @param {string} fileName - Nombre del archivo.
 * @param {Buffer|Stream} fileData - Datos del archivo.
 * @param {string} mimeType - Tipo MIME.
 * @returns {Promise<string>} URL pública de la imagen.
 */
const uploadFile = async (fileName, fileData, mimeType) => {
  await ensureBucketExists();
  await minioClient.putObject(BUCKET_NAME, fileName, fileData, { 'Content-Type': mimeType });
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  return `http://${endpoint}:${port}/${BUCKET_NAME}/${fileName}`;
};

module.exports = { minioClient, BUCKET_NAME, ensureBucketExists, uploadFile };
