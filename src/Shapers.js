const abs = Math.abs
const floor = Math.floor

// The values passed in must be integers
export function getBresenhamPoints(startX, startY, endX, endY, includeEndPts) {
    const deltaCol = Math.abs(endX - startX) // zero or positive number
    const deltaRow = Math.abs(endY - startY) // zero or positive number

    let pointX = startX
    let pointY = startY

    const horizontalStep = (startX < endX) ? 1 : -1
    const verticalStep = (startY < endY) ? 1 : -1
    const points = []
    let difference = deltaCol - deltaRow

    if (includeEndPts) {
        points.push({ "x": pointX, "y": pointY })
    }
    while (true) {
        const doubleDifference = 2 * difference // necessary to store this value

        if (doubleDifference > -deltaRow) {
            difference -= deltaRow;
            pointX += horizontalStep
        }
        if (doubleDifference < deltaCol) {
            difference += deltaCol;
            pointY += verticalStep
        }

        // should we return the end point?
        if ((pointX == endX) && (pointY == endY)) {
            if (includeEndPts) {
                points.push({ "x": pointX, "y": pointY })
            }
            return points
        }
        points.push({ "x": pointX, "y": pointY })
    }
}

// generator version, values must be integers
export function* iterateBresenhamPoints(startX, startY, endX, endY, includeEndPts) {
    startX = floor(startX)
    startY = floor(startY)
    endX = floor(endX)
    endY = floor(endY)
    const deltaCol = Math.abs(endX - startX) // zero or positive number
    const deltaRow = Math.abs(endY - startY) // zero or positive number

    let pointX = startX
    let pointY = startY

    const horizontalStep = (startX < endX) ? 1 : -1
    const verticalStep = (startY < endY) ? 1 : -1
    let difference = deltaCol - deltaRow

    if (includeEndPts) {
        yield { "x": pointX, "y": pointY }
    }
    while (true) {
        const doubleDifference = 2 * difference // necessary to store this value

        if (doubleDifference > -deltaRow) {
            difference -= deltaRow;
            pointX += horizontalStep
        }
        if (doubleDifference < deltaCol) {
            difference += deltaCol;
            pointY += verticalStep
        }

        // should we return the end point?
        if ((pointX == endX) && (pointY == endY)) {
            if (includeEndPts) {
                yield { "x": pointX, "y": pointY }
            }
            return
        }
        yield { "x": pointX, "y": pointY }
    }
}

// integer part of x
function ipart(x) {
    return floor(x)
}
function round(x) {
    return floor(x + 0.5)
}
// fractional part of x
function fpart(x) {
    return x - floor(x)
}
function rfpart(x) {
    return 1 - fpart(x)
}

export function* iterateXiaolinLinePts(x0, y0, x1, y1) {
    let steep = abs(y1 - y0) > abs(x1 - x0)

    if (steep) {
        let t = x0
        x0 = y0
        y0 = t

        t = x1
        x1 = y1
        y1 = t
        // swap(x0, y0)
        // swap(x1, y1)
    }
    if (x0 > x1) {
        let t = x0
        x0 = x1
        x1 = t

        t = y0
        y0 = y1
        y1 = t
        // swap(x0, x1)
        // swap(y0, y1)
    }

    let dx = x1 - x0
    let dy = y1 - y0
    let gradient = 0
    if (dx === 0) {
        gradient = 1
    } else {
        gradient = dy / dx
    }

    // handle first endpoint
    let xend = round(x0)
    let yend = y0 + gradient * (xend - x0)
    let xgap = rfpart(x0 + 0.5)
    let xpxl1 = xend // this will be used in the main loop
    let ypxl1 = ipart(yend)
    if (steep) {
        yield {x:ypxl1, y:xpxl1, a:rfpart(yend) * xgap}
        yield {x:ypxl1 + 1, y:xpxl1, a:fpart(yend) * xgap}
    } else {
        yield {x:xpxl1, y:ypxl1, a:rfpart(yend) * xgap}
        yield {x:xpxl1, y:ypxl1 + 1, a:fpart(yend) * xgap}
    }
    let intery = yend + gradient // first y-intersection for the main loop

    // handle second endpoint
    let endPts = []
    xend = round(x1)
    yend = y1 + gradient * (xend - x1)
    xgap = fpart(x1 + 0.5)
    let xpxl2 = xend //this will be used in the main loop
    let ypxl2 = ipart(yend)
    if (steep) {
        endPts.push({x:ypxl2, y:xpxl2, a:rfpart(yend) * xgap})
        endPts.push({x:ypxl2 + 1, y:xpxl2, a:fpart(yend) * xgap})
    } else {
        endPts.push({x:xpxl2, y:ypxl2, a:rfpart(yend) * xgap})
        endPts.push({x:xpxl2, y:ypxl2 + 1, a:fpart(yend) * xgap})
    }

    // main loop
    if (steep) {
        for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
            yield {x:ipart(intery), y:x, a:rfpart(intery)}
            yield {x:ipart(intery) + 1, y:x, a:fpart(intery)}
            intery = intery + gradient
        }
    } else {
        for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
            yield {x:x, y:ipart(intery), a:rfpart(intery)}
            yield {x:x, y:ipart(intery) + 1, a:fpart(intery)}
            intery = intery + gradient
        }
    }

    yield endPts[0]
    yield endPts[1]
}
