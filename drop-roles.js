const { MongoClient } = require('mongodb');

async function dropRolesCollection() {
  const uri = 'mongodb://mongo:27017/InsightKB';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('InsightKB');
    const result = await database.collection('roles').drop();
    
    if (result) {
      console.log('Successfully dropped the roles collection');
    } else {
      console.log('Collection does not exist or could not be dropped');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

dropRolesCollection();