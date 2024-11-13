import React from 'react';
import { Box, Separator, SimpleGrid, Stack, HStack, Text } from '@chakra-ui/react';
import { Skeleton } from './ui/skeleton';
import { useScreenSize } from '../hooks/useScreenSize';

const LoadingMovieDesc = () => {

    const screenSize = useScreenSize();

    const pageSize = screenSize === 'extraLarge' ? '1000px' : screenSize === 'large' ? '800px' : screenSize === 'medium' ? '500px' : '95%';
    const posterW = screenSize === 'extraLarge' ? '324px' : screenSize === 'large' ? '216px' : screenSize === 'medium' ? '216px' : '144px';
    const posterH = screenSize === 'extraLarge' ? '480px' : screenSize === 'large' ? '320px' : screenSize === 'medium' ? '320px' : '213.3px';
    const titleH = screenSize === 'extraLarge' ? '50px' : screenSize === 'large' ? '50px' : screenSize === 'medium' ? '40px' : '30px';
    const synopsisH = screenSize === 'extraLarge' ? '200px' : screenSize === 'large' ? '200px' : screenSize === 'medium' ? '200px' : '100px';
    const marginY = screenSize === 'extraLarge' ? 2 : screenSize === 'large' ? 1 : screenSize === 'medium' ? 1 : 'unset';
    const tagSizeW = screenSize === 'extraLarge' ? '60px' : screenSize === 'large' ? '60px' : screenSize === 'medium' ? '50px' : '40px';
    const tagSizeH = screenSize === 'extraLarge' ? '25px' : screenSize === 'large' ? '25px' : screenSize === 'medium' ? '20px' : '15px';
    const reviewsFS = screenSize === 'extraLarge' ? 24 : screenSize === 'large' ? 22 : screenSize === 'medium' ? 22 : 18;

    return (
        <Box w={pageSize}>
            <SimpleGrid columns={2} gap={0} mb={(screenSize !== 'extraLarge' && screenSize !== 'large') && 5}>
                <Box display='flex' justifyContent='center' alignItems='flex-start'>
                    <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                </Box>
                <Box display='flex' alignItems='flex-start' justifyContent='flex-start'>
                    <Stack w='95%'>
                        <Skeleton w='100%' h={titleH} />
                        <Skeleton my={marginY} w='100%' h={synopsisH} />
                        <Box display='flex' alignItems='center' flexWrap='wrap' my={2}>
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                        </Box>
                        {(screenSize !== 'medium' && screenSize !== 'small' && screenSize !== 'mobile') && 
                            <>
                                <Separator />
                                <Box display='flex' alignItems='center' flexWrap='wrap' my={2}>
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                                </Box>
                                <Separator />
                                <Box display='flex' alignItems='center' flexWrap='wrap' my={2}>
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                                    <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
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
                        <Box Box display='flex' alignItems='center' flexWrap='wrap'>
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                        </Box>
                        <Separator />
                        <Box Box display='flex' alignItems='center' flexWrap='wrap'>
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                            <Skeleton w={tagSizeW} h={tagSizeH} m={1} />
                        </Box>
                    </Stack>
                </Box>
            }
            <Separator mt={10} />
            <HStack display='flex' alignItems='center' justifyContent='flex-start' mt={2} mb={5}>
                <Separator orientation='vertical' height='8' borderColor='red' size='lg' />
                <Text fontSize={reviewsFS} fontWeight='bold'>Reviews</Text>
            </HStack>
            <Skeleton w='100%' h='80px' />
            <Separator my={4} />
            <Skeleton w='100%' h='80px' />
            <Separator my={4} />
            <Skeleton w='100%' h='80px' />
            <Separator my={4} />
        </Box>
    )
}

export default LoadingMovieDesc;