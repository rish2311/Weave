/**
 * zipExporter.ts
 *
 * Phase 2 — Export System (2.3)
 *
 * Bundles a set of GeneratedFile objects into a downloadable ZIP archive
 * entirely in the browser using the native Compression Streams API
 * (available in all modern browsers since 2023).
 *
 * No external zip library needed — this keeps the bundle lean.
 *
 * We implement a minimal ZIP writer following the ZIP specification:
 * https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

import type { GeneratedFile } from "./astCompiler.js";

// ---------------------------------------------------------------------------
// Minimal ZIP implementation (no deps)
// ---------------------------------------------------------------------------

function uint32LE(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function uint16LE(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  for (const byte of data) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crc32Table: Uint32Array | null = null;
function getCRC32Table(): Uint32Array {
  if (_crc32Table) return _crc32Table;
  _crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crc32Table[i] = c;
  }
  return _crc32Table;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function encodeString(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

interface LocalFileEntry {
  header: Uint8Array;
  data: Uint8Array;
  centralHeader: Uint8Array;
  offset: number;
}

function buildLocalEntry(file: GeneratedFile, offset: number): LocalFileEntry {
  const nameBytes = encodeString(file.path);
  const dataBytes = encodeString(file.content);
  const crc = crc32(dataBytes);
  const size = dataBytes.length;
  const dosDate = dosDateTime();

  // Local file header
  const localHeader = concat(
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
    uint16LE(20),                               // version needed: 2.0
    uint16LE(0),                                // general purpose flags
    uint16LE(0),                                // compression: stored
    dosDate,                                    // last mod time+date (4 bytes)
    uint32LE(crc),                              // CRC-32
    uint32LE(size),                             // compressed size
    uint32LE(size),                             // uncompressed size
    uint16LE(nameBytes.length),                 // filename length
    uint16LE(0),                                // extra field length
    nameBytes
  );

  // Central directory header
  const centralHeader = concat(
    new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
    uint16LE(20),                               // version made by
    uint16LE(20),                               // version needed
    uint16LE(0),                                // flags
    uint16LE(0),                                // compression
    dosDate,                                    // last mod
    uint32LE(crc),
    uint32LE(size),
    uint32LE(size),
    uint16LE(nameBytes.length),
    uint16LE(0),                                // extra field
    uint16LE(0),                                // comment length
    uint16LE(0),                                // disk number start
    uint16LE(0),                                // internal attr
    uint32LE(0),                                // external attr
    uint32LE(offset),                           // local header offset
    nameBytes
  );

  return { header: localHeader, data: dataBytes, centralHeader, offset };
}

function dosDateTime(): Uint8Array {
  const now = new Date();
  const time =
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2);
  const date =
    ((now.getFullYear() - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();
  const b = new Uint8Array(4);
  const dv = new DataView(b.buffer);
  dv.setUint16(0, time, true);
  dv.setUint16(2, date, true);
  return b;
}

/**
 * Packages all generated files into a ZIP Uint8Array.
 * Works entirely in the browser (no Node.js fs).
 */
export function filesToZip(files: GeneratedFile[]): Uint8Array {
  const entries: LocalFileEntry[] = [];
  let offset = 0;

  for (const file of files) {
    const entry = buildLocalEntry(file, offset);
    entries.push(entry);
    offset += entry.header.length + entry.data.length;
  }

  const centralDir = concat(...entries.map((e) => e.centralHeader));
  const centralDirSize = centralDir.length;
  const centralDirOffset = offset;

  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // EOCD signature
    uint16LE(0),                                // disk number
    uint16LE(0),                                // disk with central dir
    uint16LE(entries.length),                   // entries on this disk
    uint16LE(entries.length),                   // total entries
    uint32LE(centralDirSize),
    uint32LE(centralDirOffset),
    uint16LE(0)                                 // comment length
  );

  return concat(
    ...entries.flatMap((e) => [e.header, e.data]),
    centralDir,
    eocd
  );
}

/**
 * Triggers a browser download of a ZIP file containing all generated files.
 */
export function downloadProjectZip(files: GeneratedFile[], projectName: string): void {
  const zipBytes = filesToZip(files);
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-weave.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
