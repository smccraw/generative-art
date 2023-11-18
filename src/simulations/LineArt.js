import React from "react"
import get from "lodash.get"
import utils from "../utils"
import Vector, { rads } from "../Vector"
import SketchTweaker, { DefaultController } from "../components/SketchTweaker"
import P5Canvas2 from "../components/P5Canvas2"
import { VariableChangeSet } from "../components/VariableChanger"
import { CardinalSplineCurver} from "../Curvers"
import * as EASING from "../easing"
import initialize3dProjection, { rotateAroundX, rotateAroundY, rotateAroundZ } from "../projection3d.js"

// const TWO_PI = Math.PI * 2
// const sin = Math.sin
// const cos = Math.cos
const sind = (d) => Math.sin(d * Math.PI / 180)
const cosd = (d) => Math.cos(d * Math.PI / 180)


export function SimpleTrigLineArt(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800), depth = 800
    let CENTER = { x: width / 2, y: height / 2 }
    let sketchState = null
    let frameCount = 0
    let controller = new DefaultController()
    let tweakerRef = React.createRef();

    controller.backgroundType = 'light'
    controller.showBots = true
    controller.width = width
    controller.height = height
    controller.depth = depth
    controller.frameRate = 30
    controller.finishedArt = true

    const initializeSketch = () => {
        frameCount = 0
        sketchState = {
            angle1: -1,
            dAngle: 360 / 23,
            iteration: -1,
            iterationMax: 18,
            finished: false,
        }

    }
    initializeSketch()  // prime the pump at least once

    controller.onChange = (type) => {
        if (type === 'backgroundType') {
            controller.resetRequested = true
        }
    }

    const drawTearDrop = (gb, angle1, iteration) => {
        let lastPt = null
        let targetLengthRadius = 160 - iteration * 7
        let targetWidthRadius = 80 - iteration * 3
        for (let t = 0; t <= 1; t += 0.000625) {
            let ang2 = t * 360
            let radius = targetWidthRadius * sind(t * 180)
            let x = targetLengthRadius * cosd(ang2) - iteration * 9
            let y = radius * sind(ang2)

            let pos = rotateAroundZ(rads(180 + angle1), x, y, 0)
            pos.x += CENTER.x + targetLengthRadius * cosd(angle1)
            pos.y += CENTER.y + targetLengthRadius * sind(angle1)
            if (lastPt) {
                gb.line(lastPt.x, lastPt.y, pos.x, pos.y)
            }
            lastPt = pos
        }
    }
    const nextIteration = (p5, sketchBuffer, p5canvas2) => {
        // animate first iteration
        if (sketchState.angle1 === -1) {
            if (sketchState.iteration === -1) {
                // one time initialization
                sketchBuffer.noFill()
                sketchBuffer.strokeWeight(1)
                controller.setStrokeColor(sketchBuffer, controller.getNotBackgroundColor(), 128)
                sketchBuffer.clear()
            }
            sketchState.iteration++
            if (sketchState.iteration < sketchState.iterationMax) {
                drawTearDrop(sketchBuffer, sketchState.angle1, sketchState.iteration)
                return
            } else {
                sketchState.iteration = -1
                sketchState.angle1++
            }
        }

        sketchState.angle1 += sketchState.dAngle
        if (sketchState.angle1 < 360) {
            for (let i = 0; i < 18; i++) {
                drawTearDrop(sketchBuffer, sketchState.angle1, i)
            }
        } else {
            sketchState.finished = true
        }
    }

    const draw = (p5, sketchBuffer, p5canvas2) => {
        if (controller.resetRequested) {
            controller.resetRequested = false
            p5canvas2.reset()
            initializeSketch()
            return
        }
        if (controller.downloadRequested) {
            controller.downloadRequested = false
            p5canvas2.downloadSketch("trigFlower")
            return
        }

        if (!controller.paused || controller.stepRequested) {
            frameCount++
            controller.stepRequested = false

            if (!sketchState.finished) {
                if (controller.showBots) {
                    nextIteration(p5, sketchBuffer, p5canvas2)
                } else {
                    while (!sketchState.finished) {
                        nextIteration(p5, sketchBuffer, p5canvas2)
                    }
                }
            }
        }

        controller.eraseBackground(p5)
        p5.image(sketchBuffer, 0, 0)
        if (controller.showBots) {
            controller.drawFrameCount(p5, frameCount)
        }
    }

    return <div id='simpletrig' className='content-chunk'>
        <h3>Line Art - Simple Trigonometry</h3>
        <p>At the heart of spirograph type art is repeating patterns, typically in a circular fashion. Here we draw a simple tear drop shape, repeat it
            a bit smaller a few times and then just rotate it around the origin a bunch of times. Uncheck the ShowBots icon before hitting play to see this animated.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} ref={tweakerRef} />
            <P5Canvas2 width={width} height={height} onDraw={draw} frameRate={controller.frameRate}
                enableMouseDragging={true} />
        </div>
    </div>
}

export function FlowerLineArt(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800), depth = 800
    let painted = false
    let sketchState = null
    let frameCount = 0
    let projection = initialize3dProjection(width, height, depth, 0.55)
    let controller = new DefaultController()
    let tweakerRef = React.createRef();

    controller.backgroundType = 'light'
    controller.showBots = true
    controller.projection = projection
    controller.width = width
    controller.height = height
    controller.depth = depth
    controller.frameRate = 120
    controller.onChange = (type, name) => {
        if (type === 'backgroundType') {
            controller.resetRequested = true
        }
    }
    const initializeSketch = () => {
        painted = false
        frameCount = 0
        sketchState = null
    }
    initializeSketch()  // prime the pump at least once

    const draw = (p5, sketchBuffer, p5canvas2) => {
        if (controller.resetRequested) {
            controller.resetRequested = false
            p5canvas2.reset()
            initializeSketch()
            return
        }
        if (controller.downloadRequested) {
            controller.downloadRequested = false
            p5canvas2.downloadSketch("trigFlower2")
            return
        }

        if (!sketchState) {
            sketchState = lineArtGenerator(sketchBuffer, controller)
        }

        if (!painted) {
            if (!controller.paused || controller.stepRequested) {
                frameCount++
                controller.stepRequested = false
    
                if (controller.showBots) {
                    let res = sketchState.next()
                    if (res.done) {
                        painted = true
                    }
                } else {
                    let res = sketchState.next()
                    while (!res.done) {
                        res = sketchState.next()
                    }
                    painted = true
                }
            }
        }
        
        controller.eraseBackground(p5)
        p5.image(sketchBuffer, 0, 0)
        if (controller.showBots) {
            controller.drawFrameCount(p5, frameCount)
        }
    }

    return <div id='lineflower' className='content-chunk'>
        <h3>Line Art - Flower</h3>
        <p>This flower is generated using cardinal splines (basically a Catnull-Rom spline with tension added). Our control points for the spline
            are selected by choosing 2 points along the circumference of the circle at a specific angles apart (alternating between 40 and 80 degrees).
            Then we choose a point near the center of the circle, but on the far side from our first two points. Then we choose the final two points
            in between our circumference points and our center point. When drawn the first time this arc does not look smooth, all 3 of the curves
            are sharp and have unpleasing angles to them. However if we continue drawing these over and over with, just slightly varying the angle by 
            a fixed amount, the resulting image is much more pleasing than any of it's individual lines.

        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} ref={tweakerRef} />
            <P5Canvas2 width={width} height={height} onDraw={draw} frameRate={controller.frameRate} />
        </div>
    </div>
}

function* lineArtGenerator(p5, controller) {
    let driveState = buildLineSegmentState(controller)

    controller.setStrokeColor(p5, controller.getNotBackgroundColor(), 128)
    let radius = 440
    let innerR = 220
    let innerR2 = 330
    for (let theta = 0; theta <= 360; theta++) {
        let x = radius * cosd(theta)
        let y = radius * sind(theta)
        let z = 0

        drawLineSegment(p5, x, y, z, driveState)
        yield theta;
    }

    for (let w = 0; w <= 9; w++) {
        let deltaW = 10 * EASING.easeOutQuad(w / 10)
        let ang = 250 - deltaW

        for (let i = 0; i < 6; i++) {
            let pts = [
                (radius - w * 10) * cosd(ang), (radius - w * 10) * sind(ang),
                (innerR - w * 10) * cosd(ang - 40 + deltaW), (innerR - w * 10) * sind(ang - 40 + deltaW),
                (radius - w * 10) * cosd(ang - 80 + 2 * deltaW), (radius - w * 10) * sind(ang - 80 + 2 * deltaW)
            ]

            let curver = CardinalSplineCurver.makeFromPoints(pts, 0.5, 40)
            let t = 0
            driveState.lastPt = null
            while (t <= 1) {
                let pt = curver.getPoint(t)
                drawLineSegment(p5, pt.x, pt.y, 0, driveState)
                if ((t + 0.001) >= 1) {
                    break;
                }
                t += 1 / 120
                yield t;
            }

            pts = [
                (radius - w * 10) * cosd(ang), (radius - w * 10) * sind(ang),
                (innerR2 - w * 10) * cosd(ang + 20 + deltaW), (innerR2 - w * 10) * sind(ang + 20 + deltaW),
                (50 - w * 10) * cosd(ang - 220 + deltaW), (50 - w * 10) * sind(ang - 220 + deltaW),
                (innerR2 - w * 10) * cosd(ang - 100 + deltaW), (innerR2 - w * 10) * sind(ang - 100 + deltaW),
                (radius - w * 10) * cosd(ang - 80 + 2 * deltaW), (radius - w * 10) * sind(ang - 80 + 2 * deltaW)
            ]

            curver = CardinalSplineCurver.makeFromPoints(pts, 0.5, 40)
            t = 0
            driveState.lastPt = null
            while (t <= 1) {
                let pt = curver.getPoint(t)
                drawLineSegment(p5, pt.x, pt.y, 0, driveState)
                if ((t + 0.001) >= 1) {
                    break;
                }
                t += 1 / 120
                yield t;
            }
            ang -= 60
        }
    }
}

export function ArchesLineArt(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800), depth = 800
    let CENTER = { x: width / 2, y: height / 2 }
    let painted = false
    let sketchState = null
    let frameCount = 0
    let controller = new DefaultController()
    let tweakerRef = React.createRef();

    controller.backgroundType = 'light'
    controller.showBots = true
    controller.width = width
    controller.height = height
    controller.depth = depth
    controller.finishedArt = true
    controller.frameRate = 60
    controller.onChange = (type, name) => {
        if (type === 'backgroundType') {
            controller.resetRequested = true
        }
    }
    const initializeSketch = () => {
        painted = false
        frameCount = 0
        sketchState = null
    }
    initializeSketch()  // prime the pump at least once

    const drawImage = function* (gb) {
        let targetRadius = 390
        const makePt = (angle, radius) => {
            return {
                x: radius * cosd(angle) + CENTER.x,
                y: radius * sind(angle) + CENTER.y,
            }
        }

        for (let a = 0; a < 720; a += 0.618) {
            let ang1 = a
            let ang2 = a + utils.map(0, 720, a, 72, 6180)

            let pt1 = makePt(ang1, targetRadius)
            let pt2 = makePt(ang2, targetRadius)
            gb.line(pt1.x, pt1.y, pt2.x, pt2.y)
            yield a;
        }
    }

    const draw = (p5, sketchBuffer, p5canvas2) => {
        if (controller.resetRequested) {
            controller.resetRequested = false
            p5canvas2.reset()
            initializeSketch()
            return
        }
        if (controller.downloadRequested) {
            controller.downloadRequested = false
            p5canvas2.downloadSketch("lineArches")
            return
        }

        if (!sketchState) {
            sketchState = drawImage(sketchBuffer)
            sketchBuffer.noFill()
            sketchBuffer.strokeWeight(1)
            controller.setStrokeColor(sketchBuffer, controller.getNotBackgroundColor(), 96)
            console.log(controller.getNotBackgroundColor())
        }

        if (!painted) {
            if (!controller.paused || controller.stepRequested) {
                frameCount++
                controller.stepRequested = false
    
                if (controller.showBots) {
                    let res = sketchState.next()
                    if (res.done) {
                        painted = true
                    }
                } else {
                    let res = sketchState.next()
                    while (!res.done) {
                        res = sketchState.next()
                    }
                    painted = true
                }
            }
        }

        controller.eraseBackground(p5)
        p5.image(sketchBuffer, 0, 0)
        if (controller.showBots) {
            controller.drawFrameCount(p5, frameCount)
        }
    }

    return <div id='linearches' className='content-chunk'>
        <h3>Line Art - Arches</h3>
        <p>Arches is a prime example of how complex images can be created with simple lines. All we do here is draw lines between two points
            along the outside of a circle. On each iteration we move one of the end points by a small delta angle and we move then other
            end point by a large delta angle, draw a line, rinse, repeat...
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} ref={tweakerRef} />
            <P5Canvas2 width={width} height={height} onDraw={draw} frameRate={controller.frameRate} />
        </div>
    </div>
}

function drawLineSegment(gb, x, y, z, state) {
    let rotated = { x, y, z }
    if (state.xrot !== 0) {
        rotated = rotateAroundX(rads(state.xrot), rotated.x, rotated.y, rotated.z)
    }
    if (state.yrot !== 0) {
        rotated = rotateAroundY(rads(state.yrot), rotated.x, rotated.y, rotated.z)
    }
    if (state.zrot !== 0) {
        rotated = rotateAroundZ(rads(state.zrot), rotated.x, rotated.y, rotated.z)
    }

    let pjp = state.projection.getProjectedPoint([rotated.x + state.xoffset, rotated.y + state.yoffset, rotated.z + state.zoffset])
    if (state.lastPt) {
        gb.line(state.lastPt.x, state.lastPt.y, pjp[0], pjp[1])
    }
    state.lastPt = { x: pjp[0], y: pjp[1] }
}

function drawMarkerPoint(gb, x, y, z, state) {
    let rotated = { x, y, z }
    if (state.xrot !== 0) {
        rotated = rotateAroundX(rads(state.xrot), rotated.x, rotated.y, rotated.z)
    }
    if (state.yrot !== 0) {
        rotated = rotateAroundY(rads(state.yrot), rotated.x, rotated.y, rotated.z)
    }
    if (state.zrot !== 0) {
        rotated = rotateAroundZ(rads(state.zrot), rotated.x, rotated.y, rotated.z)
    }

    let pjp = state.projection.getProjectedPoint([rotated.x + state.xoffset, rotated.y + state.yoffset, rotated.z + state.zoffset])
    gb.circle(pjp[0], pjp[1], 4)
}


function buildLineSegmentState(controller, zDepth) {
    if (!controller.variableSet) {
        return {
            xrot: 0,
            yrot: 0,
            zrot: 0,
            xoffset: 400,
            yoffset: 400,
            zoffset: (typeof zDepth === 'number') ? zDepth :100,
            projection: controller.projection,
            lastPt: null
        }
    }
    return {
        xrot: controller.variableSet.getValue('xrot'),
        yrot: controller.variableSet.getValue('yrot'),
        zrot: controller.variableSet.getValue('zrot'),
        xoffset: controller.variableSet.getValue('xoffset'),
        yoffset: controller.variableSet.getValue('yoffset'),
        zoffset: controller.variableSet.getValue('zoffset'),
        projection: controller.projection,
        lastPt: null
    }
}

function drawBoxOverlay(p5, controller, frameCount) {
    let { width, height, depth, projection } = controller
    let box_ul = projection.getProjectedPoint([0, 0, depth])
    let box_ur = projection.getProjectedPoint([width, 0, depth])
    let box_lr = projection.getProjectedPoint([width, height, depth])
    let box_ll = projection.getProjectedPoint([0, height, depth])
    p5.stroke(220, 255)
    p5.strokeWeight(1)
    p5.line(0, 0, box_ul[0], box_ul[1])
    p5.line(800, 0, box_ur[0], box_ur[1])
    p5.line(box_ul[0], box_ul[1], box_ur[0], box_ur[1])

    p5.line(800, 800, box_lr[0], box_lr[1])
    p5.line(box_lr[0], box_lr[1], box_ur[0], box_ur[1])

    p5.line(0, 800, box_ll[0], box_ll[1])
    p5.line(box_lr[0], box_lr[1], box_ll[0], box_ll[1])
    p5.line(box_ul[0], box_ul[1], box_ll[0], box_ll[1])

    p5.line(width / 2, 0, width / 2, height)
    p5.line(0, height / 2, width, height / 2)

    controller.drawFrameCount(p5, frameCount)
}

function handleCameraDrag(ds, controller, tweakerRef) {
    if (ds.action === 'start') {
        ds.xrotStart = controller.variableSet.getValue('xrot')
        ds.yrotStart = controller.variableSet.getValue('yrot')
    } else if (ds.action === 'move') {
        let dx = ds.dragNowAt.x - ds.dragStartAt.x
        let dy = ds.dragNowAt.y - ds.dragStartAt.y

        if (dy) {
            controller.setVariableValue('xrot', ds.xrotStart + dy)
        }
        if (dx) {
            controller.setVariableValue('yrot', ds.yrotStart - dx)
        }
    } else if (ds.action === 'end') {
        if (tweakerRef && tweakerRef.current) {
            tweakerRef.current.forceUpdate()
        }
    }
}

export function TorusLineArt(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800), depth = 800
    let painted = false
    let sketchState = null
    let frameCount = 0
    let projection = initialize3dProjection(width, height, depth, 0.55)
    let controller = new DefaultController()
    let tweakerRef = React.createRef();

    controller.projection = projection
    controller.width = width
    controller.height = height
    controller.depth = depth
    controller.showBots = true
    controller.finishedArt = true
    controller.frameRate = 15
    
    controller.onChange = (type, name) => {
        if (type === 'backgroundType') {
            controller.resetRequested = true
        }
    }
    const initializeSketch = () => {
        painted = false
        frameCount = 0
        sketchState = null
    }
    initializeSketch()  // prime the pump at least once

    const drawArcdLine = function (gb, x1, y1, x2, y2, arcW) {
        let vec = new Vector(x2 - x1, y2 - y1)
        let dist = vec.mag()
        let vec2 = vec.turnRight90().unit()

        let arcState = buildLineSegmentState(controller, depth/2)

        let t = 0
        while (t < 1) {
            let vt = new Vector(x1 + (vec.x * EASING.easeInOutSine(t)), y1 + (vec.y * EASING.easeInOutSine(t)))
            let bowD = arcW * sind(t * 180)
            vt = vt.add(vec2.mult(bowD))

            drawLineSegment(gb, vt.x, vt.y, 0, arcState)
            t += 3 / dist
        }
        drawLineSegment(gb, x2, y2, 0, arcState)
    }
    const drawGenerator = function *(gb) {
        let radius = 400

        const dt = 180
        for (let t = 0; t <= 1; t += 0.00625) {
            let zeta = 270 - t * 360
            let x = radius * cosd(zeta)
            let y = radius * sind(zeta)

            let x2 = radius * cosd(zeta - t * dt)
            let y2 = radius * sind(zeta - t * dt)

            drawArcdLine(gb, x, y, x2, y2, t * 90)

            zeta = 90 - t * 360
            x = radius * cosd(zeta)
            y = radius * sind(zeta)

            x2 = radius * cosd(zeta - t * dt)
            y2 = radius * sind(zeta - t * dt)

            drawArcdLine(gb, x, y, x2, y2, t * 90)
            yield t
        }
    }
    const draw = (p5, sketchBuffer, p5canvas2) => {
        if (controller.resetRequested) {
            controller.resetRequested = false
            p5canvas2.reset()
            initializeSketch()
            return
        }
        if (controller.downloadRequested) {
            controller.downloadRequested = false
            p5canvas2.downloadSketch("lineTorus")
            return
        }

        if (!sketchState) {
            sketchState = drawGenerator(sketchBuffer)
            controller.setStrokeColor(sketchBuffer, controller.getNotBackgroundColor(), 96)
        }
        if (!painted) {
            if (!controller.paused || controller.stepRequested) {
                frameCount++
                controller.stepRequested = false
    
                if (controller.showBots) {
                    let res = sketchState.next()
                    if (res.done) {
                        painted = true
                    }
                } else {
                    let res = sketchState.next()
                    while (!res.done) {
                        res = sketchState.next()
                    }
                    painted = true
                }
            }
        }

        controller.eraseBackground(p5)
        p5.image(sketchBuffer, 0, 0)
        if (controller.showBots) {
            controller.drawFrameCount(p5, frameCount)
        }
    }

    return <div id='linetorus' className='content-chunk'>
        <h3>Line Art - Torus</h3>
        <p>This torus like shape is drawn by walking around the circumference of a circle and drawing lines between arc lengths. At first
            the angle between the line end points is very small and the lines are very straight. As we progress around the circle the
            arc angle is larger and larger, eventually approaching 180 degrees. As the angle gets bigger we also start to bow out the
            line using half of a single sine wave to give the line a curvature, which is why when we get to the arc angle of 180 degrees
            we do not have a line being drawn throught the center point, but rather something that looks like half an ellipse.
        </p>
        <p>We then duplicate this process at exactly 180 degrees around the circle, thus creating what looks like two spirals circling each other.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} ref={tweakerRef} />
            <P5Canvas2 width={width} height={height} onDraw={draw} frameRate={controller.frameRate} />
        </div>
    </div>
}

export function CameraDragLineArt(props) {
    let width = get(props, 'width', 800), height = get(props, 'height', 800), depth = 800
    let frameCount = 0
    let projection = initialize3dProjection(width, height, depth, 0.55)
    let controller = new DefaultController()
    let tweakerRef = React.createRef();

    controller.projection = projection
    controller.width = width
    controller.height = height
    controller.depth = depth
    controller.showBots = false
    controller.variableSet = new VariableChangeSet()
    controller.variableSet.addNumberSlider('xrot', 'XRot', -360, 360, 3, 0)
        .addNumberSlider('yrot', 'YRot', -360, 360, 3, 0)
        .addNumberSlider('zrot', 'ZRot', -360, 360, 3, 0)
        .addNumberSlider('xoffset', 'XOff', 0, width, 1, width / 2)
        .addNumberSlider('yoffset', 'YOff', 0, height, 1, height / 2)
        .addNumberSlider('zoffset', 'ZOff', 0, depth, 1, depth / 2)
    controller.onChange = (type, name) => {
        if (type === 'variable') {
            controller.resetRequested = false
        }
    }
    const initializeSketch = () => {
        frameCount = 0
    }
    initializeSketch()  // prime the pump at least once

    const drawArcdLine = (gb, x1, y1, x2, y2, arcW) => {
        let vec = new Vector(x2 - x1, y2 - y1)
        let dist = vec.mag()
        let vec2 = vec.turnRight90().unit()

        let arcState = buildLineSegmentState(controller)

        let t = 0
        while (t < 1) {
            let vt = new Vector(x1 + (vec.x * EASING.easeInOutSine(t)), y1 + (vec.y * EASING.easeInOutSine(t)))
            let bowD = arcW * sind(t * 180)
            vt = vt.add(vec2.mult(bowD))

            drawLineSegment(gb, vt.x, vt.y, 0, arcState)
            t += 3 / dist
        }
        drawLineSegment(gb, x2, y2, 0, arcState)
    }
    const draw = (p5, sketchBuffer, p5canvas2) => {
        if (controller.resetRequested) {
            controller.resetRequested = false
            p5canvas2.reset()
            initializeSketch()
            return
        }
        if (controller.downloadRequested) {
            controller.downloadRequested = false
            p5canvas2.downloadSketch("imageGen")
            return
        }

        if (!controller.paused || controller.stepRequested) {
            frameCount++
            controller.stepRequested = false
        }

        controller.eraseBackground(p5)
        if (controller.showBots) {
            drawBoxOverlay(p5, controller, frameCount)
        }

        let driveState = buildLineSegmentState(controller)

        p5.stroke(0, 128)
        let radius = 400
        for (let theta = 0; theta <= 360; theta++) {
            let x = radius * cosd(theta)
            let y = radius * sind(theta)
            let z = 0

            drawLineSegment(p5, x, y, z, driveState)
        }

        const dt = 180
        for (let t = 0; t <= 1; t += 0.00625) {
            let zeta = 270 - t * 360
            let x = radius * cosd(zeta)
            let y = radius * sind(zeta)

            let x2 = radius * cosd(zeta - t * dt)
            let y2 = radius * sind(zeta - t * dt)

            drawArcdLine(p5, x, y, x2, y2, t * 90)

            zeta = 90 - t * 360
            x = radius * cosd(zeta)
            y = radius * sind(zeta)

            x2 = radius * cosd(zeta - t * dt)
            y2 = radius * sind(zeta - t * dt)

            drawArcdLine(p5, x, y, x2, y2, t * 90)
        }

        p5.image(sketchBuffer, 0, 0)
    }

    return <div className='content-chunk'>
        <h3>Line Art - Torus</h3>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} ref={tweakerRef} />
            <P5Canvas2 width={width} height={height} onDraw={draw} frameRate={controller.frameRate}
                enableMouseDragging={true} onMouseDragging={(ds) => handleCameraDrag(ds, controller, tweakerRef)} />
        </div>
    </div>
}