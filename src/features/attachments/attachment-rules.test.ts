import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_MAX_BYTES,
  inferAttachmentFormat,
  isLikelyTextBytes,
  validateAttachmentBytes,
  validateAttachmentMetadata,
} from '@/features/attachments/attachment-rules';

describe('inferAttachmentFormat', () => {
  it('maps known extensions', () => {
    expect(inferAttachmentFormat('readme.md')).toBe('md');
    expect(inferAttachmentFormat('NOTES.TXT')).toBe('txt');
    expect(inferAttachmentFormat('config.json')).toBe('json');
    expect(inferAttachmentFormat('settings.yaml')).toBe('yaml');
    expect(inferAttachmentFormat('compose.yml')).toBe('yaml');
  });

  it('returns null for unknown / missing extension', () => {
    expect(inferAttachmentFormat('image.png')).toBeNull();
    expect(inferAttachmentFormat('Makefile')).toBeNull();
  });
});

describe('validateAttachmentMetadata', () => {
  it('accepts a small markdown file', () => {
    const r = validateAttachmentMetadata({ filename: 'spec.md', sizeBytes: 1024 });
    expect(r).toEqual({ ok: true, format: 'md' });
  });

  it('rejects unsupported types', () => {
    const r = validateAttachmentMetadata({ filename: 'pic.png', sizeBytes: 100 });
    expect(r.ok).toBe(false);
  });

  it('rejects empty files', () => {
    const r = validateAttachmentMetadata({ filename: 'x.md', sizeBytes: 0 });
    expect(r).toMatchObject({ ok: false });
  });

  it('rejects files over the size cap', () => {
    const r = validateAttachmentMetadata({
      filename: 'big.md',
      sizeBytes: ATTACHMENT_MAX_BYTES + 1,
    });
    expect(r).toMatchObject({ ok: false });
  });
});

describe('isLikelyTextBytes', () => {
  it('returns true for UTF-8 text', () => {
    const bytes = new TextEncoder().encode('# Hello\nWorld 🌍');
    expect(isLikelyTextBytes(bytes)).toBe(true);
  });

  it('returns false when NUL byte appears in window', () => {
    const bytes = new Uint8Array([72, 105, 0, 33]);
    expect(isLikelyTextBytes(bytes)).toBe(false);
  });

  it('accepts UTF-8 when a multi-byte codepoint straddles the 4 KB sniff window', () => {
    // 4095 ASCII bytes followed by a 2-byte cyrillic char ("Я" = 0xD0 0xAF).
    // The sniff window cuts between 0xD0 and 0xAF; strict (non-stream) decode
    // would throw "invalid utf-8" and falsely flag the file as binary.
    const head = new Uint8Array(4095).fill(0x61);
    const bytes = new Uint8Array(head.length + 2);
    bytes.set(head, 0);
    bytes[4095] = 0xd0;
    bytes[4096] = 0xaf;
    expect(isLikelyTextBytes(bytes)).toBe(true);
  });
});

describe('validateAttachmentBytes', () => {
  it('accepts well-formed text', () => {
    const bytes = new TextEncoder().encode('hello');
    const r = validateAttachmentBytes({ filename: 'a.txt', bytes });
    expect(r).toEqual({ ok: true, format: 'txt' });
  });

  it('rejects binary even with allowed extension', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x10]);
    const r = validateAttachmentBytes({ filename: 'fake.txt', bytes });
    expect(r).toMatchObject({ ok: false });
  });
});
