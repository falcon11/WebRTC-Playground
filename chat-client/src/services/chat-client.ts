import WebSocket, { w3cwebsocket } from 'websocket';
import WebrtcController from './webrtc-controller';

const wsURL = 'ws://localhost:8080/';
const wsProtocol = 'chat';

const wsClient = new w3cwebsocket(wsURL, wsProtocol);

export default class ChatClient {
  wsClient!: w3cwebsocket;
  webrtcController!: WebrtcController;
  messageListener: any[] = [];
  remoteUser?: string;
  isLogin: boolean = false;
  userList: string[] = [];
  onReceiveCall?: (username: string, accept: () => Promise<any>) => void;
  onReceiveAnswer?: () => void;
  onLogin?: (msg: any) => void;
  onReceiveUserList?: (userList: string[]) => void;

  constructor() {
    this._initWSClient();
    this._initWebrtcController();
  }

  _initWSClient = () => {
    this.wsClient = wsClient;
    this.wsClient.onopen = this._onWsClientOpen;
    this.wsClient.onclose = this._onWsClientClose;
    this.wsClient.onmessage = this._onWsClientMessage;
    this.wsClient.onerror = this._onWsClientError;
  };

  _initWebrtcController = () => {
    this.webrtcController = new WebrtcController();
    this.webrtcController.onIceCandidate = this._onIceCandidate;
  };

  _onWsClientOpen = () => {
    console.log('WebSocket Client Connected');
  };

  _onWsClientClose = () => {
    console.log('WebSocket Client closed');
  };

  _onWsClientMessage = (message: WebSocket.IMessageEvent) => {
    const data = message.data;
    try {
      const msgObj = JSON.parse(data as string);
      this._handleOnMessage(msgObj);
      this.messageListener.forEach(listener => {
        listener(msgObj);
      });
    } catch (error) {
      console.log('invalid data');
    }
  };

  _handleSuccessMessage = (data: any) => {
    const requestType = data?.requestType;
    const msg = data?.msg;
    switch (requestType) {
      case 'login':
        this._handleLoginSuccess(msg);
        break;
      default:
        break;
    }
  };

  _handleLoginSuccess = (msg: any) => {
    this.isLogin = true;
    this.onLogin?.(msg);
  };

  _acceptWebrtcOffer = async (data: { caller: string; offer: any }) => {
    this.remoteUser = data.caller;
    const answer = await this.webrtcController.handleReceiveOffer(data.offer);
    this.sendMessage({
      type: 'webrtc.answer',
      data: {
        caller: data.caller,
        answer,
      },
    });
  };

  _handleReceiveWebrtcOffer = async (data: { caller: string; offer: any }) => {
    this.onReceiveCall &&
      this.onReceiveCall(data.caller, () => {
        return this._acceptWebrtcOffer(data);
      });
  };

  _handleReceiveWebrtcAnswer = async (data: {
    receiver: string;
    answer: any;
  }) => {
    await this.webrtcController.handleReceiveAnswer(data.answer);
    this.onReceiveAnswer?.();
  };

  _handleReceiveWebrtcIceCandidate = async (data: {
    sender: string;
    candidate: any;
  }) => {
    await this.webrtcController.handleReceiveCandidate(data.candidate);
  };

  _handleReceiveUserList = ({ userList = [] }) => {
    this.userList = userList;
    this.onReceiveUserList?.(userList);
  };

  _handleOnMessage = ({ type = '', data }: { type: string; data: any }) => {
    switch (type) {
      case 'webrtc.offer':
        this._handleReceiveWebrtcOffer(data);
        break;
      case 'webrtc.answer':
        this._handleReceiveWebrtcAnswer(data);
        break;
      case 'webrtc.icecandidate':
        this._handleReceiveWebrtcIceCandidate(data);
        break;
      case 'success':
        this._handleSuccessMessage(data);
        break;
      case 'userList':
        this._handleReceiveUserList(data);
        break;
      default:
        break;
    }
  };

  _onWsClientError = (error: Error) => {
    console.log('websocket client error', error);
  };

  _onIceCandidate = (candidate: RTCIceCandidate) => {
    if (!this.remoteUser) {
      console.log('no remote user');
      return;
    }
    this.sendMessage({
      type: 'webrtc.icecandidate',
      data: {
        remoteUser: this.remoteUser,
        candidate,
      },
    });
  };

  addMessageListener = (
    listener: (message: { type: string; data: any }) => void,
  ) => {
    if (this.messageListener.indexOf(listener) === -1) {
      this.messageListener.push(listener);
    }
  };

  removeMessageListener = (
    listener: (message: { type: string; data: any }) => void,
  ) => {
    const index = this.messageListener.indexOf(listener);
    if (index !== -1) {
      this.messageListener.splice(index, 1);
    }
  };

  sendMessage = ({ type = '', data }: { type?: string; data?: any } = {}) => {
    if (this.wsClient.readyState === this.wsClient.OPEN) {
      const message = {
        type,
        data,
      };
      this.wsClient.send(JSON.stringify(message));
    }
  };

  loginWithUser = (user: { username: string }) => {
    if (user && user.username) this.sendMessage({ type: 'login', data: user });
  };

  call = async (receiver: string) => {
    this.remoteUser = receiver;
    const offer = await this.webrtcController.makeCall();
    this.sendMessage({
      type: 'webrtc.offer',
      data: {
        receiver,
        offer: offer,
      },
    });
  };
}
