// GPU ASCII rendering, shape-vector variant, after
// https://alexharri.com/blog/ascii-rendering: each 4x8 render-pixel block
// becomes the glyph whose ink distribution best matches the block's light
// distribution, instead of mapping average luminance onto a density ramp.
//
// Per cell: sample 6 regions (2 columns x 3 rows) into a "sampling vector",
// sharpen it with two contrast-enhancement passes (directional, using samples
// reaching into neighbor cells, then global), and pick the glyph whose
// precomputed shape vector (see glyph-coverage.ts) is nearest in 6D.
// Foreground color carries the hue only, like the ramp variant.

import { DEFAULT_ASCII_CHARSET, GLYPH_COVERAGE } from './glyph-coverage'

/** Render pixels per terminal cell for {@link asciiShapeShader}. */
export const ASCII_SHAPE_CELL = { width: 4, height: 8 } as const

/**
 * Default contrast-enhancement exponent. 1 disables enhancement; higher
 * values push cells toward the dominant side of an edge (cel-shading look).
 */
export const DEFAULT_ASCII_CONTRAST = 2

/**
 * Builds the WGSL compute shader for shape-vector ASCII cell rendering.
 * `charset` is an unordered glyph pool (order does not matter, unlike ramps);
 * every character must exist in {@link GLYPH_COVERAGE}.
 */
export function asciiShapeShader(
  workgroupSize: number,
  charset: string = DEFAULT_ASCII_CHARSET,
): string {
  const chars = [...new Set([...charset])]
  if (chars.length < 2) {
    throw new Error(`ASCII charset needs at least 2 characters, got ${JSON.stringify(charset)}`)
  }
  const missing = chars.filter((char) => !(char in GLYPH_COVERAGE))
  if (missing.length > 0) {
    throw new Error(
      `No glyph coverage data for ${missing.map((c) => JSON.stringify(c)).join(', ')} — ` +
        `regenerate scripts/glyph-coverage.html with them or use the 'ramp' ascii style`,
    )
  }

  // normalize per component over the active charset so shape vectors span
  // [0, 1] like the image-side luminance samples
  const raw = chars.map((char) => GLYPH_COVERAGE[char]!)
  const componentMax = Array.from({ length: 6 }, (_, i) =>
    Math.max(...raw.map((coverage) => coverage[i]!)),
  )
  const vectors = raw.map((coverage) =>
    coverage.map((value, i) => (componentMax[i]! > 0 ? value / componentMax[i]! : 0)),
  )

  const codePoints = chars.map((char) => char.codePointAt(0)!)
  const flatVectors = vectors.flat().map((value) => value.toFixed(4))

  return /* wgsl */ `
struct CellResult {
    bg: vec4<f32>,      // Background RGBA (16 bytes)
    fg: vec4<f32>,      // Foreground RGBA (16 bytes)
    char: u32,          // Unicode character code (4 bytes)
    _padding1: u32,     // Padding (4 bytes)
    _padding2: u32,     // Extra padding (4 bytes)
    _padding3: u32,     // Extra padding (4 bytes) - total now 48 bytes (16-byte aligned)
};

struct CellBuffer {
    cells: array<CellResult>
};

struct SuperSamplingParams {
    width: u32,              // Canvas width in pixels
    height: u32,             // Canvas height in pixels
    sampleAlgo: u32,         // unused here; layout shared with supersampling
    contrast: f32,           // contrast-enhancement exponent (1 = off)
};

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> output: CellBuffer;
@group(0) @binding(2) var<uniform> params: SuperSamplingParams;

const CELL_W: i32 = ${ASCII_SHAPE_CELL.width};
const CELL_H: i32 = ${ASCII_SHAPE_CELL.height};

const glyphCount: u32 = ${codePoints.length}u;
const glyphChars = array<u32, ${codePoints.length}>(${codePoints.map((code) => `${code}u`).join(', ')});
// 6 components per glyph: 2 columns x 3 rows, row-major
const glyphVectors = array<f32, ${flatVectors.length}>(
${flatVectors
  .reduce<string[]>((lines, value, i) => {
    if (i % 6 === 0) lines.push('    ')
    lines[lines.length - 1] += `${value},${i % 6 === 5 ? '' : ' '}`
    return lines
  }, [])
  .join('\n')}
);

fn getPixelColor(pixelX: i32, pixelY: i32) -> vec4<f32> {
    if (pixelX < 0 || pixelY < 0 || pixelX >= i32(params.width) || pixelY >= i32(params.height)) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0); // Black for out-of-bounds
    }

    return textureLoad(inputTexture, vec2<i32>(pixelX, pixelY), 0);
}

fn luminance(color: vec4<f32>) -> f32 {
    return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

// row bands are 3/2/3 pixels tall, matching glyph-coverage.ts
fn rowBand(y: i32) -> i32 {
    if (y < 3) { return 0; }
    if (y < 5) { return 1; }
    return 2;
}

fn regionLuminance(x0: i32, x1: i32, y0: i32, y1: i32) -> f32 {
    var sum = 0.0;
    for (var y = y0; y < y1; y++) {
        for (var x = x0; x < x1; x++) {
            sum += luminance(getPixelColor(x, y));
        }
    }
    return sum / f32((x1 - x0) * (y1 - y0));
}

@compute @workgroup_size(${workgroupSize}, ${workgroupSize}, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let bufferWidthCells = (params.width + u32(CELL_W) - 1u) / u32(CELL_W);
    let bufferHeightCells = (params.height + u32(CELL_H) - 1u) / u32(CELL_H);

    if (id.x >= bufferWidthCells || id.y >= bufferHeightCells) {
        return;
    }

    let baseX = i32(id.x) * CELL_W;
    let baseY = i32(id.y) * CELL_H;

    // internal sampling vector + average color in one pass over the cell
    var v = array<f32, 6>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    var regionPixels = array<f32, 6>(6.0, 6.0, 4.0, 4.0, 6.0, 6.0);
    var colorSum = vec4<f32>(0.0);
    for (var y = 0; y < CELL_H; y++) {
        let row = rowBand(y);
        for (var x = 0; x < CELL_W; x++) {
            let color = getPixelColor(baseX + x, baseY + y);
            colorSum += color;
            var i = row * 2;
            if (x >= CELL_W / 2) { i += 1; }
            v[i] += luminance(color);
        }
    }
    for (var i = 0; i < 6; i++) {
        v[i] /= regionPixels[i];
    }
    let avg = colorSum / f32(CELL_W * CELL_H);

    // external sampling vector: mirrored regions reaching into the neighbor
    // cells (2 above, 2 below, 3 left, 3 right)
    var e = array<f32, 10>(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    e[0] = regionLuminance(baseX, baseX + 2, baseY - 3, baseY);
    e[1] = regionLuminance(baseX + 2, baseX + 4, baseY - 3, baseY);
    e[2] = regionLuminance(baseX, baseX + 2, baseY + 8, baseY + 11);
    e[3] = regionLuminance(baseX + 2, baseX + 4, baseY + 8, baseY + 11);
    e[4] = regionLuminance(baseX - 2, baseX, baseY, baseY + 3);
    e[5] = regionLuminance(baseX - 2, baseX, baseY + 3, baseY + 5);
    e[6] = regionLuminance(baseX - 2, baseX, baseY + 5, baseY + 8);
    e[7] = regionLuminance(baseX + 4, baseX + 6, baseY, baseY + 3);
    e[8] = regionLuminance(baseX + 4, baseX + 6, baseY + 3, baseY + 5);
    e[9] = regionLuminance(baseX + 4, baseX + 6, baseY + 5, baseY + 8);

    // widened affect mapping: each internal component listens to the external
    // regions on its side(s), including diagonally adjacent ones
    var extMax = array<f32, 6>(
        max(max(e[0], e[1]), max(e[4], e[5])),
        max(max(e[0], e[1]), max(e[7], e[8])),
        max(e[4], max(e[5], e[6])),
        max(e[7], max(e[8], e[9])),
        max(max(e[2], e[3]), max(e[5], e[6])),
        max(max(e[2], e[3]), max(e[8], e[9])),
    );

    let exponent = max(params.contrast, 1.0);

    // directional enhancement: darken components that sit on the dark side of
    // an edge crossing this cell or a neighbor
    for (var i = 0; i < 6; i++) {
        let m = max(v[i], extMax[i]);
        if (m > 1e-4) {
            v[i] = pow(v[i] / m, exponent) * m;
        }
    }

    // global enhancement: sharpen intra-cell edges without darkening the
    // brightest component (normalize by max, pow, denormalize)
    var vMax = 0.0;
    for (var i = 0; i < 6; i++) {
        vMax = max(vMax, v[i]);
    }
    if (vMax > 1e-4) {
        for (var i = 0; i < 6; i++) {
            v[i] = pow(v[i] / vMax, exponent) * vMax;
        }
    }

    // nearest glyph by squared euclidean distance
    var best = 0u;
    var bestDist = 1e30;
    for (var g = 0u; g < glyphCount; g++) {
        var dist = 0.0;
        for (var i = 0u; i < 6u; i++) {
            let diff = v[i] - glyphVectors[g * 6u + i];
            dist += diff * diff;
        }
        if (dist < bestDist) {
            bestDist = dist;
            best = g;
        }
    }

    var result: CellResult;
    result.char = glyphChars[best];

    let maxChannel = max(avg.r, max(avg.g, avg.b));
    if (maxChannel > 0.0001) {
        result.fg = vec4<f32>(avg.rgb / maxChannel, avg.a);
    } else {
        result.fg = vec4<f32>(0.0, 0.0, 0.0, avg.a);
    }
    result.bg = vec4<f32>(0.0, 0.0, 0.0, avg.a);
    result._padding1 = 0u;
    result._padding2 = 0u;
    result._padding3 = 0u;

    output.cells[id.y * bufferWidthCells + id.x] = result;
}
`
}
