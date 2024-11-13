import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import Navbar from '../components/Navbar';
import Description from '../components/Description';
import Footer from '../components/Footer';

const MovieDesc = () => {
    return (
        <Box w='100%' h='100vh'>
            <VStack>
                <Navbar />
                <Description />
                <Footer />
            </VStack>
        </Box>
    )
}

export default MovieDesc;