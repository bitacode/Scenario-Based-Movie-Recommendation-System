import React from 'react';
import { Box, VStack, SimpleGrid } from '@chakra-ui/react';
import { Skeleton } from './ui/skeleton';
import { useScreenSize } from '../hooks/useScreenSize';

const Loading = () => {
    const screenSize = useScreenSize();

    const Columns = screenSize === 'extraLarge' ? 3 : screenSize === 'large' ? 3 : screenSize === 'medium' ? 2 : screenSize === 'small' ? 2 : 1;
    const Gap = screenSize === 'extraLarge' ? 6 : 'large' ? 4 : screenSize === 'medium' ? 3 : 0;
    const posterW = screenSize === 'extraLarge' ? '324px' : screenSize === 'large' ? '216px' : screenSize === 'medium' ? '216px' : '144px';
    const posterH = screenSize === 'extraLarge' ? '480px' : screenSize === 'large' ? '320px' : screenSize === 'medium' ? '320px' : '213.3px' ;

    return (
        <VStack w='100%' display='flex' alignItems='center' justifyContent='center' overflow='hidden'>
            <Box mb={4} />
            <SimpleGrid columns={Columns} gap={Gap}>
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
                <Skeleton w={posterW} h={posterH} borderRadius='3xl' />
            </SimpleGrid>
        </VStack>
    )
}

export default Loading;