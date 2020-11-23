function openDefaultStream() {
  console.log('open default stream');
  const constraints = {
    video: true,
    audio: true,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      console.log('get the stream', stream);
      var video = document.getElementById('player');
      video.srcObject = stream;
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

navigator.mediaDevices.addEventListener('devicechange', async () => {
  const devices = await getDevices();
  updateDevicesList(devices);
});

getDevices().then((devices) => updateDevicesList(devices));

const constraints = navigator.mediaDevices.getSupportedConstraints();
console.log('supported constraints', constraints);
