import React, { useState, useEffect } from 'react';
import { RSCodecWrapper } from '../codec';
import { 
  Heading, 
  Text, 
  Flex, 
  Box, 
  Card, 
  Button, 
  TextArea, 
  TextField, 
  Grid,
  Separator,
  Switch,
  ScrollArea,
  Tabs
} from '@radix-ui/themes';
import { FileTextIcon, DownloadIcon, GearIcon, CheckCircledIcon, CrossCircledIcon, CopyIcon, TrashIcon } from '@radix-ui/react-icons';

export const EncodePage = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [errorRate, setErrorRate] = useState(0.2);
  const [blockSize, setBlockSize] = useState(200);
  const [status, setStatus] = useState<{msg: string, type: 'info' | 'success' | 'error'}>({ msg: '', type: 'info' });
  
  // Auto-save state
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAutoSave = localStorage.getItem('rs-codec-encode-autosave-enabled');
    if (savedAutoSave === 'true') {
      setAutoSave(true);
      const savedData = localStorage.getItem('rs-codec-encode-data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.inputText) setInputText(parsed.inputText);
          if (parsed.errorRate) setErrorRate(parsed.errorRate);
          if (parsed.blockSize) setBlockSize(parsed.blockSize);
          setStatus({ msg: '已恢复上次保存的编码内容', type: 'info' });
        } catch (e) {
          console.error('Failed to parse saved data', e);
        }
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('rs-codec-encode-autosave-enabled', autoSave.toString());
    
    if (autoSave) {
      const dataToSave = {
        inputText,
        errorRate,
        blockSize,
        timestamp: Date.now()
      };
      localStorage.setItem('rs-codec-encode-data', JSON.stringify(dataToSave));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [autoSave, inputText, errorRate, blockSize]);

  const clearHistory = () => {
    if (window.confirm('确定要清空所有已保存的编码历史记录吗？')) {
      localStorage.removeItem('rs-codec-encode-data');
      setInputText('');
      setOutputText('');
      setStatus({ msg: '编码历史记录已清空', type: 'success' });
    }
  };

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    setStatus({ msg: `已加载文件: ${file.name} (${bytes.length} 字节)`, type: 'info' });
    try {
      const codec = new RSCodecWrapper(errorRate, blockSize);
      const chunks = codec.encode(bytes);
      const header = `#RS:${errorRate}:${blockSize}`;
      setOutputText([header, ...chunks].join('\n'));
      setStatus({ msg: `编码成功。生成了 ${chunks.length} 个块。`, type: 'success' });
    } catch (err: any) {
      setStatus({ msg: `错误: ${err.message}`, type: 'error' });
    }
  };

  const handleEncode = () => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(inputText);
      const codec = new RSCodecWrapper(errorRate, blockSize);
      const chunks = codec.encode(data);
      const header = `#RS:${errorRate}:${blockSize}`;
      setOutputText([header, ...chunks].join('\n'));
      setStatus({ msg: '文本编码成功。', type: 'success' });
    } catch (err: any) {
      setStatus({ msg: `错误: ${err.message}`, type: 'error' });
    }
  };

  const downloadOutput = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encoded.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format helper for print view
  const getFormattedBlocks = () => {
    if (!outputText) return [];
    const lines = outputText.split('\n').filter(l => l.trim() && !l.startsWith('#RS:'));
    
    return lines.map((block, idx) => {
      const clean = block.trim();
      const groups = [];
      for (let i = 0; i < clean.length; i += 5) {
        groups.push(clean.slice(i, i + 5));
      }
      const lines = [];
      for (let i = 0; i < groups.length; i += 4) {
        lines.push(groups.slice(i, i + 4).join('-'));
      }
      return { id: idx, content: lines };
    });
  };

  const copyFormatted = () => {
      const blocks = getFormattedBlocks();
      const content = blocks.map(b => `Block #${b.id}\n${b.content.join('\n')}`).join('\n\n');
      navigator.clipboard.writeText(content).then(() => {
          setStatus({ msg: '格式化块已复制到剪贴板！', type: 'success' });
      }).catch(() => {
          setStatus({ msg: '复制失败', type: 'error' });
      });
  };

  const downloadFormatted = () => {
      const blocks = getFormattedBlocks();
      const content = blocks.map(b => `Block #${b.id}\n${b.content.join('\n')}`).join('\n\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatted_blocks.txt';
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <Box pt="4">
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        
        {/* Left Column: Input & Controls */}
        <Flex direction="column" gap="4">
          <Box>
            <Heading size="3" mb="2" color="gray">设置 (Settings)</Heading>
            <Flex gap="3">
              <Box flexGrow="1">
                <Text as="div" size="2" mb="1" weight="bold">容错率 (Error Rate)</Text>
                <TextField.Root 
                  type="number" 
                  value={errorRate} 
                  onChange={e => setErrorRate(parseFloat(e.target.value))}
                  placeholder="0.2"
                >
                  <TextField.Slot><GearIcon /></TextField.Slot>
                </TextField.Root>
              </Box>
              <Box flexGrow="1">
                <Text as="div" size="2" mb="1" weight="bold">块大小 (Block Size)</Text>
                <TextField.Root 
                  type="number" 
                  value={blockSize} 
                  onChange={e => setBlockSize(parseInt(e.target.value))}
                  placeholder="200"
                />
              </Box>
            </Flex>

            <Separator size="4" my="3" />
            
            <Flex justify="between" align="center">
                <Flex gap="2" align="center">
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    <Flex direction="column" gap="0">
                        <Text size="2" weight="bold">自动保存 (Auto Save)</Text>
                        {autoSave && lastSaved && (
                            <Text size="1" color="green" style={{ opacity: 0.7 }}>
                                已保存于 {lastSaved}
                            </Text>
                        )}
                    </Flex>
                </Flex>
                <Button size="1" color="red" variant="soft" onClick={clearHistory}>
                    <TrashIcon /> 清空历史
                </Button>
            </Flex>
          </Box>

          <Separator size="4" />

          <Box>
            <Flex justify="between" align="center" mb="2">
              <Heading size="3" color="gray">输入 (Input)</Heading>
            </Flex>
            
            <Flex direction="column" gap="3">
              <label style={{ cursor: 'pointer' }}>
                <Button variant="outline" style={{ width: '100%', cursor: 'pointer' }} asChild>
                  <span>
                    <FileTextIcon /> 
                    选择文件进行编码
                    <input 
                      type="file" 
                      onChange={handleFileRead} 
                      style={{ display: 'none' }} 
                    />
                  </span>
                </Button>
              </label>
              
              <Text size="1" color="gray" align="center">- 或 -</Text>

              <TextArea 
                 placeholder="在此输入或粘贴文本..."
                 value={inputText}
                 onChange={e => setInputText(e.target.value)}
                 style={{ height: '400px', fontFamily: 'var(--code-font)' }}
               />
              
              <Button onClick={handleEncode} size="3" variant="solid" highContrast>
                 执行编码 (Run Encode)
              </Button>
            </Flex>
          </Box>
        </Flex>

        {/* Right Column: Output */}
        <Flex direction="column" gap="4">
          <Box>
            <Flex justify="between" align="center" mb="2">
              <Heading size="3" color="gray">输出 (Output)</Heading>
              {outputText && (
                <Flex gap="2">
                  <Button size="1" variant="ghost" onClick={downloadOutput}>
                    <DownloadIcon /> 下载
                  </Button>
                </Flex>
              )}
            </Flex>

            <Tabs.Root defaultValue="raw">
              <Tabs.List size="1">
                <Tabs.Trigger value="raw">原始输出</Tabs.Trigger>
                <Tabs.Trigger value="formatted">格式化块</Tabs.Trigger>
              </Tabs.List>
              
              <Box pt="2">
                <Tabs.Content value="raw">
                  <TextArea 
                    readOnly 
                    value={outputText}
                    placeholder="处理结果将显示在这里..."
                    style={{ height: '400px', fontFamily: 'var(--code-font)', backgroundColor: 'var(--gray-3)' }}
                  />
                </Tabs.Content>
                
                <Tabs.Content value="formatted">
                   <Box mb="2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button size="1" variant="soft" onClick={copyFormatted}>
                        <CopyIcon /> 复制
                      </Button>
                      <Button size="1" variant="soft" onClick={downloadFormatted}>
                        <DownloadIcon /> 下载 .txt
                      </Button>
                   </Box>
                   <ScrollArea type="always" scrollbars="vertical" style={{ height: '360px', backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-2)' }}>
                      <Box p="3">
                        {getFormattedBlocks().map((block) => (
                          <Card key={block.id} mb="3" size="1">
                            <Text size="1" color="gray" mb="1" weight="bold">Block #{block.id}</Text>
                            <Box style={{ fontFamily: 'var(--code-font)', fontSize: '12px', lineHeight: '1.5' }}>
                              {block.content.map((line, i) => (
                                <div key={i}>{line}</div>
                              ))}
                            </Box>
                          </Card>
                        ))}
                        {getFormattedBlocks().length === 0 && (
                          <Text color="gray" size="2" align="center">无格式化输出</Text>
                        )}
                      </Box>
                   </ScrollArea>
                </Tabs.Content>
              </Box>
            </Tabs.Root>

          </Box>
          
          {status.msg && (
            <Card style={{ 
              backgroundColor: status.type === 'error' ? 'var(--red-3)' : 
                             status.type === 'success' ? 'var(--green-3)' : 'var(--blue-3)' 
            }}>
              <Flex gap="2" align="center">
                {status.type === 'success' && <CheckCircledIcon color="green" />}
                {status.type === 'error' && <CrossCircledIcon color="red" />}
                <Text size="2" color={status.type === 'error' ? 'red' : 'gray'}>
                  {status.msg}
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>

      </Grid>
    </Box>
  );
};
