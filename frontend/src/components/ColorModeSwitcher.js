import React from 'react';
import { IconButton } from '@chakra-ui/react';
import { useTheme } from 'next-themes';
import { FaMoon } from 'react-icons/fa6';
import { FaSun } from 'react-icons/fa';

export const ColorModeSwitcher = props => {
    const { theme, setTheme } = useTheme();

    return (
        <IconButton
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            size='sm'
            variant='ghost'
            color='white'
            {...props}
        >
            { theme === 'light' ? <FaSun color='black' /> : <FaMoon /> }
        </IconButton>
    )
}