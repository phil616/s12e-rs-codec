import * as base32 from 'hi-base32';
// @ts-ignore
import * as rsModule from 'reedsolomon';

// @ts-ignore
const rs = rsModule.default || rsModule;

export class RSCodecWrapper {
    private encoder: any;
    private decoder: any;
    private nsym: number;
    private dataSize: number;
    private blockSize: number;

    constructor(errorRate: number = 0.2, blockSize: number = 200) {
        if (blockSize > 255) {
            throw new Error("Block size must be <= 255");
        }

        this.blockSize = blockSize;
        this.nsym = Math.ceil(2 * errorRate * blockSize);
        this.dataSize = blockSize - this.nsym;

        if (this.dataSize <= 0) {
            throw new Error(`Error rate ${errorRate} is too high for block size ${blockSize}`);
        }

        // Initialize GF(2^8) with primitive 0x11d and generator base 0
        const field = new rs.GenericGF(0x11D, 256, 0);
        this.encoder = new rs.ReedSolomonEncoder(field);
        this.decoder = new rs.ReedSolomonDecoder(field);
    }

    public encode(data: Uint8Array): string[] {
        const chunks: string[] = [];
        
        for (let i = 0; i < data.length; i += this.dataSize) {
            const chunkData = data.slice(i, i + this.dataSize);
            
            // Prepare buffer: data + ecc
            const currentBlockSize = chunkData.length + this.nsym;
            const bufferForChunk = new Int32Array(currentBlockSize);
            for (let j = 0; j < chunkData.length; j++) {
                bufferForChunk[j] = chunkData[j];
            }
            
            this.encoder.encode(bufferForChunk, this.nsym);
            
            // Convert to Uint8Array for base32
            const encodedBytes = new Uint8Array(currentBlockSize);
            for (let j = 0; j < currentBlockSize; j++) {
                encodedBytes[j] = bufferForChunk[j];
            }
            
            // Base32 encode
            // hi-base32 encode returns string
            const b32 = base32.encode(encodedBytes);
            chunks.push(b32);
        }
        
        return chunks;
    }

    public decode(encodedBlocks: string[]): Uint8Array {
        const decodedParts: Uint8Array[] = [];
        let totalLength = 0;

        for (let i = 0; i < encodedBlocks.length; i++) {
            let block = encodedBlocks[i];
            
            // Fix padding if missing
            const missingPadding = block.length % 8;
            if (missingPadding) {
                block += '='.repeat(8 - missingPadding);
            }

            try {
                // Base32 decode
                // hi-base32 decode returns string, but we need bytes.
                // Use asBytes method provided by hi-base32
                const rawChunk = (base32.decode as any).asBytes(block);
                
                // If rawChunk length is not what we expect (blockSize), we should pad or trim?
                // The RS decoder expects a buffer of size `blockSize`.
                // If base32 decoded data is shorter, we must pad it with 0s to match blockSize?
                // Or does it include parity?
                // `rawChunk` IS the received block (data + parity).
                // Its length should be `blockSize` (or close to it if padding was stripped).
                // In my encode function: `const encodedBytes = new Uint8Array(currentBlockSize);`
                // `currentBlockSize` is usually `blockSize` (except maybe last block).
                // So we should use the length of rawChunk to initialize the buffer in decodeBlock?
                // `const buffer = new Int32Array(data.length);` -> Yes, it does.
                
                const decodedChunk = this.decodeBlock(new Uint8Array(rawChunk));
                decodedParts.push(decodedChunk);
                totalLength += decodedChunk.length;
            } catch (e) {
                // Try repair
                try {
                    const repaired = this.tryRepairBlock(block);
                    decodedParts.push(repaired);
                    totalLength += repaired.length;
                } catch (repairError) {
                    throw new Error(`Block ${i}: Decoding failed: ${e}`);
                }
            }
        }

        // Combine parts
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of decodedParts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }

    private decodeBlock(data: Uint8Array): Uint8Array {
        // Prepare Int32Array for reedsolomon.js
        const buffer = new Int32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            buffer[i] = data[i];
        }

        // decode(data, ecBytes)
        // This modifies buffer in place (hopefully corrects errors)
        // And returns nothing? Or throws if fails?
        // reedsolomon.js throws ReedSolomonException if fails.
        // It seems reedsolomon.js throws an error if it cannot decode.
        // Let's wrap it in try-catch to be safe, although the caller already does.
        try {
            this.decoder.decode(buffer, this.nsym);
        } catch (e) {
            // Re-throw to be caught by caller
            throw e;
        }
        
        // Extract data (first part)
        const dataLen = data.length - this.nsym;
        
        // Safety check: if dataLen is negative, something is wrong with configuration
        if (dataLen < 0) {
             throw new Error("Invalid block size or parity configuration");
        }

        const result = new Uint8Array(dataLen);
        for (let i = 0; i < dataLen; i++) {
            result[i] = buffer[i];
        }
        return result;
    }

    private tryRepairBlock(block: string): Uint8Array {
        // Brute force 'A' insertion
        const fillChar = 'A';
        // Remove padding for insertion
        const cleanBlock = block.replace(/=+$/, '');
        
        for (let i = 0; i <= cleanBlock.length; i++) {
            let repairedBlock = cleanBlock.slice(0, i) + fillChar + cleanBlock.slice(i);
            
            // Add padding back
            const missing = repairedBlock.length % 8;
            if (missing) repairedBlock += '='.repeat(8 - missing);
            
            try {
                const rawChunk = (base32.decode as any).asBytes(repairedBlock);
                const result = this.decodeBlock(new Uint8Array(rawChunk));
                // console.log(`Repair successful at index ${i}`);
                return result;
            } catch (e) {
                continue;
            }
        }
        throw new Error("Repair failed");
    }
    
    public getConfigSummary() {
        return {
            blockSize: this.blockSize,
            dataSize: this.dataSize,
            paritySize: this.nsym,
            correctionCapacity: Math.floor(this.nsym / 2)
        };
    }
}
