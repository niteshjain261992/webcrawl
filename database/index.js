var MongoClient = require('mongodb').MongoClient;

let index;
class MongoCtrl {

    connect() {
        return new Promise((resolve, reject) => {
            if (index) return resolve(index);
            const options = {
                "poolSize": 5,
                "keepAlive": 100
            };

            const url = "mongodb://localhost:27017";

            MongoClient.connect(url, options, (err, client) => {
                if (err) {
                    return reject("Error in connecting with db");
                }
                const db = client.db("webcrawler");
                index = db;
                resolve(db);
            });
        })
    }

}

module.exports = new MongoCtrl();
