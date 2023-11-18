import React from "react"
import get from "lodash.get"
import forEach from "lodash.foreach"
import Vector from "../Vector"
import p5 from "p5"

// Props are:
//  width: xxx,
//  height: xxx,
//  controller: P5Controller object
//  enableMouseDragging: T/F
//  [frameRate: 120]
//  [onDraw: (p5Canvas) => {}]
//  [onMouseDragging: (dragState) => {}]
//  [onPreload: (p5Canvas) => {}]
//  [onSetupComplete: (p5Canvas) => {}]
export default class P5Canvas extends React.Component {
    constructor(props) {
        super(props)
        this.setupComplete = false
        this.p5CanvasRef = React.createRef();
        this.width = get(props, 'width', get(props, 'controller.width', 400))
        this.height = get(props, 'height', get(props, 'controller.height', 400))
        this.sketch = (p) => {
            p.preload = () => this.preload(p)
            p.setup = () => this.setup(p)
            p.draw = () => this.draw(p)
        }
    }

    componentDidMount() {
        this.p5 = new p5(this.sketch, this.p5CanvasRef.current)
        if (this.props.controller) {
            this.props.controller.pixelDensity = this.p5.pixelDensity()

            if (this.props.enableMouseDragging) {
                this.p5.mousePressed = (e) => {
                    let mx = this.p5.mouseX
                    let my = this.p5.mouseY
                    if (mx >= 0 && mx < this.width && my >= 0 && my < this.height) {
                        this.dragState = {
                            dragStartAt: new Vector(this.p5.mouseX, this.p5.mouseY),
                            dragNowAt: new Vector(this.p5.mouseX, this.p5.mouseY),
                            action: 'start',
                            keyOptions: { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey }
                        }
                        if (this.props.onMouseDragging) {
                            this.props.onMouseDragging(this.dragState)
                        }
                        if (this.props.controller.onMouseDragging) {
                            this.props.controller.onMouseDragging(this.dragState)
                        }
                    }
                }
                this.p5.mouseDragged = (e) => {
                    if (this.dragState) {
                        this.dragState.dragNowAt = new Vector(this.p5.mouseX, this.p5.mouseY)
                        this.dragState.action = 'move'
                        this.dragState.keyOptions = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey }
                        if (this.props.onMouseDragging) {
                            this.props.onMouseDragging(this.dragState)
                        }
                        if (this.props.controller.onMouseDragging) {
                            this.props.controller.onMouseDragging(this.dragState)
                        }
                    }
                }
                this.p5.mouseReleased = (e) => {
                    if (this.dragState) {
                        this.dragState.dragNowAt = new Vector(this.p5.mouseX, this.p5.mouseY)
                        this.dragState.action = 'end'
                        this.dragState.keyOptions = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey }
                        if (this.props.onMouseDragging) {
                            this.props.onMouseDragging(this.dragState)
                        }
                        if (this.props.controller.onMouseDragging) {
                            this.props.controller.onMouseDragging(this.dragState)
                        }
                        this.dragState = null
                    }
                }
            }
        }
    }

    preload(p5) {
        if (this.props.onPreload) {
            this.props.onPreload(p5)
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
        if (this.props.controller) {
            this.props.controller.useWebGL = this.useWebGL
        }

        p5.frameRate(this.props.frameRate || get(this.props, 'controller.frameRate', 120))

        if (this.props.onSetupComplete) {
            this.props.onSetupComplete(this)
        }
        if (this.props.controller && this.props.controller.onSetupComplete) {
            this.props.controller.onSetupComplete(this, p5)
        }
        this.setupComplete = true
    }

    reset() {
        if (!this.sketchBuffer) {
            this.sketchBuffer = this.p5.createGraphics(this.width, this.height);
        } else {
            this.sketchBuffer.clear()
        }
    }

    draw(p5) {
        if (!this.setupComplete) {
            return
        }

        if (this.props.onDraw) {
            this.props.onDraw(this, this.useWebGL)
        }

        if (this.props.controller && this.props.controller.onDraw) {
            this.props.controller.onDraw(this, this.useWebGL)
        }
    }

    render() {
        return <div className='p5-canvas-holder' ref={this.p5CanvasRef}></div>
    }

    downloadClicked(e) {
        let name = (this.props.sketchName || 'mySketch')

        this.props.controller.paintCanvasForDownload(this.p5, this.sketchBuffer)
        this.p5.saveCanvas(name, "png");
    }
}