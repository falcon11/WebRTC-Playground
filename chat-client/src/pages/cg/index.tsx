import { getUserMedia } from '@/services/webrtc-controller';
import React, { useEffect, useState, useRef } from 'react';
import styles from './index.less';

export default () => {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function initStream() {
      const stream = await getUserMedia({ video: true });
      setVideoStream(stream);
    }
    initStream();
  }, []);

  useEffect(() => {
    videoRef.current && (videoRef.current.srcObject = videoStream);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(
        videoRef.current,
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight,
      );
    }, 1000 / 30);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        className={styles.player}
        autoPlay
        playsInline
      ></video>
      <canvas ref={canvasRef} className={styles.player}></canvas>
    </div>
  );
};
