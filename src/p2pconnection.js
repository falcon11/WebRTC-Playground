const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.xten.com' },
  ],
};
let callerlocalStream;
let callerRemoteStream = new MediaStream();

let answerLocalStream;
let answerRemoteStream = new MediaStream();

const callPeerConnection = window.callPeerConnection = new RTCPeerConnection(configuration);
const answerPeerConnection = window.answerPeerConnection = new RTCPeerConnection(configuration);

async function makeCall() {
  const peerConnection = callPeerConnection;
  localStream = window.localStream = await getStream();
  playStreamWithID('caller-local', localStream);
  peerConnectionAddTracks(peerConnection, localStream);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('offer', offer);
  return offer;
}

async function makeAnswer(offer) {
  const peerConnection = answerPeerConnection;
  answerLocalStream = await getStream();
  playStreamWithID('answer-local', answerLocalStream);
  peerConnectionAddTracks(answerPeerConnection, answerLocalStream);
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log('answer', answer);
  return answer;
}

async function onCallReceiveAnswer(answer) {
  await callPeerConnection.setRemoteDescription(answer);
}

async function peerConnectionAddIceCandidate(peerConnection, icecandidate) {
  console.log('peer connection add ice candidate', peerConnection.remoteDescription);
  if (!peerConnection.remoteDescription) return;
  await peerConnection.addIceCandidate(icecandidate);
}

callPeerConnection.addEventListener('icegatheringstatechange', (event) => {
  console.log('call peer icegatheringstatechange', event);
});

answerPeerConnection.addEventListener('icegatheringstatechange', (event) => {
  console.log('answer peer icegatheringstatechange', event);
});

callPeerConnection.addEventListener('icecandidate', (event) => {
  console.log('call on icecandidate', event);
  if (event.candidate) {
    console.log('call peer receive icecandidate', event.candidate);
    peerConnectionAddIceCandidate(answerPeerConnection, event.candidate);
  }
});

answerPeerConnection.addEventListener('icecandidate', (event) => {
  console.log('answer on icecandidate', event);
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

callPeerConnection.ontrack = (ev) => {
  console.log('caller on track', ev);
  callerRemoteStream.addTrack(ev.track);
};

answerPeerConnection.ontrack = (ev) => {
  console.log('answer on track', ev);
  answerRemoteStream.addTrack(ev.track);
};

function getUserMedia(constraints) {
  return new Promise((resolve, reject) => {
    navigator.getUserMedia(constraints, (stream) => {
      resolve(stream);
    }, (error) => {
      reject(error);
    });
  });
}

async function getStream() {
  const localStream = await getUserMedia({ video: true, audio: false });
  return localStream;
}

async function peerConnectionAddTracks(peerConnection, stream) {
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  })
}

function playStreamWithID(id, stream) {
  const video = document.getElementById(id);
  video.srcObject = stream;
}

async function start() {
  const offer = await makeCall();
  playStreamWithID('caller-remote', callerRemoteStream);
  const answer = await makeAnswer(offer);
  playStreamWithID('answer-remote', answerRemoteStream);
  await onCallReceiveAnswer(answer);
}

start();
