import React, { useEffect, useState } from 'react';
import styles from './index.less';
import { addMessageListener, removeMessageListener, sendMessage } from '@/services/chat-client';

export default () => {
  const [username, setUsername] = useState('');
  const onMessage = (data: any) => {
    console.log('receive data', data);
  }
  useEffect(() => {
    addMessageListener(onMessage);
    return () => {
      removeMessageListener(onMessage);
    };
  }, []);
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ type: 'login', data: { username, } })
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
    </div>
  );
}
