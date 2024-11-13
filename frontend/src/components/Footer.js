import React from 'react';
import { Stack, Text } from '@chakra-ui/react';

const Footer = () => {
    return (
        <Stack bg='red' w='100%' align='center' py={2}>
            <Text fontSize={12} color='white'>© Tabita Simorangkir 2024</Text>
        </Stack>
    )
}

export default Footer;