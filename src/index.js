let _stream;

function openDefaultStream() {
  console.log('open default stream');
  const constraints = {
    video: true,
    audio: true,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      onStreamOpen(stream);
    })
    .catch((e) => {
      console.error('error accessing media devices', e);
    });
}

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log(devices);
  return devices;
}

function updateDevicesList(devices) {
  const list = document.getElementById('devices');
  devices.forEach((device) => {
    const li = document.createElement('li');
    li.textContent = device.label;
    list.appendChild(li);
  });
}

/**
 * update tracks list
 * @param {MediaStream} stream media stream
 */
function updateTracks(stream) {
  const tracks = stream.getTracks();
  console.log('tracks:', tracks);
  const listEle = document.getElementById('tracks');
  listEle.innerHTML = '';
  tracks.forEach((track) => {
    console.log('track settings', track.getSettings());
    const trackObj = {
      kind: track.kind,
      enabled: track.enabled,
      label: track.label,
      id: track.id,
      readyState: track.readyState,
      muted: track.muted,
    };
    const li = document.createElement('li');
    li.textContent = JSON.stringify(trackObj);
    listEle.appendChild(li);
  });
}

function playStream(stream) {
  var video = document.getElementById('player');
  video.srcObject = stream;
}

function onStreamOpen(stream) {
  _stream = stream;
  updateTracks(stream);
  playStream(stream);
  console.log('get the stream', stream);
}

function toggleAudio() {
  const audioTracks = _stream.getAudioTracks();
  audioTracks.forEach((track) => {
    track.enabled = !track.enabled;
  });
  updateTracks(_stream);
}

function toggleVideo() {
  const videoTracks = _stream.getVideoTracks();
  videoTracks.forEach((track) => {
    track.enabled = !track.enabled;
  });
  updateTracks(_stream);
}

navigator.mediaDevices.addEventListener('devicechange', async () => {
  const devices = await getDevices();
  updateDevicesList(devices);
});

getDevices().then((devices) => updateDevicesList(devices));

const constraints = navigator.mediaDevices.getSupportedConstraints();
console.log('supported constraints', constraints);
