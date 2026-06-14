import React, { useEffect, useState } from 'react';

const RollingNumber = ({ number }:{number:number}) => {
  const [prevNumber, setPrevNumber] = useState(number);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (number !== prevNumber) {
      setAnimate(true);
      const timeout = setTimeout(() => {
        setPrevNumber(number);
        setAnimate(false);
      }, 1000); // Duration of the animation
      return () => clearTimeout(timeout);
    }
  }, [number, prevNumber]);

  return (
    <div className='rolling-number mb-5 flex justify-center items-center text-center text-[45px]'>
      <span className={animate ? 'animate-out' : 'text-center'}>{prevNumber}</span>
      {animate && <span className='animate-in'>{number}</span>}
    </div>
  );
};

export default RollingNumber;

