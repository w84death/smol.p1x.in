// Array of available .splat files on the server
const splatFiles = [
    "splat/kamien.splat",
    "splat/desk.splat",
    "splat/flowers.splat",
    "splat/hylux.splat",
    "splat/hylux_clean.splat",
    "splat/bikes.splat",
    "splat/rock.splat",
    "splat/posts.splat",
    "splat/street-light.splat",
    "splat/street-light_clean.splat",
    "splat/impostor.splat",
    "splat/impostor_clean.splat",
    "splat/sandbox.splat",
    "splat/sandbox_clean.splat",
    "splat/kbd_clean.splat",
    "splat/monster.splat",
    "splat/monster_clean.splat",
];

// Make splatFiles available globally for the HTML file selector
window.splatFiles = splatFiles;

let cameras = [
    {
        id: 0,
        img_name: "00001",
        width: 1959,
        height: 1090,
        position: [
            -2.0089893469241797, 0.11070002417020636, -2.7527640949141428,
        ],
        rotation: [
            [-0.9982591221282085, -0.02189508615715557, -0.057543624084392326],
            [0.0027761930814079344, -0.9370984970279224, 0.3490725881842409],
            [-0.058766122708323026, 0.34852671727879507, 0.9353986856512764],
        ],
        fy: 1164.6601287484507,
        fx: 1159.5880733038064,
    },
];

let camera = cameras[0];

function getProjectionMatrix(fx, fy, width, height) {
    const znear = 0.2;
    const zfar = 200;
    return [
        [(2 * fx) / width, 0, 0, 0],
        [0, -(2 * fy) / height, 0, 0],
        [0, 0, zfar / (zfar - znear), 1],
        [0, 0, -(zfar * znear) / (zfar - znear), 0],
    ].flat();
}

function multiply4(a, b) {
    return [
        b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
        b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13],
        b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14],
        b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
        b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12],
        b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13],
        b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14],
        b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15],
        b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12],
        b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13],
        b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14],
        b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15],
        b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12],
        b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13],
        b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14],
        b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15],
    ];
}

function createWorker(self) {
    let buffer;
    let vertexCount = 0;
    let viewProj;
    // 6*4 + 4 + 4 = 8*4
    // XYZ - Position (Float32)
    // XYZ - Scale (Float32)
    // RGBA - colors (uint8)
    // IJKL - quaternion/rot (uint8)
    const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
    let lastProj = [];
    let depthIndex = new Uint32Array();
    let lastVertexCount = 0;

    var _floatView = new Float32Array(1);
    var _int32View = new Int32Array(_floatView.buffer);

    function floatToHalf(float) {
        _floatView[0] = float;
        var f = _int32View[0];

        var sign = (f >> 31) & 0x0001;
        var exp = (f >> 23) & 0x00ff;
        var frac = f & 0x007fffff;

        var newExp;
        if (exp == 0) {
            newExp = 0;
        } else if (exp < 113) {
            newExp = 0;
            frac |= 0x00800000;
            frac = frac >> (113 - exp);
            if (frac & 0x01000000) {
                newExp = 1;
                frac = 0;
            }
        } else if (exp < 142) {
            newExp = exp - 112;
        } else {
            newExp = 31;
            frac = 0;
        }

        return (sign << 15) | (newExp << 10) | (frac >> 13);
    }

    function packHalf2x16(x, y) {
        return (floatToHalf(x) | (floatToHalf(y) << 16)) >>> 0;
    }

    function generateTexture() {
        if (!buffer) return;
        const f_buffer = new Float32Array(buffer);
        const u_buffer = new Uint8Array(buffer);

        var texwidth = 1024 * 2; // Set to your desired width
        var texheight = Math.ceil((2 * vertexCount) / texwidth); // Set to your desired height
        var texdata = new Uint32Array(texwidth * texheight * 4); // 4 components per pixel (RGBA)
        var texdata_c = new Uint8Array(texdata.buffer);
        var texdata_f = new Float32Array(texdata.buffer);

        // Here we convert from a .splat file buffer into a texture
        // With a little bit more foresight perhaps this texture file
        // should have been the native format as it'd be very easy to
        // load it into webgl.
        for (let i = 0; i < vertexCount; i++) {
            // x, y, z
            texdata_f[8 * i + 0] = f_buffer[8 * i + 0];
            texdata_f[8 * i + 1] = f_buffer[8 * i + 1];
            texdata_f[8 * i + 2] = f_buffer[8 * i + 2];

            // r, g, b, a
            texdata_c[4 * (8 * i + 7) + 0] = u_buffer[32 * i + 24 + 0];
            texdata_c[4 * (8 * i + 7) + 1] = u_buffer[32 * i + 24 + 1];
            texdata_c[4 * (8 * i + 7) + 2] = u_buffer[32 * i + 24 + 2];
            texdata_c[4 * (8 * i + 7) + 3] = u_buffer[32 * i + 24 + 3];

            // quaternions
            let scale = [
                f_buffer[8 * i + 3 + 0],
                f_buffer[8 * i + 3 + 1],
                f_buffer[8 * i + 3 + 2],
            ];
            let rot = [
                (u_buffer[32 * i + 28 + 0] - 128) / 128,
                (u_buffer[32 * i + 28 + 1] - 128) / 128,
                (u_buffer[32 * i + 28 + 2] - 128) / 128,
                (u_buffer[32 * i + 28 + 3] - 128) / 128,
            ];

            // Compute the matrix product of S and R (M = S * R)
            const M = [
                1.0 - 2.0 * (rot[2] * rot[2] + rot[3] * rot[3]),
                2.0 * (rot[1] * rot[2] + rot[0] * rot[3]),
                2.0 * (rot[1] * rot[3] - rot[0] * rot[2]),

                2.0 * (rot[1] * rot[2] - rot[0] * rot[3]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[3] * rot[3]),
                2.0 * (rot[2] * rot[3] + rot[0] * rot[1]),

                2.0 * (rot[1] * rot[3] + rot[0] * rot[2]),
                2.0 * (rot[2] * rot[3] - rot[0] * rot[1]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[2] * rot[2]),
            ].map((k, i) => k * scale[Math.floor(i / 3)]);

            const sigma = [
                M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
                M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
                M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
                M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
                M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
                M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
            ];

            texdata[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
            texdata[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
            texdata[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
        }

        self.postMessage({ texdata, texwidth, texheight }, [texdata.buffer]);
    }

    let sortTimer = 0;
    let sortInterval = 16; // Default minimum ms between sorts

    function runSort(viewProj) {
        if (!buffer) return;

        const f_buffer = new Float32Array(buffer);
        if (lastVertexCount == vertexCount) {
            let dot =
                lastProj[2] * viewProj[2] +
                lastProj[6] * viewProj[6] +
                lastProj[10] * viewProj[10];
            if (Math.abs(dot - 1) < 0.01) {
                return;
            }
        } else {
            generateTexture();
            lastVertexCount = vertexCount;
        }

        let maxDepth = -Infinity;
        let minDepth = Infinity;
        let sizeList = new Int32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            let depth =
                ((viewProj[2] * f_buffer[8 * i + 0] +
                    viewProj[6] * f_buffer[8 * i + 1] +
                    viewProj[10] * f_buffer[8 * i + 2]) *
                    4096) |
                0;
            sizeList[i] = depth;
            if (depth > maxDepth) maxDepth = depth;
            if (depth < minDepth) minDepth = depth;
        }

        // This is a 16 bit single-pass counting sort
        let depthInv = (256 * 256 - 1) / (maxDepth - minDepth);
        let counts0 = new Uint32Array(256 * 256);
        for (let i = 0; i < vertexCount; i++) {
            sizeList[i] = ((sizeList[i] - minDepth) * depthInv) | 0;
            counts0[sizeList[i]]++;
        }
        let starts0 = new Uint32Array(256 * 256);
        for (let i = 1; i < 256 * 256; i++)
            starts0[i] = starts0[i - 1] + counts0[i - 1];
        depthIndex = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++)
            depthIndex[starts0[sizeList[i]]++] = i;

        lastProj = viewProj;
        self.postMessage({ depthIndex, viewProj, vertexCount }, [
            depthIndex.buffer,
        ]);
    }

    function processPlyBuffer(inputBuffer) {
        const ubuf = new Uint8Array(inputBuffer);
        // 10KB ought to be enough for a header...
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const header_end = "end_header\n";
        const header_end_index = header.indexOf(header_end);
        if (header_end_index < 0)
            throw new Error("Unable to read .ply file header");
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)[1]);
        console.log("Vertex Count", vertexCount);
        let row_offset = 0,
            offsets = {},
            types = {};
        const TYPE_MAP = {
            double: "getFloat64",
            int: "getInt32",
            uint: "getUint32",
            float: "getFloat32",
            short: "getInt16",
            ushort: "getUint16",
            uchar: "getUint8",
        };
        for (let prop of header
            .slice(0, header_end_index)
            .split("\n")
            .filter((k) => k.startsWith("property "))) {
            const [p, type, name] = prop.split(" ");
            const arrayType = TYPE_MAP[type] || "getInt8";
            types[name] = arrayType;
            offsets[name] = row_offset;
            row_offset += parseInt(arrayType.replace(/[^\d]/g, "")) / 8;
        }
        console.log("Bytes per row", row_offset, types, offsets);

        let dataView = new DataView(
            inputBuffer,
            header_end_index + header_end.length,
        );
        let row = 0;
        const attrs = new Proxy(
            {},
            {
                get(target, prop) {
                    if (!types[prop]) throw new Error(prop + " not found");
                    return dataView[types[prop]](
                        row * row_offset + offsets[prop],
                        true,
                    );
                },
            },
        );

        console.time("calculate importance");
        let sizeList = new Float32Array(vertexCount);
        let sizeIndex = new Uint32Array(vertexCount);
        for (row = 0; row < vertexCount; row++) {
            sizeIndex[row] = row;
            if (!types["scale_0"]) continue;
            const size =
                Math.exp(attrs.scale_0) *
                Math.exp(attrs.scale_1) *
                Math.exp(attrs.scale_2);
            const opacity = 1 / (1 + Math.exp(-attrs.opacity));
            sizeList[row] = size * opacity;
        }
        console.timeEnd("calculate importance");

        console.time("sort");
        sizeIndex.sort((b, a) => sizeList[a] - sizeList[b]);
        console.timeEnd("sort");

        // 6*4 + 4 + 4 = 8*4
        // XYZ - Position (Float32)
        // XYZ - Scale (Float32)
        // RGBA - colors (uint8)
        // IJKL - quaternion/rot (uint8)
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
        const buffer = new ArrayBuffer(rowLength * vertexCount);

        console.time("build buffer");
        for (let j = 0; j < vertexCount; j++) {
            row = sizeIndex[j];

            const position = new Float32Array(buffer, j * rowLength, 3);
            const scales = new Float32Array(buffer, j * rowLength + 4 * 3, 3);
            const rgba = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3,
                4,
            );
            const rot = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3 + 4,
                4,
            );

            if (types["scale_0"]) {
                const qlen = Math.sqrt(
                    attrs.rot_0 ** 2 +
                        attrs.rot_1 ** 2 +
                        attrs.rot_2 ** 2 +
                        attrs.rot_3 ** 2,
                );

                rot[0] = (attrs.rot_0 / qlen) * 128 + 128;
                rot[1] = (attrs.rot_1 / qlen) * 128 + 128;
                rot[2] = (attrs.rot_2 / qlen) * 128 + 128;
                rot[3] = (attrs.rot_3 / qlen) * 128 + 128;

                scales[0] = Math.exp(attrs.scale_0);
                scales[1] = Math.exp(attrs.scale_1);
                scales[2] = Math.exp(attrs.scale_2);
            } else {
                scales[0] = 0.01;
                scales[1] = 0.01;
                scales[2] = 0.01;

                rot[0] = 255;
                rot[1] = 0;
                rot[2] = 0;
                rot[3] = 0;
            }

            position[0] = attrs.x;
            position[1] = attrs.y;
            position[2] = attrs.z;

            if (types["f_dc_0"]) {
                const SH_C0 = 0.28209479177387814;
                rgba[0] = (0.5 + SH_C0 * attrs.f_dc_0) * 255;
                rgba[1] = (0.5 + SH_C0 * attrs.f_dc_1) * 255;
                rgba[2] = (0.5 + SH_C0 * attrs.f_dc_2) * 255;
            } else {
                rgba[0] = attrs.red;
                rgba[1] = attrs.green;
                rgba[2] = attrs.blue;
            }
            if (types["opacity"]) {
                rgba[3] = (1 / (1 + Math.exp(-attrs.opacity))) * 255;
            } else {
                rgba[3] = 255;
            }
        }
        console.timeEnd("build buffer");
        return buffer;
    }

    const throttledSort = () => {
        if (!sortRunning) {
            sortRunning = true;
            let lastView = viewProj;
            runSort(lastView);
            setTimeout(() => {
                sortRunning = false;
                if (lastView !== viewProj) {
                    throttledSort();
                }
            }, 0);
        }
    };

    let sortRunning;
    self.onmessage = (e) => {
        if (e.data.ply) {
            vertexCount = 0;
            runSort(viewProj);
            buffer = processPlyBuffer(e.data.ply);
            vertexCount = Math.floor(buffer.byteLength / rowLength);
            postMessage({ buffer: buffer, save: !!e.data.save });
        } else if (e.data.buffer) {
            buffer = e.data.buffer;
            vertexCount = e.data.vertexCount;
        } else if (e.data.vertexCount) {
            vertexCount = e.data.vertexCount;
        } else if (e.data.view) {
            viewProj = e.data.view;
            throttledSort();
        }
    };
}

const vertexShaderSource = `
#version 300 es
precision highp float;
precision highp int;

uniform highp usampler2D u_texture;
uniform mat4 projection, view;
uniform vec2 focal;
uniform vec2 viewport;

in vec2 position;
in int index;

out vec4 vColor;
out vec2 vPosition;

void main () {
    uvec4 cen = texelFetch(u_texture, ivec2((uint(index) & 0x3ffu) << 1, uint(index) >> 10), 0);
    vec4 cam = view * vec4(uintBitsToFloat(cen.xyz), 1);
    vec4 pos2d = projection * cam;

    float clip = 1.2 * pos2d.w;
    if (pos2d.z < -clip || pos2d.x < -clip || pos2d.x > clip || pos2d.y < -clip || pos2d.y > clip) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    uvec4 cov = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 1) | 1u, uint(index) >> 10), 0);
    vec2 u1 = unpackHalf2x16(cov.x), u2 = unpackHalf2x16(cov.y), u3 = unpackHalf2x16(cov.z);
    mat3 Vrk = mat3(u1.x, u1.y, u2.x, u1.y, u2.y, u3.x, u2.x, u3.x, u3.y);

    mat3 J = mat3(
        focal.x / cam.z, 0., -(focal.x * cam.x) / (cam.z * cam.z),
        0., -focal.y / cam.z, (focal.y * cam.y) / (cam.z * cam.z),
        0., 0., 0.
    );

    mat3 T = transpose(mat3(view)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;

    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float lambda1 = mid + radius, lambda2 = mid - radius;

    if(lambda2 < 0.0) return;
    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vColor = clamp(pos2d.z/pos2d.w+1.0, 0.0, 1.0) * vec4((cov.w) & 0xffu, (cov.w >> 8) & 0xffu, (cov.w >> 16) & 0xffu, (cov.w >> 24) & 0xffu) / 255.0;
    vPosition = position;

    vec2 vCenter = vec2(pos2d) / pos2d.w;
    gl_Position = vec4(
        vCenter
        + position.x * majorAxis / viewport
        + position.y * minorAxis / viewport, 0.0, 1.0);

}
`.trim();

const fragmentShaderSource = `
#version 300 es
precision highp float;

in vec4 vColor;
in vec2 vPosition;

out vec4 fragColor;

void main () {
    float A = -dot(vPosition, vPosition);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    fragColor = vec4(B * vColor.rgb, B);
}

`.trim();

let defaultViewMatrix = [
    0.47, 0.04, 0.88, 0, -0.11, 0.99, 0.02, 0, -0.88, -0.11, 0.47, 0, 0.07,
    0.03, 6.55, 1,
];
let viewMatrix = defaultViewMatrix;
async function main() {
    const params = new URLSearchParams(location.search);
    try {
        viewMatrix = JSON.parse(decodeURIComponent(location.hash.slice(1)));
    } catch (err) {}
    // Get file index from URL parameter or default to 0
    const fileIndex = parseInt(params.get("file")) || 0;
    const selectedFile = splatFiles[fileIndex] || splatFiles[0];

    const url = new URL(selectedFile, window.location.origin + "/");
    const req = await fetch(url, {
        mode: "cors", // no-cors, *cors, same-origin
        credentials: "omit", // include, *same-origin, omit
    });
    if (req.status != 200)
        throw new Error(req.status + " Unable to load " + req.url);

    const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
    const reader = req.body.getReader();
    let splatData = new Uint8Array(req.headers.get("content-length"));

    // Adjust downsample based on splat count for better performance
    const splatCount = splatData.length / rowLength;
    const downsample = splatCount > 500000 ? 1 : 1 / devicePixelRatio;

    const worker = new Worker(
        URL.createObjectURL(
            new Blob(["(", createWorker.toString(), ")(self)"], {
                type: "application/javascript",
            }),
        ),
    );

    const canvas = document.getElementById("canvas");
    const fps = document.getElementById("fps");
    const camid = document.getElementById("camid");

    if (!canvas) {
        throw new Error(
            "Canvas element not found. Please ensure the page has loaded correctly.",
        );
    }

    let projectionMatrix;

    const gl = canvas.getContext("webgl2", {
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
    });

    if (!gl) {
        throw new Error(
            "WebGL2 is not supported in this browser. Please use a modern browser with WebGL2 support.",
        );
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(vertexShader));

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(fragmentShader));

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(program));

    gl.disable(gl.DEPTH_TEST); // Disable depth testing

    // Set clear color to transparent black
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
    );
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

    const u_projection = gl.getUniformLocation(program, "projection");
    const u_viewport = gl.getUniformLocation(program, "viewport");
    const u_focal = gl.getUniformLocation(program, "focal");
    const u_view = gl.getUniformLocation(program, "view");

    // positions
    const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var u_textureLocation = gl.getUniformLocation(program, "u_texture");
    gl.uniform1i(u_textureLocation, 0);

    const indexBuffer = gl.createBuffer();
    const a_index = gl.getAttribLocation(program, "index");
    gl.enableVertexAttribArray(a_index);
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.vertexAttribIPointer(a_index, 1, gl.INT, false, 0, 0);
    gl.vertexAttribDivisor(a_index, 1);

    const resize = () => {
        gl.uniform2fv(u_focal, new Float32Array([camera.fx, camera.fy]));

        projectionMatrix = getProjectionMatrix(
            camera.fx,
            camera.fy,
            innerWidth,
            innerHeight,
        );

        gl.uniform2fv(u_viewport, new Float32Array([innerWidth, innerHeight]));

        gl.canvas.width = Math.round(innerWidth / downsample);
        gl.canvas.height = Math.round(innerHeight / downsample);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.uniformMatrix4fv(u_projection, false, projectionMatrix);
    };

    window.addEventListener("resize", resize);
    resize();

    worker.onmessage = (e) => {
        if (e.data.buffer) {
            splatData = new Uint8Array(e.data.buffer);
            if (e.data.save) {
                const blob = new Blob([splatData.buffer], {
                    type: "application/octet-stream",
                });
                const link = document.createElement("a");
                link.download = "model.splat";
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
            }
        } else if (e.data.texdata) {
            const { texdata, texwidth, texheight } = e.data;
            // console.log(texdata)
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE,
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE,
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA32UI,
                texwidth,
                texheight,
                0,
                gl.RGBA_INTEGER,
                gl.UNSIGNED_INT,
                texdata,
            );
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        } else if (e.data.depthIndex) {
            const { depthIndex, viewProj } = e.data;
            gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, depthIndex, gl.DYNAMIC_DRAW);
            vertexCount = e.data.vertexCount;
        }
    };

    // FPS Controls State
    let activeKeys = {};
    let mouseX = 0,
        mouseY = 0;
    let pitch = 0,
        yaw = 0;
    let isPointerLocked = false;

    // Initial camera position variable
    const initialCameraPosition = [0, 0, -5.0];

    // Camera position - start at initial position
    let cameraPosition = [...initialCameraPosition];

    // Movement speed settings
    const moveSpeed = 0.1;
    const mouseSensitivity = 0.002;

    // Request pointer lock on canvas click
    canvas.addEventListener("click", () => {
        if (!isPointerLocked) {
            canvas.requestPointerLock();
        }
    });

    // Handle pointer lock change
    document.addEventListener("pointerlockchange", () => {
        isPointerLocked = document.pointerLockElement === canvas;
        if (!isPointerLocked) {
            // Reset mouse state when pointer lock is released
            mouseX = 0;
            mouseY = 0;
        }
    });

    // Mouse look
    document.addEventListener("mousemove", (e) => {
        if (!isPointerLocked) return;

        mouseX = e.movementX;
        mouseY = e.movementY;

        // Update yaw and pitch
        yaw += mouseX * mouseSensitivity;
        pitch -= mouseY * mouseSensitivity;

        // Clamp pitch to prevent over-rotation
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    });

    // Keyboard input
    window.addEventListener("keydown", (e) => {
        if (e.code === "Escape" && isPointerLocked) {
            document.exitPointerLock();
            return;
        }
        activeKeys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
        activeKeys[e.code] = false;
    });

    window.addEventListener("blur", () => {
        activeKeys = {};
        mouseX = 0;
        mouseY = 0;
    });

    // Removed wheel, mouse drag, and touch controls - using FPS controls only

    let vertexCount = 0;
    let lastFrame = 0;
    let avgFps = 0;
    let start = 0;

    const frame = (now) => {
        // Build view matrix from camera position and rotation

        // Calculate forward and right vectors from rotation
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        // Forward vector - only on horizontal plane (ignore pitch for movement)
        let forward = [sinYaw, 0, cosYaw];

        // Right vector - perpendicular to forward on horizontal plane
        let right = [cosYaw, 0, -sinYaw];

        // Handle WASD movement
        const actualMoveSpeed = activeKeys["ShiftLeft"]
            ? moveSpeed * 2
            : moveSpeed;

        if (activeKeys["KeyW"]) {
            cameraPosition[0] += forward[0] * actualMoveSpeed;
            cameraPosition[1] += forward[1] * actualMoveSpeed;
            cameraPosition[2] += forward[2] * actualMoveSpeed;
        }
        if (activeKeys["KeyS"]) {
            cameraPosition[0] -= forward[0] * actualMoveSpeed;
            cameraPosition[1] -= forward[1] * actualMoveSpeed;
            cameraPosition[2] -= forward[2] * actualMoveSpeed;
        }
        if (activeKeys["KeyA"]) {
            cameraPosition[0] -= right[0] * actualMoveSpeed;
            cameraPosition[1] -= right[1] * actualMoveSpeed;
            cameraPosition[2] -= right[2] * actualMoveSpeed;
        }
        if (activeKeys["KeyD"]) {
            cameraPosition[0] += right[0] * actualMoveSpeed;
            cameraPosition[1] += right[1] * actualMoveSpeed;
            cameraPosition[2] += right[2] * actualMoveSpeed;
        }

        // Optional vertical movement (Space to go up, Ctrl/C to go down)
        if (activeKeys["Space"]) {
            cameraPosition[1] -= actualMoveSpeed; // Y is up in this coordinate system
        }
        if (activeKeys["ControlLeft"] || activeKeys["KeyC"]) {
            cameraPosition[1] += actualMoveSpeed;
        }

        // Build proper FPS view matrix
        // Calculate basis vectors for camera orientation
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);

        // Camera basis vectors for view matrix
        // Right vector
        const xAxis = [cy, 0, -sy];
        // Up vector
        const yAxis = [sy * sp, cp, cy * sp];
        // Forward vector (into screen, negated for view matrix)
        const zAxis = [sy * cp, -sp, cy * cp];

        // Build view matrix directly (inverse of camera transform)
        let actualViewMatrix = [
            xAxis[0],
            yAxis[0],
            zAxis[0],
            0,
            xAxis[1],
            yAxis[1],
            zAxis[1],
            0,
            xAxis[2],
            yAxis[2],
            zAxis[2],
            0,
            -(
                xAxis[0] * cameraPosition[0] +
                xAxis[1] * cameraPosition[1] +
                xAxis[2] * cameraPosition[2]
            ),
            -(
                yAxis[0] * cameraPosition[0] +
                yAxis[1] * cameraPosition[1] +
                yAxis[2] * cameraPosition[2]
            ),
            -(
                zAxis[0] * cameraPosition[0] +
                zAxis[1] * cameraPosition[1] +
                zAxis[2] * cameraPosition[2]
            ),
            1,
        ];

        const viewProj = multiply4(projectionMatrix, actualViewMatrix);
        worker.postMessage({ view: viewProj });

        const currentFps = 1000 / (now - lastFrame) || 0;
        avgFps = avgFps * 0.9 + currentFps * 0.1;

        if (vertexCount > 0) {
            document.getElementById("spinner").style.display = "none";
            gl.uniformMatrix4fv(u_view, false, actualViewMatrix);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, vertexCount);
        } else {
            gl.clear(gl.COLOR_BUFFER_BIT);
            document.getElementById("spinner").style.display = "";
        }
        const progress = (100 * vertexCount) / (splatData.length / rowLength);
        if (progress < 100) {
            document.getElementById("progress").style.width = progress + "%";
        } else {
            document.getElementById("progress").style.display = "none";
        }
        fps.innerText = Math.round(avgFps) + " fps";

        // Show control hint when not locked
        if (!isPointerLocked) {
            camid.innerText = "Click to enable FPS controls";
        } else {
            camid.innerText =
                "WASD: Move | Mouse: Look | Space/C: Up/Down | ESC: Exit";
        }

        lastFrame = now;
        requestAnimationFrame(frame);
    };

    frame();

    const isPly = (splatData) =>
        splatData[0] == 112 &&
        splatData[1] == 108 &&
        splatData[2] == 121 &&
        splatData[3] == 10;

    window.addEventListener("hashchange", (e) => {
        try {
            viewMatrix = JSON.parse(decodeURIComponent(location.hash.slice(1)));
        } catch (err) {}
    });

    // File selection functionality removed - files are now loaded from server array

    let bytesRead = 0;
    let lastVertexCount = -1;
    let stopLoading = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done || stopLoading) break;

        splatData.set(value, bytesRead);
        bytesRead += value.length;

        if (vertexCount > lastVertexCount) {
            if (!isPly(splatData)) {
                worker.postMessage({
                    buffer: splatData.buffer,
                    vertexCount: Math.floor(bytesRead / rowLength),
                });
            }
            lastVertexCount = vertexCount;
        }
    }
    if (!stopLoading) {
        if (isPly(splatData)) {
            // ply file magic header means it should be handled differently
            worker.postMessage({ ply: splatData.buffer, save: false });
        } else {
            worker.postMessage({
                buffer: splatData.buffer,
                vertexCount: Math.floor(bytesRead / rowLength),
            });
        }
    }
}

// Initialize file selector
function initFileSelector() {
    const select = document.getElementById("splat-select");
    const welcomeSelect = document.getElementById("welcome-splat-select");

    // Helper function to populate a select element
    function populateSelect(selectElement) {
        if (selectElement) {
            selectElement.innerHTML = "";
            splatFiles.forEach((filename, index) => {
                const option = document.createElement("option");
                option.value = index;
                option.textContent = filename
                    .replace("splat/", "")
                    .replace(".splat", "");
                selectElement.appendChild(option);
            });
        }
    }

    // Populate both selects
    populateSelect(select);
    populateSelect(welcomeSelect);

    // Set selected option based on URL parameter for main select
    if (select) {
        const params = new URLSearchParams(window.location.search);
        const currentFile = params.get("file") || "0";
        select.value = currentFile;

        // Add change event listener
        select.addEventListener("change", function () {
            const fileIndex = this.value;
            const url = new URL(window.location);
            url.searchParams.set("file", fileIndex);
            window.location = url.toString();
        });
    }

    // Handle welcome screen controls
    const welcomeScreen = document.getElementById("welcome-screen");
    const loadButton = document.getElementById("load-splat-button");
    const screenshotCards = document.querySelectorAll(".screenshot-card");

    // Check if we should show welcome screen
    const params = new URLSearchParams(window.location.search);
    const shouldShowWelcome = !params.has("file") && !params.has("url");

    if (shouldShowWelcome) {
        // Show welcome screen on first visit
        if (welcomeScreen) {
            welcomeScreen.classList.remove("hidden");
        }

        // Handle screenshot card clicks
        screenshotCards.forEach((card) => {
            card.addEventListener("click", function () {
                // Remove selected class from all cards
                screenshotCards.forEach((c) => c.classList.remove("selected"));
                // Add selected class to clicked card
                card.classList.add("selected");

                if (welcomeSelect) {
                    // Get the file from data-file attribute
                    const fileName = card.getAttribute("data-file");
                    // Find the index of this file in the splatFiles array
                    const fileIndex = splatFiles.indexOf(fileName);
                    if (fileIndex !== -1) {
                        welcomeSelect.value = fileIndex;
                    }
                }
            });
        });

        // Handle load button click
        if (loadButton && welcomeSelect) {
            loadButton.addEventListener("click", function () {
                const selectedIndex = welcomeSelect.value;
                const url = new URL(window.location);
                url.searchParams.set("file", selectedIndex);
                window.location = url.toString();
            });
        }

        // Also update selected card when dropdown changes
        if (welcomeSelect) {
            welcomeSelect.addEventListener("change", function () {
                const selectedFile = splatFiles[this.value];
                screenshotCards.forEach((card) => {
                    if (card.getAttribute("data-file") === selectedFile) {
                        card.classList.add("selected");
                    } else {
                        card.classList.remove("selected");
                    }
                });
            });

            // Set initial selection based on dropdown
            const initialFile = splatFiles[welcomeSelect.value];
            screenshotCards.forEach((card) => {
                if (card.getAttribute("data-file") === initialFile) {
                    card.classList.add("selected");
                }
            });
        }
    } else {
        // Hide welcome screen if we have a file parameter
        if (welcomeScreen) {
            welcomeScreen.classList.add("hidden");
        }
        // Ensure DOM is ready before starting
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                main().catch((err) => {
                    console.error("Error loading splat viewer:", err);
                    document.getElementById("spinner").style.display = "none";
                    document.getElementById("message").innerText =
                        `Error: ${err.toString()}`;
                });
            });
        } else {
            // Start loading the splat file
            main().catch((err) => {
                console.error("Error loading splat viewer:", err);
                document.getElementById("spinner").style.display = "none";
                document.getElementById("message").innerText =
                    `Error: ${err.toString()}`;
            });
        }
    }
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFileSelector);
} else {
    initFileSelector();
}

// Main initialization is handled by initFileSelector
// No need to call main() here as it's already called when appropriate
