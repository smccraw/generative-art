import colors from '../colors.js'
import utils from '../utils.js'
import Vector from "../Vector.js"
import { CardinalSplineCurver } from "../Curvers.js"

let nextBotId = 1
const NO_SPATIAL_ZONE = { x: 0, y: 0, midX: 0, midY: 0, bots: [], spiX: -1, spiY: -1 }

// a bot system with simple fixed and a rudimentary spatial indexing if needed
export default class BotSystem {
    constructor(width, height) {
        this.bots = []
        this.width = width || 400
        this.height = height || 400
        this.gravityVec = new Vector(0, 0)
        this.friction = 0   // typically this will be something really small, like -0.01
        this.maxVelocity = null
        this.fixedVelocity = null
        this.spacialIndexSize = 0
        this.spatialIndex = null
        this.CENTER_POS = new Vector(this.width / 2, this.height / 2)
        this.attractors = []
        this.boundaries = new RectangularBoundaries(0, 0, width, height)
        this.frameCount = 0
        this.showBotVelocities = false

        this.initializeSystem = (sys, controller) => { sys.reset() }
    }

    setAllElasticities(val) {
        this.boundaries.elasticities = { left: val, right: val, top: val, bottom: val }
    }

    addBot(bot) {
        bot.clr = colors.ensureColor255(bot.clr)
        this.bots.push(bot)
    }

    reset() {
        this.frameCount = 0
        this.bots = []
        this.attractors = []
    }

    clearBots() {
        this.bots = []
    }

    clearAttractors() {
        this.attractors = []
    }

    handleDeletes() {
        let i = 0
        let dels = 0
        while (i < this.bots.length) {
            let bot = this.bots[i]
            if (bot.deleteRequested) {
                this.bots.splice(i, 1)
                dels++
            } else {
                i++
            }
        }
        return dels
    }

    // fmt = "flat,paired,coords"
    //  flat = [x1, y1, x2, y2,...]  -> DEFAULT behavior
    // paired = [[x1,y1], [x2,y2],...]
    // coords = [{x,y},{x,y}]
    getBotPoints(fmt, filter) {
        if (!filter) {
            filter = () => true
        }
        let pts = []
        this.bots.forEach((bot) => {
            if (filter(bot)) {
                switch (fmt) {
                    case 'coords':
                        pts.push(bot.pos)
                        break
                    case 'paired':
                        pts.push([bot.pos.x, bot.pos.y])
                        break;
                    case 'flat':
                    default:
                        pts.push(bot.pos.x)
                        pts.push(bot.pos.y)
                        break;
                }
            }
        })
        return pts
    }

    getBotPointsCardinalCurver(tension, segments, closed) {
        let pts = []
        this.bots.forEach((bot) => {
            pts.push(bot.pos.x)
            pts.push(bot.pos.y)
        })

        return CardinalSplineCurver.makeFromPoints(pts, tension, segments, closed)
    }

    applyPhysicsToBots() {
        this.bots.forEach((bot) => {
            if (!bot.fixedPosition) {
                if (this.gravityVec.x !== 0 || this.gravityVec.y !== 0) {
                    bot.applyForce(this.gravityVec)
                }
                this.attractors.forEach((att) => {
                    if (att.applyAttractor) {
                        att.applyAttractor(bot, this)
                    } else {
                        let avec = att.pos.subtr(bot.pos)
                        let df = (att.distanceFactor ? att.distanceFactor : "").toLowerCase()
                        let mag = att.magnitude
                        let d = Math.max(att.radius, avec.mag())

                        if (df === 'linear') {
                            mag = att.magnitude / d
                            console.log('linear', att.magnitude, mag)
                        } else if (df === 'gravity') {
                            mag = att.magnitude / (d * d)
                            console.log('gravity', att.magnitude, mag)
                        }
                        bot.applyForce(avec.unit().mult(mag))
                    }
                })

                if (this.friction < 0) {
                    bot.applyForce(bot.vel.unit().mult(this.friction))
                }

                bot.step(this)
                this.boundaries.enforce(bot)

                if (this.onPostBotPhysics) {
                    this.onPostBotPhysics(bot, this)
                }
            }
        })
    }

    doNextFrame(frameCount) {
        this.frameCount = frameCount
        this.bots.forEach((bot) => {
            bot.framesAlive++
        })

        let handleDeletes = true
        if (this.onPreStep) {
            if (false === this.onPreStep(this)) {
                handleDeletes = false
            }
        }
        if (handleDeletes) {
            this.handleDeletes()
        }

        let doPhysics = true
        if (this.onStepBots) {
            if (false === this.onStepBots(this)) {
                doPhysics = false
            }
        }
        if (doPhysics) {
            this.applyPhysicsToBots()
        }

        if (this.onPostStep) {
            this.onPostStep(this)
        }

        if (this.spacialIndexSize > 0) {
            this.buildSpatialIndex()
        }
    }

    getSpatialIndexZone(siX, siY) {
        if (siX < 0 || siX >= this.spatialIndexDimens.x) {
            return NO_SPATIAL_ZONE
        }
        if (siY < 0 || siY >= this.spatialIndexDimens.y) {
            return NO_SPATIAL_ZONE
        }

        let row = this.spatialIndex[siY]
        if (!row) {
            row = new Array(this.spatialIndexDimens.x)
            this.spatialIndex[siY] = row
        }
        let cell = row[siX]
        if (!cell) {
            cell = { x: siX * this.spacialIndexSize, y: siY * this.spacialIndexSize, bots: [], siX: siX, siY: siY }
            cell.midX = cell.x + this.spacialIndexSize / 2
            cell.midY = cell.y + this.spacialIndexSize / 2
            row[siX] = cell
        }
        return cell
    }
    getSpatialIndexForBot(bot) {
        let siX = Math.floor(bot.pos.x / this.spacialIndexSize)
        let siY = Math.floor(bot.pos.y / this.spacialIndexSize)

        return this.getSpatialIndexZone(siX, siY)
    }
    readSpatialIndexZone(siX, siY) {
        if (siX < 0 || siX >= this.spatialIndexDimens.x) {
            return null
        }
        if (siY < 0 || siY >= this.spatialIndexDimens.y) {
            return null
        }

        let row = this.spatialIndex[siY]
        if (!row) {
            return null
        }
        let cell = row[siX]
        return cell
    }
    buildSpatialIndex() {
        if (this.spacialIndexSize > 0) {
            let siW = Math.ceil(this.width / this.spacialIndexSize)
            let siH = Math.ceil(this.height / this.spacialIndexSize)

            this.spatialIndexDimens = { x: siW, y: siH }
            this.spatialIndex = new Array(siH)

            this.bots.forEach((bot) => {
                let zone = this.getSpatialIndexForBot(bot)
                zone.bots.push(bot)
            })
        }
    }
    // just your index cluster
    * immediateNeighbors(bot) {
        let sidx = this.getSpatialIndexForBot(bot)
        let i = 0
        while (i < sidx.bots.length) {
            let b = sidx.bots[i++];
            if (b !== bot && !b.deleteRequested) {
                yield b;
            }
        }
    }
    // 9 square are your index cluster
    * allInNeighborhood(bot) {
        let sidx = this.getSpatialIndexForBot(bot)
        if (sidx.siX >= 0) {
            let minX = Math.max(0, sidx.siX - 1)
            let minY = Math.max(0, sidx.siY - 1)
            let maxX = Math.min(this.spatialIndexDimens.x - 1, sidx.siX + 1)
            let maxY = Math.min(this.spatialIndexDimens.y - 1, sidx.siY + 1)

            for (let siY = minY; siY <= maxY; siY++) {
                for (let siX = minX; siX <= maxX; siX++) {
                    sidx = this.readSpatialIndexZone(siX, siY)
                    if (sidx) {
                        let i = 0
                        while (i < sidx.bots.length) {
                            let b = sidx.bots[i++];
                            if (b !== bot && !b.deleteRequested) {
                                yield b;
                            }
                        }
                    }
                }
            }
        }
    }
    * allOtherNeighborhoods(bot) {
        let sidx = this.getSpatialIndexForBot(bot)
        let hoods = new Set()
        if (sidx.siX >= 0) {
            let minX = Math.max(0, sidx.siX - 1)
            let minY = Math.max(0, sidx.siY - 1)
            let maxX = Math.min(this.spatialIndexDimens.x - 1, sidx.siX + 1)
            let maxY = Math.min(this.spatialIndexDimens.y - 1, sidx.siY + 1)

            for (let siY = minY; siY <= maxY; siY++) {
                for (let siX = minX; siX <= maxX; siX++) {
                    hoods.add(`${siX}_${siY}`)
                }
            }
        }
        for (let siY = 0; siY < this.spatialIndexDimens.y; siY++) {
            for (let siX = 0; siX < this.spatialIndexDimens.x; siX++) {
                if (!hoods.has(`${siX}_${siY}`)) {
                    sidx = this.readSpatialIndexZone(siX, siY)
                    if (sidx) {
                        yield sidx
                    }
                }
            }
        }
    }

    * surroundingPixels(xInt, yInt, radius) {
        for (let r = 1; r <= radius; r++) {
            for (let x = xInt - r; x <= xInt + r; x++) {
                if (x >= 0 && x < this.width) {
                    let y = yInt - r
                    if (y >= 0 && y < this.height) {
                        yield { x: x, y: y, radius: r }
                    }
                    y = yInt + r
                    if (y >= 0 && y < this.height) {
                        yield { x: x, y: y, radius: r }
                    }
                }
            }
            for (let y = yInt - r + 1; y < yInt + radius; y++) {
                if (y >= 0 && y < this.height) {
                    let x = xInt - r
                    if (x >= 0 && x < this.width) {
                        yield { x: x, y: y, radius: r }
                    }
                    x = xInt + r
                    if (x >= 0 && x < this.width) {
                        yield { x: x, y: y, radius: r }
                    }
                }
            }
        }
    }

    paintBotsOverlay(p5) {
        this.bots.forEach((bot) => {
            if (bot.overlayRadius > 0) {
                let diam = 2 * bot.overlayRadius
                if (this.showBotVelocities) {
                    let v = bot.vel.unit().mult(10)
                    p5.noFill();
                    p5.stroke('rgba(255,255,255,0.5)');
                    p5.line(bot.pos.x, bot.pos.y, bot.pos.x + v.x, bot.pos.y + v.y)
                    diam = Math.max(4, diam)
                }
                p5.noStroke();
                p5.fill(bot.clr.r, bot.clr.g, bot.clr.b);
                p5.circle(bot.pos.x, bot.pos.y, diam)
            }
        })
        this.attractors.forEach((attr) => {
            p5.noStroke();
            p5.fill(attr.clr.r, attr.clr.g, attr.clr.b);
            p5.circle(attr.pos.x, attr.pos.y, 2 * attr.radius)
        })
    }

    dragBotHandler(e) {
        if (e.action === 'start') {
            let dragBot = null
            let closestDist = 999999
            this.bots.forEach((bot) => {
                let v = bot.pos.subtr(e.dragStartAt)
                if (v.mag() < closestDist) {
                    dragBot = bot
                    closestDist = v.mag()
                }
                bot.originalDragPosition = new Vector(bot.pos.x, bot.pos.y)
            })

            if (dragBot && closestDist <= 9) {
                if (this.mouseSelectedBot !== dragBot) {
                    this.mouseSelectedBot = dragBot
                    if (this.onBotSelected) {
                        this.onBotSelected(dragBot)
                    }
                }
                e.dragBot = dragBot
                e.originalPos = new Vector(dragBot.pos)
            }
        } else if (e.action === 'move') {
            if (e.dragBot) {
                let dx = e.dragNowAt.x - e.dragStartAt.x
                let dy = e.dragNowAt.y - e.dragStartAt.y

                e.dragBot.setNewPosition(e.originalPos.addScalars(dx, dy))
                if (e.keyOptions.shiftKey) {
                    this.bots.forEach((bot) => {
                        if (bot !== e.dragBot) {
                            bot.setNewPosition(bot.originalDragPosition.addScalars(dx, dy))
                        }
                    })
                }
            }
        } else if (e.action === 'end') {
            let positions = []
            this.bots.forEach((bot) => {
                delete bot.originalDragPosition
                positions.push({x: bot.xInt(), y: bot.yInt()})
            })
            console.log("Bot Positions", JSON.stringify(positions))
        }
    }

    resolveFriendships(bot) {
        if (typeof bot.friend === 'object' && bot.friend !== null) {
            return [bot.friend]
        }
        if (typeof bot.friend === 'number') {
            return [this.bots[bot.friend]]
        }
        if (Array.isArray(bot.friends)) {
            let farr = []
            bot.friends.forEach((bf) => {
                if (typeof bf === 'number') {
                    farr.push(this.bots[bf])
                }
                if (typeof bf === 'object' && bf !== null) {
                    farr.push(bf)
                }
            })
            return farr
        } else if (bot.friends instanceof Set) {
            let farr = []
            Array.from(bot.friends).forEach((bf) => {
                if (typeof bf === 'number') {
                    farr.push(this.bots[bf])
                }
                if (typeof bf === 'object' && bf !== null) {
                    farr.push(bf)
                }
            })
            return farr
        }
        return []
    }

    // additionalProps: ['splineBot']
    serializeBots(additionalProps) {
        let out = {
            bots: []
        }

        this.bots.forEach((bot) => {
            let sbot = {}
            bot.serializeInto(sbot)
            if (additionalProps) {
                sbot.additionalProps = {}
                additionalProps.forEach((propName) => {
                    sbot.additionalProps[propName] = bot[propName]
                })
            }
            out.bots.push(sbot)
        })
        return out
    }

    deserializeBots(botsJson) {
        this.bots = []
        botsJson.bots.forEach((botInfo) => {
            let bot = new Bot()
            bot.deserialize(botInfo)
            if (botInfo.additionalProps) {
                for (let propName in botInfo.additionalProps) {
                    bot[propName] = botInfo.additionalProps[propName]
                }
            }
            this.bots.push(bot)
        })
    }
}

export class RectangularBoundaries {
    constructor(x, y, w, h) {
        this.left = x
        this.top = y
        this.right = x + w - 1
        this.bottom = x + h - 1
        // an elasticity of -1 means we do not enforce that boundary
        this.elasticities = { left: 1, right: 1, top: 1, bottom: 1 }
    }
    isInBoundary(bot) {
        if (bot.pos.x < this.left || bot.pos.x > this.right) {
            return false
        }
        if (bot.pos.y < this.top || bot.pos.y > this.bottom) {
            return false
        }
        return true
    }
    areCoordsInBoundary(x, y) {
        if (x < this.left || x > this.right) {
            return false
        }
        if (y < this.top || y > this.bottom) {
            return false
        }
        return true
    }
    enforce(bot) {
        let newX = bot.pos.x
        let newY = bot.pos.y
        if (bot.pos.x < this.left && this.elasticities.left >= 0) {
            newX = this.left
            bot.vel.set(-bot.vel.x * this.elasticities.left, bot.vel.y * this.elasticities.left)
        }
        if (bot.pos.x > this.right && this.elasticities.right >= 0) {
            newX = this.right
            bot.vel.set(-bot.vel.x * this.elasticities.right, bot.vel.y * this.elasticities.right)
        }
        if (bot.pos.y < this.top && this.elasticities.top >= 0) {
            newY = this.top
            bot.vel.set(bot.vel.x * this.elasticities.top, -bot.vel.y * this.elasticities.top)
        }
        if (bot.pos.y > this.bottom && this.elasticities.bottom >= 0) {
            newY = this.bottom
            bot.vel.set(bot.vel.x * this.elasticities.bottom, -bot.vel.y * this.elasticities.bottom)
        }
        bot.pos.set(newX, newY)
    }
}

export class Moveable {
    constructor() {
        this.lastPos = null
        this.pos = new Vector(0, 0)
        this.vel = new Vector(0, 0)
        this.forces = new Vector(0, 0)
        this.mass = 1
    }
    serializeInto(sbot) {
        sbot.pos = { x: this.pos.x, y: this.pos.y }
        sbot.vel = { x: this.vel.x, y: this.vel.y }
        if (this.forces.x !== 0 || this.forces.y !== 0) {
            sbot.forces = { x: this.forces.x, y: this.forces.y }
        }
        if (this.mass !== 1) {
            sbot.mass = this.mass
        }
    }
    deserialize(botInfo) {
        this.pos = new Vector(botInfo.pos)
        this.vel = new Vector(botInfo.vel)
        if (botInfo.forces) {
            this.forces = new Vector(botInfo.forces)
        }
        if (botInfo.mass) {
            this.mass = botInfo.mass
        }
    }
    xInt() {
        return Math.floor(this.pos.x)
    }

    yInt() {
        return Math.floor(this.pos.y)
    }
    applyForce(force) {
        let f = force.div(this.mass);
        this.forces.set(this.forces.x + f.x, this.forces.y + f.y);
    }
    setNewPosition(x, y) {
        this.lastPos = new Vector(this.pos)
        this.lastPos.z = this.pos.z

        if (typeof y === 'undefined' && typeof x === 'object' && typeof x.x === 'number') {
            this.pos.set(x.x, x.y)
        } else {
            this.pos.set(x, y)
        }
    }
    update(fixedVelocity, maxVelocity) {
        this.vel.set(this.vel.x + this.forces.x, this.vel.y + this.forces.y)

        if (fixedVelocity) {
            let mag = this.vel.mag()
            if (mag !== fixedVelocity) {
                this.vel = this.vel.unit().mult(fixedVelocity)
            }
        } else if (maxVelocity) {
            let mag = this.vel.mag()
            if (mag > maxVelocity) {
                this.vel = this.vel.mult(maxVelocity / mag)
            }
        }

        if (this.vel.x !== 0 || this.vel.y !== 0) {
            this.setNewPosition(this.pos.x + this.vel.x, this.pos.y + this.vel.y)
        }
        this.forces.set(0, 0)
    }

}

export class Bot extends Moveable {
    constructor() {
        super()
        this.id = nextBotId++
        this.framesAlive = 0
        this.clr = { r: 90, g: 90, b: 255 }
        this.overlayRadius = 1.5
        this.controlFn = null
    }

    serializeInto(sbot) {
        Moveable.prototype.serializeInto.call(this, sbot)
        sbot.id = this.id
        sbot.clr = Object.assign({}, this.clr)
        sbot.overlayRadius = this.overlayRadius
    }
    deserialize(botInfo) {
        Moveable.prototype.deserialize.call(this, botInfo)
        this.id = botInfo.id
        this.clr = botInfo.clr
        this.overlayRadius = botInfo.overlayRadius
    }
    setColor(clr) {
        this.clr = colors.ensureColor255(clr)
    }

    step(botSystem) {
        if (this.controlFn && typeof this.controlFn === 'function') {
            this.controlFn(this, botSystem)
        } else {
            this.update(botSystem.fixedVelocity, botSystem.maxVelocity)
        }
    }
}

export function createFollow1FriendBots(botSys, botCount, orbitors, colorSet, rand) {
    const width = botSys.width, height = botSys.height
    for (let i = 0; i < botCount; i++) {
        let bot = new Bot()
        let v = new Vector(width * 0.45 + rand.jitterRandom(10), 0).rotate(rand.random(Math.PI * 2))
        bot.pos = new Vector(width / 2 + v.x, height / 2 + v.y)

        bot.overlayRadius = 2
        bot.clr = rand.random(colorSet)
        bot.friend = (i + 1) % botCount
        botSys.addBot(bot)
    }

    let i = 0
    while (i <= orbitors && i < (botCount / 2)) {
        let bot = botSys.bots[i++]
        bot.orbitor = true
        bot.noPaint = true
        delete bot.friend
        bot.orbitDist = Math.min(width, height) / 2 - 120
        bot.overlayRadius = 3
        bot.clr = colors.HTML_COLORS['orange']
        i++
    }
}
export function handleFollow1FriendMove(botSys) {
    const width = botSys.width, height = botSys.height
    const ANGLE_VELOCITY = (Math.PI * 2) / 1000
    const ORBITOR_SPEED = Math.PI / 2
    const FRIEND_SPEED = ORBITOR_SPEED * 0.9

    botSys.bots.forEach((bot) => {
        let vbotF = botSys.bots[bot.friend]
        if (bot.orbitor) {
            let v = bot.pos.subtrScalars(width / 2, height / 2)
            let targetPos = v.unit().rotate(ANGLE_VELOCITY).mult(bot.orbitDist).addScalars(width / 2, height / 2)

            bot.vel = targetPos.subtr(bot.pos).unit().mult(ORBITOR_SPEED)
        } else {
            let vx = (vbotF.pos.x - bot.pos.x) / 1000
            let vy = (vbotF.pos.y - bot.pos.y) / 1000

            bot.vel = bot.vel.addScalars(vx, vy).unit().mult(FRIEND_SPEED)
        }
    })
}

