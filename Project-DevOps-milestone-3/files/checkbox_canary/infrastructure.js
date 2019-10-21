var http = require('http'),
    httpProxy = require('http-proxy'),
    request = require('request');

// Stable and canary servers
var checkbox1 = {
        host: process.env.checkbox1,
        port: 80
    },
    canary_checkbox = {
        host: process.env.canary_checkbox,
        port: 80
    };

var servers = [checkbox1, canary_checkbox];
var count = 0;
// Proxy server
var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {
        count++;
    console.log("\n request count", count++, "\n");
    var currentTarget = checkbox1; //servers.shift();
   var url = `${currentTarget.host}:${currentTarget.port}`;

if(count%4 == 0)
        currentTarget = canary_checkbox;
else
        currentTarget = checkbox1;

    request.get(`http://${url}`, function (err, resp, body) {
         console.log("DEBUG", "Request complete");
        console.log("Error:"+err+"Response"+resp.statusCode);
        if ((err || resp.statusCode != 200))) {
            console.log("Re-reouting to checkbox1");
            currentTarget = checkbox1;
        }
         console.log('Balancing to', currentTarget.host);
        proxy.web(req, res, { target: currentTarget });
    });
});
//    servers.push(currentTarget);
}).listen(3000);
