import React, { useEffect, useRef } from 'react';
import { Flex, TextField, IconButton, Box } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';

interface BlockLineProps {
    index: number;
    value: string;
    onChange: (val: string) => void;
    onDelete: () => void;
    onEnter?: () => void;
    onPaste?: (text: string) => void;
    autoFocus?: boolean;
}

export const BlockLine: React.FC<BlockLineProps> = ({ 
    index, 
    value, 
    onChange, 
    onDelete, 
    onEnter,
    onPaste,
    autoFocus 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const formatValue = (val: string) => {
        // Remove non-alphanumeric
        const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        // Group by 5
        const groups = [];
        for (let i = 0; i < clean.length; i += 5) {
            groups.push(clean.slice(i, i + 5));
        }
        return groups.join('-');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const formatted = formatValue(raw);
        onChange(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
        }
        if (e.key === 'Backspace' && value === '' && onDelete) {
            e.preventDefault();
            onDelete();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        // If text contains newlines or is very long, treat as bulk paste
        if (text.includes('\n') || text.length > 20) {
            e.preventDefault();
            if (onPaste) onPaste(text);
        }
        // Otherwise let default behavior happen (and be formatted by handleChange)
    };

    return (
        <Flex gap="2" align="center" style={{ width: '100%' }}>
            <Box style={{ width: '20px', color: 'var(--gray-8)', fontSize: '10px', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
                {index + 1}
            </Box>
            <TextField.Root 
                ref={inputRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="AAAAA-BBBBB-CCCCC-DDDDD"
                style={{ fontFamily: 'var(--code-font)', flexGrow: 1, width: '100%' }}
            >
            </TextField.Root>
            <IconButton 
                size="1" 
                variant="ghost" 
                color="gray" 
                onClick={onDelete}
                tabIndex={-1}
                style={{ flexShrink: 0 }}
            >
                <Cross2Icon />
            </IconButton>
        </Flex>
    );
};
