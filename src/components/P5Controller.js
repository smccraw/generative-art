import colors from '../colors'
import Random from '../random'
import Vector from '../Vector'
import get from 'lodash.get'

export default class P5Controller {
    // props: {
    //   backgroundType: 'light|dark|none',
    //   backgroundLightColor: '#FFFFFF',
    //   backgroundDarkColor = '#000000',
    //   seed: ###
    //   variableSet: VariableSet object
    //   botSystem: BotSystem object
    // }
    constructor(props) {
        this.props = props || {}
        this.pixelDensity = 1
        this.paused = true
        this.simulationComplete = false
        this.backgroundType = props.backgroundType || "light"
        this.seed = props.seed || 42
        this.showBots = get(props, "showBots", true)
        this.finishedArt = get(props, "finishedArt", false)
        this.variableSet = props.variableSet || null
        this.frameRate = props.frameRate || 120
        this.minFrameRate = props.minFrameRate || 1
        this.maxFrameRate = props.maxFrameRate || 120
        this.autoPauseAt = props.autoPauseAt || 0
        this.frameCount = 0
        this.botSystem = null

        this.width = props.width || 400
        this.height = props.height || 400
        if (props.botSystem) {
            this.botSystem = props.botSystem
            this.width = props.width || this.botSystem.width
            this.height = props.height || this.botSystem.height
        }
        this.CENTER_POS = new Vector(this.width / 2, this.height / 2)

        this.lightColor = colors.ensureColor255(props.lightColor || colors.WHITE)
        this.darkColor = colors.ensureColor255(props.darkColor || colors.BLACK)


        this.rand = new Random(this.seed)
        // a second generator that the painters use. we do this so swapping out painters doesn't affect the overall shape of the sketch, just the painting
        this.painterRand = new Random(this.seed)

        // these are made to be overridden
        this.prepareSketchForAnimation = (p5, sketchBuffer) => { }
        this.updateSketch = (p5, sketchBuffer) => { }
        this.updateOverlay = (p5, sketchBuffer) => { }
        this.doNextFrame = (p5, sketchBuffer) => { }

        this.paintCanvasForDownload = (p5, sketchBuffer) => {
            p5.clear()
            if (this.useWebGL) {
                p5.image(sketchBuffer, -this.width / 2, -this.height / 2)
            } else {
                p5.image(sketchBuffer, 0, 0)
            }
        }
    }


    // p5Canvas = {
    //  p5 -> instance
    //  sketchBuffer -> image same size as p5
    //  loadedImages: {name: image, ...}
    onSetupComplete(p5Canvas) {
        this.p5Canvas = p5Canvas
        this.loadedImages = p5Canvas.loadedImages || null

        if (this.botSystem) {
            this.botSystem.initializeSystem(this.botSystem, this, false)
        }

        if (this.initializeSystem) {
            this.initializeSystem(this, false)
        }
    }

    reset() {
        this.paused = true
        this.frameCount = 0
        this.rand = new Random(this.seed)
        this.painterRand = new Random(this.seed)
        if (this.botSystem) {
            this.botSystem.initializeSystem(this.botSystem, this, true)
        }
        if (this.initializeSystem) {
            this.initializeSystem(this, true)
        }
        if (this.p5Canvas) {
            this.p5Canvas.reset()
            this.updateScreen(this.p5Canvas.p5, this.p5Canvas.sketchBuffer)
            this.loadedImages = this.p5Canvas.loadedImages || null
        }
    }

    setContrastingFillColor(gb, alpha255) {
        if (typeof alpha255 !== 'number') {
            alpha255 = 255
        }
        switch (this.backgroundType) {
            case 'light':
                gb.fill(this.darkColor.r, this.darkColor.g, this.darkColor.b, alpha255)
                break;
            case 'dark':
                gb.fill(this.lightColor.r, this.lightColor.g, this.lightColor.b, alpha255)
                break;
            default:
                gb.fill(this.darkColor.r, this.darkColor.g, this.darkColor.b, alpha255)
                break;
        }
    }
    setContrastingStrokeColor(gb, alpha255) {
        if (typeof alpha255 !== 'number') {
            alpha255 = 255
        }
        switch (this.backgroundType) {
            case 'light':
                gb.stroke(this.darkColor.r, this.darkColor.g, this.darkColor.b, alpha255)
                break;
            case 'dark':
                gb.stroke(this.lightColor.r, this.lightColor.g, this.lightColor.b, alpha255)
                break;
            default:
                gb.stroke(this.darkColor.r, this.darkColor.g, this.darkColor.b, alpha255)
                break;
        }
    }
    setStrokeColor(p, clr, a) {
        let c = colors.ensureColor255(clr)
        p.stroke(c.r, c.g, c.b, colors.ensureAlpha255(a))
    }
    setFillColor(p, clr, a) {
        let c = colors.ensureColor255(clr)
        p.fill(c.r, c.g, c.b, colors.ensureAlpha255(a))
    }
    getPixelIndex(p5, xInt, yInt) {
        return 4 * (yInt * p5.width + xInt);
    }
    readPixel(p5, xInt, yInt) {
        let index = 4 * (yInt * p5.width + xInt);
        return [p5.pixels[index], p5.pixels[index + 1], p5.pixels[index + 2], p5.pixels[index + 3]];
    }
    addColorToPixel(p5, xInt, yInt, r, g, b, a) {
        let idx = this.getPixelIndex(p5, xInt, yInt)
        let pxa = p5.pixels[idx + 3] / 255.0
        a = colors.ensureAlpha1(a)
        let aB = pxa * (1 - a)

        let aNew = a + aB
        let rOut = (r * a + p5.pixels[idx + 0] * aB) / aNew
        let gOut = (g * a + p5.pixels[idx + 1] * aB) / aNew
        let bOut = (b * a + p5.pixels[idx + 2] * aB) / aNew

        p5.pixels[idx] = Math.floor(rOut);
        p5.pixels[idx + 1] = Math.floor(gOut);
        p5.pixels[idx + 2] = Math.floor(bOut);
        p5.pixels[idx + 3] = Math.floor(aNew * 255)
    }
    setPixel(p5, xInt, yInt, r, g, b, a) {
        let index = 4 * (yInt * p5.width + xInt);
        p5.pixels[index] = r;
        p5.pixels[index + 1] = g;
        p5.pixels[index + 2] = b;
        p5.pixels[index + 3] = colors.ensureAlpha255(a)
    }
    eraseBackground(p5, sketchBuffer) {
        switch (this.backgroundType) {
            case 'light':
                p5.background(this.lightColor.r, this.lightColor.g, this.lightColor.b)
                break;
            case 'dark':
                p5.background(this.darkColor.r, this.darkColor.g, this.darkColor.b)
                break;
            default:
                p5.clear()
                break;
        }
    }
    applySketch(p5, sketchBuffer) {
        if (this.useWebGL) {
            p5.image(sketchBuffer, -this.width / 2, -this.height / 2)
        } else {
            p5.image(sketchBuffer, 0, 0)
        }
    }
    applyOverlay(p5, sketchBuffer) {
        if (this.showBots && this.botSystem && this.botSystem.paintBotsOverlay) {
            this.botSystem.paintBotsOverlay(p5, this)
        }
        if (!this.useWebGL) {
            this.setContrastingFillColor(p5, 255)
            p5.textSize(12);
            p5.textFont('Arial');
            p5.noStroke()

            p5.textAlign(p5.RIGHT);
            if (this.botSystem && this.botSystem.bots) {
                p5.text(`frame: ${this.frameCount}, bots: ${this.botSystem.bots.length}`, this.width - 2, 12)
            } else {
                p5.text(`frame: ${this.frameCount}`, p5.width - 2, 12)
            }
        }
        this.updateOverlay(p5, sketchBuffer)
    }

    applyFrameLogic(p5, sketchBuffer) {
        this.frameCount++
        if (this.botSystem && this.botSystem.doNextFrame) {
            this.botSystem.doNextFrame(this.frameCount, p5, sketchBuffer)
        }
        if (this.doNextFrame) {
            this.doNextFrame(p5, sketchBuffer)
        }

        if (this.simulationComplete) {
            this.onPausePlayClicked()
        } else if (this.autoPauseAt > 0 && this.autoPauseAt === this.frameCount) {
            this.onPausePlayClicked()
        }
    }

    // p5Canvas = {
    //  p5 -> instance
    //  sketchBuffer -> image same size as p5
    //  loadedImages: {name: image, ...}
    onDraw(p5Canvas, useWebGL) {
        let { p5, sketchBuffer } = p5Canvas

        this.useWebGL = useWebGL
        if (!this.paused || this.stepRequested) {
            if (this.frameCount === 0) {
                this.prepareSketchForAnimation(p5, sketchBuffer)
            }
            this.applyFrameLogic(p5, sketchBuffer)
            this.updateSketch(p5, sketchBuffer)
            this.stepRequested = false
        }
        this.updateScreen(p5, sketchBuffer)
    }

    updateScreen(p5, sketchBuffer) {
        this.eraseBackground(p5, sketchBuffer)
        this.applySketch(p5, sketchBuffer)
        this.applyOverlay(p5, sketchBuffer)
    }

    // dragState = {
    //     dragStartAt: new Vector(this.p5.mouseX, this.p5.mouseY),
    //     dragNowAt: new Vector(this.p5.mouseX, this.p5.mouseY),
    //     action: 'start'
    // }
    onMouseDragging(dragState) {
        if (this.botSystem) {
            this.botSystem.dragBotHandler(dragState)
        }
    }

    onPausePlayClicked(controller) {
        this.paused = !this.paused
    }
    onStepClicked(controller) {
        this.stepRequested = true
    }
    onResetClicked(controller) {
        this.reset()
    }
    onShowBotsClicked(controller) {
        this.showBots = !this.showBots
    }
    onDownloadClicked(controller, e) {
        this.p5Canvas.downloadClicked(e)
    }
    onBackgroundToggleClicked(controller) {
        if (this.backgroundType !== 'none') {
            if (this.backgroundType === 'light') {
                this.backgroundType = 'dark'
            } else {
                this.backgroundType = 'light'
            }
        }
    }
    onChangeSeedClicked(controller, keyOptions) {
        if (keyOptions && keyOptions.shiftKey) {
            this.seed++
        } else {
            this.seed = Math.floor(Math.random() * 9998) + 1
        }
        if (controller.onSeedChanged) {
            controller.onSeedChanged()
        }
        this.reset()
    }
    onVariableChanged(controller, vdef, changeSet) {
        this.reset()
    }
    onFrameRateChanged(newFrameRate) {
        this.frameRate = newFrameRate
        if (this.p5Canvas) {
            this.p5Canvas.p5.frameRate(newFrameRate)
        }
    }
}