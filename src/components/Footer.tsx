import React from 'react';
import { Flex, Text, Link, Separator, Container, Box } from '@radix-ui/themes';
import { GitHubLogoIcon } from '@radix-ui/react-icons';

export const Footer: React.FC = () => {
    return (
        <Box style={{ backgroundColor: 'var(--gray-2)', marginTop: 'auto', padding: '32px 0' }}>
            <Container size="3" px="4">
                <Flex direction="column" gap="4" align="center">
                    <Separator size="4" />
                    <Flex justify="between" align="center" width="100%" wrap="wrap" gap="4">
                        <Flex direction="column" gap="2">
                            <Text size="3" weight="bold">RS 编解码工具</Text>
                            <Text size="2" color="gray">
                                利用里德-所罗门 (Reed-Solomon) 编解进行自动纠错，适用于人工录入信息。
                            </Text>
                        </Flex>
                        
                        <Flex gap="5" align="center">
                             <Link href="https://github.com/DreamReflex" target="_blank" rel="noopener noreferrer" color="gray" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <GitHubLogoIcon width="18" height="18" /> GitHub
                            </Link>
                            <Text size="2" color="gray">© {new Date().getFullYear()} DreamReflex</Text>
                        </Flex>
                    </Flex>
                </Flex>
            </Container>
        </Box>
    );
};


