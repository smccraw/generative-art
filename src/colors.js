export default class colors {
    static WHITE = { r: 255, g: 255, b: 255 }
    static BLACK = { r: 0, g: 0, b: 0 }

    // {r:255,g:255,b:255,a:255}
    static ensureColor255(color) {
        let a = 255
        if (color === null || typeof color === 'undefined') {
            color = { r: 0, g: 0, b: 0 }
        }
        if (typeof color === 'object') {
            if (Array.isArray(color)) {
                return { r: color[0] || 0, g: color[1] || 0, b: color[2] || 0, a: typeof color[3] === 'number' ? color[3] : 255 }
            }
            if (typeof color.r === 'number') {
                return Object.assign({}, color)
            } else if (typeof color.value !== 'undefined') {
                color = color.value
            }
        }

        if (typeof color === 'string') {
            if (color === 'transparent') {
                return { r: 0, g: 0, b: 0, a: 0 }
            }

            if (color.startsWith('#')) {
                let digits = color.substring(1)
                if (digits.length === 6) {  // #FF1954
                    color = parseInt(digits, 16)
                } else if (digits.length === 8) {  // #FF1954FF
                    a = parseInt(digits.substring(6), 16)
                    color = parseInt(digits.substring(0, 6), 16)
                }
            } else if (color.startsWith('0x')) {
                let digits = color.substring(2)
                if (digits.length === 6) {  // #FF1954
                    color = parseInt(digits, 16)
                } else if (digits.length === 8) {  // #FF1954FF
                    a = parseInt(digits.substring(6), 16)
                    color = parseInt(digits.substring(0, 6), 16)
                }
            } else {
                let val = colors.HTML_COLORS[color]
                if (val) {
                    return colors.ensureColor255(val)
                } else {
                    return { r: 0, g: 0, b: 0, a: 0 }
                }
            }
        }

        return {
            b: color & 0xFF,
            g: (color >> 8) & 0xFF,
            r: (color >> 16) & 0xFF,
            a: a
        }
    }

    // ensures alpha is 0-255. If alpha===1 exactly, then we return either 255 or if oneIs contains a number
    static ensureAlpha255(alpha, oneIs) {
        if (!typeof alpha === 'number') {
            return 255
        }
        if (alpha === 1) {
            if (typeof oneIs === 'number') {
                return oneIs
            } else {
                return 255
            }
        }
        if (alpha < 1 && alpha >= 0) {
            return Math.round(alpha * 255)
        } else if (alpha > 1 && alpha <= 255) {
            return Math.floor(alpha)
        }
        return 255
    }

    // ensure alpha is 0.0 - 1.0. If alpha===1 exactly, then we return either 1 or if oneIs contains a number
    static ensureAlpha1(alpha, oneIs) {
        if (!typeof alpha === 'number') {
            return 1
        }
        if (alpha === 1) {
            if (typeof oneIs === 'number') {
                return oneIs
            } else {
                return 1
            }
        }
        if (alpha < 1 && alpha >= 0) {
            return alpha
        } else if (alpha > 1 && alpha <= 255) {
            return (alpha / 255)
        }
        return 1
    }

    static makeGrayColor(val, pct) {
        if (pct) {
            let c = Math.min(255, Math.max(0, Math.round(val * 255)))
            return { r: c, g: c, b: c }
        } else {
            let c = Math.min(255, Math.max(0, val))
            return { r: c, g: c, b: c }
        }
    }

    static colorDist(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
    }
    static makeColorStyle(color) {
        if (color === null || typeof color === 'undefined') {
            return 'black'
        }
        if (typeof color === 'string') {
            return color
        }
        if (typeof color === 'object') {
            if (typeof color.r === 'number') {
                if (typeof color.a === 'number') {
                    return `rgba(${color.r},${color.g},${color.b},${colors.ensureAlpha1(color.a)})`
                } else {
                    return `rgb(${color.r},${color.g},${color.b})`
                }
            } else if (typeof color.value !== 'undefined') {
                color = color.value
            }
        }

        return `rgb(${(color >> 16) & 0xFF},${(color >> 8) & 0xFF},${color & 0xFF})`
    }

    static sameColors(c1, c2) {
        return (c1.r === c2.r && c1.g === c2.g && c1.b === c2.b)
    }
    static complementaryColor(c) {
        return {
            r: 255 - c.r,
            g: 255 - c.g,
            b: 255 - c.b
        }
    }
    static addColors(c1, c2) {
        return {
            r: Math.round((c1.r + c2.r) / 2),
            g: Math.round((c1.g + c2.g) / 2),
            b: Math.round((c1.b + c2.b) / 2),
        }
    }

    static easeColor(c1, c2, t) {
        t = Math.max(0, Math.min(1, t))
        let cD = {
            r: c1.r + t * (c2.r - c1.r),
            g: c1.g + t * (c2.g - c1.g),
            b: c1.b + t * (c2.b - c1.b)
        }
        cD.r = Math.floor(cD.r)
        cD.g = Math.floor(cD.g)
        cD.b = Math.floor(cD.b)
        if (typeof c1.a === 'number') {
            cD.a = c1.a + t * (c2.a - c1.a)
        }
        return cD
    }
    static HSLtoRGB(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
    }

    static HSBtoRGB(h, s, b) {
        s /= 100;
        b /= 100;
        const k = (n) => (n + h / 60) % 6;
        const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
        return { r: Math.round(255 * f(5)), g: Math.round(255 * f(3)), b: Math.round(255 * f(1)) };
    }

    static RGBToHSB(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const v = Math.max(r, g, b),
            n = v - Math.min(r, g, b);
        const h =
            n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
        return [60 * (h < 0 ? h + 6 : h), v && (n / v) * 100, v * 100];
    }

    static RGBToHSL(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
                ? (g - b) / s
                : l === g
                    ? 2 + (b - r) / s
                    : 4 + (r - g) / s
            : 0;
        return [
            60 * h < 0 ? 60 * h + 360 : 60 * h,
            100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
            (100 * (2 * l - s)) / 2,
        ];
    }

    // these all get converted to {r,g,b} format, we just list them here like this because you can see the actual colors
    // in most modern editors
    static HTML_COLORS = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkgrey": "#a9a9a9",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkslategrey": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dimgrey": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "goldenrod": "#daa520",
        "gold": "#ffd700",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "grey": "#808080",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavenderblush": "#fff0f5",
        "lavender": "#e6e6fa",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgray": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightgrey": "#d3d3d3",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightslategrey": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370db",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#db7093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "slategrey": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    }
}

for (let name in colors.HTML_COLORS) {
    let val = colors.HTML_COLORS[name]
    if (typeof val === 'string') {
        colors.HTML_COLORS[name] = colors.ensureColor255(val)
    }
}

export class ColorLerper {
    constructor(colorArr) {
        this.colors = colorArr.map((c) => colors.ensureColor255(c))
    }
    getColor(t) {
        if (this.autoLerping) {
            t = this.t
            this.t = (this.t + this.deltaT) % 1
        }

        t = Math.abs(t) % 1
        if (this.colors.length === 1) {
            return this.colors[0]
        }

        let lerpChunks = this.colors.length - 1
        let chunkSize = 1 / lerpChunks
        let clrIdx = Math.min(lerpChunks - 1, Math.floor(t / chunkSize))
        let tsub = (t - (chunkSize * clrIdx)) / chunkSize
        let c1 = this.colors[clrIdx]
        let c2 = this.colors[clrIdx + 1]
        if (!c2) {
            debugger;
        }
        return colors.easeColor(c1, c2, tsub)
    }
    setAutoLerping(deltaT) {
        this.autoLerping = true
        this.deltaT = deltaT
        this.t = 0
    }
}

export class ColorAutoLerper {
    constructor(colorArr, deltaT) {
        this.colors = colorArr.map((c) => colors.ensureColor255(c))
        this.deltaT = deltaT
        this.t = 0
    }
    getNextColor() {
        let t = this.t
        this.t = (this.t + this.deltaT) % 1

        if (this.colors.length === 1) {
            return this.colors[0]
        }

        let lerpChunks = this.colors.length - 1
        let chunkSize = 1 / lerpChunks
        let clrIdx = Math.min(lerpChunks - 1, Math.floor(t / chunkSize))
        let tsub = (t - (chunkSize * clrIdx)) / chunkSize
        let c1 = this.colors[clrIdx]
        let c2 = this.colors[clrIdx + 1]
        if (!c2) {
            debugger;
        }
        return colors.easeColor(c1, c2, tsub)
    }
    setAutoLerping(deltaT) {
        this.autoLerping = true

    }
}

export class RandomColorGenerator {
    constructor(clrs, rand) {
        this.clrs = clrs
        this.rand = rand
    }
    getNextColor() {
        return colors.ensureColor255(this.rand.random(this.clrs))
    }
}

export class SequentialColorGenerator {
    constructor(clrs) {
        this.clrs = clrs
        this.nextIdx = 0
    }
    getNextColor() {
        let clr = colors.ensureColor255(this.clrs[this.nextIdx])
        this.nextIdx = (this.nextIdx + 1) % this.clrs.length
        return clr
    }
}

export class StaticColorGenerator {
    constructor(clr) {
        this.clr = colors.ensureColor255(clr)
    }
    getNextColor() {
        return this.clr
    }
}