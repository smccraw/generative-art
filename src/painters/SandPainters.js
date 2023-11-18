import utils from "../utils"
import colors from "../colors"

const sin = Math.sin

// dotter has 2 methods we need: stroke(r,g,b,a) and point(x,y)
// p5 canvas and images work straight up as does our painter pencil
export function drawSandSplineGrains(dotter, curver, grains, clr, alpha255, noEnds) {
    alpha255 = colors.ensureAlpha255(alpha255)
    grains = Math.max(3, grains)    // minimum of 3 grains
    let tStep = 1 / (grains - 1)
    let t = 0

    if (noEnds) {
        t += tStep
    }
    let paintClr = clr
    if (typeof clr.getNextColor === 'function') {
        paintClr = clr.getNextColor()
    }
    dotter.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
    while (t <= 1) {
        let pt = utils.quantizePoint(curver.getPoint(t))

        if (!noEnds || t !== 1) {
            dotter.point(pt.x, pt.y)
        }

        if (t !== 1) {
            t = Math.min(1, t + tStep)
        } else {
            break
        }
    }
}

export function drawSandSplineMulticolorGrains(dotter, curver, grains, clrGenerator, alpha255, noEnds) {
    grains = Math.max(3, grains)    // minimum of 3 grains
    let tStep = 1 / (grains - 1)
    let t = 0

    if (noEnds) {
        t += tStep
    }
    while (t <= 1) {
        let clr = clrGenerator.getNextColor()
        dotter.stroke(clr.r, clr.g, clr.b, alpha255)
        let pt = utils.quantizePoint(curver.getPoint(t))

        if (!noEnds || t !== 1) {
            dotter.point(pt.x, pt.y)
        }

        if (t !== 1) {
            t = Math.min(1, t + tStep)
        } else {
            break
        }
    }
}


// export class SweepingSandStrokePen {
//     constructor(paintSet, expose, arena, alpha) {
//         this.paintSet = paintSet
//         this.alpha = alpha
//         this.sands = [
//             new SweepingSandPainter(paintSet.palette, arena.painterRand, alpha),
//             new SweepingSandPainter(paintSet.palette, arena.painterRand, alpha),
//             new SweepingSandPainter(paintSet.palette, arena.painterRand, alpha)
//         ]
//         this.expose = expose
//         this.exposureHighlight = utils.makeColorRGB(paintSet.exposureHighlight)
//         this.exposureShadow = utils.makeColorRGB(paintSet.exposureShadow)
//     }

//     draw(gb, arena, p5) {
//         gb.loadPixels()
//         arena.bots.forEach((bot) => {
//             if (!bot.sands) {
//                 bot.sands = [
//                     new SweepingSandPainter(this.paintSet.palette, arena.painterRand, this.alpha),
//                     new SweepingSandPainter(this.paintSet.palette, arena.painterRand, this.alpha),
//                     new SweepingSandPainter(this.paintSet.palette, arena.painterRand, this.alpha)
//                 ]
//             }
//             let friends = resolveFriendships(bot, arena)
//             friends.forEach((botF) => {
//                 if (bot.id < botF.id) {
//                     if (Array.isArray(bot.sands)) {
//                         bot.sands.forEach((sand) => {
//                             sand.render(gb, bot.xInt(), bot.yInt(), botF.xInt(), botF.yInt())
//                         })
//                     } else {
//                         this.sands.forEach((sand) => {
//                             sand.render(gb, bot.xInt(), bot.yInt(), botF.xInt(), botF.yInt())
//                         })
//                     }
//                 }
//             })
//         })
//         if (this.expose) {
//             exposeBots(gb, arena, this.exposureHighlight, this.exposureShadow)
//         }
//         gb.updatePixels()
//     }
// }

// adapted from j.tarbells code @ https://github.com/jaredstarbell/GenerativeSpaces.git
export class SweepingSandPainter {
    constructor(clrGenerator, rand, alpha255) {
        this.MAX_G = 0.22

        this.alpha255 = alpha255 || 28.0
        this.rand = rand
        this.p = rand.random()
        this.clrGenerator = clrGenerator
        this.g = rand.randomBetween(0.01, 0.1)
    }
    render(dotter, x1, y1, x2, y2) {
        let clr = this.clrGenerator.getNextColor()
        // dot the ends and  add in a little 3d effect
        dotter.stroke(255, 0.2)
        dotter.point(x1, y1-1)
        dotter.point(x2, y2-1)
        dotter.stroke(255, 0.1)
        dotter.point(x1, y1-2)
        dotter.point(x2, y2-2)

        dotter.stroke(0, 0.2)
        dotter.point(x1, y1+1)
        dotter.point(x2, y2+1)
        dotter.stroke(0, 0.1)
        dotter.point(x1, y1+2)
        dotter.point(x2, y2+2)

        dotter.stroke(clr.r, clr.g, clr.b, this.alpha255)
        dotter.point(x1, y1)
        dotter.point(x2, y2)
        // draw painting sweeps
        let sinP = sin(this.p)
        dotter.point(x2 + (x1 - x2) * sinP, y2 + (y1 - y2) * sinP)

        this.g += this.rand.randomBetween(-0.050, 0.050);
        if (this.g < -this.MAX_G) {
            this.g = -this.MAX_G;
        }
        if (this.g > this.MAX_G) {
            this.g = this.MAX_G;
        }

        let w = this.g / 10.0;
        for (let i = 0; i < 6; i++) {
            let a = 0.1 - i / 60;
            let sinIW = sin(i * w)
            let sinPIW = sin(this.p + sinIW)
            let sinPIW_minus = sin(this.p - sinIW)
            dotter.stroke(clr.r, clr.g, clr.b, 256 * a)

            dotter.point(x2 + (x1 - x2) * sinPIW, y2 + (y1 - y2) * sinPIW)
            dotter.point(x2 + (x1 - x2) * sinPIW_minus, y2 + (y1 - y2) * sinPIW_minus)
        }
    }
}

export class TriSandPainter {
    constructor(clrGenerator, offset, controller, alpha) {
        this.alpha255 = colors.ensureAlpha255(alpha || 28.0)
        this.offset = offset
        this.controller = controller
        this.rand = controller.rand
        this.max_wiggle = 0.06
        this.clrGenerator = clrGenerator
        this.wiggle = controller.rand.randomBetween(this.max_wiggle / 3, this.max_wiggle * 0.667)
    }
    render(dotter, x1, y1, x2, y2) {
        let clr = this.clrGenerator.getNextColor()
        
        let a = this.alpha255
        dotter.stroke(clr.r, clr.g, clr.b, a)
        dotter.point(Math.round(x1 + (x2 - x1) * this.offset), Math.round(y1 + (y2 - y1) * this.offset))

        this.wiggle += this.rand.randomBetween(-0.005, 0.005);
        if (this.wiggle < -this.max_wiggle) {
            this.wiggle = -this.max_wiggle;
        }
        if (this.wiggle > this.max_wiggle) {
            this.wiggle = this.max_wiggle;
        }

        for (let i = 1; i < 6; i++) {
            a = 0.1 - i / 60;
            let sinIW = sin(i * this.wiggle)

            dotter.stroke(clr.r, clr.g, clr.b, colors.ensureAlpha255(a))
            dotter.point(Math.round(x1 + (x2 - x1) * (this.offset + sinIW)), Math.round(y1 + (y2 - y1) * (this.offset + sinIW)))
        }
    }
}


