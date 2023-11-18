import get from "lodash.get"
import Random from "../random"

const random = new Random(14271)

/*
    Node: -> some calculation (or fixed constant) for it's x/y location
    children: [] -> one or more children, the equations for which will inherit a variable (n) to denote their index if they choose to use that
*/

// x and y will always be rooted at 0,0 during local calculations and
// only when putting to the screen will it get translated to appropriate coordinates
export default class SpiralNode {
    constructor(algo, options) {
        options = options || {}
        this.x = (typeof options.startingX ==='number') ? options.startingX : 0
        this.y = (typeof options.startingY ==='number') ? options.startingY : 0
        this.children = []
        this.algo = algo
        this.paintStyle = get(options, "paintStyle", "none")
        this.paintColor = get(options, "color", {r:255,g:255,b:255,a:164})
        this.paintPalette = get(options, "palette", {r:255,g:255,b:255,a:164})
        this.screenPt = null
        this.lastScreenPt = null
        this.data = options.data || {}
    }
    getScreenPt(parentX,parentY,scale) {
        return {
            x: this.x*scale + parentX,
            y: this.y*scale + parentY
        }
    }
   
    // t is the main outer iterator, params is anything the parent might want to pass down to the child
    // there will always be at least two (params.n and params.nOf) to denote your index amongst siblings and total siblings
    // for example with 3 children, {n:1, nOf:3}, {n:2, nOf:3} and {n:3, nOf:3} will be their values
    recalc(t, params, parentScreenX, parentScreenY, scale) {
        this.lastPos = {x: this.x, y: this.y}
        if (this.algo) {
            let res = this.algo(t, params, this)
            this.x = res.x
            this.y = res.y
        }
        if (this.screenPt) {
            this.lastScreenPt = this.screenPt
        }
        this.screenPt = this.getScreenPt(parentScreenX, parentScreenY, scale)

        let i=0;
        while (i < this.children.length) {
            let child = this.children[i]
            let cps = Object.assign({}, params, {n: i+1, nOf: this.children.length})
            child.recalc(t, cps, this.screenPt.x, this.screenPt.y, scale)
            i++
        }
    }

    // if you want to add several children, all with the same algorithm
    addMany(count, algo, options) {
        while (count > 0) {
            this.children.push(new SpiralNode(algo, options))
            count--
        }
    }
    add(algo, options) {
        let node = new SpiralNode(algo, options)
        this.children.push(node)
        return node
    }
    paintOnSketch(sketch, parentX, parentY, scale) {
        sketch.stroke(this.paintColor.r, this.paintColor.g, this.paintColor.b, this.paintColor.a)
        let pt = this.screenPt
        if (this.paintStyle === 'dot') {
            sketch.point(pt.x, pt.y)
        } else if (this.paintStyle === 'line' && this.lastScreenPt) {
            sketch.line(this.lastScreenPt.x, this.lastScreenPt.y, pt.x, pt.y)
        } else if (this.paintStyle === 'sand' && this.lastScreenPt) {
            let dx = this.screenPt.x - this.lastScreenPt.x
            let dy = this.screenPt.y - this.lastScreenPt.y
            let dist = Math.sqrt(dx*dx + dy*dy)
            let grains = Math.max(2,Math.round(random.randomBetween(dist/4, dist/2)))
            let ddx = dx / (grains-1)
            let ddy = dy / (grains-1)
            for (let i=0; i<=grains; i++) {
                let clr = this.paintPalette ? random.random(this.paintPalette) : this.paintColor
                let jitterX = random.jitterRandom(-2,2)
                let jitterY = random.jitterRandom(-2,2)
                sketch.stroke(clr.r, clr.g, clr.b, clr.a || 128)
                sketch.point(this.lastScreenPt.x + i*ddx + jitterX, this.lastScreenPt.y + i*ddy + jitterY)
                console.log(i, this.lastScreenPt, this.lastScreenPt.x + i*ddx + jitterX, this.lastScreenPt.y + i*ddy + jitterY)
            }
        }

        this.children.forEach( (child) => {
            child.paintOnSketch(sketch, pt.x, pt.y, scale)
        })
    }
    drawOnOverlay(overlay, parentX, parentY, scale) {
        if (this.screenPt) {
            let pt = this.screenPt
            this.children.forEach( (child, idx) => {
                child.drawOnOverlay(overlay, pt.x, pt.y, scale)
            })
    
            overlay.stroke(0xff, 0xa5, 0x00, 192)
            overlay.line(pt.x, pt.y, parentX, parentY)
            overlay.noStroke()
            overlay.fill(255,255)
            overlay.circle(pt.x, pt.y, 3)
        }
    }
}
