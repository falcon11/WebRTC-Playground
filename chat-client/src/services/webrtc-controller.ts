const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.xten.com' },
    ],
};

function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
        navigator.getUserMedia(constraints, (stream) => {
            resolve(stream);
        }, (error) => {
            reject(error);
        });
    });
}

class WebrtcController {

    peerConnection: RTCPeerConnection;
    localMediaStream: MediaStream | undefined;
    remoteMediaStream: MediaStream;
    onIceCandidate?: (candidate: RTCIceCandidate) => void;

    constructor() {
        this.localMediaStream = undefined;
        this.remoteMediaStream = new MediaStream();
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.ontrack = this._onTrack;
        this.peerConnection.onconnectionstatechange = this._onConnectionStateChange;
        this.peerConnection.onicecandidate = this._onIceCandidate;
    }

    _onTrack = (ev: RTCTrackEvent) => {
        this.remoteMediaStream.addTrack(ev.track);
    }

    _onConnectionStateChange = () => {
        console.log('current webrtc connection state:', this.peerConnection.connectionState);
    }

    _onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
        console.log('on ice candidate', ev.candidate);
        if (ev.candidate) {
            this.onIceCandidate && this.onIceCandidate(ev.candidate);
        }
    }

    makeCall = async () => {
        this.localMediaStream = await getUserMedia({ video: true, audio: false });
        this.localMediaStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localMediaStream!);
        });
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    handleReceiveOffer = async (offer: any) => {
        console.log('receive offer', offer);
        this.localMediaStream = await getUserMedia({ video: true, audio: false });
        this.localMediaStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localMediaStream!);
        });
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    handleReceiveAnswer = async (answer: any) => {
        console.log('receive answer', answer);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    handleReceiveCandidate = async (candidate: any) => {
        console.log('receive candidate', candidate);
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {

        }

    }
}

export default WebrtcController;