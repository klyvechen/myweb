var serverUtil = require('./serverUtil.js');

server = serverUtil.createHTTPServer();

server.listen(3000);