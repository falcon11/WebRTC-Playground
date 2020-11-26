const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.xten.com' },
  ],
};
const callPeerConnection = new RTCPeerConnection(configuration);
const answerPeerConnection = new RTCPeerConnection(configuration);

async function makeCall() {
  const peerConnection = callPeerConnection;
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('offer', offer);
  return offer;
}

async function makeAnswer(offer) {
  const peerConnection = answerPeerConnection;
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log('answer', answer);
  return answer;
}

async function onCallReceiveAnswer(answer) {
  await callPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function peerConnectionAddIceCandidate(peerConnection, icecandidate) {
  await peerConnection.addIceCandidate(icecandidate);
}

callPeerConnection.addEventListener('icegatheringstatechange', (event) => {
  console.log('call peer icegatheringstatechange', event);
});

answerPeerConnection.addEventListener('icegatheringstatechange', (event) => {
  console.log('answer peer icegatheringstatechange', event);
});

callPeerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    console.log('call peer receive icecandidate', event.candidate);
    peerConnectionAddIceCandidate(answerPeerConnection, event.candidate);
  }
});

answerPeerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    console.log('answer peer receive icecandidate', event.candidate);
    peerConnectionAddIceCandidate(callPeerConnection, event.candidate);
  }
});

callPeerConnection.addEventListener('connectionstatechange', () => {
  console.log('call peer connect state', callPeerConnection.connectionState);
});

answerPeerConnection.addEventListener('connectionstatechange', () => {
  console.log('answer peer connect state', answerPeerConnection.connectionState);
});

async function start() {
  const offer = await makeCall();
  const answer = await makeAnswer(offer);
  await onCallReceiveAnswer(answer);
}

start();
