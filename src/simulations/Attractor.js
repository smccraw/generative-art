import get from 'lodash.get'

export function map(min, max, curr, newMin, newMax) {
    let t = Math.max(0, Math.min(1, (curr - min) / (max - min)))
    return newMin + t * (newMax - newMin)
}
// parseColor('#FE650D') - rgb
// parseColor('#FE650DFF') - rgba
// parseColor('#FE650D,0.2') - rgba, a as a %
export function parseColor(color) {
    let a = 255
    if (typeof color === 'string') {
        let digits = color.substring(1)
        if (digits.length === 6) {  // #FF1954
            color = parseInt(digits, 16)
        } else if (digits.length === 8) {  // #FF1954FF
            a = parseInt(digits.substring(6), 16)
            color = parseInt(digits.substring(0, 6), 16)
        } else {
            let parts = digits.split(',')
            color = parseInt(parts[0].substring(0, 6), 16)
            a = Math.min(255, Math.max(0, Math.floor(parseFloat(parts[1]) * 255)))
        }
        return {
            r: (color >> 16) & 0xFF,
            g: (color >> 8) & 0xFF,
            b: color & 0xFF,
            a: a
        }
    }
    return color
}
export function lerpColor(c1, c2, t) {
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
        cD.a = Math.floor(c1.a + t * (c2.a - c1.a))
    }
    return cD
}
// takes an array of strengths where each entry is a % on a scale of 0-100
// Example: [0,20,40,60,80,100]
// and returns an array if ever increasing numbers that represent the # of 
// pixels that maps to that color
export function mapStrengthsToPixels(colorCount, strengthArr, interestingPixels) {
    if (strengthArr.length !== colorCount) {
        strengthArr = []
        let bkt = parseFloat((100 / (colorCount - 1)).toFixed(3))
        strengthArr.push(0)
        for (let i = 1; i < (colorCount - 1); i++) {
            strengthArr.push(i * bkt)
        }
        strengthArr.push(100)
    }

    let out = []
    strengthArr.forEach((pct) => {
        out.push(Math.floor(interestingPixels * pct / 100))
    })
    return out
}

export class Attractor {
    constructor(config) {
        this.name = config.name
        this.algorithmText = config.algorithmText   // maybe text, maybe a chunk of react elements we do nothing with these
        this.description = config.description       // maybe text, maybe a chunk of react elements we do nothing with these
        this.suggestedFilename = config.suggestedFilename
        this.presets = config.presets

        // {xmin: -1.32, xmax: 2.9, ymin: -2.1, ymax: 2.3}
        this.suggestedLimits = config.suggestedLimits
        // {a: [min,max,default], b: [min,max,default], etc...}
        this.paramsNeeded = config.paramsNeeded
        this.iterator = config.iterator
        this.rawConfig = config    // some attractors may have more config than what's pulled out above
    }

    // derived classes replace this
    getNextPoint(x, y, params) {
        if (this.iterator) {
            return this.iterator(x, y, params)
        }
        // default implementation for now. TODO: Remove
        let xn = Math.sin(params.a * y) + params.c * Math.cos(params.a * x)
        let yn = Math.sin(params.b * x) + params.d * Math.cos(params.b * y)

        return { x: xn, y: yn }
    }
}

export class AttractorRunner {
    constructor(attractor, grid, params) {
        this.attractor = attractor
        this.grid = grid
        this.params = params
        this.resetStats()
    }

    resetStats() {
        this.x = get(this.params, 'x', 0)
        this.y = get(this.params, 'y', 0)
        this.minX = this.x
        this.maxX = this.x
        this.minY = this.y
        this.maxY = this.y
        this.iterations = 0
    }
    probeForLimits() {
        let iters = 1500000
        this.resetStats()

        while (iters > 0) {
            let np = this.attractor.getNextPoint(this.x, this.y, this.params)
            this.x = np.x
            this.y = np.y
            if (this.x < this.minX) {
                this.minX = this.x
            }
            if (this.x > this.maxX) {
                this.maxX = this.x
            }

            if (this.y < this.minY) {
                this.minY = this.y
            }
            if (this.y > this.maxY) {
                this.maxY = this.y
            }
            iters--
        }

        let res = this.createLimitsObject()
        this.resetStats()
        return res
    }
    createLimitsObject() {
        let res = {
            minX: this.minX,
            minY: this.minY,
            maxX: this.maxX,
            maxY: this.maxY,
            width: this.maxX - this.minX,
            height: this.maxY - this.minY
        }
        res.bestSquareSize = Math.max(res.width, res.height) * 1.1
        res.scale = Math.min(this.grid.width, this.grid.height) / res.bestSquareSize
        let extraX = res.width - res.bestSquareSize
        let extraY = res.height - res.bestSquareSize
        res.originX = res.minX + extraX / 2
        res.originY = res.minY + extraY / 2

        return res
    }

    run(iterations) {
        while (iterations > 0) {
            let np = this.attractor.getNextPoint(this.x, this.y, this.params)
            this.grid.recordPoint(np.x, np.y)

            this.x = np.x
            this.y = np.y
            if (this.x < this.minX) {
                this.minX = this.x
            }
            if (this.x > this.maxX) {
                this.maxX = this.x
            }

            if (this.y < this.minY) {
                this.minY = this.y
            }
            if (this.y > this.maxY) {
                this.maxY = this.y
            }

            this.iterations++
            iterations--
        }
    }
}

export class PixelHitGrid {
    static REFLECT_NONE = 0
    static REFLECT_LEFT_TO_RIGHT = 1
    static REFLECT_RIGHT_TO_LEFT = 2
    static REFLECT_TOP_TO_BOTTOM = 3
    static REFLECT_BOTTOM_TO_TOP = 4
    constructor(width, height) {
        this.width = width
        this.height = height
        this.pixels = []
        for (let y = 0; y < this.height; y++) {
            let row = []
            for (let x = 0; x < this.width; x++) {
                row.push(0)
            }
            this.pixels.push(row)
        }

        this.origin = { x: 0, y: 0 }
        this.scale = { x: 1, y: 1 }
        this.reflect = PixelHitGrid.REFLECT_NONE
    }

    setOriginAndScale(x, y, xScale, yScale) {
        this.origin = { x: x, y: y }
        this.scale = { x: xScale, y: yScale }
    }

    // for most attractors based on trig functions, x and y will typically be in the -3 to 3 range or close to that
    // so scale and origin are required to make a decent high pixel image out of
    recordPoint(x, y) {
        let px = Math.floor(this.scale.x * (x - this.origin.x))
        let py = Math.floor(this.scale.y * (y - this.origin.y))
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            if (this.reflect === PixelHitGrid.REFLECT_NONE) {
                this.pixels[py][px]++
            } else if (this.reflect === PixelHitGrid.REFLECT_LEFT_TO_RIGHT) {
                let midX = this.width / 2
                if (px <= midX) {
                    this.pixels[py][px]++
                    if (px !== midX) {
                        this.pixels[py][midX + (midX - px)]++
                    }
                }
            } else if (this.reflect === PixelHitGrid.REFLECT_RIGHT_TO_LEFT) {
                let midX = this.width / 2
                if (px >= midX) {
                    this.pixels[py][px]++
                    if (px !== midX) {
                        this.pixels[py][midX - (px - midX)]++
                    }
                }
            } else if (this.reflect === PixelHitGrid.REFLECT_TOP_TO_BOTTOM) {
                let midY = this.height / 2
                if (py <= midY) {
                    this.pixels[py][px]++
                    if (py !== midY) {
                        this.pixels[midY + (midY - py)][px]++
                    }
                }
            } else if (this.reflect === PixelHitGrid.REFLECT_BOTTOM_TO_TOP) {
                let midY = this.height / 2
                if (py >= midY) {
                    this.pixels[py][px]++
                    if (py !== midY) {
                        this.pixels[midY - (py - midY)][px]++
                    }
                }
            }
            return { x: px, y: py, count: this.pixels[py][px] }
        }
        return null
    }
    readPixelHitCount(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null
        }
        return this.pixels[y][x]
    }
    readPixelHitCountSafe(x, y) {
        // out of bounds is assumed to be 0 in our safe mode
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 0
        }
        return this.pixels[y][x]
    }

    buildHitCountSummary() {
        let hitsRecorded = 0
        let hitCountDistribution = {}
        let maxHitCount = 0
        let minHitCount = 999999
        let emptyPixels = 0

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let timesHit = this.pixels[y][x]
                if (timesHit > 0) {
                    if (timesHit > maxHitCount) {
                        maxHitCount = timesHit
                    }
                    if (timesHit < minHitCount) {
                        minHitCount = timesHit
                    }
                    if (!hitCountDistribution[timesHit]) {
                        hitCountDistribution[timesHit] = { occurrences: 1 }
                    } else {
                        hitCountDistribution[timesHit].occurrences++
                    }
                    hitsRecorded += timesHit
                } else {
                    emptyPixels++
                }
            }
        }

        let interestingPixels = (this.width * this.height) - emptyPixels

        // hitCountDistribution: {hitsOnPixel: occurrences} so {"22": 2100} means that there are 2100 pixels in the image that got hit 22 times
        return {
            hitsRecorded,
            minHitCount: minHitCount,
            maxHitCount: maxHitCount,
            interestingPixels,
            emptyPixels,
            hitCountDistribution
        }
    }

    // pixelMaps = [12000,5000,3000,7000,2000,...] array of pixel counts for each color in the color system strengths array
    getPixelMapRangePoints(pixelMaps, pixelCount) {
        let i = 0
        let lastTotal = 0
        while (i < pixelMaps.length) {
            let nextTotal = pixelMaps[i]

            if (lastTotal <= pixelCount && nextTotal >= pixelCount) {
                return {
                    underIdx: i - 1,
                    underPixelCount: lastTotal,
                    overIdx: i,
                    overPixelCount: nextTotal
                }
            }
            lastTotal = nextTotal
            i++
        }
        // the number is somewhere off the end of the spectrum
        return {
            underIdx: pixelMaps.length - 1,
            underPixelCount: pixelMaps[pixelMaps.length - 1],
            overIdx: -1,
            overPixelCount: -1
        }
    }

    createColorMappings(hitCountSummary, colorSystem) {
        let pixelMaps = mapStrengthsToPixels(colorSystem.colors.length, colorSystem.colorStrengths, hitCountSummary.interestingPixels)

        let totalPixels = 0
        for (let pxCnt = 1; pxCnt <= hitCountSummary.maxHitCount; pxCnt++) {
            let pxInfo = hitCountSummary.hitCountDistribution[pxCnt]
            if (pxInfo) {
                totalPixels += pxInfo.occurrences
                pxInfo.runningTotal = totalPixels
                let range = this.getPixelMapRangePoints(pixelMaps, totalPixels)
                if (range.underIdx < 0) {
                    pxInfo.color = colorSystem.colors[0]
                } else if (range.overIdx < 0) {
                    pxInfo.color = colorSystem.colors[colorSystem.colors.length - 1]
                } else {
                    let t = (totalPixels - range.underPixelCount) / (range.overPixelCount - range.underPixelCount)
                    pxInfo.color = lerpColor(colorSystem.colors[range.underIdx], colorSystem.colors[range.overIdx], t)
                }
            }
        }
    }

    postProcessPixels(hitCountSummary, outPixels) {
        const bytesPerRow = 4 * this.width

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                let clrStart = row * bytesPerRow + col * 4
                let px = this.readPixelHitCount(col, row)
                if (px <= 0) {
                    outPixels[clrStart] = 255
                    outPixels[clrStart + 1] = 255
                    outPixels[clrStart + 2] = 255
                    outPixels[clrStart + 3] = 0
                } else {
                    let item = hitCountSummary.hitCountDistribution[px]
                    let clr = { r: 0, g: 0, b: 0, a: 0 }
                    if (item) {
                        clr = item.color
                    }
                    outPixels[clrStart] = clr.r
                    outPixels[clrStart + 1] = clr.g
                    outPixels[clrStart + 2] = clr.b
                    outPixels[clrStart + 3] = clr.a
                }
            }
        }
        // this.cleanUpEmptyCruds(outPixels)
    }
}

// strength is on a scale of 1 to 100
// const colorSystem = {
//     minHitCount: 10,
//     smoothingFactor: 0, // 0, 1 or 2
//     colors: [
//         '#FFF75D,0.1',
//         '#FFC11F,0.2',
//         '#FE650DFF',
//         '#F33C04',
//         '#DA1F05',
//         '#A10100',
//         '#000000',
//     ],
//     colorStrengths: [
//         7.2,
//         12.2,
//         17.2,
//         27.2,
//         37.2,
//         47.2,
//         57.2,
//         87.3,
//     ]
// }

/* OLD CODE:

    purgeLowCountPixels(breakpoint) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let timesHit = this.pixels[y][x]
                if (timesHit <= breakpoint) {
                    this.pixels[y][x] = 0
                }
            }
        }
    }
    
    checkForPreSmoothing(x, y, dx, dy, smoothLevel) {
        const maxSmoothDist = 8
        let cx = x
        let cy = y
        let smoothDist = 0
        for (let i = 1; i <= (maxSmoothDist+1); i++) {
            let timesHit = this.readPixelHitCount(cx + i * dx, cy + i * dy)
            if (timesHit === null || timesHit !== 0) {
                if (timesHit >= smoothLevel) {
                    return
                }
                break
            }
            smoothDist++
        }

        if (smoothDist > 0 && smoothDist < maxSmoothDist) {
            let smoothVal = this.pixels[y][x]
            for (let i = 1; i <= smoothDist; i++) {
                this.pixels[cy + i * dy][cx + i * dx] = smoothVal
            }
        }
    }
    preProcessPixels(smoothLevel) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let timesHit = this.readPixelHitCount(x, y)
                if (this.isPixelAnIsland(x, y)) {    // get rid of islands
                    this.pixels[y][x] = 0
                } else if (timesHit && timesHit > 0 && timesHit < smoothLevel) {
                    this.checkForPreSmoothing(x, y, 1, 0, smoothLevel)
                    this.checkForPreSmoothing(x, y, 1, 1, smoothLevel)
                    this.checkForPreSmoothing(x, y, 0, 1, smoothLevel)
                }
            }
        }
    }

    cleanUpEmptyCruds(outPixels) {
        const bytesPerRow = 4 * this.width
        let queued = []
        for (let row = 1; row < this.height - 1; row++) {
            for (let col = 1; col < this.width - 1; col++) {
                let clrStart = row * bytesPerRow + col * 4
                let pxAlpha = outPixels[clrStart + 3]
                if (pxAlpha === 0) {
                    // if (row === 521 && col > 100) {
                    //     debugger
                    // }

                    const tests = [[-1, 0, 1, 0], [0, -1, 0, 1], [-1, -1, 1, 1], [1, -1, -1, 1]]
                    let shouldFill = false
                    let fillClr = 0
                    tests.forEach((test) => {
                        let res1 = this.getDirectionalBestColor(outPixels, col, row, test[0], test[1])
                        let res2 = this.getDirectionalBestColor(outPixels, col, row, test[2], test[3])
                        if (res1.cnt > 0 && res2.cnt > 0) {
                            shouldFill = true
                            fillClr = this.getClosestColor(outPixels, col, row, test[0], test[1])
                            if (fillClr === -1) {
                                fillClr = this.getClosestColor(outPixels, col, row, test[2], test[3])
                            }
                            return false
                        }
                    })
                    if (shouldFill) {
                        queued.push({
                            col,
                            row,
                            cc: { r: fillClr, g: fillClr, b: fillClr, a: 255 }
                        })
                    }
                } else if (this.isNineGridAroundEmpty(outPixels, col, row)) {
                    queued.push({ col: col, row: row, cc: { r: 255, g: 255, b: 255, a: 0 } })
                }
            }
        }

        queued.forEach((item) => {
            let clrStart = item.row * bytesPerRow + item.col * 4
            outPixels[clrStart] = item.cc.r
            outPixels[clrStart + 1] = item.cc.g
            outPixels[clrStart + 2] = item.cc.b
            outPixels[clrStart + 3] = item.cc.a
        })
    }

    doSmoothingCodesMatch(c1, c2) {
        let acceptable = acceptableSmoothingCodes[c1]
        let match = false
        acceptable.forEach((code) => {
            if (code === c2) {
                match = true
            }
        })
        return match
    }
    isOutPixelEmpty(outPixels, x, y) {
        if (x < 0 || x > this.width || y < 0 || y >= this.height) {
            return true
        }
        let clrStart = y * (4 * this.width) + x * 4
        let alpha = outPixels[clrStart + 3]
        return alpha === 0
    }
    isNineGridAroundEmpty(outPixels, x, y) {
        if (!this.isOutPixelEmpty(outPixels, x - 1, y - 1)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x, y - 1)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x + 1, y - 1)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x - 1, y)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x + 1, y)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x - 1, y + 1)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x, y + 1)) { return false }
        if (!this.isOutPixelEmpty(outPixels, x + 1, y + 1)) { return false }
        return true
    }

    isPixelAnIsland(x, y) {
        let count = this.readPixelHitCountSafe(x - 1, y - 1)
        count += this.readPixelHitCountSafe(x, y - 1)
        count += this.readPixelHitCountSafe(x + 1, y - 1)
        count += this.readPixelHitCountSafe(x - 1, y)
        count += this.readPixelHitCountSafe(x + 1, y)
        count += this.readPixelHitCountSafe(x - 1, y + 1)
        count += this.readPixelHitCountSafe(x, y + 1)
        count += this.readPixelHitCountSafe(x + 1, y + 1)
        return count === 0
    }

    getBWPixelColor(outPixels, x, y) {
        if (x < 0 || x > this.width || y < 0 || y >= this.height) {
            return -1
        }
        let clrStart = y * (4 * this.width) + x * 4
        let alpha = outPixels[clrStart + 3]
        if (alpha === 0) {
            return -1
        }
        return outPixels[clrStart]  // return just the red as we assume this image is in grayscale
    }
    getClosestColor(outPixels, x, y, dx, dy) {
        for (let i = 1; i <= 5; i++) {
            let px = this.getBWPixelColor(outPixels, x + i * dx, y + i * dy)
            if (px !== -1) {
                return px
            }
        }
        return -1
    }
    getDirectionalBestColor(outPixels, x, y, dx, dy) {
        let types = {}
        let maxCnt = 0
        let maxType = -1
        for (let i = 1; i <= 5; i++) {
            let px = this.getBWPixelColor(outPixels, x + i * dx, y + i * dy)
            if (px !== -1) {
                let c = types[px]
                if (!c) {
                    types[px] = 1
                } else {
                    types[px]++
                }
                if (types[px] > maxCnt) {
                    maxCnt = types[px]
                    maxType = px
                }
            }
        }
        return { pxVal: maxType, cnt: maxCnt }
    }
*/