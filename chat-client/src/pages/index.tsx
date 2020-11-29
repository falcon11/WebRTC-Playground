import React, { useEffect, useState, useRef } from 'react';
import styles from './index.less';
import ChatClient from '@/services/chat-client';

export default () => {
  const [username, setUsername] = useState('');
  const [remoteUser, setRemoteUser] = useState('');
  const [chatClient, setChatClient] = useState<ChatClient>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const onMessage = ({ type, data }: { type: string; data: any }) => {
    console.log('receive data', data);
  }
  useEffect(() => {
    const client = new ChatClient();
    setChatClient(client);
  }, []);
  useEffect(() => {
    if (!chatClient) return;
    chatClient.addMessageListener(onMessage);
    chatClient.onReceiveCall = async (caller, accept) => {
      const isAccepted = confirm('' + caller + ' calling, accept?');
      if (isAccepted && accept) {
        await accept();
        localVideoRef.current && (localVideoRef.current.srcObject = chatClient?.webrtcController.localMediaStream || null);
        remoteVideoRef.current && (remoteVideoRef.current.srcObject = chatClient?.webrtcController.remoteMediaStream || null);
      }
    };
    return () => {
      chatClient.removeMessageListener(onMessage);
    };
  }, [chatClient])
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chatClient?.sendMessage({ type: 'login', data: { username, } })
  }
  const handleCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await chatClient?.call(remoteUser);
    localVideoRef.current && (localVideoRef.current!.srcObject = chatClient?.webrtcController.localMediaStream || null);
    remoteVideoRef.current && (remoteVideoRef.current.srcObject = chatClient?.webrtcController.remoteMediaStream || null);
  }
  return (
    <div>
      <h1 className={styles.title}>chat client</h1>
      <form onSubmit={handleLogin}>
        <label>
          Username:
          <input type="text" name="username" onChange={(e) => setUsername(e.target.value)} />
        </label>
        <input type='submit' value="Login" />
      </form>
      <form onSubmit={handleCall}>
        <label>
          Remote:
          <input type="text" name="remoteUser" onChange={e => setRemoteUser(e.target.value)} />
        </label>
        <input type="submit" value="Call" />
      </form>
      <div>
        <video ref={localVideoRef} className={styles.player} autoPlay playsInline></video>
        <video ref={remoteVideoRef} className={styles.player} autoPlay playsInline></video>
      </div>
    </div>
  );
}
