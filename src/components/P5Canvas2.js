import React from "react"
import get from "lodash.get"
import forEach from "lodash.foreach"
import p5, { Vector } from "p5"

// Props are:
//  width: xxx,
//  height: xxx,
//  [enableMouseDragging: T/F]
//  [useWebGL: T/F]
//  [frameRate: 120]
//  [onMouseDragging: (dragState) => {}]
//  [onPreload: (p5Canvas) => {}]
//  [onSetup: (p5, sketchBuffer, p5canvas2) => {}]
//  [onDraw: (p5, sketchBuffer, p5canvas2) => {}]
export default class P5Canvas2 extends React.Component {
    constructor(props) {
        super(props)
        this.setupComplete = false
        this.p5CanvasRef = React.createRef();
        this.width = get(props, 'width', 400)
        this.height = get(props, 'height', 400)
        this.sketch = (p) => {
            p.preload = () => this.preload(p)
            p.setup = () => this.setup(p)
            p.draw = () => this.draw(p)
        }
    }

    componentDidMount() {
        this.p5 = new p5(this.sketch, this.p5CanvasRef.current)
        if (this.props.enableMouseDragging) {
            this.p5.mousePressed = (e) => {
                let mx = this.p5.mouseX
                let my = this.p5.mouseY
                if (mx >= 0 && mx < this.width && my >= 0 && my < this.height) {
                    this.dragState = {
                        dragStartAt: new Vector(this.p5.mouseX, this.p5.mouseY),
                        dragNowAt: new Vector(this.p5.mouseX, this.p5.mouseY),
                        action: 'start',
                        keyOptions: {shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey}
                    }
                    if (this.props.onMouseDragging) {
                        this.props.onMouseDragging(this.dragState)
                    }
                }
            }
            this.p5.mouseDragged = (e) => {
                if (this.dragState) {
                    this.dragState.dragNowAt = new Vector(this.p5.mouseX, this.p5.mouseY)
                    this.dragState.action = 'move'
                    this.dragState.keyOptions = {shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey}
                    if (this.props.onMouseDragging) {
                        this.props.onMouseDragging(this.dragState)
                    }
                }
            }
            this.p5.mouseReleased = (e) => {
                if (this.dragState) {
                    this.dragState.dragNowAt = new Vector(this.p5.mouseX, this.p5.mouseY)
                    this.dragState.action = 'end'
                    this.dragState.keyOptions = {shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey}
                    if (this.props.onMouseDragging) {
                        this.props.onMouseDragging(this.dragState)
                    }
                    this.dragState = null
                }
            }
        }
    }

    preload(p5) {
        if (this.props.onPreload) {
            this.props.onPreload(this)
        }
        let requestedImages = get(this.props, 'requestedImages')
        if (requestedImages) {
            this.loadedImages = {}
            forEach(requestedImages, (imgRef, name) => {
                this.loadedImages[name] = p5.loadImage(imgRef);
            })
        }
    }

    setup(p5) {
        this.useWebGL = !!this.props.useWebGL
        if (this.props.useWebGL) {
            this.canvas = p5.createCanvas(this.width, this.height, p5.WEBGL);
        } else {
            this.canvas = p5.createCanvas(this.width, this.height);
        }
        if (this.props.useWebGL) {
            this.sketchBuffer = p5.createGraphics(this.width, this.height, p5.WEBGL);
        } else {
            this.sketchBuffer = p5.createGraphics(this.width, this.height);
        }
        let rate = get(this.props, 'frameRate', 120)
        p5.frameRate(rate)

        if (this.props.onSetup) {
            this.props.onSetup(this.p5, this.sketchBuffer, this)
        }
        this.setupComplete = true
    }

    reset() {
        this.sketchBuffer = this.p5.createGraphics(this.width, this.height);
        this.canvas.clear()
    }

    draw(p5) {
        if (!this.setupComplete) {
            return
        }

        if (this.props.onDraw) {
            this.props.onDraw(this.p5, this.sketchBuffer, this)
        }
    }
    downloadSketch(name) {
        this.p5.clear()
        this.p5.image(this.sketchBuffer, 0, 0)
        this.p5.saveCanvas(name, "png");
    }

    render() {
        return <div className='p5-canvas-holder' ref={this.p5CanvasRef}></div>
    }
}