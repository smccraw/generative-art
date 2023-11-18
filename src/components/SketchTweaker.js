import './SketchTweaker.scss'
import React from 'react'
import VariableChanger from './VariableChanger'
import Random from '../random.js'
import colors from '../colors.js'
import get from 'lodash.get'

// props.controller = {
//    paused: T/F
//    backgroundType: "light|dark|none"
//    seed: 1-100
//    variableSet: VariableChangeSet object
//  }
export default class SketchTweaker extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    // componentDidMount() {
    // }

    playPauseClicked() {
        if (this.props.controller.onPausePlayClicked) {
            this.props.controller.onPausePlayClicked(this.props.controller)
            this.forceUpdate()
        }
    }
    stepClicked() {
        if (this.props.controller.onStepClicked) {
            this.props.controller.onStepClicked(this.props.controller)
            this.forceUpdate()
        }
    }
    resetClicked() {
        if (this.props.controller.onResetClicked) {
            this.props.controller.onResetClicked(this.props.controller)
            this.forceUpdate()
        }
    }
    showBotsClicked() {
        if (this.props.controller.onShowBotsClicked) {
            this.props.controller.onShowBotsClicked(this.props.controller)
            this.forceUpdate()
        }
    }
    downloadClicked(e) {
        if (this.props.controller.onDownloadClicked) {
            this.props.controller.onDownloadClicked(this.props.controller, e)
            this.forceUpdate()
        }
    }
    backgroundToggleClicked() {
        if (this.props.controller.onBackgroundToggleClicked) {
            this.props.controller.onBackgroundToggleClicked(this.props.controller)
            this.forceUpdate()
        }
    }
    changeSeedClicked(e) {
        if (this.props.controller.onChangeSeedClicked) {
            this.props.controller.onChangeSeedClicked(this.props.controller, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey }, e)
            this.forceUpdate()
        }
    }
    onVariableChanged(vdef, changeSet) {
        if (this.props.controller.onVariableChanged) {
            this.props.controller.onVariableChanged(this.props.controller, vdef, changeSet)
            this.forceUpdate()
        }
    }
    onFrameRateChanged(newFrameRate) {
        if (this.props.controller.onFrameRateChanged) {
            this.props.controller.onFrameRateChanged(newFrameRate)
            this.forceUpdate()
        }
    }

    render() {
        if (this.props.controller) {
            let stepBtn = <div className="bc_ctrl_btn disabled" title="Step"><div className="step_btn"></div></div>
            let resetBtn = <div className="bc_ctrl_btn" title="Reset" onClick={() => this.resetClicked()}><div className="reset_btn"></div></div>
            let downloadBtn = <div className="bc_ctrl_btn" title="Download" onClick={(e) => this.downloadClicked(e)}><div className="download_btn"></div></div>
            let playBtn = <div className="bc_ctrl_btn" title="Pause" onClick={(e) => this.playPauseClicked(e)}><div className="pause_btn"></div></div>
            let shotBotsBtn = <div className="bc_ctrl_btn" title="Show Bots" onClick={(e) => this.showBotsClicked()}><div className={this.props.controller.showBots ? "showBots_btn" : "noShowBots_btn"}></div></div>

            if (this.props.controller.paused) {
                playBtn = <div className="bc_ctrl_btn" title="Play" onClick={(e) => this.playPauseClicked(e)}><div className="play_btn"></div></div>
                stepBtn = <div className="bc_ctrl_btn" title="Step" onClick={() => this.stepClicked()}><div className="step_btn"></div></div>
            }

            let backgroundSwitch = null
            if (this.props.controller.backgroundType === 'light' || this.props.controller.backgroundType === 'dark') {
                backgroundSwitch = <div className={`background-toggle-switch ${this.props.controller.backgroundType}`} onClick={(e) => this.backgroundToggleClicked(e)} title='Background'>
                    <span className={`slider-left ${this.props.controller.backgroundType}`}></span>
                    <div className={`bts-text ${this.props.controller.backgroundType}`}>{this.props.controller.backgroundType}</div>
                    <span className={`slider-right ${this.props.controller.backgroundType}`}></span>
                </div>
            }

            let seedChanger = null
            if (!this.props.controller.finishedArt) {
                seedChanger = <div className='bc-seed-picker' title='Change PRNG seed' onClick={(e) => this.changeSeedClicked(e)}>
                    <div className="seed_label">Random Seed: {this.props.controller.seed || 1}</div>
                </div>
            }
            let varChanger = null
            if (this.props.controller.variableSet && this.props.controller.variableSet.getVariableCount() > 0) {
                varChanger = <div className='variable_row'><VariableChanger changeSet={this.props.controller.variableSet} onVariableChanged={(vdef, changeSet) => this.onVariableChanged(vdef, changeSet)} /></div>
            }

            let minFrameRate = get(this.props.controller, 'minFrameRate', 1)
            let maxFrameRate = get(this.props.controller, 'maxFrameRate', 120)
            let frameRate = get(this.props.controller, 'frameRate', 60)
            return <div className='SketchTweaker'>
                <div className='controller_row'>
                    {playBtn}
                    {stepBtn}
                    {resetBtn}
                    {shotBotsBtn}
                    {downloadBtn}
                    {backgroundSwitch}
                    <div className="frameRate_holder">
                        <input className="frameRate_slider" type='range' min={minFrameRate} max={maxFrameRate} step={1} value={frameRate} onInput={(e) => {
                            let fr = parseInt(e.target.value)
                            this.onFrameRateChanged(fr)
                        }} /><div className='frameRate_label'>{this.props.controller.frameRate} fps</div>
                    </div>
                    {seedChanger}

                </div>
                {varChanger}
            </div>
        } else {
            return <div className='SketchTweaker'>
                No Controller Specified
            </div>
        }
    }
}

export class DefaultController {
    constructor(variableSet) {
        this.paused = true
        this.stepRequested = false
        this.showBots = true
        this.backgroundType = 'light'
        this.frameRate = 120
        this.seed = Math.floor(Math.random() * 9998) + 1
        this.variableSet = variableSet
        this.resetRequested = false
        this.downloadRequested = false
        // you should override this
        this.initializeSketch = () => { }
        this.onChange = () => { }

        this.rand = new Random(this.seed)
        this.lightColor = { r: 255, g: 255, b: 255, a: 255 }
        this.darkColor = { r: 0, g: 0, b: 0, a: 255 }

        this.externalVariableChanges = 0
    }
    setVariableValue(varName, value) {
        if (this.variableSet) {
            this.variableSet.setValue(varName, value, `${value}`)
            this.externalVariableChanges++
        }
    }
    reset() {
        this.paused = true
        this.rand = new Random(this.seed)
        this.painterRand = new Random(this.seed)
        this.resetRequested = true
        this.onChange('reset')
    }
    onPausePlayClicked(controller) {
        this.paused = !this.paused
        this.onChange('paused')
    }
    onStepClicked(controller) {
        this.stepRequested = true
        this.onChange('stepRequested')
    }
    onResetClicked(controller) {
        this.reset()
    }
    onShowBotsClicked(controller) {
        this.showBots = !this.showBots
        this.onChange('showBots')
    }
    onDownloadClicked(controller, e) {
        this.downloadRequested = true
        this.onChange('downloadRequested')
    }
    onBackgroundToggleClicked(controller) {
        if (this.backgroundType !== 'none') {
            if (this.backgroundType === 'light') {
                this.backgroundType = 'dark'
            } else {
                this.backgroundType = 'light'
            }
        }
        this.onChange('backgroundType')
    }
    onChangeSeedClicked(controller, keyOptions) {
        if (keyOptions && keyOptions.shiftKey) {
            this.seed++
        } else {
            this.seed = Math.floor(Math.random() * 9998) + 1
        }
        this.resetRequested = true
        this.onChange('seed')
    }
    onVariableChanged(controller, vdef, changeSet) {
        this.resetRequested = true
        this.onChange('variable', vdef.name)
    }
    onFrameRateChanged(newFrameRate) {
        this.frameRate = newFrameRate
        this.onChange('frameRate')
    }
    eraseBackground(gb) {
        switch (this.backgroundType) {
            case 'light':
                gb.background(this.lightColor.r, this.lightColor.g, this.lightColor.b)
                break;
            case 'dark':
                gb.background(this.darkColor.r, this.darkColor.g, this.darkColor.b)
                break;
            default:
                gb.clear()
                break;
        }
    }
    getBackgroundColor() {
        return (this.backgroundType === 'light') ? this.lightColor : this.darkColor
    }
    getNotBackgroundColor() {
        return (this.backgroundType === 'light') ? this.darkColor : this.lightColor
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
    drawFrameCount(p5, frameCount) {
        this.setFillColor(p5, this.getNotBackgroundColor(), 255)
        p5.textSize(12);
        p5.textFont('Arial');
        p5.textAlign(p5.RIGHT);
        p5.text(`frame: ${frameCount}`, p5.width - 2, 12)
    }
}