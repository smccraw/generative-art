import bspline from 'b-spline'
import { Bezier } from 'bezier-js'
import { getCurvePoints } from 'cardinal-spline-js'
import { getBresenhamPoints } from './Shapers'
import utils from './utils'

export class LineCurver {
    constructor(x1,y1,z1,x2,y2,z2) {
        this.x1 = x1
        this.y1 = y1
        this.z1 = z1
        this.x2 = x2
        this.y2 = y2
        this.z2 = z2
        this.dx = x2 - x1
        this.dy = y2 - y1
        this.dz = z2 - z1
    }

    getPoint(t) {
        if (t <= 0) {
            return {x: this.x1, y: this.y1, z: this.z1}
        } else if (t >= 1) {
            return {x: this.x2, y: this.y2, z: this.z2}
        } else {
            return {x: this.x1 + this.dx*t, y: this.y1 + this.dy*t, z: this.z1 + this.dz*t}
        }
    }
}
export class BSplineCurver {
    constructor(degree, points, knots) {
        this.degree = degree
        this.points = points
        this.knots = knots
    }
    // returns: {x,y,t}
    getPoint(t) {
        let res = bspline(t, this.degree, this.points, this.knots)
        return { x: res[0], y: res[1], t: t }
    }

    static ensureProperPointsFormat(pts) {
        let bsPts = []
        if (typeof pts[0] === 'number') {
            // flat array with 2 pairs per point: [x1, y1, x2, y2]
            for (let i=0; i < pts.length; i+=2) {
                bsPts.push([pts[i], pts[i+1]])
            }
        } else if (Array.isArray(pts[0])) {
            // array of arrays with 2 pairs per point: [[x1, y1], [x2, y2]]
            bsPts = pts
        } else if (typeof pts[0].x === 'number') {
            // array of objects with x/y pairs per point: [{x:#,y:#}, {x:#,y:#}]
            pts.forEach((pt) => {
                bsPts.push([pt.x, pt.y])
            })
        }
        return bsPts
    }
    static makeClamped(degree, pts) {
        let knots = []
        pts = BSplineCurver.ensureProperPointsFormat(pts)
        let kcnt = pts.length + degree + 1
        let mids = kcnt - 2 * (degree + 1)
        for (let i = 0; i <= degree; i++) {
            knots.push(0)
        }
        let num = 1
        for (let i = 0; i < mids; i++) {
            knots.push(num++)
        }
        for (let i = 0; i <= degree; i++) {
            knots.push(num)
        }

        return new BSplineCurver(degree, pts, knots)
    }
    static makeUniform(degree, pts) {
        let knots = []
        pts = BSplineCurver.ensureProperPointsFormat(pts)
        let kcnt = pts.length + degree + 1
        for (let i = 0; i < kcnt; i++) {
            knots.push(i)
        }
        return new BSplineCurver(degree, pts, knots)
    }
}

export class BezierCurver {
    constructor(bezier) {
        this.bezier = bezier
    }
    // returns: {x,y,t}
    getPoint(t) {
        return this.bezier.get(t)
    }
    static makeFromPoints(pts) {
        if (typeof pts[0] === 'number') {
            // flat array with 2 pairs per point: [x1, y1, x2, y2]
            if (pts.length === 6) {
                return new BezierCurver(new Bezier(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]))
            } else if (pts.length === 8) {
                return new BezierCurver(new Bezier(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]))
            }
        } else if (Array.isArray(pts[0])) {
            if (pts.length === 3) {
                return new BezierCurver(new Bezier(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]))
            } else if (pts.length === 4) {
                return new BezierCurver(new Bezier(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]))
            }
        } else if (typeof pts[0].x === 'number') {
            if (pts.length === 3) {
                return new BezierCurver(new Bezier(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y))
            } else if (pts.length === 4) {
                return new BezierCurver(new Bezier(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y))
            }

        }
        return null
    }
}

export class CardinalSplineCurver {
    constructor(curvePts) {
        this.curvePts = curvePts
        this.length = this.calculateLength()
    }
    calculateLength() {
        let len = 0

        for (let i = 2; i < (this.curvePts.length - 1); i += 2) {
            let dx = this.curvePts[i] - this.curvePts[i - 2]
            let dy = this.curvePts[i + 1] - this.curvePts[i - 1]
            if (isNaN(dx) || isNaN(dy)) {
                return len
            }
            len += Math.sqrt(dx * dx + dy * dy)
        }
        return len
    }
    // returns: {x,y,t}
    getPoint(t) {
        if (t <= 0) {
            return { x: this.curvePts[0], y: this.curvePts[1] }
        } else if (t >= 1) {
            return { x: this.curvePts[this.curvePts.length - 2], y: this.curvePts[this.curvePts.length - 1], t: t }
        }
        let dist = t * this.length
        let travelled = 0

        for (let i = 2; i < (this.curvePts.length - 1); i += 2) {
            let dx = this.curvePts[i] - this.curvePts[i - 2]
            let dy = this.curvePts[i + 1] - this.curvePts[i - 1]
            let len = Math.sqrt(dx * dx + dy * dy)

            // are we there?
            if ((travelled + len) >= dist) {
                let tt = (dist - travelled) / len
                return { x: this.curvePts[i - 2] + tt * dx, y: this.curvePts[i - 1] + tt * dy, t: t }

            }
            travelled += len
        }
        return { x: this.curvePts[this.curvePts.length - 2], y: this.curvePts[this.curvePts.length - 1], t: t }
    }
    static makeFromPoints(pts, tension, segmentResolution, closed) {
        let flatPts = []
        if (typeof pts[0] === 'number') {
            // flat array with 2 pairs per point: [x1, y1, x2, y2]
            flatPts = pts
        } else if (Array.isArray(pts[0])) {
            // array of arrays with 2 pairs per point: [[x1, y1], [x2, y2]]
            pts.forEach((pt) => {
                flatPts.push(pt[0])
                flatPts.push(pt[1])
            })
        } else if (typeof pts[0].x === 'number') {
            // array of objects with x/y pairs per point: [{x:#,y:#}, {x:#,y:#}]
            pts.forEach((pt) => {
                flatPts.push(pt.x)
                flatPts.push(pt.y)
            })
        }
        let outPts = getCurvePoints(flatPts, tension, segmentResolution, closed)
        return new CardinalSplineCurver(outPts)
    }
}

export function getContiguousPoints(curver, resolution) {
    let pts = []
    for (let pt of iterateContiguousPoints(curver, resolution)) {
        pts.push(pt)
    }
    return pts
}
export function* iterateContiguousPoints(curver, resolution) {
    let t = 0
    let lastPt = utils.quantizePoint(curver.getPoint(t))
    yield lastPt
    t += resolution
    while (t <= 1) {
        let nextPt = utils.quantizePoint(curver.getPoint(t))
        
        // if (isNaN(nextPt.x) || isNaN(nextPt.y)) {
        //     console.log(JSON.stringify(curver.curvePts, null, 2))
        //     let pt = curver.getPoint(t)
        //     pt = utils.quantizePoint(pt)
        // }
        if (nextPt.x === lastPt.x) {
            if (nextPt.y !== lastPt.y) {
                let cnt = Math.abs(nextPt.y - lastPt.y)
                let dy = Math.sign(nextPt.y - lastPt.y)
                let y = lastPt.y + dy
                while (cnt > 0) {
                    yield { x: nextPt.x, y: y, t:nextPt.t}
                    y += dy
                    cnt--
                }
            }
        } else if (nextPt.y === lastPt.y) {
            let cnt = Math.abs(nextPt.x - lastPt.x)
            let dx = Math.sign(nextPt.x - lastPt.x)
            let x = lastPt.x + dx
            while (cnt > 0) {
                yield { x: x, y: nextPt.y, t:nextPt.t}
                x += dx
                cnt--
            }
        } else {
            let pts = getBresenhamPoints(lastPt.x, lastPt.y, nextPt.x, nextPt.y, true)
            for (let i=1; i<pts.length; i++) {
                yield Object.assign(pts[i], {t:nextPt.t})
            }
        }

        lastPt = nextPt
        if (t !== 1) {
            t = Math.min(1, t + resolution)
        } else {
            break
        }
    }
}
