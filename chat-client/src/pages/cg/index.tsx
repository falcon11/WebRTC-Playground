import { getUserMedia } from '@/services/webrtc-controller';
import React, { useEffect, useState, useRef } from 'react';
import styles from './index.less';

const sepiaFilter = function(imgData: ImageData) {
  let d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];
    d[i] = r * 0.393 + g * 0.769 + b * 0.189; // red
    d[i + 1] = r * 0.349 + g * 0.686 + b * 0.168; // green
    d[i + 2] = r * 0.272 + g * 0.534 + b * 0.131; // blue
  }
  return imgData;
};

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

  const renderVideoToCanvas = () => {
    if (
      !videoRef.current ||
      videoRef.current.videoWidth === 0 ||
      !canvasRef.current
    ) {
      return;
    }
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
    const imageData = ctx?.getImageData(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoWidth,
    );
    imageData && ctx?.putImageData(sepiaFilter(imageData), 0, 0);
  };

  useEffect(() => {
    const engineLoop = () => {
      renderVideoToCanvas();
      requestAnimationFrame(engineLoop);
    };
    engineLoop();
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
