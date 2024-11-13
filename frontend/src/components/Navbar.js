import React, { useState } from 'react';
import { Box, Image, Input, SimpleGrid, Text, Stack, VStack } from '@chakra-ui/react';
import { ProgressCircleRoot, ProgressCircleRing } from '../components/ui/progress-circle';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useScreenSize } from '../hooks/useScreenSize';
import Movies from '../assets/movies.json';

const Navbar = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const screenSize = useScreenSize();

    const [searchMovie, setSearchMovie] = useState('');
    const [filteredMovies, setFitleredMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = (e) => {
        const movie = e.target.value;
        setSearchMovie(movie);
        setLoading(true);

        setTimeout(() => {
            if(movie.trim() === ''){
                setFitleredMovies([]);
            } else {
                const results = Movies.filter(list =>
                    list.Title.toLowerCase().includes(movie.toLowerCase())
                );
                setFitleredMovies(results);
            }

            setLoading(false);
        }, 500)
        
    }

    const onInteraction = (movie) => {
        const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
    
        if (!interactions.some(interaction => interaction.id === movie.id)) {
            interactions.push(movie);
    
            if (interactions.length > 1) {
                interactions.shift();
            }
    
            localStorage.setItem('interactions', JSON.stringify(interactions));
        }
    };

    const searchBarW = screenSize === 'extraLarge' ? '800px' : screenSize === 'large' ? '550px' : '90vw';
    const small = screenSize !== 'extraLarge' && screenSize !== 'large' && screenSize !== 'medium';
    const Gap = screenSize === 'extraLarge' ? 10 : screenSize === 'large' ? 10 : 8;

    return (
        <Box position='relative'>
            <Box bg={theme === 'light' ? 'white' : 'black' } position='sticky' top={0} zIndex={99} w='100%' display='flex' alignItems='center' justifyContent='center' overflow='hidden' py={5}>
                <SimpleGrid columns={small ? 2 : 3} gap={Gap} display='flex' alignItems='centers' justifyContent='center'>
                    <Box display='flex' w={small && '40vw'} alignItems='center' justifyContent='flex-start'>
                        <Box as='button' cursor='button' onClick={() => navigate('/')}>
                            <Image
                                src='/popcorn.png' w={50}
                            />
                        </Box>
                    </Box>
                    <Input display={ small ? 'none' : 'block' } placeholder='Search here...' variant='flushed' w={searchBarW} value={searchMovie} onChange={handleSearch} />
                    <Box display='flex' w={small && '40vw'} alignItems='center' justifyContent='flex-end'>
                        <ColorModeSwitcher />
                    </Box>
                </SimpleGrid>
            </Box>

            { loading && 
                <Stack position='absolute' zIndex={1000} bg={theme === 'light' ? 'white' : 'black' } w={searchBarW} align='center' top={small && '165%'} right='50%' transform='translateX(50%)' py={2}>
                    <ProgressCircleRoot size='sm' value={null}>
                        <ProgressCircleRing />
                    </ProgressCircleRoot>
                </Stack>
            }

            {filteredMovies.length > 0 && !loading && (
                <VStack position='absolute' zIndex={1000} bg={theme === 'light' ? 'white' : 'black' } w={searchBarW} align='left' top={small && '160%'} right='50%' transform='translateX(50%)'>
                    {filteredMovies.map((movie) => (
                        <Box px={2} pt={1.5} key={movie.id} _hover={{bg:'rgba(128,128,128,0.2)'}} >
                            <Box as='button' w='100%' onClick={() => {onInteraction(movie); navigate(`/description/${movie.id}`)}} cursor='button'>
                                <Box display='flex' alignItems='flex-start' justifyContent='flex-start'>
                                    <Image src={movie.Poster} h='80px' w='54px' mr={2} />
                                    <Stack align='flex-start'>
                                        <Text lineHeight='1' fontWeight='bold'>{movie.Title}</Text>
                                        <Text lineHeight='1' color='gray'>{movie.Year}</Text>
                                        {!(movie.Director.length === 1 && movie.Director[0] === 'None') &&
                                            <Text lineHeight='1' color='gray'>{movie.Director}</Text>
                                        }
                                    </Stack>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </VStack>
            )}

            {!loading && searchMovie.length > 0 && filteredMovies.length === 0 && (
                <Stack position='absolute' zIndex={1000} bg={theme === 'light' ? 'white' : 'black' } w='800px'align='center' top={small && '160%'} right='50%' transform='translateX(50%)' py={2}>
                    <Text>No results found for "{searchMovie}"</Text>
                </Stack>
            )}

            { small && 
            <Box bg={theme === 'light' ? 'white' : 'black' } position='absolute' top={20} zIndex={99} w='100%' display='flex' alignItems='center' justifyContent='center' overflow='hidden' pb={5}>
                <Box display='flex' w='90vw'>
                    <Input placeholder='Search here...' variant='flushed' w='100%' value={searchMovie} onChange={handleSearch} />
                </Box>
            </Box>
            }
            
        </Box>
    )
}

export default Navbar;