import React, { useEffect, useState } from 'react';
import { Box, Image, SimpleGrid, Text, VStack, Stack, Separator, Link, HStack, Badge } from '@chakra-ui/react';
import { Tag } from './ui/tag';
import { useParams } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useScreenSize } from '../hooks/useScreenSize';
import axios from 'axios';
import Movies from '../assets/movies.json';
import LoadingMovieDesc from './LoadingMovieDesc';

const Description = () => {
    const { id } = useParams();
    const movie = Movies[parseInt(id)]
    const genres = Array.isArray(movie.Genres) ? movie.Genres : movie.Genres.split(', ');
    const writers = Array.isArray(movie.Writers) ? movie.Writers : movie.Writers.split(', ');
    const casts = Array.isArray(movie.Cast) ? movie.Cast : movie.Cast.split(', ');

    const [classifiedReviews, setClassifiedReviews] = useState(null);
    const [loading, setLoading] = useState(true);

    const theme = useTheme();
    const screenSize = useScreenSize();

    const posterW = screenSize === 'extraLarge' ? '324px' : screenSize === 'large' ? '216px' : screenSize === 'medium' ? '216px' : '144px';
    const posterH = screenSize === 'extraLarge' ? '480px' : screenSize === 'large' ? '320px' : screenSize === 'medium' ? '320px' : '213.3px';
    const titleFS = screenSize === 'extraLarge' ? 32 : screenSize === 'large' ? 24 : screenSize === 'medium' ? 24 : 20;
    const yearFS = screenSize === 'extraLarge' ? 16 : screenSize === 'large' ? 14 : screenSize === 'medium' ? 14 : 12;
    const marginT = screenSize === 'extraLarge' ? -1 : screenSize === 'large' ? -1.5 : screenSize === 'medium' ? -1.5 : -1.5;
    const marginY = screenSize === 'extraLarge' ? 2 : screenSize === 'large' ? 1 : screenSize === 'medium' ? 1 : 'unset';
    const pageSize = screenSize === 'extraLarge' ? '1000px' : screenSize === 'large' ? '800px' : screenSize === 'medium' ? '500px' : '95%';
    const tagSize = screenSize === 'extraLarge' ? 'lg' : screenSize === 'large' ? 'lg' : screenSize === 'medium' ? 'md' : 'sm';
    const reviewsFS = screenSize === 'extraLarge' ? 24 : screenSize === 'large' ? 22 : screenSize === 'medium' ? 22 : 18;
    const small = screenSize !== 'extraLarge' && screenSize !== 'large' && screenSize !== 'medium';

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);

            try {
                // Open cache and try to get cached data
                const cache = await caches.open('review-cache');
                const cachedResponse = await cache.match(`/classify_reviews?id=${id}`);
                
                if (cachedResponse) {
                    const data = await cachedResponse.json();
                    setClassifiedReviews(data.classified_reviews);
                    setLoading(false);
                    return; // Exit if data is retrieved from cache
                }

                // If no cached data, make an API request
                const response = await axios.post('http://localhost:5000/classify_reviews', { id });
                if (response.data.status === 'success') {
                    // Store response in Cache Storage
                    cache.put(
                        `/classify_reviews?id=${id}`, 
                        new Response(JSON.stringify(response.data), { headers: { 'Content-Type': 'application/json' } })
                    );
                    setClassifiedReviews(response.data.classified_reviews);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchReviews();
    }, [id]);


    return (
        <VStack my={small ? '55px' : 8} w='100%' display='flex' alignItems='center' justifyContent='center' overflow='hidden'>
            {loading ? 
                <LoadingMovieDesc /> :
                <Box w={pageSize}>
                    <SimpleGrid columns={2} gap={0} mb={(screenSize !== 'extraLarge' && screenSize !== 'large') && 5}>
                        <Box display='flex' justifyContent='center' alignItems='flex-start' >
                            <Image src={movie.Poster} w={posterW} h={posterH} borderRadius='3xl' />
                        </Box>
                        <Box display='flex' alignItems='flex-start' justifyContent='flex-start'>
                            <Stack w='95%'>
                                <Text fontSize={titleFS} fontWeight='bold' lineHeight='1.2'>{movie.Title}</Text>
                                <Text fontSize={yearFS} mt={marginT} color='gray' display='flex' flexWrap='wrap'>
                                    <Text >{movie.Year}&nbsp;⋅&nbsp;directed by&nbsp;</Text>
                                    <Link variant='plain' color='gray'>
                                        <Text _hover={{ color: 'red' }}>{!(movie.Director.length === 1 && movie.Director[0] === 'None') ? movie.Director.join(', ') : ""}</Text>
                                    </Link>
                                </Text>
                                <Text my={marginY} textAlign='justify' fontSize={yearFS}>{movie.Synopsis}</Text>
                                <Box display='flex' alignItems='center' flexWrap='wrap' my={2}>
                                {genres.map((genre, index) => (
                                    <Tag key={index} size={tagSize} _hover={{ bg: 'red', color: theme === 'light' ? 'white' : 'white' }} textTransform='capitalize' m={1}>{genre}</Tag>
                                ))}
                                </Box>
                                {(screenSize !== 'medium' && screenSize !== 'small' && screenSize !== 'mobile') && 
                                    <>
                                        {!(movie.Writers.length === 1 && movie.Writers[0] === 'None') && 
                                            <>
                                                <Separator />
                                                <Box display='flex' alignItems='center' justifyContent='flex-start' flexWrap='wrap' >
                                                    <Text fontWeight='bold' fontSize={yearFS}>Writer&nbsp;&nbsp;&nbsp;</Text>
                                                    {writers.slice(0, 5).map((writer, index) => (
                                                        <Tag key={index} size={tagSize} _hover={{ bg: 'red', color: theme === 'light' ? 'white' : 'white' }} textTransform='capitalize' m={1}>{writer}</Tag>
                                                    ))}
                                                </Box>
                                            </>
                                        }
                                        <Separator />
                                        <Box display='flex' alignItems='center' flexWrap='wrap'>
                                            <Text fontWeight='bold' fontSize={yearFS}>Cast&nbsp;&nbsp;&nbsp;</Text>
                                            {casts.slice(0, 5).map((cast, index) => (
                                                <Tag key={index} size={tagSize} _hover={{ bg: 'red', color: theme === 'light' ? 'white' : 'white' }} textTransform='capitalize' m={1}>{cast}</Tag>
                                            ))}
                                        </Box>
                                        <Separator />
                                    </>
                                }
                            </Stack>
                        </Box>
                    </SimpleGrid>
                    {(screenSize !== 'extraLarge' && screenSize !== 'large') &&
                        <Box display='flex' alignItems='center' justifyContent='center'>
                            <Stack w='90%'>
                                {!(movie.Writers.length === 1 && movie.Writers[0] === 'None') && 
                                    <>
                                        <Box display='flex' alignItems='center' justifyContent='flex-start' flexWrap='wrap'>
                                            <Text fontWeight='bold' fontSize={yearFS}>Writer&nbsp;&nbsp;&nbsp;</Text>
                                            {writers.slice(0, 5).map((writer, index) => (
                                                <Tag key={index} size={tagSize} _hover={{ bg: 'red', color: theme === 'light' ? 'white' : 'white' }} textTransform='capitalize' m={1}>{writer}</Tag>
                                            ))}
                                        </Box>
                                    </>
                                }
                                <Separator />
                                <Box display='flex' alignItems='center' flexWrap='wrap'>
                                    <Text fontWeight='bold' fontSize={yearFS}>Cast&nbsp;&nbsp;&nbsp;</Text>
                                        {casts.slice(0, 5).map((cast, index) => (
                                            <Tag key={index} size={tagSize} _hover={{ bg: 'red', color: theme === 'light' ? 'white' : 'white' }} textTransform='capitalize' m={1}>{cast}</Tag>
                                        ))}
                                    </Box>
                            </Stack>
                        </Box>
                    }
                    
                    <Separator mt={10} />
                    <HStack display='flex' alignItems='center' justifyContent='flex-start' mt={2} mb={5}>
                        <Separator orientation='vertical' height='8' borderColor='red' size='lg' />
                        <Text fontSize={reviewsFS} fontWeight='bold'>Reviews</Text>
                    </HStack>
                    { classifiedReviews && classifiedReviews.Reviews ? (
                        classifiedReviews.Reviews.map((review, index) => (
                            <Box key={index}>
                                <Box display='flex' flexWrap='wrap' alignItems='center' justifyContent='flex-start'>
                                    <Text color='gray' fontSize={yearFS}>Review by&nbsp;</Text>
                                    <Text fontWeight='bold' fontSize={yearFS}>
                                        {review.Username}&nbsp;
                                    </Text>
                                    <Badge colorPalette={review.Sentiment === 'Positive' ? 'green' : review.Sentiment === 'Negative' ? 'red' : 'yellow'}>
                                        {review.Sentiment}
                                    </Badge>
                                </Box>
                                <Text fontSize={yearFS}>{review.Review}</Text>
                                <Separator my={4} />
                            </Box>
                        ))) : <Text>No reviews</Text>
                    }
                </Box>
            }
        </VStack>
    )
}

export default Description;