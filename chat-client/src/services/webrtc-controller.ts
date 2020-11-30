const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.xten.com' },
  ],
};

const constraints: MediaStreamConstraints = {
  video: true,
  audio: true,
};

function getUserMedia(
  constraints: MediaStreamConstraints,
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(constraints);
}

class WebrtcController {
  peerConnection: RTCPeerConnection;
  localMediaStream: MediaStream | undefined;
  remoteMediaStream: MediaStream;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  candidateArray: any[] = [];

  constructor() {
    this.localMediaStream = undefined;
    this.remoteMediaStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection(configuration);
    this.peerConnection.ontrack = this._onTrack;
    this.peerConnection.onconnectionstatechange = this._onConnectionStateChange;
    this.peerConnection.onicecandidate = this._onIceCandidate;
    this.peerConnection.onicegatheringstatechange = this._onIceGatheringStateChange;
  }

  _onTrack = (ev: RTCTrackEvent) => {
    this.remoteMediaStream.addTrack(ev.track);
  };

  _onConnectionStateChange = () => {
    console.log(
      'current webrtc connection state:',
      this.peerConnection.connectionState,
    );
  };

  _onIceGatheringStateChange = (ev: any) => {
    console.log('on ice gathering state change', ev);
  };

  _onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
    console.log('on ice candidate', ev.candidate);
    if (ev.candidate) {
      this.onIceCandidate && this.onIceCandidate(ev.candidate);
    }
  };

  makeCall = async () => {
    this.localMediaStream = await getUserMedia(constraints);
    this.localMediaStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localMediaStream!);
    });
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  };

  handleReceiveOffer = async (offer: any) => {
    console.log('receive offer', offer);
    this.localMediaStream = await getUserMedia(constraints);
    this.localMediaStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localMediaStream!);
    });
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offer),
    );
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  };

  handleReceiveAnswer = async (answer: any) => {
    console.log('receive answer', answer);
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    );
    if (this.candidateArray.length > 0) {
      console.log('receive answer and add candidate');
      for (let i = 0; i < this.candidateArray.length; i += 1) {
        const candidate = this.candidateArray[i];
        try {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (error) {
          console.error('add ice candidate error', error);
        }
      }
      this.candidateArray = [];
    }
  };

  handleReceiveCandidate = async (candidate: any) => {
    console.log('receive candidate', candidate);
    if (!this.peerConnection.remoteDescription) {
      this.candidateArray.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('add ice candidate error', error);
    }
  };
}

export default WebrtcController;
