//require the Elasticsearch librray
const elasticsearch = require('elasticsearch');
// instantiate an elasticsearch client
const client = new elasticsearch.Client({
    hosts: ['http://localhost:9200']
});

//require Express
const express = require('express');
// instanciate an instance of express and hold the value in a constant called app
const app = express();
//require the body-parser library. will be used for parsing body requests
const bodyParser = require('body-parser')
    //require the path library
const path = require('path');

// ping the client to be sure Elasticsearch is up
client.ping({
    requestTimeout: 30000,
}, function(error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('Everything is ok');
    }
});

// use the bodyparser as a middleware  
app.use(bodyParser.json())
    // set port for the app to listen on
app.set('port', process.env.PORT || 3001);
// set path to serve static files
app.use(express.static(path.join(__dirname, 'public')));
// enable CORS 
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// defined the base route and return with an HTML file called tempate.html
app.get('/', function(req, res) {
    res.sendFile('template.html', {
        root: path.join(__dirname, 'views')
    });
})

// define the /search route that should return elastic search results 
app.get('/search', function(req, res) {
    // declare the query object to search elastic search and return only 200 results from the first result found. 
    // also match any data where the name is like the query string sent in
    console.log(req.query['q'], ' --> from search 1')
    let body = {
            size: 200,
            from: 0,
            query: {
                query_string: {
                    query: req.query['q'] + '*',
                    fields: ['name'],
                    analyze_wildcard: true,
                    allow_leading_wildcard: true
                }
            }
        }
        // perform the actual search passing in the index, the search query and the type
    client.search({ index: 'indian-cities-index', body: body, type: 'city' })
        .then(results => {
            res.send(results.hits.hits);
        })
        .catch(err => {
            console.log(err)
            res.send([]);
        });
})

// define the /search2 route that should return elastic search results 
app.get('/stateSearch', function(req, res) {
    // declare the query object to search elastic search and return only 200 results from the first result found. 
    // also match any data where the name is like the query string sent in
    const stateFilter = req.query['z'].split(', ')[1]
    console.log(req.query['q'], stateFilter, ' --> from search 2')
    let body = {
            size: 200,
            from: 0,
            query: {
                bool: {
                    must: [{
                        query_string: {
                            query: req.query['q'] + '*',
                            fields: ['name', 'state'],
                            analyze_wildcard: true,
                            allow_leading_wildcard: true
                        }
                    }],
                    filter: [{
                        match: {
                            state: stateFilter
                        }
                    }]
                }
            }
        }
        // perform the actual search passing in the index, the search query and the type
    client.search({ index: 'indian-cities-index', body: body, type: 'city' })
        .then(results => {
            res.send(results.hits.hits);
        })
        .catch(err => {
            console.log(err)
            res.send([]);
        });
})

// listen on the specified port
app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});