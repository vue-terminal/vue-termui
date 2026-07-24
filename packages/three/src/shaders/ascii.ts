// GPU ASCII rendering: collapses 2x2 render pixels into one terminal cell,
// mapping the cell's average luminance to a glyph from a density ramp.
// Brightness lives in the glyph; the foreground color only carries the hue
// (normalized to full intensity), on a black background.

/** Density ramp used when {@link asciiShader} gets no custom characters. */
export const DEFAULT_ASCII_RAMP = ' .:-=+*#%@'

/**
 * Builds the WGSL compute shader for ASCII cell rendering. `ramp` is ordered
 * from darkest to brightest; each code point becomes one luminance step.
 */
export function asciiShader(workgroupSize: number, ramp: string = DEFAULT_ASCII_RAMP): string {
  const codePoints = [...ramp].map((char) => char.codePointAt(0)!)
  if (codePoints.length < 2) {
    throw new Error(`ASCII ramp needs at least 2 characters, got ${JSON.stringify(ramp)}`)
  }

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
    _padding: u32,           // Padding for 16-byte alignment
};

@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> output: CellBuffer;
@group(0) @binding(2) var<uniform> params: SuperSamplingParams;

const rampSize: u32 = ${codePoints.length}u;
const rampChars = array<u32, ${codePoints.length}>(${codePoints.map((code) => `${code}u`).join(', ')});

fn getPixelColor(pixelX: u32, pixelY: u32) -> vec4<f32> {
    if (pixelX >= params.width || pixelY >= params.height) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0); // Black for out-of-bounds
    }

    return textureLoad(inputTexture, vec2<i32>(i32(pixelX), i32(pixelY)), 0);
}

fn luminance(color: vec4<f32>) -> f32 {
    return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

fn blendColors(color1: vec4<f32>, color2: vec4<f32>) -> vec4<f32> {
    let a1 = color1.a;
    let a2 = color2.a;

    if (a1 == 0.0 && a2 == 0.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }

    let outAlpha = a1 + a2 - a1 * a2;
    if (outAlpha == 0.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }

    let rgb = (color1.rgb * a1 + color2.rgb * a2 * (1.0 - a1)) / outAlpha;

    return vec4<f32>(rgb, outAlpha);
}

fn averageColorsWithAlpha(pixels: array<vec4<f32>, 4>) -> vec4<f32> {
    let blend1 = blendColors(pixels[0], pixels[1]);
    let blend2 = blendColors(pixels[2], pixels[3]);

    return blendColors(blend1, blend2);
}

@compute @workgroup_size(${workgroupSize}, ${workgroupSize}, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let cellX = id.x;
    let cellY = id.y;
    let bufferWidthCells = (params.width + 1u) / 2u;
    let bufferHeightCells = (params.height + 1u) / 2u;

    if (cellX >= bufferWidthCells || cellY >= bufferHeightCells) {
        return;
    }

    let renderX = cellX * 2u;
    let renderY = cellY * 2u;

    var pixels: array<vec4<f32>, 4>;
    pixels[0] = getPixelColor(renderX, renderY);
    pixels[1] = getPixelColor(renderX + 1u, renderY);
    pixels[2] = getPixelColor(renderX, renderY + 1u);
    pixels[3] = getPixelColor(renderX + 1u, renderY + 1u);

    let avg = averageColorsWithAlpha(pixels);
    let lum = clamp(luminance(avg), 0.0, 1.0);
    let rampIndex = min(u32(lum * f32(rampSize)), rampSize - 1u);

    var result: CellResult;
    result.char = rampChars[rampIndex];

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

    let outputIndex = cellY * bufferWidthCells + cellX;
    output.cells[outputIndex] = result;
}
`
}
