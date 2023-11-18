import colors from '../colors.js'
import utils from '../utils.js'
import Vector from "../Vector.js"
import { ProjectionCalculator3d } from 'projection-3d-2d';

// a bot system that has 1 bot and it is driven by a parametric equations
export default class ParametricBotSystem {
    constructor(width, height, initialPosition) {
        this.initialPosition = initialPosition || {x:0,y:0,z:0}
        this.width = width || 400
        this.height = height || 400
        
        this.currentPos = this.initialPosition
        this.CENTER_POS = new Vector(this.width / 2, this.height / 2)
        this.frameCount = 0
        this.projector = null
        this.offsets = {x: width/2, y: height/2, z: 0}
        this.scale = { x: 1, y: 1, z: 1 }

        this.initializeSystem = (sys,controller,forReset) => {sys.reset()}
        this.calculateNextPoint = (sys, currentPos, frameCount, p5, sketchBuffer) => {return currentPos}
    }

    setScaleAndOffset(xScale, yScale, zScale, x, y, z) {
        this.offsets = { x: x, y: y, z: z }
        this.scale = { x: xScale, y: yScale, z: zScale }
    }
    reset() {
        this.frameCount = 0
    }

    doNextFrame(frameCount, p5, sketchBuffer) {
        this.frameCount = frameCount
        let nextPos = this.calculateNextPoint(this, this.currentPos, this.frameCount, p5, sketchBuffer)
        this.lastPos = this.currentPos
        this.currentPos = nextPos
    }

    paintBotsOverlay(p5) {
        // let clr = colors.HTML_COLORS.magenta
        // p5.noStroke();
        // p5.fill(clr.r, clr.g, clr.b);

        // let uiPos = this.mapPositionToScreen(this.currentPos)

        // p5.circle(uiPos.x, uiPos.y, 3)    
    }

    dragBotHandler(e) {
    }

    mapPositionToScreen(pos) {
        let x = pos.x * this.scale.x + this.offsets.x
        let y = pos.y * this.scale.y + this.offsets.y
        let z = (pos.z || 0) * this.scale.z + this.offsets.z
        if (this.projector) {
            let outPos = this.projector.getProjectedPoint([x,y,z])
            return {x: outPos[0], y: outPos[1]}    
        } else {
            return {x:x, y:y, z:z}
        }
    }

    initialize3dProjection(scale, width, height, depth) {
        let {points2d, points3d} = this.buildProjectionPointsForScale(scale, width, height, depth)
        this.projector = new ProjectionCalculator3d(points3d, points2d);
    }

    buildProjectionPointsForScale(scale, width, height, depth) {
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
}
