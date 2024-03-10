const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(process.env.DB_HOST, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function connect(cb){

  try{
    await client.connect();
    const db=client.db('textEditor');
    cb(db);
  }

  catch(e){
    console.log(e);
    process.exit(1);
  }
}


module.exports={connect};





