// 1070 above
// 1669 - 771
// 770 - 560
// 559 - 481
// 480 below

import { useState, useEffect } from 'react';

const getScreenSize = () => {
    const width = window.innerWidth;

    if (width >= 1070) {
        return 'extraLarge'
    } if (width >= 771 && width <= 1669) {
        return 'large'
    } if (width >= 560 && width <= 770) {
        return 'medium'
    } if (width >= 481 && width <= 559) {
        return 'small'
    } else {
        return 'mobile'
    }
}

export function useScreenSize() {
    const [screenSize, setScreenSize] = useState(getScreenSize());

    useEffect(() => {
        const onResize = () => {
            setScreenSize(getScreenSize());
        }

       window.addEventListener('resize', onResize);

       return() => {
            window.removeEventListener('resize', onResize);
       }
       
    }, []);

    return screenSize;
}