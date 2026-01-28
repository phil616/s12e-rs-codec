
const rs = require('reedsolomon');

// Try to find the matching GF
// Python reedsolo: prim=0x11d, size=256, fcr=0
// ZXing QR_CODE_FIELD_256: prim=0x11d, size=256, generatorBase=0
// This seems to be the match.

// In reedsolomon.js, let's see available fields.
// Usually they are exposed on GenericGF.
// Or we can construct one: new GenericGF(0x11d, 256, 0);

try {
    const field = new rs.GenericGF(0x11D, 256, 0);
    const encoder = new rs.ReedSolomonEncoder(field);

    const message = new Int32Array(7); // 3 data + 4 parity
    message[0] = 1;
    message[1] = 2;
    message[2] = 3;
    // rest are 0

    // encode(toEncode, ecBytes)
    encoder.encode(message, 4);

    console.log(Array.from(message));
} catch (e) {
    console.error(e);
}
