import {iterateContiguousPoints} from "../Curvers"
import colors from "../colors"

// dotter has 2 methods we need: stroke(r,g,b,a) and point(x,y)
// p5 canvas and images work straight up as does our painter pencil
export function drawSolidSpline(dotter, curver, clr, alpha255, precision) {
    precision = precision || 0.01
    let paintClr = clr
    if (typeof clr.getNextColor === 'function') {
        paintClr = clr.getNextColor()
    }
    dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
    for (let pt of iterateContiguousPoints(curver, precision)) {
        // if (typeof clr.getNextColor === 'function') {
        //     paintClr = clr.getNextColor()
        //     dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
        // }
        dotter.point(pt.x, pt.y)
    }
}
export function drawSolidSplineWithLines(dotter, curver, clr, alpha255, precision) {
    precision = precision || 0.01
    let paintClr = clr
    if (typeof clr.getNextColor === 'function') {
        paintClr = clr.getNextColor()
    }
    dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
    let lastPt = curver.getPoint(0)
    let t = precision
    while (t <= 1) {
        let pt = curver.getPoint(t)
        dotter.line(lastPt.x, lastPt.y, pt.x, pt.y)
        lastPt = pt

        if (t >= 1) {
            break;
        }
        t = Math.min(1, t + precision)
    }
}
export function drawDeltaSolidSpline(dotter, curver1, curver2, clr, alpha255, precision) {
    precision = precision || 0.01
    let paintClr = clr
    if (typeof clr.getNextColor === 'function') {
        paintClr = clr.getNextColor()
    }
    dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)

    let lastGen = iterateContiguousPoints(curver2, precision)
    for (let pt of iterateContiguousPoints(curver1, precision)) {
        let pt2 = lastGen.next()
        if (!pt2.done) {
            // if (typeof clr.getNextColor === 'function') {
            //     paintClr = clr.getNextColor()
            //     dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
            // }
            dotter.line(pt.x, pt.y, pt2.value.x, pt2.value.y)
        }
    }
}

// liner has 2 methods we need: stroke(r,g,b,a) and line(x1,y1,x2,y2)
// uniformColor is optional, the typical behavior is to use the clr on the bot
export function drawFriendlyLines(botSys, liner, alpha, options) {
    options = options || {}
    botSys.bots.forEach((bot) => {
        if (!bot.noPaint) {
            let fadeIn = 1, clr = bot.clr
            
            if (options.fadeIn > 0) {
                fadeIn = Math.min(1, botSys.frameCount / options.fadeIn)
            }
            if (options.uniformColor) {
                clr = colors.ensureColor255(options.uniformColor)
            }
            if (typeof bot.fadeAlpha === 'number') {
                fadeIn *= bot.fadeAlpha
            }

            liner.stroke(clr.r, clr.g, clr.b, Math.min(255, Math.round(255 * alpha * fadeIn)))
            
            let friends = botSys.resolveFriendships(bot)
            friends.forEach((botF) => {
                liner.line(bot.xInt(), bot.yInt(), botF.xInt(), botF.yInt())
            })
        }
    })
}
