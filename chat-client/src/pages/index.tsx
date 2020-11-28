import React from 'react';
import styles from './index.less';
import ChatClient from '@/services/chat-client';

console.log('chat client', ChatClient);

export default () => {
  return (
    <div>
      <h1 className={styles.title}>chat client</h1>
    </div>
  );
}
