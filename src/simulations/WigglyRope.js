import React from "react"
import get from "lodash.get"
import colors, {ColorAutoLerper} from "../colors.js"
import utils from "../utils.js"
import Vector from "../Vector.js"
import SketchTweaker from "../components/SketchTweaker.js"
import { drawSandSplineGrains } from "../painters/SandPainters.js"
import { drawSolidSpline, drawDeltaSolidSpline } from "../painters/LinePainters.js"
import { VariableChangeSet, makeSelectorOptions } from "../components/VariableChanger.js"
import { CardinalSplineCurver } from "../Curvers.js"
import P5Controller from "../components/P5Controller.js"
import BotSystem, { Bot } from "../components/BotSystem.js"
import P5Canvas from "../components/P5Canvas.js"
import * as CANNON from 'cannon-es'
import colorSchemes from "../ColorSchemes.js"

const sin = Math.sin
const cos = Math.cos

function createShapeRotator(type, topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller) {
    if (type === 'Infinity') {
        return new InfinityRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    } else if (type === 'Ellipse') {
        return new EllipseRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    } else if (type === 'CurlyCues') {
        return new CurlyCueRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    } else if (type === 'SpiralsVert') {
        return new VerticalSpiralsRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    } else if (type === 'SpiralsHoriz') {
        return new HorizontalSpiralsRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    } else if (type === 'Random') {
        return new RandomJumpsRotator(topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller.rand)
    }
    return null
}



export function WigglySplineRope(props) {
    let width = get(props, 'width', 1000), height = get(props, 'height', 800)
    let paintColor = colors.ensureColor255('#404040')
    let botSys = new BotSystem(width, height)
    let nodes = []
    const MAX_WEIGHT = 100
    let lastCurver = null
    let topShapeRotator = null
    let bottomShapeRotator = null
    let world = null
    let weightedNodeIndex = -1
    let variableSet = new VariableChangeSet()
    let simulationComplete = false
    let colorLerper = null

    variableSet.addSelector('topRotateShape', 'Top Shape', makeSelectorOptions(['None', 'Infinity', 'Ellipse', 'CurlyCues', 'SpiralsVert', 'SpiralsHoriz', 'Random']), 6)
    variableSet.addNumberSlider('topRotateSpeed', 'Rotate Speed', 0.5, 2.0, 0.05, 1.3)
    variableSet.addNumberSlider('topShapeX', 'Shape X', 0, width, 2, 400)
    variableSet.addNumberSlider('topShapeY', 'Shape Y', 0, height, 2, 364)
    variableSet.addNumberSlider('topShapeWidth', 'Shape Width', 2, width * 0.8, 2, 600)
    variableSet.addNumberSlider('topShapeHeight', 'Shape Height', 2, height * 0.8, 2, 34)

    variableSet.addSeparator()
    variableSet.addSelector('bottomRotateShape', 'Bottom Shape', makeSelectorOptions(['None', 'Infinity', 'Ellipse', 'CurlyCues','SpiralsVert', 'SpiralsHoriz', 'Random']), 2)
    variableSet.addNumberSlider('bottomRotateSpeed', 'Rotate Speed', 0.5, 2.0, 0.05, 0.5)
    variableSet.addNumberSlider('bottomShapeX', 'Shape X', 0, width, 2, 406)
    variableSet.addNumberSlider('bottomShapeY', 'Shape Y', 0, height, 2, 506)
    variableSet.addNumberSlider('bottomShapeWidth', 'Shape Width', 2, width * 0.8, 2, 462)
    variableSet.addNumberSlider('bottomShapeHeight', 'Shape Height', 2, height * 0.8, 2, 20)

    variableSet.addSeparator()
    variableSet.addNumberSlider('splineNodes', 'Spline Nodes', 3, 10, 1, 6)
    variableSet.addNumberSlider('gravityX', 'GravityX', -20, 20, 0.5, 2.5)
    variableSet.addNumberSlider('gravityY', 'GravityY', -20, 20, 0.5, -8.5)
    variableSet.addNumberSlider('dampening', 'Dampening', 0, 1, 0.01, 0.03)
    variableSet.addNumberSlider('weight', 'Weight', 0, MAX_WEIGHT, 1, 2)
    variableSet.addNumberSlider('weightPlacement', 'Placement', 0, 100, 1, 0)

    variableSet.addSeparator()
    variableSet.addSelector('paintType', 'Paint Type', makeSelectorOptions(['Line', 'Line2', 'Dots']))
    variableSet.addNumberSlider('paintStrength', 'Paint Density', 1, 20, 1, 10)
    variableSet.addNumberSlider('startDelay', 'Paint Delay', 0, 240, 2, 12)
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 10)


    botSys.initializeSystem = (sys, controller, forReset) => {
        const topShapeX = controller.variableSet.getValue('topShapeX')
        const topShapeY = controller.variableSet.getValue('topShapeY')
        const bottomShapeX = controller.variableSet.getValue('bottomShapeX')
        const bottomShapeY = controller.variableSet.getValue('bottomShapeY')
        const splineNodes = controller.variableSet.getValue('splineNodes')
        botSys.frameCount = 0

        if (botSys.bots.length === splineNodes) {
            botSys.bots.forEach((bot) => bot.overlayRadius = 2)
        } else {
            botSys.bots = []
            let nodeDist = height * 0.5 / splineNodes
            for (let i = 0; i < splineNodes; i++) {
                let bot = new Bot()
                bot.pos = new Vector(width / 2, topShapeY + i * nodeDist)
                bot.overlayRadius = 2
                bot.clr = `#ff00ff`
                botSys.addBot(bot)
            }

            if (!forReset && splineNodes === 6) {
                let flamePositions = [{"x":98,"y":262},{"x":92,"y":307},{"x":101,"y":348},{"x":114,"y":420},{"x":158,"y":437},{"x":177,"y":508}]
                botSys.bots.forEach((bot, idx) => {
                    bot.pos = new Vector(flamePositions[idx])
                })
            }
        }

        const topRotateShape = controller.variableSet.getValue('topRotateShape')
        const topShapeWidth = controller.variableSet.getValue('topShapeWidth')
        const topShapeHeight = controller.variableSet.getValue('topShapeHeight')
        topShapeRotator = createShapeRotator(topRotateShape, topShapeX, topShapeY, topShapeWidth, topShapeHeight, controller)

        const bottomRotateShape = controller.variableSet.getValue('bottomRotateShape')
        const bottomShapeWidth = controller.variableSet.getValue('bottomShapeWidth')
        const bottomShapeHeight = controller.variableSet.getValue('bottomShapeHeight')
        bottomShapeRotator = createShapeRotator(bottomRotateShape, bottomShapeX, bottomShapeY, bottomShapeWidth, bottomShapeHeight, controller)

        if (controller.p5Canvas && controller.p5Canvas.sketchBuffer) {
            controller.p5Canvas.sketchBuffer.clear()
        }

        paintColor = colors.ensureColor255(controller.backgroundType === 'dark' ? '#b919fa' : '#404040')
        simulationComplete = false
        colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        width: width,
        height: height,
        minFrameRate: 20,
        maxFrameRate: 40,
        frameRate: 20,
        seed: 7918,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    controller.onVariableChanged = (controller, vdef, changeSet) => {
        
        if (vdef.name === 'weight' || vdef.name === 'weightPlacement' || vdef.name === 'dampening' ||
            vdef.name === 'topRotateSpeed' || vdef.name === 'paintStrength') {
            return
        }
        if (vdef.name === 'colorScheme') {
            colorLerper = new ColorAutoLerper(controller.variableSet.getValue('colorScheme').colors, 0.0095)
        }
        controller.reset()
    }

    const findClosestNode = (bot, nodes) => {
        let dist2 = 99999
        let bestNode = null

        nodes.forEach((node) => {
            let d2 = (node.position.x - bot.pos.x) ** 2 + (node.position.y - bot.pos.y) ** 2
            if (d2 < dist2) {
                dist2 = d2
                bestNode = node
            }
        })

        return bestNode
    }
    controller.prepareSketchForAnimation = (p5, sketchBuffer) => {
        const dampening = Math.max(0.001, variableSet.getValue('dampening'))
        const weight = variableSet.getValue('weight')
        const weightPlacement = variableSet.getValue('weightPlacement')

        world = new CANNON.World({
            gravity: new CANNON.Vec3(variableSet.getValue('gravityX'), variableSet.getValue('gravityY'), 0)
        })
        sketchBuffer.clear()

        nodes = []
        let prev = null
        let curver = botSys.getBotPointsCardinalCurver(0.5, 32, false)
        let nodeCount = Math.floor(curver.length / 12)
        if (weight > 0) {
            weightedNodeIndex = Math.round(weightPlacement * nodeCount / 100)
        } else {
            weightedNodeIndex = -1
        }
        for (let i = 0; i <= nodeCount; i++) {
            let mass = 1
            if (i === weightedNodeIndex) {
                mass = weight
            }

            const sphereBody = new CANNON.Body({
                mass: mass,
                shape: new CANNON.Sphere(1),
                collisionResponse: false,
                linearDamping: dampening / 8,
                linearFactor: new CANNON.Vec3(1 - dampening, 1 - dampening, 0)
            })

            let pos = curver.getPoint(i / nodeCount)
            sphereBody.position.set(pos.x, pos.y, 0)
            world.addBody(sphereBody)

            if (prev) {
                let con = new CANNON.DistanceConstraint(sphereBody, prev, sphereBody.position.distanceTo(prev.position))
                world.addConstraint(con)

                let con2 = new CANNON.LockConstraint(sphereBody, prev)
                world.addConstraint(con2)
            }
            nodes.push(sphereBody)
            prev = sphereBody
        }

        botSys.bots.forEach((bot) => {
            if (bot.shapeLock) {
                let node = findClosestNode(bot, nodes)
                node.shapeLock = bot.shapeLock
                node.mass = 0
                node.updateMassProperties()
            }
        })

        lastCurver = null

        botSys.bots.forEach((bot) => bot.overlayRadius = 0)
    }

    controller.doNextFrame = (p5, sketchBuffer) => {
        if (!simulationComplete) {
            const topRotateSpeed = controller.variableSet.getValue('topRotateSpeed')
            const bottomRotateSpeed = controller.variableSet.getValue('bottomRotateSpeed')

            nodes.forEach((node) => {
                if (node.shapeLock) {
                    let pos
                    if (node.shapeLock.key === 'top') {
                        pos = topShapeRotator.getNextPosition(node.shapeLock.t, topRotateSpeed, node.position)
                    } else {
                        pos = bottomShapeRotator.getNextPosition(node.shapeLock.t, bottomRotateSpeed, node.position)
                    }
                    if (pos) {
                        node.shapeLock.t = pos.t
                        node.position.set(pos.x, pos.y, 0)
                    } else {
                        simulationComplete = true
                    }
                }
            })
            world.fixedStep(1 / 20, 10)
        }
    }

    const makeCardinalSplineCurverFromSpherePositions = () => {
        let pts = []
        nodes.forEach((node) => {
            pts.push(node.position.x)
            pts.push(node.position.y)
        })

        return CardinalSplineCurver.makeFromPoints(pts, 0.5, 3, false)
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        const paintType = variableSet.getValue('paintType')
        const paintStrength = variableSet.getValue('paintStrength')
        const startDelay = variableSet.getValue('startDelay')

        if (simulationComplete === false && botSys.frameCount > startDelay) {
            let curver = makeCardinalSplineCurverFromSpherePositions()
            
            if (paintType === 'Line') {
                drawSolidSpline(sketchBuffer, curver, colorLerper, 2 * paintStrength, 0.001)
            } else if (paintType === 'Line2') {
                drawSolidSpline(sketchBuffer, curver, colorLerper, paintStrength, 0.001)
                if (lastCurver) {
                    drawDeltaSolidSpline(sketchBuffer, curver, lastCurver, colorLerper, 2 * paintStrength, 0.001)
                }
                lastCurver = curver
            } else { // Dots
                let grains = Math.floor(curver.length / controller.rand.randomBetween(4, 8))
                drawSandSplineGrains(sketchBuffer, curver, grains, colorLerper, 2 * paintStrength)
            }
        }
    }

    const drawFixedNode = (gb, x, y, locked) => {
        if (locked) {
            gb.stroke(0, 255, 0, 255)
        } else {
            controller.setStrokeColor(gb, botSys.bots[0].clr, 255)
        }
        gb.noFill()
        gb.circle(x, y, 8)
    }
    const calcBotDist = (bot, pos) => {
        return Math.sqrt((bot.pos.x - pos.x) ** 2 + (bot.pos.y - pos.y) ** 2)
    }
    const checkForShapeLocks = (rotator, key) => {
        const SNAP_DIST = 2
        botSys.bots.forEach((bot) => {
            let dist = 9999
            for (let pos of rotator.iterateFullLoop()) {
                let d = calcBotDist(bot, pos)
                if (d < SNAP_DIST && d < dist) {
                    dist = d
                    bot.shapeLock = {
                        key: key,
                        rotator: rotator,
                        t: pos.t
                    }
                }
            }
        })
    }
    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots && botSys.bots.length > 0) {
            const weight = variableSet.getValue('weight')
            const weightPlacement = variableSet.getValue('weightPlacement')

            if (controller.frameCount === 0) {
                let curver = botSys.getBotPointsCardinalCurver(0.5, 32, false)
                p5.strokeWeight(1)
                drawSolidSpline(p5, curver, botSys.bots[0].clr, 64, 0.001)

                botSys.bots.forEach((bot) => bot.shapeLock = null)
                if (topShapeRotator) {
                    let lastPos = null
                    p5.strokeWeight(1)
                    p5.noFill()
                    p5.stroke(192, 128, 128, 128)

                    for (let pos of topShapeRotator.iterateFullLoop()) {
                        if (lastPos) {
                            p5.line(lastPos.x, lastPos.y, pos.x, pos.y)
                        }
                        lastPos = pos
                    }

                    checkForShapeLocks(topShapeRotator, 'top')
                }

                if (bottomShapeRotator) {
                    let lastPos = null
                    p5.strokeWeight(1)
                    p5.noFill()
                    p5.stroke(192, 128, 128, 128)

                    for (let pos of bottomShapeRotator.iterateFullLoop()) {
                        if (lastPos) {
                            p5.line(lastPos.x, lastPos.y, pos.x, pos.y)
                        }
                        lastPos = pos
                    }
                    checkForShapeLocks(bottomShapeRotator, 'bottom')
                }

                // should we draw our weight?
                if (weight > 0 && weightPlacement > 0) {
                    let pos = curver.getPoint(weightPlacement / 100)
                    let size = utils.map(1, MAX_WEIGHT, weight, 6, 20)
                    p5.noStroke()
                    p5.fill(64, 255)
                    p5.circle(pos.x, pos.y, size)
                }

                botSys.bots.forEach((bot) => {
                    if (bot.shapeLock) {
                        drawFixedNode(p5, bot.pos.x, bot.pos.y, true)
                    }
                })
            } else {
                p5.strokeWeight(1)
                p5.noFill()
                p5.stroke(192, 128, 128, 64)
                if (topShapeRotator) {
                    let lastPos = null
                    for (let pos of topShapeRotator.iterateFullLoop()) {
                        if (lastPos) {
                            p5.line(lastPos.x, lastPos.y, pos.x, pos.y)
                        }
                        lastPos = pos
                    }
                }
                if (bottomShapeRotator) {
                    let lastPos = null
                    for (let pos of bottomShapeRotator.iterateFullLoop()) {
                        if (lastPos) {
                            p5.line(lastPos.x, lastPos.y, pos.x, pos.y)
                        }
                        lastPos = pos
                    }
                }

                let curver = makeCardinalSplineCurverFromSpherePositions()
                p5.strokeWeight(1)
                drawSolidSpline(p5, curver, paintColor, 255, 0.001)

                if (weight > 0 && weightedNodeIndex > 0) {
                    let node = nodes[weightedNodeIndex]
                    let size = utils.map(1, MAX_WEIGHT, weight, 6, 20)
                    p5.noStroke()
                    p5.fill(64, 255)
                    p5.circle(node.position.x, node.position.y, size)
                }

                nodes.forEach((node) => {
                    if (node.shapeLock) {
                        drawFixedNode(p5, node.position.x, node.position.y, true)
                    }
                })
            }
        }
    }

    return <div id='wigglyropes' className='content-chunk'>
        <h3>Wiggly Rope</h3>
        <p>Get a rope, tie it onto a spinning ellipse and let gravity do the rest. Okay, so it's not that simple,
            but that's the general idea behind this one. We use a physics engine to simulate a rope and then every
            frame we paint the shape of the rope to the canvas.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='wigglyRope' enableMouseDragging={true} />
            <p></p>
        </div>
        
    </div>
}

const ROT_TARGET_SPEED = 1
const ROT_SPEED_TOLERANCE = 0.05
class ShapeRotator {

    constructor(midX, midY, maxW, maxH, framesPerCycle) {
        this.midX = midX
        this.midY = midY
        this.maxW = maxW
        this.maxH = maxH

        this.framesPerCycle = framesPerCycle
    }
    *iterateFullLoop() {
    }
    getPosition(t) {
    }
    getNextPosition(t, speedMx, currentPos) {
        let targetDist = ROT_TARGET_SPEED * speedMx
        let dt = 1 / this.framesPerCycle
        let newT = t + dt
        let pos = this.getPosition(t)
        let nextPos = this.getPosition(newT)

        for (let i = 0; i <= 2; i++) {
            let vec = Vector.fromPoints(pos, nextPos)
            let dist = vec.mag()
            let variance = targetDist - dist
            if (Math.abs(variance) <= ROT_SPEED_TOLERANCE) {
                return nextPos
            }

            // we went too far, linear interp and try again
            if (dist > targetDist) {
                let pct = targetDist / dist
                newT = t + dt * pct
            } else { // not far enough
                let pct = dist / targetDist
                newT += (1 - pct) * dt
            }

            dt = newT - t
            nextPos = this.getPosition(newT)
        }

        return nextPos
    }
}
class InfinityRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH) {
        super(midX, midY, maxW, maxH, 600)
    }
    *iterateFullLoop() {
        for (let fc = 0; fc <= this.framesPerCycle; fc++) {
            let t = fc / this.framesPerCycle
            let y = sin(t * 4 * Math.PI)
            let x = cos(t * 2 * Math.PI)
            yield { x: x * this.maxW / 2 + this.midX, y: y * this.maxH / 2 + this.midY, t: fc / this.framesPerCycle }
        }
    }
    getPosition(t) {
        let y = sin(t * 4 * Math.PI)
        let x = cos(t * 2 * Math.PI)
        return { x: x * this.maxW / 2 + this.midX, y: y * this.maxH / 2 + this.midY, t: t }
    }
}
class EllipseRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH) {
        super(midX, midY, maxW, maxH, 600)
    }
    *iterateFullLoop() {
        for (let fc = 0; fc <= this.framesPerCycle; fc++) {
            let t = fc / this.framesPerCycle
            yield this.getPosition(t)
        }
    }
    getPosition(t) {
        let y = sin(t * 2 * Math.PI)
        let x = cos(t * 2 * Math.PI)

        return { x: x * this.maxW / 2 + this.midX, y: y * this.maxH / 2 + this.midY, t: t }
    }
}
class RandomJumpsRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH, rand) {
        const nodeCount = 64
        super(midX, midY, maxW, maxH, 2 * maxW)
        this.overlayStops = []
        let pos = {
            x: -0.5 * this.maxW,
            y: -0.5 * this.maxH
        }

        let deltaX = maxW / nodeCount
        for (let i = 0; i < nodeCount; i++) {
            pos.minT = i/nodeCount
            pos.maxT = (i+1)/nodeCount
            this.overlayStops.push(pos)

            let x = pos.x + deltaX
            let minY = Math.max(-0.5 * maxH, pos.y - 4 * deltaX)
            let maxY = Math.min(0.5 * maxH, pos.y + 4 * deltaX)

            pos = { x: x, y: rand.randomBetween(minY, maxY)}
        }
    }
    *iterateFullLoop() {
        for (let i = 0; i < this.overlayStops.length; i++) {
            let stop = this.overlayStops[i]
            yield { x: stop.x + this.midX, y: stop.y + this.midY, t: stop.minT }
        }
    }

    getNextPosition(t, speedMx, currentPos) {
        let newT = (t + speedMx / this.framesPerCycle)
        if (newT > 1) {
            return null
        }
        let i = 0
        while (i < this.overlayStops.length-1) {
            let stop = this.overlayStops[i++]
            let nextStop = this.overlayStops[i]
            if (stop.minT <= newT && stop.maxT >= newT) {
                let pct = (newT - stop.minT) / (stop.maxT - stop.minT)
                let dx = stop.x + pct * (nextStop.x - stop.x)
                let dy = stop.y + pct * (nextStop.y - stop.y)
                return { x: dx + this.midX, y: dy + this.midY, t: newT }
            }
        }
        return null
    }
}

class CurlyCueRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH) {
        super(midX, midY, maxW, maxH, 1200)
        this.loopRadius = Math.max(8, maxH / 30)
        this.loopSpeed = (maxW + maxH * 0.8) / 30
    }
    *iterateFullLoop() {
        for (let fc = 0; fc <= this.framesPerCycle; fc++) {
            yield this.getPosition(fc / this.framesPerCycle)
        }
    }
    getPosition(t) {
        let x = (t * this.maxW) - this.maxW/2
        let y = 0

        let cang = this.loopSpeed*t*2*Math.PI + Math.PI
        let cx = cos(cang) * this.loopRadius
        let cy = sin(cang) * this.loopRadius

        return { x: x + cx + this.midX, y: y + cy + this.midY, t: t }
    }
}

class VerticalSpiralsRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH) {
        super(midX, midY, maxW, maxH, 1200)
        this.rings = Math.floor(maxH / 16 + maxW / 180)
        this.ringFrames = this.framesPerCycle / this.rings
    }
    *iterateFullLoop() {
        for (let fc = 0; fc <= this.framesPerCycle; fc++) {
            yield this.getPosition(fc / this.framesPerCycle)
        }
    }
    getPosition(t) {
        let loopRadius = 1 + (t * this.maxW)

        let cang = t*2*Math.PI * this.rings
        let x = cos(cang) * loopRadius
        let y = (t * this.maxH)

        return { x: x + this.midX, y: y + this.midY, t: t }
    }
}
class HorizontalSpiralsRotator extends ShapeRotator {
    constructor(midX, midY, maxW, maxH) {
        super(midX, midY, maxW, maxH, 1200)
        this.rings = Math.floor(maxW / 16 + 180 / maxH / 180)
        this.ringFrames = this.framesPerCycle / this.rings
    }
    *iterateFullLoop() {
        for (let fc = 0; fc <= this.framesPerCycle; fc++) {
            yield this.getPosition(fc / this.framesPerCycle)
        }
    }
    getPosition(t) {
        let loopRadius = 1 + (t * this.maxH)

        let cang = t*2*Math.PI * this.rings
        let y = sin(cang) * loopRadius
        let x = (t * this.maxW)

        return { x: x + this.midX, y: y + this.midY, t: t }
    }
}