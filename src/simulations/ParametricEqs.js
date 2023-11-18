import React from "react"
import Vector from '../Vector'
import utils from '../utils'
import colors, { ColorLerper } from '../colors'
import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot } from "../components/BotSystem"
import ParametricBotSystem from "../components/ParametricBotSystem"
import P5Canvas from "../components/P5Canvas"
import { easeInQuad } from "../easing"

const pow = Math.pow
const sin = Math.sin
const cos = Math.cos

const width = 800, height = 800
const CENTER_POS = new Vector(width / 2, height / 2)

export function ParametricEquationTester(props) {
    // let COLOR_SET = ['#5f4736', '#6c5d4e', '#836c53', '#b19979', '#b29158', '#b9a180', '#d9c1a0', '#e0d0b8'].map((c) => colors.ensureColor255(c))
    // COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let botSys = new ParametricBotSystem(width, height, { x: 0, y: 0, z: 0 })
    let currentT = 0
    let pos = { x: 0, y: 0, z: 1 }
    let scale = 50
    botSys.setScaleAndOffset(scale, scale, 1, width / 2, height / 2, 0)
    botSys.initialize3dProjection(0.65, 800, 800, -Math.max(width, height))
    botSys.initializeSystem = () => {
        botSys.reset();

    }

    const calculateNextPoint = (t, currentPos) => {
        let it = pow(Math.E, cos(t)) - 2 * cos(4 * t) - pow(sin(t / 12), 5)

        return {
            x: 4 * pow(sin(t / 2.033), 3) + sin(t) * it / 2,
            y: 4 * pow(cos(t / 2.033), 3) + cos(t) * it / 2,
            z: 1
        }
        // return {
        //     x: cos(t/128) + Math.pow(Math.E,cos(t/2560)),
        //     y: sin(t/128) +  Math.pow(Math.E,cos(t/128)),
        //     z: cos(t/2560) +  Math.pow(Math.E,sin(t/256))
        // }
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'light',
        seed: 1782,
        showBots: true,
        frameRate: 119,
        finishedArt: false
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        sketchBuffer.loadPixels()

        for (let i = 0; i < 100; i++) {
            pos = calculateNextPoint(currentT, pos)
            let uiPos = botSys.mapPositionToScreen(pos)
            let clrStr = utils.map(-1, 1, pos.z, 192, 0)
            controller.addColorToPixel(sketchBuffer, Math.floor(uiPos.x), Math.floor(uiPos.y), clrStr, clrStr, clrStr, 255)
            currentT += 0.00031457
        }
        sketchBuffer.updatePixels()
    }

    return <div className='content-chunk'>
        <h3>Parameteric Equations - Tester</h3>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}

export function ParametricEquationFireyButterFly(props) {
    let COLOR_SET = ['#fffec87f', '#fffc80', '#ff9b25', '#ff561e', '#e31a17', '#ab0707', '#a20505'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new ParametricBotSystem(width, height, { x: 0, y: 0, z: 0 })

    botSys.setScaleAndOffset(75, 75, 1, width / 2, height / 2 - 75, 0)
    botSys.initialize3dProjection(0.65, 800, 800, -Math.max(width, height))
    botSys.initializeSystem = () => {
        botSys.reset();
    }

    const calculateNextPoint = (t, currentPos) => {
        let it = pow(Math.E, cos(t)) - 2 * cos(4 * t) - pow(sin(t / 12), 5)

        return {
            x: 3.14 * pow(sin(t / 2.033), 3) + sin(t) * it / 1.57,
            y: 3.14 * pow(cos(t / 2.033), 3) + cos(t) * it / 1.57,
            z: 1
        }
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        frameRate: 119,
        autoPauseAt: 11116,
        finishedArt: false
    })
    let pos1 = calculateNextPoint(0, { x: 0, y: 0, z: 1 })
    let pos2 = calculateNextPoint(0, { x: 0, y: 0, z: 1 })

    botSys.paintBotsOverlay = (p5) => {
        if (controller.showBots) {
            let uiPos = botSys.mapPositionToScreen(pos2)
            let clr = colors.HTML_COLORS.magenta
            p5.noStroke();
            p5.fill(clr.r, clr.g, clr.b);
            p5.circle(uiPos.x, uiPos.y, 3)

            uiPos = botSys.mapPositionToScreen(pos1)
            clr = colors.HTML_COLORS.cyan
            p5.noStroke();
            p5.fill(clr.r, clr.g, clr.b);
            p5.circle(uiPos.x, uiPos.y, 3)
        }
    }
    controller.updateSketch = (p5, sketchBuffer) => {
        let speedDenom = 8400
        let loopFrames = speedDenom / 3.01
        let clrIdx = 4 * Math.PI * botSys.frameCount / (COLOR_SET.length * loopFrames)
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])
        let a = 16 // 0.12 * clr.a

        // a = a * utils.mapEase(0,23824,botSys.frameCount,1,1.5, easeInQuad)
        // a = Math.max(2, Math.round(a))

        let t = Math.PI * 12 * (botSys.frameCount / speedDenom)
        pos1 = calculateNextPoint(t, pos1)

        t = Math.PI * 12 * ((loopFrames + botSys.frameCount) / speedDenom)
        pos2 = calculateNextPoint(t, pos2)

        let uiPos1 = botSys.mapPositionToScreen(pos1)
        let uiPos2 = botSys.mapPositionToScreen(pos2)

        if (uiPos1.x >= width / 2) {
            controller.setStrokeColor(sketchBuffer, clr, a)
            sketchBuffer.strokeWeight(1)
            sketchBuffer.line(uiPos1.x, uiPos1.y, uiPos2.x, uiPos2.y)

            if (botSys.frameCount >= 4) {
                controller.setStrokeColor(sketchBuffer, clr, a * 2)
                sketchBuffer.point(uiPos1.x, uiPos1.y)
                sketchBuffer.point(uiPos1.x, uiPos1.y)
                sketchBuffer.point(uiPos2.x, uiPos2.y)
                sketchBuffer.point(uiPos2.x, uiPos2.y)
            }

            uiPos1.x = width / 2 + (width / 2 - uiPos1.x)
            uiPos2.x = width / 2 + (width / 2 - uiPos2.x)

            controller.setStrokeColor(sketchBuffer, clr, a)
            sketchBuffer.line(uiPos1.x, uiPos1.y, uiPos2.x, uiPos2.y)

            if (botSys.frameCount >= 4) {
                controller.setStrokeColor(sketchBuffer, clr, a * 2)
                sketchBuffer.point(uiPos1.x, uiPos1.y)
                sketchBuffer.point(uiPos1.x, uiPos1.y)
                sketchBuffer.point(uiPos2.x, uiPos2.y)
                sketchBuffer.point(uiPos2.x, uiPos2.y)
            }
        }
    }

    return <div id='fierybutterfly' className='content-chunk'>
        <h3>Parameteric Equations - Fiery Butterfly</h3>
        <p>Tweak the constants in our base equation, refelect the image along the Y axis and paint using a fiery color palette.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}

export function ParametricEquationSplat(props) {
    // let COLOR_SET = ['#808080c0', '#A0A0A0', '#C0C0C0', '#D0D0D0', 'E0E0E0', '#A0A0A0', '#000000a0', '#D0D0D0', '#E0E0E0', '#000000a0', '#C0C0C0'].map((c) => colors.ensureColor255(c))
    let COLOR_SET = ['#ffccfe7f', '#ffa4fd7f', '#ff8efc70', '#ff73fc80', '#fb42fb90', '#b919faa0', '#9c17fab0', '#8016fac0', '#6d16fa', '#2d14f9', '#080c99'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new ParametricBotSystem(width, height, { x: 0, y: 0, z: 0 })

    botSys.setScaleAndOffset(120, 120, 1, width / 2 - 50, height / 2 - 50, 0)
    botSys.initialize3dProjection(0.65, 800, 800, -Math.max(width, height))
    botSys.initializeSystem = () => {
        botSys.reset();
    }

    const calculateNextPoint = (t, currentPos) => {
        let it = pow(Math.E, cos(t)) - 2 * cos(4 * t) - pow(sin(t / 12), 5)

        return {
            x: (sin(t) * it + currentPos.y) / 2,
            y: (cos(t) * it + currentPos.x) / 2,
            z: (sin(t) * it + currentPos.y) / 2 - 1
        }
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        frameRate: 119,
        autoPauseAt: 23824,
        finishedArt: false
    })
    let pos1 = calculateNextPoint(0, { x: 0, y: 0, z: 1 })
    let pos2 = calculateNextPoint(0, { x: 0, y: 0, z: 1 })

    botSys.paintBotsOverlay = (p5) => {
        if (controller.showBots) {
            let uiPos = botSys.mapPositionToScreen(pos2)
            let clr = colors.HTML_COLORS.magenta
            p5.noStroke();
            p5.fill(clr.r, clr.g, clr.b);
            p5.circle(uiPos.x, uiPos.y, 3)

            uiPos = botSys.mapPositionToScreen(pos1)
            clr = colors.HTML_COLORS.cyan
            p5.noStroke();
            p5.fill(clr.r, clr.g, clr.b);
            p5.circle(uiPos.x, uiPos.y, 3)
        }
    }
    controller.updateSketch = (p5, sketchBuffer) => {
        let speedDenom = 12800
        let loopFrames = speedDenom / 5.91
        let clrIdx = 2 * Math.PI * botSys.frameCount / (COLOR_SET.length * loopFrames)
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])
        let a = 0.12 * clr.a

        a = a * utils.mapEase(0, 23824, botSys.frameCount, 1, 1.5, easeInQuad)
        a = Math.max(2, Math.round(a))

        let t = Math.PI * 12 * (botSys.frameCount / speedDenom)
        pos1 = calculateNextPoint(t, pos1)

        t = Math.PI * 12 * ((loopFrames + botSys.frameCount) / speedDenom)
        pos2 = calculateNextPoint(t, pos2)

        let uiPos1 = botSys.mapPositionToScreen(pos1)
        let uiPos2 = botSys.mapPositionToScreen(pos2)

        controller.setStrokeColor(sketchBuffer, clr, a)
        sketchBuffer.strokeWeight(1)
        sketchBuffer.line(uiPos1.x, uiPos1.y, uiPos2.x, uiPos2.y)

        if (botSys.frameCount >= 4) {
            sketchBuffer.point(uiPos1.x, uiPos1.y)
            sketchBuffer.point(uiPos1.x, uiPos1.y)
            sketchBuffer.point(uiPos2.x, uiPos2.y)
            sketchBuffer.point(uiPos2.x, uiPos2.y)
        }
    }

    return <div id='parasplat' className='content-chunk'>
        <h3>Parameteric Equations - Butterfly #2</h3>
        <p>For this rendering, we add in a Z component and plot the curve in 3D space.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}


function calcButterflyPoint(t) {
    let it = pow(Math.E, cos(t)) - 2 * cos(4 * t) - pow(sin(t / 12), 5)

    return {
        x: sin(t) * it * 100 + CENTER_POS.x,
        y: cos(t) * it * 100 + CENTER_POS.y - 100
    }
}

function initializeButterflyParametricBots(botSys) {
    botSys.reset();
    let bot = new Bot()
    bot.pos = new Vector(calcButterflyPoint(0))
    bot.clr = 'cyan'
    bot.overlayRadius = 3
    botSys.addBot(bot)

    bot = new Bot()
    bot.pos = new Vector(calcButterflyPoint(0))
    bot.clr = 'magenta'
    bot.overlayRadius = 3
    botSys.addBot(bot)
    botSys.setAllElasticities(-1)
}

function stepButterflyBotsForward(botSys) {
    let speedDenom = 12800
    let loopFrames = speedDenom / 5.91

    let t = Math.PI * 12 * (botSys.frameCount / speedDenom)
    let pos = calcButterflyPoint(t)

    botSys.bots[0].setNewPosition(pos)
    t = Math.PI * 12 * ((loopFrames + botSys.frameCount) / speedDenom)
    pos = calcButterflyPoint(t)
    botSys.bots[1].setNewPosition(pos)
}

export function ParametricEquationButterfly(props) {
    let COLOR_SET = ['#6c5d4e', '#836c53', '#b19979', '#b29158', '#b9a180', '#d9c1a0', '#e0d0b8'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = () => { initializeButterflyParametricBots(botSys) }

    let speedDenom = 12800
    let loopFrames = speedDenom / 5.91
    botSys.onPreStep = () => { stepButterflyBotsForward(botSys) }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        finishedArt: false
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let pt1 = botSys.bots[0].pos
        let pt2 = botSys.bots[1].pos
        let a = 0.05
        let clrIdx = 2 * Math.PI * botSys.frameCount / (COLOR_SET.length * loopFrames)
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])

        controller.setStrokeColor(sketchBuffer, clr, a)
        sketchBuffer.strokeWeight(1)
        // if (d > 4) {
        //     sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
        // }
        sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
    }

    return <div id='parabutterfly' className='content-chunk'>
        <h3>Parameteric Equations - Butterfly</h3>
        <p>Using the above equation we create 2 travelling bots, one of them modified to be a full rotational pass in front of the other
            so they are slightly out of phase (that is the purpose of the <strong>sin<sup>5</sup>(t/12)</strong> term). We then draw mostly transparent lines
            between the two points every frame, gradually varying the color being painted from our color palette.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}

export function ParametricEquationSand(props) {
    let COLOR_SET = ['#5f4736', '#6c5d4e', '#836c53', '#b19979', '#b29158', '#b9a180', '#d9c1a0', '#e0d0b8'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = () => { initializeButterflyParametricBots(botSys) }

    let speedDenom = 12800
    let loopFrames = speedDenom / 5.91
    botSys.onPreStep = () => { stepButterflyBotsForward(botSys) }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        finishedArt: false
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let pt1 = botSys.bots[0].pos
        let lastPt1 = botSys.bots[0].lastPos
        let pt2 = botSys.bots[1].pos
        let lastPt2 = botSys.bots[1].lastPos
        let d = pt1.subtr(pt2).mag()
        let a = 0.05
        let clrIdx = 2 * Math.PI * botSys.frameCount / (COLOR_SET.length * loopFrames)
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])

        controller.setStrokeColor(sketchBuffer, clr, a)
        sketchBuffer.strokeWeight(1)
        let fzDx = 1, fzDy = 1
        if (lastPt1) {
            sketchBuffer.line(pt1.x, pt1.y, lastPt1.x, lastPt1.y)
            fzDx = Math.max(fzDx, Math.abs(pt1.x - lastPt1.x))
            fzDy = Math.max(fzDy, Math.abs(pt1.y - lastPt1.y))
        }
        if (lastPt2) {
            sketchBuffer.line(pt2.x, pt2.y, lastPt2.x, lastPt2.y)
            fzDx = Math.max(fzDx, Math.abs(pt2.x - lastPt2.x))
            fzDy = Math.max(fzDy, Math.abs(pt2.y - lastPt2.y))
        }
        if (d > 4) {
            sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
            controller.setStrokeColor(sketchBuffer, clr, a)
            let pts = Math.round(2 + controller.rand.randomBetween(d / 5, d / 16))
            let dx = (pt2.x - pt1.x) / (pts - 1)
            let dy = (pt2.y - pt1.y) / (pts - 1)
            let i = 0
            while (i < pts) {
                let fzX = controller.rand.jitterRandom(-fzDx, fzDx)
                let fzY = controller.rand.jitterRandom(-fzDy, fzDy)
                sketchBuffer.point(pt1.x + i * dx + fzX, pt1.y + i * dy + fzY)
                i++
            }
        }
    }

    return <div id='sandybutterfly' className='content-chunk'>
        <h3>Parameteric Equations Sandy Version</h3>
        <p>Using the same technique as above, except instead of drawing mostly transparent lines between the two points, we 'sprinkle some sand' in between
            them each friend.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}

export function ParametricEquationSmoke(props) {
    let COLOR_SET = ['#808080', '#A0A0A0', '#C0C0C0', '#D0D0D0', 'E0E0E0', '#A0A0A0', '#000000', '#D0D0D0', '#E0E0E0', '#000000', '#C0C0C0'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = () => { initializeButterflyParametricBots(botSys) }

    let speedDenom = 12800
    let loopFrames = speedDenom / 5.91
    botSys.onPreStep = () => { stepButterflyBotsForward(botSys) }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'light',
        seed: 1782,
        showBots: true,
        finishedArt: false
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let pt1 = botSys.bots[0].pos
        let pt2 = botSys.bots[1].pos
        let a = 0.05
        let clrIdx = 2 * Math.PI * botSys.frameCount / (COLOR_SET.length * loopFrames)
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])

        controller.setStrokeColor(sketchBuffer, clr, a)
        sketchBuffer.strokeWeight(1)
        // if (d > 4) {
        //     sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
        // }
        sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
    }

    return <div id='smokeybutterfly' className='content-chunk'>
        <h3>Parameteric Equations Smoke Version</h3>
        <p>Paint using black with a very low alpha to create a smokey like effect.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}

export function ParametricEquationSpirals(props) {
    let COLOR_SET = ['#ffccfe7f', '#ffa4fd7f', '#ff8efc70', '#ff73fc80', '#fb42fb90', '#b919faa0', '#9c17fab0', '#8016fac0', '#6d16fa', '#2d14f9', '#080c99'].map((c) => colors.ensureColor255(c))
    COLOR_SET = COLOR_SET.concat(Array.from(COLOR_SET).reverse())
    let colorLerper = new ColorLerper(COLOR_SET)
    let botSys = new BotSystem(width, height)

    const calcPoint = (t) => {
        let ang = t * 4 * (2 * Math.PI) 
        let rx = sin(t * Math.PI) * props.width / 2.2 + (t/2)*10
        let ry = sin(t * Math.PI) * props.height / 2.2 + (t/2)*10
        let x = cos(ang) * rx
        let y = sin(ang) * ry
        return { x: x  + CENTER_POS.x, y: y + CENTER_POS.y }
    }
    botSys.initializeSystem = () => {
        botSys.reset();
        let bot = new Bot()
        bot.pos = new Vector(calcPoint(0))
        bot.clr = 'cyan'
        bot.overlayRadius = 3
        botSys.addBot(bot)

        bot = new Bot()
        bot.pos = new Vector(calcPoint(0))
        bot.clr = 'magenta'
        bot.overlayRadius = 3
        botSys.addBot(bot)
        botSys.setAllElasticities(-1)
    }

    botSys.onPreStep = () => {
        let t = botSys.frameCount / 3000
        let pos = calcPoint(t)

        botSys.bots[0].setNewPosition(pos)
        t += 0.034
        pos = calcPoint(t)
        botSys.bots[1].setNewPosition(pos)
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        showBots: true,
        finishedArt: false
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let pt1 = botSys.bots[0].pos
        let pt2 = botSys.bots[1].pos
        let a = 0.05
        let clrIdx = botSys.frameCount / 2168
        let clr = colorLerper.getColor(clrIdx) // utils.makeColorRGB(COLOR_SET[Math.floor(arena.frameCount/loopFrames) % COLOR_SET.length])

        controller.setStrokeColor(sketchBuffer, clr, a)
        sketchBuffer.strokeWeight(1)
        // if (d > 4) {
        //     sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
        // }
        sketchBuffer.line(pt1.x, pt1.y, pt2.x, pt2.y)
    }

    return <div id='paraspirals' className='content-chunk'>
        <h3>Parameteric Equations - Spirals</h3>
        <p>Using the equation for a spiral, we start in the center and spin outwards toward the boundaries, once there we reverse and spin
            back in towards the center. Rinse and repeat several times with slight variations to our maximum outer radius and you get
            and image like this.

        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='parametric' />
        </div>
    </div>
}