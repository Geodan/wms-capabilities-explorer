const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');
//const xml2json = require('xml2json');
var DOMParser = global.DOMParser = require('xmldom').DOMParser;
var WMSCapabilities = require('wms-capabilities');


var netconfig;
if (process.env.WMSC_TRUSTED_PROXIES &&
    process.env.WMSC_TRUSTED_IPS)
{
    netconfig = {
      trusted_proxies: process.env.PS_TRUSTED_PROXIES,
      trusted_ips: process.env.PS_TRUSTED_IPS
    };
} else {
    netconfig = require('./netconfig.json');
}


var app = express();
if (netconfig.trusted_proxies && netconfig.trusted_proxies !== '') {
  app.set('trust proxy', netconfig.trusted_proxies);
}

app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(bodyParser.json());
app.use(express.static('html'))

function errorResponse(res, message)
{
  res.json({error: message});
}

app.post('/getcapabilities', cors(), function(req, res) {
  console.log('POST /getcapabilities');
  var url = req.body.url;
  if (!url) {
    return errorResponse(res, 'no url provided');
  }
  request(url, { }, (err, clientres, xml) => {
    if (err) { 
      return errorResponse(res, 'request error:' + err);
    } else {
      try {
        var json = new WMSCapabilities().parse(xml);
        if (json.version && json.Service && json.Capability) {
          res.json(json);
        } else {
          errorResponse(res, 'parse error: capabilities invalid or incomplete')
        }
      } catch(err){
        errorResponse(res, 'parse error: ' + err.message);
      }
    }
  });
});


var port = 3100;
if (process.env.WMSC_PORT) {
  port = process.env.WMSC_PORT;
}
app.listen(port);
console.log('Listening at http://localhost:' + port);
