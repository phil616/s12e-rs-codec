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
import { FileTextIcon, DownloadIcon, GearIcon, CheckCircledIcon, CrossCircledIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { BlockInput } from '../components/BlockInput';

export const DecodePage = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);
  const [errorRate, setErrorRate] = useState(0.2);
  const [blockSize, setBlockSize] = useState(200);
  const [status, setStatus] = useState<{msg: string, type: 'info' | 'success' | 'error'}>({ msg: '', type: 'info' });

  // Input mode state
  const [inputMode, setInputMode] = useState<'text' | 'blocks'>('text');
  const [blockInputs, setBlockInputs] = useState<{id: string, value: string}[]>([{id: '0', value: ''}]);

  // Auto-save state
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Helper for unique IDs
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAutoSave = localStorage.getItem('rs-codec-decode-autosave-enabled');
    if (savedAutoSave === 'true') {
      setAutoSave(true);
      const savedData = localStorage.getItem('rs-codec-decode-data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.inputText) setInputText(parsed.inputText);
          if (parsed.inputMode) setInputMode(parsed.inputMode);
          if (parsed.errorRate) setErrorRate(parsed.errorRate);
          if (parsed.blockSize) setBlockSize(parsed.blockSize);
          if (parsed.blockInputs) setBlockInputs(parsed.blockInputs);
          setStatus({ msg: '已恢复上次保存的解码内容', type: 'info' });
        } catch (e) {
          console.error('Failed to parse saved data', e);
        }
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('rs-codec-decode-autosave-enabled', autoSave.toString());
    
    if (autoSave) {
      const dataToSave = {
        inputText,
        inputMode,
        errorRate,
        blockSize,
        blockInputs,
        timestamp: Date.now()
      };
      localStorage.setItem('rs-codec-decode-data', JSON.stringify(dataToSave));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [autoSave, inputText, inputMode, errorRate, blockSize, blockInputs]);

  const clearHistory = () => {
    if (window.confirm('确定要清空所有已保存的解码历史记录吗？')) {
      localStorage.removeItem('rs-codec-decode-data');
      setInputText('');
      setBlockInputs([{id: generateId(), value: ''}]);
      setOutputText('');
      setDecodedBytes(null);
      setStatus({ msg: '解码历史记录已清空', type: 'success' });
    }
  };

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setInputText(text);
    setStatus({ msg: '文件已加载。准备解码。', type: 'info' });
  };

  const handleAddBlock = () => {
      setBlockInputs(prev => [...prev, { id: generateId(), value: '' }]);
  };

  const handleRemoveBlock = (index: number) => {
      setBlockInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleBlockChange = (index: number, value: string) => {
      setBlockInputs(prev => {
          const newBlocks = [...prev];
          newBlocks[index].value = value;
          return newBlocks;
      });
  };

  const handleDecode = () => {
    try {
      let lines: string[] = [];
      let eRate = 0.2;
      let bSize = 200;
      let startIdx = 0;

      if (inputMode === 'blocks') {
          // Block Builder Mode
          lines = blockInputs
            .map(b => b.value.replace(/[- \t\r\n]/g, '').trim())
            .filter(v => v.length > 0);
          
          if (lines.length === 0) {
              setStatus({ msg: '没有可解码的块内容。', type: 'error' });
              return;
          }

          // Use current slider/input settings for blocks, unless user provides header in first block
          eRate = errorRate;
          bSize = blockSize;

      } else {
          // Text Mode
          let rawInput = inputText;
          
          if (/Block #\d+/.test(rawInput)) {
              // Formatted input logic
              const parts = rawInput.split(/Block #\d+/);
              lines = parts
                  .map(p => p.replace(/[- \t\r\n]/g, ''))
                  .filter(p => p.length > 0);
          } else {
              // Raw input logic
              rawInput = rawInput.replace(/-/g, '');
              rawInput = rawInput.replace(/[ \t]/g, ''); 
              lines = rawInput.split('\n').map(l => l.trim()).filter(l => l);
          }
      }

      if (lines.length === 0) return;

      if (lines[0].startsWith('#RS:')) {
        const parts = lines[0].split(':');
        eRate = parseFloat(parts[1]);
        bSize = parseInt(parts[2]);
        startIdx = 1;
        setStatus({ msg: `自动检测配置: 容错率=${eRate}, 块大小=${bSize}`, type: 'info' });
      }

      const codec = new RSCodecWrapper(eRate, bSize);
      const blocks = lines.slice(startIdx);
      const decodedBytes = codec.decode(blocks);
      setDecodedBytes(decodedBytes);
      
      const decoder = new TextDecoder();
      const decodedString = decoder.decode(decodedBytes);
      setOutputText(decodedString);
      setStatus({ msg: '解码成功。', type: 'success' });
    } catch (err: any) {
      setStatus({ msg: `解码错误: ${err.message}`, type: 'error' });
    }
  };

  const downloadOutput = () => {
    if (decodedBytes) {
      const blob = new Blob([decodedBytes as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decoded_output.bin';
      a.click();
      URL.revokeObjectURL(url);
    } else if (outputText) {
        // Fallback if user somehow wants to download text
        const blob = new Blob([outputText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'decoded.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
  };

  return (
    <Box pt="4">
      <Grid columns={{ initial: '1', md: '2' }} gap="4">
        
        {/* Left Column: Input & Controls */}
        <Flex direction="column" gap="4" style={{ gridColumn: inputMode === 'blocks' ? '1 / -1' : 'auto' }}>
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
              <Tabs.Root value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                <Tabs.List size="1">
                  <Tabs.Trigger value="text">文本 / 原始数据</Tabs.Trigger>
                  <Tabs.Trigger value="blocks">块构建器 (Block Builder)</Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>
            </Flex>
            
            <Flex direction="column" gap="3">
              <label style={{ cursor: 'pointer' }}>
                <Button variant="outline" style={{ width: '100%', cursor: 'pointer' }} asChild>
                  <span>
                    <FileTextIcon /> 
                    选择已编码文件
                    <input 
                      type="file" 
                      onChange={handleFileRead} 
                      accept=".txt"
                      style={{ display: 'none' }} 
                    />
                  </span>
                </Button>
              </label>
              
              <Text size="1" color="gray" align="center">- 或 -</Text>

              {inputMode === 'text' ? (
                   <TextArea 
                     placeholder="在此粘贴已编码的 #RS 块..."
                     value={inputText}
                     onChange={e => setInputText(e.target.value)}
                     style={{ height: '400px', fontFamily: 'var(--code-font)' }}
                   />
               ) : (
                   <Box>
                     <ScrollArea type="auto" scrollbars="vertical" style={{ height: '500px', backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-2)', padding: '16px' }}>
                       <Flex direction="column" gap="4">
                         {blockInputs.map((block, index) => (
                           <BlockInput
                             key={block.id}
                             id={block.id}
                             index={index}
                             initialValue={block.value}
                             onChange={(val) => handleBlockChange(index, val)}
                             onDelete={() => handleRemoveBlock(index)}
                           />
                         ))}
                       </Flex>
                     </ScrollArea>
                     <Button size="2" variant="soft" mt="3" onClick={handleAddBlock} style={{ width: '100%' }}>
                       <PlusIcon /> 添加新块 (Add New Block)
                     </Button>
                   </Box>
               )}
              
              <Button onClick={handleDecode} size="3" variant="solid" highContrast>
                 执行解码 (Run Decode)
              </Button>
            </Flex>
          </Box>
        </Flex>

        {/* Right Column: Output */}
        {inputMode !== 'blocks' && (
        <Flex direction="column" gap="4">
          <Box>
            <Flex justify="between" align="center" mb="2">
              <Heading size="3" color="gray">输出 (Output)</Heading>
              {outputText && (
                <Flex gap="2">
                  <Button size="1" variant="ghost" onClick={downloadOutput}>
                    <DownloadIcon /> 下载 (Download)
                  </Button>
                </Flex>
              )}
            </Flex>

            <Tabs.Root defaultValue="raw">
              <Tabs.List size="1">
                <Tabs.Trigger value="raw">原始输出</Tabs.Trigger>
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
        )}

      </Grid>

      {inputMode === 'blocks' && outputText && (
           <Box mt="4">
             <Separator size="4" mb="4" />
             <Flex justify="between" align="center" mb="2">
              <Heading size="3" color="gray">解码结果 (Decoding Result)</Heading>
              <Flex gap="2">
                <Button size="1" variant="ghost" onClick={downloadOutput}>
                  <DownloadIcon /> 下载 (Download)
                </Button>
              </Flex>
            </Flex>
            <TextArea 
                readOnly 
                value={outputText}
                placeholder="Processing result will appear here..."
                style={{ height: '200px', fontFamily: 'var(--code-font)', backgroundColor: 'var(--gray-3)' }}
            />
           </Box>
        )}
    </Box>
  );
};
