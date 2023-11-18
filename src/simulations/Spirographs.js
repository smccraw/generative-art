import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import P5Canvas from "../components/P5Canvas"
import SpiralNode from "../components/SpiralNode"
import colors, { ColorAutoLerper } from '../colors'
import get from "lodash.get"
import BotSystem, { Bot } from "../components/BotSystem.js"
import { CardinalSplineCurver } from "../Curvers"
import { VariableChangeSet, makeSelectorOptions } from "../components/VariableChanger.js"
import colorSchemes from "../ColorSchemes.js"
import Vector from "../Vector.js"

const sind = (d) => Math.sin(d * Math.PI / 180)
const cosd = (d) => Math.cos(d * Math.PI / 180)

export function MechanicalBloom1(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let variableSet = new VariableChangeSet()
    let colorLerper = null

    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 2)

    let controller = new P5Controller({
        botSystem: null,
        width: width,
        height: height,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        frameRate: 120,
        finishedArt: false,
        variableSet: variableSet
    })

    let t = 0
    let root = null
    let seg1 = null
    let seg2 = null
    let seg3 = null
    let innerSeg1 = null
    let innerSeg2 = null
    let innerSeg2a = null
    let innerSeg3 = null
    const innerR = 85
    const outerR = Math.min(width, height) * 0.45 - innerR
    const speedMx = 0.125
    const ANG_SEP = 79

    controller.autoPauseAt = 360 / speedMx
    controller.initializeSystem = (ctrl, reset) => {
        t = 0
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)

        root = new SpiralNode(null, { startingX: width / 2, startingY: height / 2 })
        seg1 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx),
                y: outerR * sind(t * speedMx),
            }
        })
        innerSeg1 = seg1.add((t, o) => {
            return {
                x: innerR * cosd(-8 * t * speedMx),
                y: innerR * sind(-8 * t * speedMx),
            }
        })
        seg2 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx + ANG_SEP),
                y: outerR * sind(t * speedMx + ANG_SEP),
            }
        })
        innerSeg2 = seg2.add((t, o) => {
            return {
                x: innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
        innerSeg2a = seg2.add((t, o) => {
            return {
                x: -innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: -innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
        seg3 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx + 2 * ANG_SEP),
                y: outerR * sind(t * speedMx + 2 * ANG_SEP),
            }
        }) //, {paintStyle: 'sand', color: {r:0, g:0xd7, b:0xf6, a:132}, palette: HORSEY_PALETTE})
        innerSeg3 = seg3.add((t, o) => {
            return {
                x: innerR * cosd(-8 * t * speedMx + 2 * ANG_SEP),
                y: innerR * sind(-8 * t * speedMx + 2 * ANG_SEP),
            }
        })
    }
    controller.initializeSystem()

    const createSplineCurver = () => {
        let pts = [
            innerSeg1.screenPt.x,
            innerSeg1.screenPt.y,

            innerSeg2.screenPt.x,
            innerSeg2.screenPt.y,

            innerSeg2a.screenPt.x,
            innerSeg2a.screenPt.y,

            innerSeg3.screenPt.x,
            innerSeg3.screenPt.y,
        ]

        return CardinalSplineCurver.makeFromPoints(pts, 0.5, 32, false)
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        // recalc the entire tree
        root.recalc(t, { n: 1, nOf: 1 }, 0, 0, 1)

        let curver = createSplineCurver()
        controller.setStrokeColor(sketchBuffer, colorLerper.getNextColor(), 0.05)
        sketchBuffer.strokeWeight(1)
        for (let i = 2; i < (curver.curvePts.length - 1); i += 2) {
            let pt1 = [curver.curvePts[i - 2], curver.curvePts[i - 1]]
            let pt2 = [curver.curvePts[i], curver.curvePts[i + 1]]

            sketchBuffer.line(pt1[0], pt1[1], pt2[0], pt2[1])
        }
        t += 1
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots) {
            if (root && root.screenPt) {
                p5.stroke(0, 0xa5, 0xff, 128)
                p5.noFill()
                p5.circle(root.screenPt.x, root.screenPt.y, (outerR + innerR) * 2)

                p5.circle(seg1.screenPt.x, seg1.screenPt.y, innerR * 2)
                p5.circle(seg2.screenPt.x, seg2.screenPt.y, innerR * 2)
                p5.circle(seg3.screenPt.x, seg3.screenPt.y, innerR * 2)
                root.drawOnOverlay(p5, width / 2, height / 2, 1)

                let curver = createSplineCurver()
                p5.stroke(255, 192)
                for (let i = 2; i < (curver.curvePts.length - 1); i += 2) {
                    let pt1 = [curver.curvePts[i - 2], curver.curvePts[i - 1]]
                    let pt2 = [curver.curvePts[i], curver.curvePts[i + 1]]

                    p5.line(pt1[0], pt1[1], pt2[0], pt2[1])
                }
            }
        }
    }

    return <div id={'mechbloom1'} className='content-chunk'>
        <h3>Mechanical Bloom #1</h3>
        <p>Using simple circles and a Catmull-Rom curve drawn between key points we can create a flowery bloom effect. Click the hide bots icon
            to remove the circles/lines overlay if you want to simple watch the picture get painted.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='mechanicalBloom1' enableMouseDragging={true} />
        </div>
    </div>
}

export function MechanicalBloom2(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let variableSet = new VariableChangeSet()
    let colorLerper = null

    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 4)

    let controller = new P5Controller({
        botSystem: null,
        width: width,
        height: height,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        frameRate: 120,
        finishedArt: false,
        variableSet: variableSet
    })

    let t = 0
    let root = null
    let seg1 = null
    let seg2 = null
    let seg3 = null
    let seg4 = null
    let innerSeg1 = null
    let innerSeg2 = null
    let innerSeg2a = null
    let innerSeg3 = null
    let innerSeg4 = null
    let innerSeg4a = null

    const innerR = 85
    const outerR = Math.min(width, height) * 0.45 - innerR
    const speedMx = 0.125
    const ANG_SEP = 79

    controller.autoPauseAt = 360 / speedMx
    controller.initializeSystem = (ctrl, reset) => {
        t = 0
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)

        root = new SpiralNode(null, { startingX: width / 2, startingY: height / 2 })
        seg1 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx),
                y: outerR * sind(t * speedMx),
            }
        })
        innerSeg1 = seg1.add((t, o) => {
            return {
                x: innerR * cosd(-8 * t * speedMx),
                y: innerR * sind(-8 * t * speedMx),
            }
        })
        seg2 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx + ANG_SEP),
                y: outerR * sind(t * speedMx + ANG_SEP),
            }
        })
        innerSeg2 = seg2.add((t, o) => {
            return {
                x: innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
        innerSeg2a = seg2.add((t, o) => {
            return {
                x: -innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: -innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
        seg3 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx + 2 * ANG_SEP),
                y: outerR * sind(t * speedMx + 2 * ANG_SEP),
            }
        }) //, {paintStyle: 'sand', color: {r:0, g:0xd7, b:0xf6, a:132}, palette: HORSEY_PALETTE})
        innerSeg3 = seg3.add((t, o) => {
            return {
                x: innerR * cosd(-8 * t * speedMx + 2 * ANG_SEP),
                y: innerR * sind(-8 * t * speedMx + 2 * ANG_SEP),
            }
        })
        seg4 = root.add((t, o) => {
            return {
                x: outerR * cosd(t * speedMx + ANG_SEP + 180),
                y: outerR * sind(t * speedMx + ANG_SEP + 180),
            }
        })
        innerSeg4 = seg4.add((t, o) => {
            return {
                x: innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
        innerSeg4a = seg4.add((t, o) => {
            return {
                x: -innerR * cosd(-4 * t * speedMx + ANG_SEP + 180),
                y: -innerR * sind(-4 * t * speedMx + ANG_SEP + 180),
            }
        })
    }
    controller.initializeSystem()
    const getBandPoints = () => {
        // there are 3 bands points, 2 end points and one mid point
        let pt1 = innerSeg1.screenPt
        let pt2 = innerSeg3.screenPt
        let pt3 = {
            x: pt1.x + (pt2.x - pt1.x) * 0.3,
            y: pt1.y + (pt2.y - pt1.y) * 0.3
        }

        return {
            end1: pt1,
            end2: pt2,
            mid: pt3
        }
    }
    const createSplineCurver = () => {
        let bandPoints = getBandPoints()
        let pts = [
            innerSeg2a.screenPt.x,
            innerSeg2a.screenPt.y,

            bandPoints.mid.x,
            bandPoints.mid.y,

            innerSeg4a.screenPt.x,
            innerSeg4a.screenPt.y,

            innerSeg4.screenPt.x,
            innerSeg4.screenPt.y,

            bandPoints.mid.x,
            bandPoints.mid.y,

            innerSeg2.screenPt.x,
            innerSeg2.screenPt.y
        ]

        return CardinalSplineCurver.makeFromPoints(pts, 0.5, 32, false)
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        // recalc the entire tree
        root.recalc(t, { n: 1, nOf: 1 }, 0, 0, 1)

        let curver = createSplineCurver()
        controller.setStrokeColor(sketchBuffer, colorLerper.getNextColor(), 0.05)
        sketchBuffer.strokeWeight(1)
        for (let i = 2; i < (curver.curvePts.length - 1); i += 2) {
            let pt1 = [curver.curvePts[i - 2], curver.curvePts[i - 1]]
            let pt2 = [curver.curvePts[i], curver.curvePts[i + 1]]

            sketchBuffer.line(pt1[0], pt1[1], pt2[0], pt2[1])
        }
        t += 1
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots) {
            if (root && root.screenPt) {
                p5.stroke(0, 0xa5, 0xff, 128)
                p5.noFill()
                p5.circle(root.screenPt.x, root.screenPt.y, (outerR + innerR) * 2)

                p5.circle(seg1.screenPt.x, seg1.screenPt.y, innerR * 2)
                p5.circle(seg2.screenPt.x, seg2.screenPt.y, innerR * 2)
                p5.circle(seg3.screenPt.x, seg3.screenPt.y, innerR * 2)
                p5.circle(seg4.screenPt.x, seg4.screenPt.y, innerR * 2)

                let bandPoints = getBandPoints()
                p5.stroke(0xff, 0xe1, 0xc6, 192)
                p5.line(bandPoints.end1.x, bandPoints.end1.y, bandPoints.end2.x, bandPoints.end2.y)
                p5.fill(255, 255)
                p5.circle(bandPoints.mid.x, bandPoints.mid.y, 3)
                root.drawOnOverlay(p5, width / 2, height / 2, 1)

                // let curver = createSplineCurver()
                // p5.stroke(255, 192)
                // for (let i = 2; i < (curver.curvePts.length - 1); i += 2) {
                //     let pt1 = [curver.curvePts[i - 2], curver.curvePts[i - 1]]
                //     let pt2 = [curver.curvePts[i], curver.curvePts[i + 1]]

                //     p5.line(pt1[0], pt1[1], pt2[0], pt2[1])
                // }
            }
        }
    }

    return <div id={'mechbloom2'} className='content-chunk'>
        <h3>Mechanical Bloom #2</h3>
        <p>Same concept as Mechanical Bloom #1, except lets add a 4th rotating circle and a rubber band
            between circle #1 and circle #3, and then use these new points as the control points for our Catmull-Rom curve.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='mechanicalBloom2' enableMouseDragging={true} />
        </div>
    </div>
}

export function StraightCircle(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let botSys = new BotSystem(width, height)
    const CENTER = new Vector(width / 2, height / 2)
    let colorLerper = null
    const speed = 1
    const outerR = Math.min(width, height) * 0.45
    const innerR = 18
    const midR = (outerR + innerR) / 2
    let variableSet = new VariableChangeSet()
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 9)

    botSys.initializeSystem = (sys, controller) => {
        botSys.reset();


        const zones = [outerR, midR, innerR, midR]
        let type = 0 // 0 => out going in, 1 => mid going in, 2 => in going out, 3 => mid going out
        for (let i = 0; i < 360; i += 15) {
            let bot = new Bot()
            bot.pos = new Vector(zones[type], 0).rotateDeg(i).addScalars(width / 2, height / 2)

            if (type <= 1) { // going in
                bot.vel = new Vector(speed, 0).rotateDeg(i + 180)
            } else {    // going out
                bot.vel = new Vector(speed, 0).rotateDeg(i)
            }

            bot.overlayRadius = 3
            bot.clr = colors.HTML_COLORS['pink']
            botSys.addBot(bot)

            type = (type + 1) % zones.length
        }

        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)
    }

    botSys.onPreStep = () => {
        botSys.bots.forEach((bot, idx) => {
            bot.pos = bot.pos.add(bot.vel)

            let vec = bot.pos.subtr(CENTER)
            if (vec.mag() <= innerR) {
                bot.pos = vec.unit().mult(innerR).addScalars(width / 2, height / 2)
                bot.vel = bot.vel.turn180()
            } else if (vec.mag() >= outerR) {
                bot.pos = vec.unit().mult(outerR).addScalars(width / 2, height / 2)
                bot.vel = bot.vel.turn180()
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1446,
        frameRate: 30,
        autoPauseAt: 600,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    const createSplineCurver = () => {
        return botSys.getBotPointsCardinalCurver(0.5, 32, true)
    }
    const drawSolidSpline = (gb, curvePts, clr, alpha255) => {
        let paintClr = clr
        if (typeof clr.getNextColor === 'function') {
            paintClr = clr.getNextColor()
        }
        gb.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
        for (let i = 2; i < (curvePts.length - 1); i += 2) {
            let pt1 = [curvePts[i - 2], curvePts[i - 1]]
            let pt2 = [curvePts[i], curvePts[i + 1]]

            gb.line(pt1[0], pt1[1], pt2[0], pt2[1])
        }
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        let curver = createSplineCurver()
        drawSolidSpline(sketchBuffer, curver.curvePts, colorLerper.getNextColor(), 32)
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots && botSys.bots.length > 0) {
            botSys.bots.forEach((bot, idx) => {
                let vec = bot.pos.subtr(CENTER).unit()
                let inPt = vec.mult(innerR).addScalars(width / 2, height / 2)
                let outPt = vec.mult(outerR).addScalars(width / 2, height / 2)

                p5.stroke(0, 32)
                p5.line(inPt.x, inPt.y, outPt.x, outPt.y)
            })
            let curver = createSplineCurver()
            drawSolidSpline(p5, curver.curvePts, { r: 255, g: 128, b: 128 }, 64)
        }
    }

    return <div id={'straightcircle'} className='content-chunk'>
        <h3>Straight Lines Make a Circle</h3>
        <p>
            Just a bunch of bots walking straight lines back and forth, but then we paint a Catmull-Rom spline
            through all those nodes.
        </p>
        <p>
            We can also create an entirely different effect by using tiny dots to paint with instead of solid lines.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='lineCircle' enableMouseDragging={true} />
            <p></p>
        </div>
    </div>
}

export function StraightCircle2(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let botSys = new BotSystem(width, height)
    const CENTER = new Vector(width / 2, height / 2)
    let colorLerper = null
    const speed = 1
    const outerR = Math.min(width, height) * 0.45
    const innerR = 42
    const midR = (outerR + innerR) / 2
    let variableSet = new VariableChangeSet()
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 10)

    botSys.initializeSystem = (sys, controller) => {
        botSys.reset();


        const zones = [outerR, midR, innerR, midR]
        let type = 0 // 0 => out going in, 1 => mid going in, 2 => in going out, 3 => mid going out
        for (let i = 0; i < 360; i += 15) {
            let bot = new Bot()
            bot.pos = new Vector(zones[type], 0).rotateDeg(i).addScalars(width / 2, height / 2)

            if (type <= 1) { // going in
                bot.vel = new Vector(speed, 0).rotateDeg(i + 180)
            } else {    // going out
                bot.vel = new Vector(speed, 0).rotateDeg(i)
            }

            bot.overlayRadius = 3
            bot.clr = colors.HTML_COLORS['pink']
            botSys.addBot(bot)

            type = (type + 1) % zones.length
        }

        const swap = (idx1, idx2) => {
            let b1 = botSys.bots[idx1]
            let b2 = botSys.bots[idx2]
            botSys.bots[idx1] = b2
            botSys.bots[idx2] = b1
        }
        // interleave the nodes to create loops in tht Catmull-Rom
        swap(2,22)
        swap(3,19)
        swap(4,20)
        swap(5,21)
        swap(6,18)
        swap(7,15)
        swap(8,16)
        swap(9,17)
        swap(10,14)
       
       
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)
    }

    botSys.onPreStep = () => {
        botSys.bots.forEach((bot, idx) => {
            bot.pos = bot.pos.add(bot.vel)

            let vec = bot.pos.subtr(CENTER)
            if (vec.mag() <= innerR) {
                bot.pos = vec.unit().mult(innerR).addScalars(width / 2, height / 2)
                bot.vel = bot.vel.turn180()
            } else if (vec.mag() >= outerR) {
                bot.pos = vec.unit().mult(outerR).addScalars(width / 2, height / 2)
                bot.vel = bot.vel.turn180()
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1446,
        frameRate: 30,
        autoPauseAt: 1196,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    const createSplineCurver = () => {
        return botSys.getBotPointsCardinalCurver(0.5, 32, true)
    }
    const drawSolidSpline = (gb, curvePts, clr, alpha255) => {
        let paintClr = clr
        if (typeof clr.getNextColor === 'function') {
            paintClr = clr.getNextColor()
        }
        gb.stroke(paintClr.r, paintClr.g, paintClr.b, alpha255)
        for (let i = 2; i < (curvePts.length - 1); i += 2) {
            let pt1 = [curvePts[i - 2], curvePts[i - 1]]
            let pt2 = [curvePts[i], curvePts[i + 1]]

            gb.line(pt1[0], pt1[1], pt2[0], pt2[1])
        }
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        let curver = createSplineCurver()
        drawSolidSpline(sketchBuffer, curver.curvePts, colorLerper.getNextColor(), 64)
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots && botSys.bots.length > 0) {
            botSys.bots.forEach((bot, idx) => {
                let vec = bot.pos.subtr(CENTER).unit()
                let inPt = vec.mult(innerR).addScalars(width / 2, height / 2)
                let outPt = vec.mult(outerR).addScalars(width / 2, height / 2)

                p5.stroke(0, 32)
                p5.line(inPt.x, inPt.y, outPt.x, outPt.y)
            })
            let curver = createSplineCurver()
            drawSolidSpline(p5, curver.curvePts, { r: 255, g: 128, b: 128 }, 64)
        }
    }

    return <div id={'straightcircle2'} className='content-chunk'>
        <h3>Straight Lines Make a Flower</h3>
        <p>
            Just a bunch of bots walking straight lines back and forth, but then we paint a Catmull-Rom spline
            through all those nodes, except we interleave our nodes to create loops in the spline and these loops
            create some nice looking petals. 
        </p>
        <p>
            We can also create an entirely different effect by using tiny dots to paint with instead of solid lines.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='lineCircle' enableMouseDragging={true} />
            <p></p>
        </div>
    </div>
}