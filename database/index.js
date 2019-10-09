var SolrNode = require('solr-node');

let client;
class SolrCtrl {

    connect() {
        return new Promise((resolve, reject) => {
            if (client) return resolve(client);

            client = new SolrNode({
                host: '127.0.0.1',
                port: '8983',
                core: 'webcrawler',
                protocol: 'http'
            });

            resolve(client);
        })
    }

}

module.exports = new SolrCtrl();
