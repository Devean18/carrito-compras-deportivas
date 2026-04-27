const { DynamoDBClient, DescribeTableCommand, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const logger = require('./logger');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
});

const documentClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  PRODUCTS: 'products',
  USERS: 'users',
  CARTS: 'carts',
  ORDERS: 'orders',
  FAVORITES: 'favorites',
};

/**
 * Crea las tablas de DynamoDB si no existen.
 * Se llama al arrancar el servidor.
 */
const createTablesIfNotExist = async () => {
  const tableDefinitions = [
    {
      TableName: TABLES.PRODUCTS,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'category', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'category-index',
          KeySchema: [{ AttributeName: 'category', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: TABLES.USERS,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'email-index',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: TABLES.CARTS,
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: TABLES.ORDERS,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-index',
          KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: TABLES.FAVORITES,
      KeySchema: [
        { AttributeName: 'userId',    KeyType: 'HASH' },
        { AttributeName: 'productId', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId',    AttributeType: 'S' },
        { AttributeName: 'productId', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
  ];

  for (const tableDef of tableDefinitions) {
    try {
      await client.send(new DescribeTableCommand({ TableName: tableDef.TableName }));
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        await client.send(new CreateTableCommand(tableDef));
      }
    }
  }
};

module.exports = { documentClient, TABLES, createTablesIfNotExist };

createTablesIfNotExist().catch((err) =>
  logger.error(`Error al crear tablas DynamoDB: ${err.message}`)
);
