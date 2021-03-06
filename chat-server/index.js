#!/usr/bin/env node
var WebSocket = require('websocket');
var WebSocketServer = WebSocket.server;
var http = require('http');
var https = require('https');
var fs = require('fs');

const MessageTypes = require('./messageType');

var server = http.createServer(function (request, response) {
  console.log(new Date() + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(8080, function () {
  console.log(new Date() + ' Server is listening on port 8080');
});

var httpsServer = https.createServer(
  {
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./privkey.pem'),
  },
  function (request, response) {
    console.log(new Date() + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
  }
);
httpsServer.listen(8081, function () {
  console.log(new Date() + ' Server is listening on port 8081');
});

const wsServer = new WebSocketServer({
  httpServer: [server, httpsServer],
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false,
});

const userList = [];
const userConnections = {};

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

/**
 * send message
 * @param {WebSocket.connection} connection
 * @param {*} param1
 */
function sendMessage(connection, { type, data }) {
  const message = {
    type,
    data,
  };
  connection.sendUTF(JSON.stringify(message));
}

/**
 *
 * @param {WebSocket.connection} connection
 * @param {string} error
 */
function sendError(connection, msg = '', requestType = undefined, data = undefined) {
  const response = {
    type: MessageTypes.error,
    data: {
      msg: msg,
      requestType,
      otherData: data,
    },
  };
  sendMessage(connection, response);
}

function sendSuccess(connection, msg = '', requestType = undefined, data = undefined) {
  const response = {
    type: MessageTypes.success,
    data: {
      msg,
      requestType,
      otherData: data,
    },
  };
  sendMessage(connection, response);
}

function handleReceiveMsg(connection, msg = {}) {
  const { type, data } = msg;
  switch (type) {
    case MessageTypes.login:
      handleLogin(connection, data);
      break;
    case MessageTypes.webrtcOffer:
      handleReceiveWebrtcOffer(connection, data);
      break;
    case MessageTypes.webrtcAnswer:
      handleReceiveWebrtcAnswer(connection, data);
      break;
    case MessageTypes.webrtcIcecandidate:
      handleReceiveWebrtcIceCandidate(connection, data);
      break;
    default:
      break;
  }
}

function handleLogin(connection, data) {
  const { username = '', password = '' } = data;
  if (!username) {
    sendError(connection, 'invalid username');
    return;
  }
  console.log('handle login', userList, data);
  const index = userList.indexOf(username);
  if (index !== -1) {
    sendError(connection, 'login fail. the user ' + username + ' already login', MessageTypes.login);
    return;
  }
  userList.push(username);
  connection.username = username;
  const connections = userConnections[username] || [];
  if (!connections.includes(connection)) {
    connections.push(connection);
  }
  userConnections[username] = connections;
  sendSuccess(connection, 'login success', MessageTypes.login);
  sendUserListToAll();
}

function sendUserListToAll() {
  const msg = {
    type: MessageTypes.userList,
    data: {
      userList,
    },
  };
  for (const key in userConnections) {
    if (userConnections.hasOwnProperty(key)) {
      const connections = userConnections[key] || [];
      if (!Array.isArray(connections)) return;
      connections.forEach((connection) => {
        sendMessage(connection, msg);
      });
    }
  }
}

function handleReceiveWebrtcOffer(callerConnection, data) {
  const { receiver, offer } = data;
  const connections = userConnections[receiver] || [];
  if (connections.length === 0) {
    return;
  }
  const msgObj = {
    type: MessageTypes.webrtcOffer,
    data: {
      caller: callerConnection.username,
      offer,
    },
  };
  const msg = JSON.stringify(msgObj);
  connections.forEach((connection) => {
    connection.sendUTF(msg);
  });
}

function handleReceiveWebrtcAnswer(receiverConnection, data) {
  const { caller, answer } = data;
  const connections = userConnections[caller] || [];
  if (connections.length === 0) {
    return;
  }
  const msgObj = {
    type: MessageTypes.webrtcAnswer,
    data: {
      receiver: receiverConnection.username,
      answer,
    },
  };
  const msg = JSON.stringify(msgObj);
  connections.forEach((connection) => {
    connection.sendUTF(msg);
  });
}

function handleReceiveWebrtcIceCandidate(srcConnection, data) {
  const { remoteUser, candidate } = data;
  const connections = userConnections[remoteUser] || [];
  if (connections.length === 0) return;
  const msgObj = {
    type: MessageTypes.webrtcIcecandidate,
    data: {
      sender: srcConnection.username,
      candidate,
    },
  };
  const msg = JSON.stringify(msgObj);
  connections.forEach((connection) => {
    connection.sendUTF(msg);
  });
}

function handleConnectionClose(connection) {
  const username = connection.username;
  const connections = userConnections[username] || [];
  const index = connections.indexOf(connection);
  if (index !== -1) {
    connections.splice(index, 1);
  }
  if (connections.length === 0) {
    delete userConnections[username];
    const userIndex = userList.indexOf(username);
    if (userIndex !== -1) {
      userList.splice(userIndex, 1);
      sendUserListToAll();
    }
  }
}

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(new Date() + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept('chat', request.origin);
  console.log(new Date() + ' Connection accepted.');
  const handleUTF8Message = (msgString = '') => {
    if (!msgString) return;
    try {
      const msg = JSON.parse(msgString);
      handleReceiveMsg(connection, msg);
    } catch (error) {
      console.log('error happen', error);
      sendError(connection, 'invalid message');
    }
  };
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      // connection.sendUTF(message.utf8Data);
      handleUTF8Message(message.utf8Data);
    } else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function (reasonCode, description) {
    console.log(new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.');
    handleConnectionClose(connection);
  });
});
