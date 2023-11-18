import React from "react"
import get from "lodash.get"
import colors, {ColorAutoLerper} from "../colors.js"
import utils from "../utils.js"
import Vector, { rads } from "../Vector.js"
import SketchTweaker from "../components/SketchTweaker.js"
import { drawSandSplineGrains } from "../painters/SandPainters.js"
import { drawSolidSpline, drawDeltaSolidSpline } from "../painters/LinePainters.js"
import { VariableChangeSet, makeSelectorOptions } from "../components/VariableChanger.js"
import { getCurvePoints } from 'cardinal-spline-js'
import { CardinalSplineCurver } from "../Curvers.js"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot } from "../components/BotSystem"
import P5Canvas from "../components/P5Canvas"
import colorSchemes from "../ColorSchemes.js"

const TWO_PI = Math.PI * 2
const sin = Math.sin
const cos = Math.cos
const abs = Math.abs
const sign = Math.sign

export function WigglySplines(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let botSys = new BotSystem(width, height)
    let variableSet = new VariableChangeSet()
    const lineLength = width - 80
    let botWidth = 0
    let colorLerper = null
    variableSet.addNumberSlider('botCount', 'Bots', 8, 64, 1, 14)
    variableSet.addSelector('paintType', 'Paint Type', makeSelectorOptions(['Line', 'Dots']))
    variableSet.addNumberSlider('paintStrength', 'Paint Density', 1, 20, 1, 8)
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 0)

    botSys.initializeSystem = (sys, controller) => {
        const botCount = variableSet.getValue('botCount')
        botWidth = lineLength / botCount
        botSys.reset();

        for (let i = 0; i < botCount; i++) {
            let bot = new Bot()
            bot.pos = new Vector(40 + i * botWidth, height / 2)
            bot.overlayRadius = 1
            bot.clr = colors.HTML_COLORS['green']
            bot.homePos = bot.pos
            bot.targetPos = null
            botSys.addBot(bot)
        }
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)
    }

    botSys.onPreStep = () => {
        const maxSpeed = 1
        const rand = controller.rand
        const botCount = variableSet.getValue('botCount')
        botSys.bots.forEach((bot, idx) => {
            if (!bot.targetPos) {
                let deviation = Math.max(2, idx) * botWidth / botCount
                bot.targetPos = new Vector(bot.homePos.x + rand.jitterRandom(deviation), bot.homePos.y + rand.jitterRandom(deviation))
            }

            let dVec = bot.targetPos.subtr(bot.pos)
            if (dVec.mag() <= maxSpeed) {
                bot.setNewPosition(bot.targetPos)
                bot.targetPos = null
            } else {
                dVec = dVec.unit().mult(maxSpeed)
                bot.setNewPosition(bot.pos.add(dVec))
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'light',
        seed: 1446,
        frameRate: 30,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        const paintType = variableSet.getValue('paintType')
        const paintStrength = variableSet.getValue('paintStrength')
        let pts = []
        botSys.bots.forEach((bot) => {
            pts.push(bot.pos.x)
            pts.push(bot.pos.y)
        })

        if (paintType === 'Line') {
            controller.setStrokeColor(sketchBuffer, colorLerper.getNextColor(), paintStrength / 100)
        } else {
            controller.setStrokeColor(sketchBuffer, colorLerper.getNextColor(), 0.05)
        }
        sketchBuffer.strokeWeight(1)

        if (paintType === 'Line') {
            // pts, tension, segments, closed
            let outPts = getCurvePoints(pts, 0.5, 4, false)

            for (let i = 2; i < (outPts.length - 1); i += 2) {
                let pt1 = [outPts[i - 2], outPts[i - 1]]
                let pt2 = [outPts[i], outPts[i + 1]]
                sketchBuffer.line(pt1[0], pt1[1], pt2[0], pt2[1])
            }
        } else {
            let grains = (paintStrength + 20) * botSys.bots.length
            let curver = CardinalSplineCurver.makeFromPoints(pts, 0.5, 12, false)
            drawSandSplineGrains(sketchBuffer, curver, grains, colorLerper.getNextColor(), 16)
        }
    }

    return <div id='wigglysplines' className='content-chunk'>
        <h3>Wiggly Spline</h3>
        <p>
            Start off with a simple line of points and then randomly alter those points each frame and draw
            the resulting spline at a 5% opacity. The amount of randomness goes from miniscule to significant
            as we go from left to right. Typically it only takes 60-70 frames (with 32 points) to create a nice smokey effect.
            Once you get up into the 125-150 range it starts looking more like a pencil sketching technique.
        </p>
        <p>
            We can also create an entirely different effect by using tiny dots to paint with instead of solid lines.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='wigglySpline' enableMouseDragging={true} />
            <p></p>
        </div>
    </div>
}

class Oscillator {
    static maxVel = 0.80
    static minAccel = 0.005
    static maxAccel = 0.01
    constructor(min, max, initial, rand) {
        this.rand = rand
        this.min = min
        this.max = max

        if (initial === null) {
            initial = rand.randomBetween(min, max)
        }
        this.initial = initial
        this.currentValue = this.initial
        this.frameCount = 0
        this.currV = rand.randomBetween(-Oscillator.maxVel, Oscillator.maxVel)
        this.currA = rand.randomBetween(Oscillator.minAccel, Oscillator.maxAccel) * rand.randomSign()
    }

    nextFrame() {
        this.frameCount++

        this.currentValue += this.currV
        if (this.currentValue <= this.min) {
            // enforce a positive direction
            this.currA = abs(this.currA)
            this.currV = 0.6 * abs(this.currV)
        } else if (this.currentValue >= this.max) {
            // enforce a negative direction
            this.currA = -abs(this.currA)
            this.currV = -0.6 * abs(this.currV)
        } else {
            if (0 === (this.frameCount % 50)) {
                this.currA = this.rand.randomBetween(Oscillator.minAccel, Oscillator.maxAccel) * this.rand.randomSign()
            }

            this.currV += this.currA

            if (this.currV <= Oscillator.minVel) {
                this.currA = abs(this.currA)
            } else if (abs(this.currV) >= Oscillator.maxVel) {
                this.currA = -abs(this.currA) * sign(this.currV)
            }
        }
        return this.currentValue
    }
}

export function WigglySplineCircle(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800)
    let botSys = new BotSystem(width, height)
    let variableSet = new VariableChangeSet()
    let startingRadius = 31.4
    let colorLerper = null
    variableSet.addNumberSlider('botCount', 'Bots', 4, 32, 1, 24)
    variableSet.addSelector('paintType', 'Paint Type', makeSelectorOptions(['Line', 'Dots']))
    variableSet.addNumberSlider('paintStrength', 'Paint Density', 2, 32, 1, 8)
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 10)

    botSys.initializeSystem = (sys, controller) => {
        const botCount = variableSet.getValue('botCount')
        botSys.reset();
        botSys.setAllElasticities(-1)

        let dA = rads(8)
        let angle = 0
        for (let i = 0; i < botCount; i++) {
            let bot = new Bot()
            bot.overlayRadius = 2
            bot.clr = colors.ensureColor255('#4087ff')
            bot.oscillator = new Oscillator(-3, 3, null, controller.rand)
            bot.angle = angle
            bot.radius = startingRadius + 10 * angle / Math.PI
            botSys.addBot(bot)
            angle -= dA
        }

        startingRadius = 4 + botCount
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0045)
    }

    botSys.onPreStep = () => {
        const angularVelocity = Math.PI / (300 + botSys.frameCount / 20)
        let startingR = 6 // Math.min(6, Math.max(3,botSys.bots[0].angle))
        let incrR = 24 / botSys.bots.length // botCountMath.max(0.8, Math.min(4, botSys.bots[0].angle / botSys.bots.length))
        botSys.bots.forEach((bot, idx) => {
            bot.angle += angularVelocity
            bot.oscillator.min = -(startingR + incrR * idx)
            bot.oscillator.max = startingR + incrR * idx
            bot.radius = bot.oscillator.nextFrame() + startingRadius + (15) * bot.angle / Math.PI

            let newPos = new Vector(bot.radius, 0).rotate(bot.angle).addScalars(width / 2, height / 2)
            bot.setNewPosition(newPos.x, newPos.y)

            if (bot.angle < 0) {
                bot.overlayRadius = 0
            } else {
                bot.overlayRadius = 2
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1446,
        frameRate: 120,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        if (botSys.frameCount <= 1) {
            sketchBuffer.clear()
        }
        const paintType = variableSet.getValue('paintType')
        const paintStrength = variableSet.getValue('paintStrength')
        let pts = []
        botSys.bots.forEach((bot) => {
            if (bot.angle > 0) {
                pts.push(bot.pos.x)
                pts.push(bot.pos.y)
            }
        })


        const paintColor =colorLerper.getNextColor()

        if (paintType === 'Line') {
            controller.setStrokeColor(sketchBuffer, paintColor, paintStrength)
        } else {
            controller.setStrokeColor(sketchBuffer, paintColor, paintStrength)
        }
        sketchBuffer.strokeWeight(1)

        if (paintType === 'Line') {
            // pts, tension, segments, closed
            let outPts = getCurvePoints(pts, 0.5, 4, false)

            for (let i = 2; i < (outPts.length - 1); i += 2) {
                let pt1 = [outPts[i - 2], outPts[i - 1]]
                let pt2 = [outPts[i], outPts[i + 1]]
                sketchBuffer.line(pt1[0], pt1[1], pt2[0], pt2[1])
            }
        } else {
            let grains = utils.map(0, 10000, botSys.frameCount, (paintStrength / 8) * pts.length, (paintStrength / 2) * pts.length)
            let curver = CardinalSplineCurver.makeFromPoints(pts, 0.5, 12, false)
            drawSandSplineGrains(sketchBuffer, curver, grains, paintColor, 16)
        }
    }

    return <div id='wigglysplinecircle' className='content-chunk'>
        <h3>Wiggly Spiral</h3>
        <p>
            Take the above concept and instead of a stationary straight line, let's drag those points around
            a spiral while they are randomly jiggling. Notice how different painting with lines versus painting
            with dots is.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='wigglySpline' enableMouseDragging={true} />
            <p></p>
        </div>
    </div>
}
