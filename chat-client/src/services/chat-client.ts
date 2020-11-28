import WebSocket from 'websocket';

const wsURL = 'ws://localhost:8080/';
const wsProtocol = 'chat';

const W3CWebSocket = WebSocket.w3cwebsocket;
const messageListener: any[] = [];


const client = new W3CWebSocket(wsURL, wsProtocol);

client.onerror = function () {
    console.log('Connection Error');
};

client.onopen = function () {
    console.log('WebSocket Client Connected');

    function sendNumber() {
        if (client.readyState === client.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            client.send(number.toString());
            // setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
};

client.onclose = function () {
    console.log('echo-protocol Client Closed');
};

client.onmessage = function (e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
    }
    messageListener.forEach(listener => {
        listener(e.data);
    });
};

export function sendMessage({ type = '', data }: { type: string; data: any }) {
    console.log('client ready state', client.readyState);
    const message = {
        type,
        data,
    };
    if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
    }
}

export function addMessageListener(listener: (data: any) => void) {
    messageListener.push(listener);
}

export function removeMessageListener(listener: any) {
    const index = messageListener.indexOf(listener);
    if (index !== -1) {
        messageListener.splice(index, 1);
    }
}

export default client;