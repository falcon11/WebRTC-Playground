import React, { useEffect, useState, useRef } from 'react';
import styles from './index.less';
import ChatClient from '@/services/chat-client';

export default () => {
  const [username, setUsername] = useState('');
  const [remoteUser, setRemoteUser] = useState('');
  const [chatClient, setChatClient] = useState<ChatClient>();
  const [isLogin, setIsLogin] = useState(chatClient?.isLogin);
  const [userList, setUserList] = useState<string[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const client = new ChatClient();
    setChatClient(client);
  }, []);
  useEffect(() => {
    if (!chatClient) return;
    chatClient.onReceiveCall = async (caller, accept) => {
      const isAccepted = confirm('' + caller + ' calling, accept?');
      if (isAccepted && accept) {
        await accept();
        localVideoRef.current &&
          (localVideoRef.current.srcObject =
            chatClient?.webrtcController.localMediaStream || null);
        remoteVideoRef.current &&
          (remoteVideoRef.current.srcObject =
            chatClient?.webrtcController.remoteMediaStream || null);
      }
    };
    chatClient.onLogin = () => {
      setIsLogin(true);
    };
    chatClient.onReceiveUserList = userList => setUserList(userList);
  }, [chatClient]);
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chatClient?.loginWithUser({ username });
  };
  const handleCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await chatClient?.call(remoteUser);
    localVideoRef.current &&
      (localVideoRef.current!.srcObject =
        chatClient?.webrtcController.localMediaStream || null);
    remoteVideoRef.current &&
      (remoteVideoRef.current.srcObject =
        chatClient?.webrtcController.remoteMediaStream || null);
  };
  return (
    <div>
      <h1 className={styles.title}>chat client</h1>
      <form onSubmit={handleLogin}>
        <label>
          Username:
          <input
            type="text"
            name="username"
            onChange={e => setUsername(e.target.value)}
          />
        </label>
        <input type="submit" value="Login" />
        <span
          className={isLogin ? styles.loginStatusYes : styles.loginStatusNo}
        >
          {isLogin ? 'has login' : 'no login'}
        </span>
      </form>
      <form onSubmit={handleCall}>
        <label>
          Remote:
          <input
            type="text"
            name="remoteUser"
            onChange={e => setRemoteUser(e.target.value)}
          />
        </label>
        <input type="submit" value="Call" />
      </form>
      <div className={styles.horizontalContainer}>
        <div className={styles.userList}>
          {userList.map(user => {
            return (
              <div>
                <span>{user}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.playerContainer}>
          <video
            ref={localVideoRef}
            className={styles.localPlayer}
            autoPlay
            playsInline
          ></video>
          <video
            ref={remoteVideoRef}
            className={styles.remotePlayer}
            autoPlay
            playsInline
          ></video>
        </div>
      </div>
    </div>
  );
};
