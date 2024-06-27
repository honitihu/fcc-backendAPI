require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlparser = require('url');
const {MongoClient} = require('mongodb');

const client = new MongoClient(process.env.mongo_URL);
const db = client.db("urlshortener");
const urls = db.collection("urlshortener");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/', (req, res) => {
  const url = req.body.url;
  const dnsCheck = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({error:"Invalid URL"});
    } else {
      const urlCount = await urls.countDocuments({});
      const urlObj = {
        url,
        short_url: urlCount
      }
      const result = urls.insertOne(urlObj);
      res.json({
        original_url: url,
        short_url: urlCount
      });
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  try {
    const urlObj = await urls.findOne({short_url: +shorturl});
    res.redirect(urlObj.url);
  } catch (error) {
    res.json({error:"No short URL found for the given input"});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
