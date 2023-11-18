const DEG_HELPER = 180 / Math.PI;
export function degs(rad) {
    return rad * DEG_HELPER;
}

export function rads(deg) {
    return deg / DEG_HELPER;
}

export default class Vector {
    constructor(x, y) {
        if (typeof x === 'object') {
            if (Array.isArray(x)) {
                this.x = x[0];
                this.y = x[1];
            } else {
                this.x = x.x
                this.y = x.y
            }
        } else {
            this.x = x;
            this.y = y;
        }
        this.magCalc = -1
    }
    xInt() { return Math.floor(this.x) }
    yInt() { return Math.floor(this.y) }

    equals(xOrV, y) {
        if (typeof y === 'number') {
            return (this.x === xOrV && this.y === y)
        }
        return (this.x === xOrV.x && this.y === xOrV.y)
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        this.magCalc = -1;
    }

    setPolar(len, angleDegs) {
        this.x = len * Math.cos(angleDegs * Math.PI / 180)
        this.y = len * Math.sin(angleDegs * Math.PI / 180)
        return this
    }

    pixelate() {
        return new Vector(Math.round(this.x), Math.round(this.y))
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    addScalars(x, y) {
        return new Vector(this.x + x, this.y + y);
    }
    subtr(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    subtrScalars(x, y) {
        return new Vector(this.x - x, this.y - y);
    }
    accumulateScalars(x, y) {
        this.x += x
        this.y += y
    }
    mag() {
        if (this.magCalc < 0) {
            this.magCalc = Math.sqrt(this.x ** 2 + this.y ** 2);
        }
        return this.magCalc;
    }
    magSquared() {
        return this.x ** 2 + this.y ** 2
    }
    isMagZero() {
        return (this.x === 0 && this.y === 0)
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    div(n) {
        return new Vector(this.x / n, this.y / n);
    }

    normal() {
        return new Vector(-this.y, this.x).unit();
    }

    unit() {
        if (this.mag() === 0) {
            return new Vector(0, 0);
        } else {
            return new Vector(this.x / this.mag(), this.y / this.mag());
        }
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }
    angleDeg() {
        return Vector.radian2degrees(Math.atan2(this.y, this.x));
    }
    rotate(angle) {
        var nx = (this.x * Math.cos(angle)) - (this.y * Math.sin(angle));
        var ny = (this.x * Math.sin(angle)) + (this.y * Math.cos(angle));

        return new Vector(nx, ny);
    }
    rotateDeg(angle) {
        angle = Vector.degrees2radian(angle);
        return this.rotate(angle);
    }
    turnRight90() {
        return new Vector(-this.y, this.x);
    }
    turnLeft90() {
        return new Vector(this.y, -this.x);
    }
    turn180() {
        return new Vector(-this.x, -this.y);
    }
    getLeftRightVecs() {
        let dx = this.y
        let dy = -this.x
        if (Math.abs(dx) > Math.abs(dy)) {
            return {
                left: { x: dx / Math.abs(dx), y: dy / Math.abs(dx) },
                right: { x: -dx / Math.abs(dx), y: -dy / Math.abs(dx) },
                fore: { x: this.x / Math.abs(dx), y: this.y / Math.abs(dx) },
                back: { x: -this.x / Math.abs(dx), y: -this.y / Math.abs(dx) }
            }
        } else {
            return {
                left: { x: dx / Math.abs(dy), y: dy / Math.abs(dy) },
                right: { x: -dx / Math.abs(dy), y: -dy / Math.abs(dy) },
                fore: { x: this.x / Math.abs(dy), y: this.y / Math.abs(dy) },
                back: { x: -this.x / Math.abs(dy), y: -this.y / Math.abs(dy) }
            }
        }
    }

    static fromPoints(ptStart, ptEnd) {
        return new Vector(ptEnd.x - ptStart.x, ptEnd.y - ptStart.y)
    }
    // equality comparison, keeping in mind we are dealing with pixels
    static isSame(v1, v2) {
        // are we working with a unit vector here?
        if (Math.abs(v1.x) <= 1 && Math.abs(v1.y) <= 1) {
            let dx = Math.abs(v1.x - v2.x)
            let dy = Math.abs(v1.y - v2.y)

            return (dx <= 0.0001 && dy <= 0.0001)
        } else {
            // do integer checks since we are dealing with pixels
            if (Math.round(v1.x) === Math.round(v2.x)) {
                if (Math.round(v1.y) === Math.round(v2.y)) {
                    return true
                }
            }
            return false
        }
    }

    distanceToLine(lineStart, lineEnd) {
        return Vector.pointLineDistance(this, lineStart, lineEnd)
    }

    static pointLineDistance(pt, lineStart, lineEnd) {
        const numerator = Math.abs((lineEnd.x - lineStart.x) * (lineStart.y - pt.y) - (lineStart.x - pt.x) * (lineEnd.y - lineStart.y));

        const denominator = Math.sqrt((lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2);
        return numerator / denominator;
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static radian2degrees(rad) {
        return rad * DEG_HELPER;
    }

    static degrees2radian(deg) {
        return deg / DEG_HELPER;
    }
}