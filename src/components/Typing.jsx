import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const Typing = () => {
  const container = useRef(null);

  useEffect(() => {
    const instance = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/ChatIndicator.json', // <-- path from public/
    });

    return () => instance.destroy();
  }, []);

  return <div ref={container} style={{ width: 50, height: 50 }} />;
};

export default Typing;
