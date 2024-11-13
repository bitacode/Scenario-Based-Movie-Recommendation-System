import React, { useEffect, useState } from 'react';
import { Box, VStack, Image, SimpleGrid, Text, Separator, Link, Stack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useScreenSize } from '../hooks/useScreenSize';
import axios from 'axios';
import Movies from '../assets/movies.json';
import LoadingMovieList from './LoadingMovieList';

const MovieList = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userHistory, setUserHistory] = useState(false);

    const navigate = useNavigate();
    const screenSize = useScreenSize();

    const fetchRecommendations = async (interactions) => {
        setLoading(true);

        const input_keywords = {};

        interactions.forEach(interaction => {
            if(interaction.Genres && interaction.Genres.length > 0) {
                input_keywords.Genres = [interaction.Genres[0]];
            }
        });

        try {
            const response = await axios.post('http://localhost:5000/recommend', {
                input_keywords,
                top_k: 9
            });
            if(response.data.status === 'success') {
                setRecommendations(response.data.recommendations[0].results);
            } else {
                alert('Error: ', + response.data.message);
            }
        } catch(error) {
            console.log('Error fetching recommendations:', error);
            alert('Error fetching recommendations');
        } finally {
            setLoading(false);
        }
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

    useEffect(() => {
        const interactions = JSON.parse(localStorage.getItem('interactions')) || [];
        const rankedMovies = JSON.parse(localStorage.getItem('rankedMovies'));
    
        setUserHistory(interactions.length > 0);
    
        if (interactions.length > 0) {
            // Fetch recommendations based on interactions
            fetchRecommendations(interactions);
        } else if (rankedMovies) {
            // Use cached ranked movies if available
            setRecommendations(rankedMovies);
            setLoading(false);
        } else {
            // Fetch ranked movies from the backend and store in local storage
            axios.get('http://localhost:5000/get_sorted_movies')
                .then(response => {
                    if (response.data.status === 'success') {
                        const movies = response.data.sorted_movies;
                        localStorage.setItem('rankedMovies', JSON.stringify(movies));
                        setRecommendations(movies);
                    }
                })
                .catch(error => {
                    console.error('Error fetching sorted movies:', error);
                    alert('Error fetching sorted movies');
                })
                .finally(() => setLoading(false));
        }
    }, []);

    const recommendedIds = new Set(recommendations.map(item => item.id));
    const remainingMovies = Movies.filter(movie => !recommendedIds.has(movie.id)).slice(0, 21);

    const Columns = screenSize === 'extraLarge' ? 3 : screenSize === 'large' ? 3 : screenSize === 'medium' ? 2 : screenSize === 'small' ? 2 : 1;
    const Gap = screenSize === 'extraLarge' ? 6 : 'large' ? 4 : screenSize === 'medium' ? 3 : 0;
    const posterW = screenSize === 'extraLarge' ? '324px' : screenSize === 'large' ? '216px' : screenSize === 'medium' ? '216px' : '144px';
    const posterH = screenSize === 'extraLarge' ? '480px' : screenSize === 'large' ? '320px' : screenSize === 'medium' ? '320px' : '213.3px' ;
    const titleFS = screenSize === 'extraLarge' ? 18 : screenSize === 'large' ? 16 : screenSize === 'medium' ? 16 : 12;
    const yearFS = screenSize === 'extraLarge' ? 16 : screenSize === 'large' ? 14 : screenSize === 'medium' ? 14 : 10;
    
    const small = screenSize !== 'extraLarge' && screenSize !== 'large' && screenSize !== 'medium';

    return (
        <VStack my={8} w='100%' display='flex' alignItems='center' justifyContent='center' overflow='hidden'>
            <Box mb={screenSize !== 'mobile' ? 4 : 2} mt={small && 8}>
                <Text fontSize={screenSize !== 'mobile' ? 38 : 24} fontWeight='bold'>{userHistory ? 'Tailored for you:' : 'You might like:'}</Text>
                <Separator borderColor='red' size='lg' />
            </Box>
            { loading ?
                <LoadingMovieList /> :
                <SimpleGrid columns={Columns} gap={Gap}>
                    {recommendations.map((item, index) => (
                        <Stack key={index}>
                            <Link onClick={() => {onInteraction(item); navigate(`/description/${item.id}`)}}>
                                <Box w={posterW} h={posterH} overflow='hidden' borderRadius='3xl'>
                                    <Image src={item.Poster} w='100%' h='100%' transition='transform .3s ease' _hover={{ transform: 'scale(1.3)' }} />
                                </Box>
                            </Link>
                            <Link w={posterW} variant='plain' onClick={() => {onInteraction(item); navigate(`/description/${item.id}`)}}>
                                <Text _hover={{color: 'red'}} fontSize={titleFS}>{item.Title}</Text>
                            </Link>
                            <Text mt={-2} color='gray' fontSize={yearFS}>{item.Year}</Text>
                        </Stack>
                    ))}
                </SimpleGrid>
            }
            {userHistory &&
                <>
                    <Box mb={screenSize !== 'mobile' ? 4 : 2} mt={8}>
                        <Text fontSize={screenSize !== 'mobile' ? 38 : 24} fontWeight='bold'>You might also like:</Text>
                        <Separator borderColor='red' size='lg' />
                    </Box>
                    { loading ? 
                        <LoadingMovieList /> :
                        <SimpleGrid columns={Columns} gap={Gap}>
                            {remainingMovies.map((item, index)=>(
                                <Stack key={index}>
                                    <Link onClick={() => {onInteraction(item); navigate(`/description/${item.id}`)}}>
                                        <Box w={posterW} h={posterH} overflow='hidden' borderRadius='3xl'>
                                            <Image src={item.Poster} w='100%' h='100%' transition='transform .3s ease' _hover={{ transform: 'scale(1.3)' }} />
                                        </Box>
                                    </Link>
                                    <Link w={posterW} variant='plain' onClick={() => {onInteraction(item); navigate(`/description/${item.id}`)}}>
                                        <Text _hover={{color: 'red'}} fontSize={titleFS}>{item.Title}</Text>
                                    </Link>
                                    <Text mt={-2} color='gray' fontSize={yearFS}>{item.Year}</Text>
                                </Stack>
                            ))}
                        </SimpleGrid>
                    }
                </>
            }
        </VStack>
    )
}

export default MovieList;