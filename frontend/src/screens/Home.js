import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import MovieList from '../components/MovieList';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <Box w='100%' h='100vh'>
            <VStack>
                <Navbar />
                <MovieList />
                <Footer />
            </VStack>
        </Box>
    )
}

export default Home;