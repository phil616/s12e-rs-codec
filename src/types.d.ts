declare module 'reedsolomon' {
    export class GenericGF {
        constructor(primitive: number, size: number, b: number);
        static AZTEC_DATA_8(): GenericGF;
        static QR_CODE_FIELD_256(): GenericGF;
    }
    export class ReedSolomonEncoder {
        constructor(field: GenericGF);
        encode(toEncode: Int32Array | number[], ecBytes: number): void;
    }
    export class ReedSolomonDecoder {
        constructor(field: GenericGF);
        decode(received: Int32Array | number[], ecBytes: number): boolean;
    }
}

declare module 'hi-base32' {
    export function encode(input: string | number[] | Uint8Array | ArrayBuffer): string;
    export function decode(input: string, asciiOnly?: boolean): number[];
}
