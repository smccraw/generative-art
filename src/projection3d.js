import { ProjectionCalculator3d } from 'projection-3d-2d';
const sin = Math.sin
const cos = Math.cos

export default function initialize3dProjection(width, height, depth, scale) {
    let {points2d, points3d} = buildProjectionPointsForScale(width, height, depth, scale)
    return new ProjectionCalculator3d(points3d, points2d);
}

// width and height are of the front plane box
// depth is how far back the back box is and scale is the size of the back box
export function buildProjectionPointsForScale(width, height, depth, scale) {
    let backW = Math.floor(width * scale)
    let backH = Math.floor(height * scale)
    let padX = Math.floor((width - backW) / 2)
    let padY = Math.floor((height - backH) / 2)
    let left = padX
    let right = width - padX
    let top = padY
    let bottom = height - padY

    const points3d = [
        [0, 0, depth],
        [width, 0, depth],
        [width, height, depth],
        [0, height, depth],
        [width, height, 0],
        [0, 0, 0],
    ];
    const points2d = [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
        [width, height],
        [0, 0],
    ];
    return { points2d, points3d }
}

export function rotateAroundX(theta, x, y, z) {
    if (typeof x === 'object' && !y && !z) {
        z = x.z
        y = x.y
        x = x.x
    }
    let cosT = cos(theta)
    let sinT = sin(theta)
    return {
        x: x,
        y: y*cosT - z*sinT,
        z: y*sinT + z*cosT
    }
}

export function rotateAroundY(theta, x, y, z) {
    if (typeof x === 'object' && !y && !z) {
        z = x.z
        y = x.y
        x = x.x
    }
    let cosT = cos(theta)
    let sinT = sin(theta)
    return {
        x: x*cosT + z*sinT,
        y: y,
        z: -x*sinT + z*cosT
    }
}

export function rotateAroundZ(theta, x, y, z) {
    if (typeof x === 'object' && !y && !z) {
        z = x.z
        y = x.y
        x = x.x
    }
    let cosT = cos(theta)
    let sinT = sin(theta)
    return {
        x: x*cosT - y*sinT,
        y: x*sinT + y*cosT,
        z: z
    }
}