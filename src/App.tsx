import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Heading, 
  Text, 
  Flex, 
  Box, 
  Card, 
  Tabs
} from '@radix-ui/themes';
import { Footer } from './components/Footer';
import { EncodePage } from './pages/EncodePage';
import { DecodePage } from './pages/DecodePage';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current tab value based on path
  const currentTab = location.pathname.startsWith('/decode') ? 'decode' : 'encode';

  return (
    <Box style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
    <Container size="3" p="4" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <Flex direction="column" gap="5">
        <Box py="6">
          <Heading size="8" align="center" mb="2" style={{ fontWeight: 500, letterSpacing: '-0.02em', background: 'linear-gradient(to right, var(--accent-9), var(--accent-11))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            自纠错信息编解码工具
          </Heading>
          <Text as="p" align="center" color="gray" size="4" style={{ maxWidth: '600px', margin: '0 auto' }}>
            利用里德-所罗门 (Reed-Solomon) 纠错编码实现的解码实用工具
          </Text>
        </Box>

        <Card size="4" style={{ backgroundColor: 'var(--gray-2)', boxShadow: 'var(--shadow-4)' }}>
          <Tabs.Root value={currentTab} onValueChange={(val) => navigate(val === 'encode' ? '/encode' : '/decode')}>
            <Tabs.List size="2">
              <Tabs.Trigger value="encode">编码 (Encode)</Tabs.Trigger>
              <Tabs.Trigger value="decode">解码 (Decode)</Tabs.Trigger>
            </Tabs.List>

            <Box>
              <Routes>
                <Route path="/encode" element={<EncodePage />} />
                <Route path="/decode" element={<DecodePage />} />
                <Route path="*" element={<Navigate to="/encode" replace />} />
              </Routes>
            </Box>
          </Tabs.Root>
        </Card>
      </Flex>
    </Container>
    <Footer />
    </Box>
  );
}

export default App;
