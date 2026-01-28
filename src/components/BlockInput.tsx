import React, { useState, useEffect } from 'react';
import { Card, Text, Flex, IconButton, Button, Separator } from '@radix-ui/themes';
import { TrashIcon, PlusIcon, CopyIcon } from '@radix-ui/react-icons';
import { BlockLine } from './BlockLine';

interface BlockInputProps {
    id: string;
    index: number;
    initialValue: string;
    onChange: (val: string) => void;
    onDelete: () => void;
}

export const BlockInput: React.FC<BlockInputProps> = ({ 
    index, 
    initialValue, 
    onChange, 
    onDelete 
}) => {
    // We maintain internal state of lines for granular editing
    // But we also need to sync with the parent's single string value
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        // Initialize lines from the single string value
        // Assuming the value comes in as a single string (possibly with newlines if previously formatted)
        // or just a raw string.
        
        // If it's a raw string, we chunk it into 20-char groups (4 * 5)
        const clean = initialValue.replace(/[^a-zA-Z0-9]/g, '');
        if (!clean) {
            setLines(['']);
            return;
        }

        const chunks = [];
        // Standard block width: 4 groups of 5 chars = 20 chars
        const rowLength = 20; 
        for (let i = 0; i < clean.length; i += rowLength) {
            const rowRaw = clean.slice(i, i + rowLength);
            // Re-format as groups
            const groups = [];
            for (let j = 0; j < rowRaw.length; j += 5) {
                groups.push(rowRaw.slice(j, j + 5));
            }
            chunks.push(groups.join('-'));
        }
        // Ensure at least one empty line if empty (handled above) or if we want an empty line at end?
        // Let's just stick to content.
        setLines(chunks);
    }, []); // Only on mount? 
    // Problem: if parent updates value (e.g. smart paste from parent), we need to update lines.
    // But if we update lines, we call onChange, which updates parent. Circular?
    // Let's assume this component owns the "editing" state, and parent only sets initial.
    // However, for the "Smart Paste" in App.tsx to work properly on a specific block, 
    // we might need to listen to props. But App.tsx logic was "replace value".
    // Let's depend on initialValue change ONLY if it's significantly different?
    // Or simpler: Just rely on local state and emit changes up.
    // But if we want to support "Reset" or external updates, we need `useEffect` on `initialValue`.
    
    // To avoid loops: Only update from props if props value != current joined value.
    useEffect(() => {
        const currentJoined = lines.map(l => l.replace(/-/g, '')).join('');
        const propClean = initialValue.replace(/[^a-zA-Z0-9]/g, '');
        if (currentJoined !== propClean) {
            // Re-parse
            const clean = propClean;
            if (!clean) {
                setLines(['']);
                return;
            }
            const chunks = [];
            const rowLength = 20; 
            for (let i = 0; i < clean.length; i += rowLength) {
                const rowRaw = clean.slice(i, i + rowLength);
                const groups = [];
                for (let j = 0; j < rowRaw.length; j += 5) {
                    groups.push(rowRaw.slice(j, j + 5));
                }
                chunks.push(groups.join('-'));
            }
            setLines(chunks);
        }
    }, [initialValue]);

    const emitChange = (newLines: string[]) => {
        const joined = newLines.map(l => l.replace(/-/g, '')).join('');
        onChange(joined);
    };

    const handleLineChange = (lineIdx: number, val: string) => {
        const newLines = [...lines];
        newLines[lineIdx] = val;
        setLines(newLines);
        emitChange(newLines);
    };

    const handleLineDelete = (lineIdx: number) => {
        if (lines.length <= 1) {
            // If only one line, just clear it
            handleLineChange(lineIdx, '');
            return;
        }
        const newLines = lines.filter((_, i) => i !== lineIdx);
        setLines(newLines);
        emitChange(newLines);
    };

    const handleLineEnter = (lineIdx: number) => {
        const newLines = [...lines];
        newLines.splice(lineIdx + 1, 0, '');
        setLines(newLines);
        emitChange(newLines);
        // Focus management would be nice here (auto focus next)
        // We can pass a `focusIndex` state but it gets complicated.
        // For now, rely on user clicking or Tab.
    };

    const handleLinePaste = (lineIdx: number, text: string) => {
        // Handle bulk paste at a specific line
        // Clean and chunk the pasted text
        const clean = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const rowLength = 20;
        const chunks = [];
        for (let i = 0; i < clean.length; i += rowLength) {
            const rowRaw = clean.slice(i, i + rowLength);
            const groups = [];
            for (let j = 0; j < rowRaw.length; j += 5) {
                groups.push(rowRaw.slice(j, j + 5));
            }
            chunks.push(groups.join('-'));
        }

        const newLines = [...lines];
        // Replace current line with first chunk
        newLines[lineIdx] = chunks[0];
        // Insert rest
        newLines.splice(lineIdx + 1, 0, ...chunks.slice(1));
        
        setLines(newLines);
        emitChange(newLines);
    };

    return (
        <Card size="2" style={{ marginBottom: '16px', borderLeft: '4px solid var(--accent-9)', width: '100%' }}>
            <Flex justify="between" align="center" mb="2">
                <Text size="2" weight="bold" color="gray">块 #{index}</Text>
                <Flex gap="2">
                    <IconButton size="1" variant="ghost" color="gray" onClick={() => navigator.clipboard.writeText(initialValue)}>
                        <CopyIcon />
                    </IconButton>
                    <IconButton size="1" variant="ghost" color="red" onClick={onDelete}>
                        <TrashIcon />
                    </IconButton>
                </Flex>
            </Flex>
            <Separator size="4" mb="2" />
            <Flex direction="column" gap="2">
                {lines.map((line, idx) => (
                    <BlockLine 
                        key={`${index}-${idx}`} // Not ideal key but okay for simple list
                        index={idx}
                        value={line}
                        onChange={(val) => handleLineChange(idx, val)}
                        onDelete={() => handleLineDelete(idx)}
                        onEnter={() => handleLineEnter(idx)}
                        onPaste={(text) => handleLinePaste(idx, text)}
                    />
                ))}
                <Button variant="ghost" size="1" onClick={() => handleLineEnter(lines.length - 1)}>
                    <PlusIcon /> 添加行 (Add Line)
                </Button>
            </Flex>
        </Card>
    );
};
