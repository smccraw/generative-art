import React, { useState } from 'react'
import get from "lodash.get"
import forEach from "lodash.foreach"
import p5 from "p5"
import "./AttractorCanvas.scss"
import { Attractor, AttractorRunner, PixelHitGrid, parseColor } from "./Attractor.js"
import colors from '../colors'

const GENST_NONE = 0
const GENST_RUNNING = 1
const GENST_DONE = 2

// Props are:
//  width: xxx,
//  height: xxx,
export default class AttractorCanvas extends React.Component {
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

        this.state = this.calcStateForAttractor(0, 0)
    }

    calcStateForAttractor(attractorIndex, presetIndex) {
        let attr = ATTRACTORS[attractorIndex]
        let preset = attr.presets[presetIndex]
        let colorParams
        if (!preset) {
            presetIndex = -1
            preset = {
                smoothingFactor: 0,
                backgroundType: this.state.backgroundType,
                iterations: this.state.iterations || 10000000,
                colorIndex: this.state.colorIndex || 0,
                attractorParams: this.getAttractorDefaultParams(attractorIndex, get(this.state, 'attractorParams')),
            }
            colorParams = this.getDefaultColorSystemParams(preset.colorIndex)
            if (this.state && this.state.colorParams) {
                colorParams.backgroundType = this.state.colorParams.backgroundType
                colorParams.inverted = this.state.colorParams.inverted
            }

        } else {
            colorParams = this.getDefaultColorSystemParams(preset.colorIndex)
            colorParams.smoothingFactor = preset.smoothingFactor
            colorParams.backgroundType = preset.backgroundType
            colorParams.inverted = preset.inverted
            if (preset.colorStrengths.length === colorParams.colors.length) {
                colorParams.colorStrengths = preset.colorStrengths
            }

            if (colorParams.inverted) {
                colorParams.colors = Array.from(colorParams.colors).reverse()
            }
            colorParams.colors = colorParams.colors.map((val) => parseColor(val))
        }

        let newState = {
            attractorIndex: attractorIndex,
            attractorParams: preset.attractorParams,
            generationState: GENST_NONE,
            progress: 0,
            iterationsDone: 0,
            iterations: preset.iterations,
            colorIndex: preset.colorIndex,
            presetIndex: presetIndex,
            colorParams: colorParams,
            reflectOption: get(preset, 'reflectOption', PixelHitGrid.REFLECT_NONE),
            runInfo: null
        }
        return newState
    }
    rebuildState(attractorIndex, presetIndex) {
        let newState = this.calcStateForAttractor(attractorIndex, presetIndex)
        this.setState(newState)
        this.sketchBuffer = this.p5.createGraphics(this.width, this.height);
    }
    componentDidMount() {
        this.p5 = new p5(this.sketch, this.p5CanvasRef.current)
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
        this.canvas = p5.createCanvas(this.width, this.height);
        this.sketchBuffer = p5.createGraphics(this.width, this.height);

        this.canvas.background(255)
        p5.frameRate(15)

        if (this.props.onSetupComplete) {
            this.props.onSetupComplete(this)
        }
        this.setupComplete = true
    }

    startGeneration(limits) {
        let grid = new PixelHitGrid(this.width, this.height)
        let attr = ATTRACTORS[this.state.attractorIndex]
        let preset = this.getPresetDefinition()
        let params = Object.assign({}, this.state.attractorParams)
        let runner = new AttractorRunner(attr, grid, params)

        if (limits) {
            grid.setOriginAndScale(limits.originX, limits.originY, limits.scale, limits.scale)
        } else if (preset && preset.scale > 0) {
            grid.setOriginAndScale(preset.originX, preset.originY, preset.scale, preset.scale)
        } else {
            let limits = runner.probeForLimits()
            let scale = Math.min(this.width, this.height) / limits.bestSquareSize
            let extraX = limits.width - limits.bestSquareSize
            let extraY = limits.height - limits.bestSquareSize
            let originX = limits.minX + extraX / 2
            let originY = limits.minY + extraY / 2
            grid.setOriginAndScale(originX, originY, scale, scale)
        }

        grid.reflect = this.state.reflectOption

        this.runInfo = {
            attractor: attr,
            pixelGrid: grid,
            runner: runner,
            params: params,
            iterations: this.state.iterations
        }
        this.setState({ progress: 0, iterationsDone: 0, generationState: GENST_RUNNING })
    }

    stopGeneration() {
        this.setState({ generationState: GENST_NONE })
    }

    generateImage() {
        if (this.runInfo) {
            this.runInfo.hitCountSummary = this.runInfo.pixelGrid.buildHitCountSummary()
            this.runInfo.pixelGrid.createColorMappings(this.runInfo.hitCountSummary, this.state.colorParams)

            this.sketchBuffer = this.p5.createGraphics(this.width, this.height);
            this.sketchBuffer.loadPixels()
            this.runInfo.pixelGrid.postProcessPixels(this.runInfo.hitCountSummary, this.sketchBuffer.pixels)
            this.sketchBuffer.updatePixels()
            this.setState({ runInfo: this.runInfo })
        }
    }

    draw(p5) {
        if (!this.setupComplete) {
            return
        }

        if (this.state.generationState === GENST_RUNNING) {
            let iters = Math.min(1000000, this.runInfo.iterations - this.state.iterationsDone)
            this.runInfo.runner.run(iters)
            let newDone = this.state.iterationsDone + iters
            let progress = Math.floor(newDone * 100 / this.runInfo.iterations)
            let newState = { iterationsDone: newDone, progress: progress }
            if (newDone >= this.runInfo.iterations) {
                newState.generationState = GENST_DONE
                // this.runInfo.pixelGrid.preProcessPixels(8)
                this.generateImage()
                
                let finalLimits = this.runInfo.runner.createLimitsObject()
                let rerunBreakpoint = this.runInfo.pixelGrid.scale.x * 0.95
                if (finalLimits.scale < rerunBreakpoint) {
                    // we messed up and didn't get limits correct, we need to reset and retry
                    console.log('scale went down, need to zoom out', finalLimits.scale, '<', this.runInfo.pixelGrid.scale.x)
                    this.startGeneration(finalLimits)
                } else {
                    this.setState(newState)
                }
            } else {
                this.setState(newState)
            }
        }

        let bkClr = '#FFFFFF'
        if (this.state.colorParams.backgroundType === 'light') {
            bkClr = get(this.state.colorParams, 'backgroundChoices.light', '#FFFFFF')
        } else {
            bkClr = get(this.state.colorParams, 'backgroundChoices.dark', '#000000')
        }
        bkClr = colors.ensureColor255(bkClr)
        p5.background(bkClr.r, bkClr.g, bkClr.b)
        if (this.sketchBuffer) {
            p5.image(this.sketchBuffer, 0, 0)
        }
    }

    render() {
        let reflectOptions = []
        reflectOptions.push(<option key={PixelHitGrid.REFLECT_NONE} value={PixelHitGrid.REFLECT_NONE}>None</option>)
        reflectOptions.push(<option key={PixelHitGrid.REFLECT_LEFT_TO_RIGHT} value={PixelHitGrid.REFLECT_LEFT_TO_RIGHT}>Left to Right</option>)
        reflectOptions.push(<option key={PixelHitGrid.REFLECT_RIGHT_TO_LEFT} value={PixelHitGrid.REFLECT_RIGHT_TO_LEFT}>Right to Left</option>)
        reflectOptions.push(<option key={PixelHitGrid.REFLECT_TOP_TO_BOTTOM} value={PixelHitGrid.REFLECT_TOP_TO_BOTTOM}>Top to Bottom</option>)
        reflectOptions.push(<option key={PixelHitGrid.REFLECT_BOTTOM_TO_TOP} value={PixelHitGrid.REFLECT_BOTTOM_TO_TOP}>Bottom to Top</option>)

        return <div id='attractors' className="AttractorCanvas">
            <div className="flex-row" style={{ gap: 16 }}>
                {this.buildAttractorSelector()}
                {this.buildPresetsSelector()}
                <div className="value-selector">
                    <span>&nbsp;&nbsp;Refelect:</span>
                    <div className="select">
                        <select id="standard-select" value={this.state.reflectOption} onChange={(e) => {
                            this.setState({reflectOption: parseInt(e.target.value)})
                        }}>
                            {reflectOptions}
                        </select>
                        <span className="focus"></span>
                    </div>
                </div>
            </div>
            <div className="worker-panel">
                {this.buildAttractorDetails()}
                <div className="attractor-params-panel">
                    {this.buidlAttractorParams()}
                </div>
                {this.buildIterations()}
            </div>
            {this.buildPostProcessingPanel()}
            {this.buildGenerationState()}
            <div className='p5-canvas-holder' ref={this.p5CanvasRef}></div>
        </div>
    }

    getDefaultColorSystemParams(idx) {
        // deep clone the default
        let cparams = Object.assign({}, COLOR_SYSTEMS[idx])
        cparams.colorStrengths = Array.from(cparams.colorStrengths)
        cparams.colors = cparams.colors.map((val) => parseColor(val))
        cparams.backgroundType = cparams.defaultBackgroundType || 'light'
        cparams.inverted = false
        if (cparams.colorStrengths.length !== cparams.colors.length) {
            cparams.colorStrengths = []
            let dt = 100 / (cparams.colors.length - 1)
            cparams.colorStrengths.push(0)
            for (let i = 1; i < (cparams.colors.length - 1); i++) {
                cparams.colorStrengths.push(i * dt)
            }
            cparams.colorStrengths.push(100)
        }
        return cparams
    }
    getAttractorDefaultParams(idx, currentParams) {
        currentParams = currentParams || {}
        let attr = ATTRACTORS[idx]
        let params = {}
        attr.paramsNeeded.forEach((parr) => {
            params[parr[0]] = get(currentParams, parr[0], parr[4]) 
        })
        return params
    }
    toggleBackgroundType() {
        let clrParams = Object.assign({}, this.state.colorParams)
        if (this.state.colorParams.backgroundType === 'light') {
            clrParams.backgroundType = 'dark'
        } else {
            clrParams.backgroundType = 'light'
        }
        this.setState({ colorParams: clrParams })
        setTimeout(() => this.generateImage(), 10)
    }
    changeSmoothingValue(smoothing) {
        let clrParams = Object.assign({}, this.state.colorParams)
        clrParams.smoothingFactor = smoothing
        this.setState({ colorParams: clrParams })
        setTimeout(() => this.generateImage(), 10)
    }
    setAttractorIndex(idx) {
        this.rebuildState(idx, 0)
    }
    setParamValue(param, value) {
        let newV = {}
        newV[`${param}`] = value

        this.setState({ attractorParams: Object.assign({}, this.state.attractorParams, newV) })
    }
    getPresetDefinition() {
        let attr = ATTRACTORS[this.state.attractorIndex]
        return attr.presets[this.state.presetIndex] || null
    }
    downloadClicked(e) {
        if (e.altKey) {
            let preset = this.getPresetDefinition()
            let limits = this.runInfo.runner.createLimitsObject()

            let newPreset = {
                name: (preset ? preset.name : 'generated'),
                attractorParams: Object.assign({}, this.state.attractorParams),
                iterations: this.state.iterations,
                colorIndex: this.state.colorIndex,
                smoothingFactor: this.state.colorParams.smoothingFactor,
                backgroundType: this.state.colorParams.backgroundType,
                inverted: this.state.colorParams.inverted,
                colorStrengths: this.state.colorParams.colorStrengths.map((c) => parseFloat(c.toFixed(2))),
                originX: parseFloat(limits.originX.toFixed(2)),
                originY: parseFloat(limits.originY.toFixed(2)),
                scale: parseFloat(limits.scale.toFixed(4)),
            }
            let text = JSON.stringify(newPreset) + ','
            if ('clipboard' in navigator) {
                navigator.clipboard.writeText(text);
            } else {
                document.execCommand('copy', true, text);
            }
            console.log("Copied to the clipboard")
            return
        } else if (e.shiftKey) {
            this.p5.clear()
        } else {
            let bkClr = '#FFFFFF'
            if (this.state.colorParams.backgroundType === 'light') {
                bkClr = get(this.state.colorParams, 'backgroundChoices.light', '#FFFFFF')
            } else {
                bkClr = get(this.state.colorParams, 'backgroundChoices.dark', '#000000')
            }
            bkClr = colors.ensureColor255(bkClr)
            this.p5.background(bkClr.r, bkClr.g, bkClr.b)
        }
        if (this.sketchBuffer) {
            this.p5.image(this.sketchBuffer, 0, 0)
        }
        let attr = ATTRACTORS[this.state.attractorIndex]
        this.p5.saveCanvas(attr.suggestedFilename || 'attractor', "png");
    }

    buildGenerationState() {
        let downloadBtn = null
        if (this.state.generationState === 2) {
            downloadBtn = <div className='download-button' onClick={(e) => this.downloadClicked(e)} title="Download"></div>
        }
        if (this.state.generationState === 1) {
            return <div className="generate-progress">Generating: {this.state.progress}% complete
                <div className='cancel-button' onClick={() => this.stopGeneration()}>Cancel</div>
            </div>
        } else {    // 0 and 2 are treated the same here
            return <div className="generate-progress">
                <div className="generate-button" onClick={() => this.startGeneration()}>Generate</div>
                {downloadBtn}
            </div>
        }
    }

    buildAttractorSelector() {
        let options = []
        ATTRACTORS.forEach((opt, index) => {
            options.push(<option key={index} value={index}>{opt.name}</option>)
        })

        return <div className="value-selector">
            <div className="label">Algorithm: </div>
            <div className="select">
                <select id="standard-select" value={this.state.attractorIndex} onChange={(e) => {
                    this.setAttractorIndex(parseInt(e.target.value))
                }}>
                    {options}
                </select>
                <span className="focus"></span>
            </div>
        </div>
    }

    buildAttractorDetails() {
        return <div className="attractor-details">
            {ATTRACTORS[this.state.attractorIndex].algorithmText}
        </div>
    }

    buidlAttractorParams() {
        if (this.state.presetIndex === -1) {
            let attr = ATTRACTORS[this.state.attractorIndex]
            let pickers = []

            attr.paramsNeeded.forEach((def, idx) => {
                pickers.push(this.buildParamPicker(def, idx))
            })

            return <div className='param-pickers'>{pickers}</div>
        } else {
            let attr = ATTRACTORS[this.state.attractorIndex]
            let params = ""
            attr.paramsNeeded.forEach((def, idx) => {
                let varName = def[0]
                let val = this.state.attractorParams[varName]
                if (typeof val !== 'number') {
                    val = def[4]    // default value
                }
                if (idx > 0) {
                    params += ', '
                }
                params += `${varName}: ${val}`
            })

            return <div className='param-pickers'>Parameters: {params}</div>
        }
    }

    buildParamPicker(def, idx) {
        let varName = def[0]
        let min = def[1]
        let max = def[2]
        let val = this.state.attractorParams[varName]
        let step = def[3]
        if (typeof val !== 'number') {
            val = def[4]    // default value
        }
        return <div className='param-picker' key={idx}>
            <span>{varName}:</span>
            <input className="param_input" type='number' min={min} max={max} step={step} value={val} onChange={(e) => {
                this.setParamValue(varName, parseFloat(e.target.value))
            }}></input>
            <input className="param_slider" type='range' min={min} max={max} step={step} value={val} onChange={(e) => {
                this.setParamValue(varName, parseFloat(e.target.value))
            }}></input>
        </div>
    }

    setPresetIndex(index) {
        this.rebuildState(this.state.attractorIndex, index)
    }
    buildPresetsSelector() {
        let attr = ATTRACTORS[this.state.attractorIndex]
        let options = []
        attr.presets.forEach((preset, index) => {
            options.push(<option key={index} value={index}>{preset.name}</option>)
        })
        options.push(<option key={'custom'} value={-1}>Custom...</option>)

        return <div className="value-selector preset-selector">
            <div className="label">Presets: </div>
            <div className="select">
                <select id="standard-select" value={this.state.presetIndex} onChange={(e) => {
                    this.setPresetIndex(parseInt(e.target.value))
                }}>
                    {options}
                </select>
                <span className="focus"></span>
            </div>
        </div>
    }

    buildIterations() {
        let txt = `${this.state.iterations}`
        if (this.state.iterations < 1000000) {
            txt = `${Math.floor(this.state.iterations / 1000)}K`
        } else {
            txt = `${(this.state.iterations / 1000000).toFixed(1)}M`
        }
        return <div className='param-picker' key='iters'>
            <span>Iterations:</span>
            <input className="param_slider iteration_slider" type='range' min={1000000} max={40000000} step={1000000} value={this.state.iterations} onChange={(e) => {
                this.setState({ iterations: parseInt(e.target.value) })
            }}></input>
            <span>{txt}</span>
        </div>
    }

    setColorIndex(idx) {
        this.setState({
            colorIndex: idx,
            colorParams: this.getDefaultColorSystemParams(idx)
        })
        setTimeout(() => this.generateImage(), 10)
    }

    buildPostProcessingPanel() {
        let options = []
        COLOR_SYSTEMS.forEach((opt, index) => {
            options.push(<option key={index} value={index}>{opt.name}</option>)
        })
       
        return <div className="pp-panel">
            <div className='flex-row'>
                <div className="value-selector">
                    <span>Color Scheme:&nbsp;</span>
                    <div className="select">
                        <select id="standard-select" value={this.state.colorIndex} onChange={(e) => {
                            this.setColorIndex(parseInt(e.target.value))
                        }}>
                            {options}
                        </select>
                        <span className="focus"></span>
                    </div>
                </div>
                <span>&nbsp;&nbsp;Inverted:&nbsp;</span>
                <label className="switch">
                    <input className="param_switch" type='checkbox' checked={this.state.colorParams.inverted} onChange={(e) => {
                        this.toggleInvertedColors()
                    }} />
                    <span className="slider round" />
                </label>
                <div className={`background-toggle-switch ${this.state.colorParams.backgroundType}`} onClick={(e) => this.toggleBackgroundType(e)} title='Background'>
                    <span className={`slider-left ${this.state.colorParams.backgroundType}`}></span>
                    <div className={`bts-text ${this.state.colorParams.backgroundType}`}>{this.state.colorParams.backgroundType}</div>
                    <span className={`slider-right ${this.state.colorParams.backgroundType}`}></span>
                </div>
                
                {/* <span>&nbsp;&nbsp;Smoothing: </span>
                <input className="param_slider" type='range' min={0} max={2} step={1} value={this.state.colorParams.smoothingFactor} onChange={(e) => {
                    this.changeSmoothingValue(parseInt(e.target.value))
                }}></input> 
                <span>&nbsp;&nbsp;{this.state.colorParams.smoothingFactor}</span>*/}
            </div>
            {this.generateHistogramSliders()}
        </div>
    }

    // hitCountSummary: {
    //     hitsRecorded,
    //     minHitCount: min,
    //     maxHitCount: max,
    //     maxPixelsInBucket,
    //     emptyPixels,
    //     interestingPixels,
    //     targetPixelCount,
    //     colorizationBuckets: colorizationBuckets,
    //     hitDistributions: countDistribution
    // }
    generateHistogramSliders() {
        let colorStrengths = this.state.colorParams.colorStrengths
        const histoWidth = 800

        return <div className="histogram-top">
            <HistogramStrengthSlider width={histoWidth} height={24} strengths={colorStrengths} colors={this.state.colorParams.colors} onStrengthChange={(idx, pct, done) => this.changeStrengthValue(idx, pct, done)} />
        </div>
    }
    changeStrengthValue(index, pct, done) {
        let clrParams = Object.assign({}, this.state.colorParams)
        clrParams.colorStrengths = Array.from(clrParams.colorStrengths)
        clrParams.colorStrengths[index] = pct

        this.setState({ colorParams: clrParams })
        if (done) {
            console.log("new strengths", JSON.stringify(clrParams.colorStrengths.map((c) => parseFloat(c.toFixed(2)))))
            setTimeout(() => this.generateImage(), 10)
        }
    }
    toggleInvertedColors() {
        let clrParams = Object.assign({}, this.state.colorParams)
        clrParams.inverted = !clrParams.inverted
        // clrParams.backgroundType = (clrParams.backgroundType === 'light') ? 'dark' : 'light'
        clrParams.colors = Array.from(COLOR_SYSTEMS[this.state.colorIndex].colors)
        if (clrParams.inverted) {
            clrParams.colors.reverse()
        }
        clrParams.colors = clrParams.colors.map((val) => parseColor(val))
        this.setState({ colorParams: clrParams })
        setTimeout(() => this.generateImage(), 10)
    }
}

function HistogramStrengthSlider(props) {
    let [dragState, setDragState] = useState(null)
    let thisID = `hsl_${Math.floor(Math.random() * 99999999999)}`
    let height = props.height
    let trackHeight = 5
    // strengths go from right to left and are a percentage
    let nubs = []
    let colorSegs = []
    let nubHitInfos = []

    const nubWith = 6
    if (props.strengths && props.colors) {
        let xvals = []
        props.strengths.forEach((strength, idx) => {
            let xval = props.width - (strength * props.width) / 100
            xvals.push(xval)
        })
        xvals.forEach((xval, idx) => {
            let leftMin, rightMax
            if (idx === (xvals.length - 1)) {
                leftMin = 0
                rightMax = xvals[idx - 1]
            } else if (idx === 0) {
                leftMin = xvals[idx + 1]
                rightMax = props.width
            } else {
                leftMin = xvals[idx + 1]
                rightMax = xvals[idx - 1]
            }

            nubs.push(<div key={idx} className='hsl-nub' style={{ left: xval - nubWith / 2, top: 0, width: nubWith, height: height }}></div>)
            nubHitInfos.push({
                strengthIndex: idx,
                nubLeft: xval - nubWith / 2,
                nubWidth: nubWith,
                xval: xval,
                dragLeftMin: leftMin,
                dragRightMax: rightMax
            })
        })

        // do the first one
        let clr = props.colors[0]
        let width = props.width - xvals[0]
        if (width >= 1) {
            let rgba = `rgba(${clr.r},${clr.g},${clr.b},${clr.a / 255})`
            colorSegs.push(<div key={'start'} className='hsl-seg' style={{ left: xvals[0], top: (height - trackHeight) / 2, width: width, height: trackHeight, backgroundColor: rgba }}></div>)
        }

        for (let i = 1; i < props.colors.length; i++) {
            let clrL = props.colors[i]
            let clrR = props.colors[i - 1]
            let width = xvals[i - 1] - xvals[i]
            let rgbaL = `rgba(${clrL.r},${clrL.g},${clrL.b},${clrL.a / 255})`
            let rgbaR = `rgba(${clrR.r},${clrR.g},${clrR.b},${clrR.a / 255})`
            let background = `linear-gradient(to right, ${rgbaL}, ${rgbaR})`
            colorSegs.push(<div key={i} className='hsl-seg' style={{ left: xvals[i], top: (height - trackHeight) / 2, width: width, height: trackHeight, background: background }}></div>)
        }

        if (props.strengths[props.strengths.length - 1] < 100) {
            let clr = props.colors[props.colors.length - 1]
            let width = xvals[xvals.length - 1]
            let rgba = `rgba(${clr.r},${clr.g},${clr.b},${clr.a / 255})`

            colorSegs.push(<div key={'end'} className='hsl-seg' style={{ left: 0, top: (height - trackHeight) / 2, width: width, height: trackHeight, backgroundColor: rgba }}></div>)
        }
    }

    const getMouseXY = (ev) => {
        let hsl_elem = document.getElementById(thisID)
        if (!ev.clientX) {
            ev = ev.touches[0];
        }
        let rect = hsl_elem.getBoundingClientRect();
        let x = (ev.clientX - rect.left),
            y = (ev.clientY - rect.top);
        return { x, y };
    }

    const mouseDown = (e) => {
        let pos = getMouseXY(e)
        nubHitInfos.forEach((hitInfo) => {
            let left = hitInfo.nubLeft - 2
            let right = hitInfo.nubLeft + hitInfo.nubWidth + 2
            if (left <= pos.x && right >= pos.x) {
                setDragState({
                    hitInfo: hitInfo,
                    startPos: pos
                })
            }
        })
    }

    const mouseMove = (e) => {
        if (dragState) {
            let pos = getMouseXY(e)
            if (pos.x < dragState.hitInfo.dragLeftMin) {
                pos.x = dragState.hitInfo.dragLeftMin
            } else if (pos.x > dragState.hitInfo.dragRightMax) {
                pos.x = dragState.hitInfo.dragRightMax
            }

            let deltaX = pos.x - dragState.startPos.x
            let newXVal = dragState.hitInfo.xval + deltaX
            // now we have to convert that newXVal into a strength that represents a %
            let pct = 100 * (props.width - newXVal) / props.width

            if (props.onStrengthChange) {
                props.onStrengthChange(dragState.hitInfo.strengthIndex, pct, false)
            }
        }
    }

    const mouseUp = (e) => {
        if (dragState) {
            let pos = getMouseXY(e)
            let deltaX = pos.x - dragState.startPos.x
            let newXVal = dragState.hitInfo.xval + deltaX
            // now we have to convert that newXVal into a strength that represents a %
            let pct = 100 * (props.width - newXVal) / props.width

            if (props.onStrengthChange) {
                props.onStrengthChange(dragState.hitInfo.strengthIndex, pct, true)
            }
            setDragState(null)
        }
    }

    return <div id={thisID} className="hist-sliders" style={{ width: props.width, height: props.height }} onMouseDown={mouseDown} onMouseMove={mouseMove} onMouseUp={mouseUp}>
        {colorSegs}
        {nubs}
    </div>
}
// 1.1, -1.32, -1.03, 1.54
const CliffordAttractors = new Attractor({
    name: "Clifford Attractors",
    suggestedFilename: 'clifford',
    algorithmText: <div>Clifford attractors are defined by the equations:<br />
        <div className="eq">X<sub>n+1</sub> = sin(a*y<sub>n</sub>) + c*cos(a*x<sub>n</sub>)</div>
        <div className="eq">Y<sub>n+1</sub> = sin(b*x<sub>n</sub>) + d*cos(b*y<sub>n</sub>)</div>
    </div>,
    // [var,min,max,step,default], ...
    paramsNeeded: [['a', -3, 3, 0.01, -1.7], ['b', -3, 3, 0.01, 1.8], ['c', -3, 3, 0.01, -1.9], ['d', -3, 3, 0.01, -0.4]],
    iterator: (x, y, params) => {
        let xn = Math.sin(params.a * y) + params.c * Math.cos(params.a * x)
        let yn = Math.sin(params.b * x) + params.d * Math.cos(params.b * y)
        return { x: xn, y: yn }
    },
    presets: [
        {"name": "Fiery #1", "attractorParams": { "a": -1.7, "b": 1.8, "c": -1.9, "d": -0.4 }, "iterations": 30000000, "colorIndex": 0, "smoothingFactor": 0, "backgroundType": "dark", "inverted": true, "colorStrengths": [0, 11.2, 31.7, 43.325, 53.825, 72.375, 88.25, 94.375, 100] },
        {"name": "Fiery #2", "attractorParams": { "a": -1.3, "b": -1.3, "c": -1.8, "d": -1.9 }, "iterations": 15000000, "colorIndex": 0, "smoothingFactor": 0, "backgroundType": "light", "inverted": false, "colorStrengths": [-1.015, 10.725, 22.335, 33.44, 46.06, 58.42, 70.53, 93.14, 100] },
        {"name": "Bow", "attractorParams": { "a": -1, "b": -1.36, "c": -1.45, "d": 1.44 }, "iterations": 20000000, "colorIndex": 0, "smoothingFactor": 0, "backgroundType": "light", "inverted": false, "colorStrengths": [0, 11.2, 19.2, 36.325, 53.825, 64.125, 76.375, 92.375, 100] }, 
        {"name": "Purple Swoop", "attractorParams": { "a": -1.7, "b": 1.5, "c": -0.5, "d": 0.7 }, "iterations": 15000000, "colorIndex": 5, "smoothingFactor": 0, "backgroundType": "light", "inverted": false, "colorStrengths": [3.46, 10.67, 17.25, 33.33, 41.67, 50, 60.83, 69.92, 78, 86.96, 95.29, 100] },
        {"name":"Black Scrawl","attractorParams":{"a":1.1,"b":-1.32,"c":-1.03,"d":1.54},"iterations":20000000,"colorIndex":1,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[0,33.63,58.38,82,100],"originX":-2.99,"originY":-2.51,"scale":152.2083},
    ]
})
const DeJongAttractors = new Attractor({
    name: "DeJong Attractors",
    suggestedFilename: 'dejong',
    algorithmText: <div>DeJong attractors are defined by the equations:<br />
        <div className="eq">X<sub>n+1</sub> = sin(a*y<sub>n</sub>) - cos(b*x<sub>n</sub>)</div>
        <div className="eq">Y<sub>n+1</sub> = sin(c*x<sub>n</sub>) - cos(d*y<sub>n</sub>)</div>
    </div>,
    // [var,min,max,step,mdefault], ...
    paramsNeeded: [['a', -3, 3, 0.01, -1.7], ['b', -3, 3, 0.01, 1.8], ['c', -3, 3, 0.01, -1.9], ['d', -3, 3, 0.01, -0.4]],

    iterator: (x, y, params) => {
        let xn = Math.sin(params.a * y) - Math.cos(params.b * x)
        let yn = Math.sin(params.c * x) - Math.cos(params.d * y)
        return { x: xn, y: yn }
    },
    presets: [
        {"name": "Blue Streak", "reflectOption":PixelHitGrid.REFLECT_RIGHT_TO_LEFT,"attractorParams": { "a": 1.7, "b": 1.7, "c": 0.6, "d": 1.2 }, "iterations": 25000000, "colorIndex": 4, "smoothingFactor": 0, "backgroundType": "dark", "inverted": true, "colorStrengths": [11.24, 24.35, 33.835, 44.32, 69.43, 85.04, 91.4, 97.26, 100] },
        {"name": "Purple Flower", "attractorParams": { "a": -0.827, "b": -1.637, "c": 1.659, "d": 0.943 }, "iterations": 25000000, "colorIndex": 5, "smoothingFactor": 0, "backgroundType": "light", "inverted": false, "colorStrengths": [6.21, 15.67, 21.63, 33.33, 41.67, 50, 60.83, 69.92, 78, 86.96, 95.29, 100] },
        {"name": "Dark C", "attractorParams": { "a": 1.4, "b": -2.3, "c": 2.4, "d": -2.1 }, "iterations": 30000000, "colorIndex": 1, "smoothingFactor": 0, "backgroundType": "dark", "inverted": true, "colorStrengths": [0, 33.25, 60.38, 80.88, 100.5] },
        {"name":"Neon","attractorParams":{"a":1.641,"b":1.902,"c":0.316,"d":1.525},"iterations":40000000,"colorIndex":5,"smoothingFactor":0,"backgroundType":"dark","inverted":true,"colorStrengths":[22.46,33.17,42.13,50.08,57.55,67.38,74.58,82.42,88.5,93.71,97.29,100],"originX":-2.19,"originY":-2.4,"scale":187.2959},
        {"name": "Wave","attractorParams":{"a":2.01,"b":-2.53,"c":1.61,"d":-0.33},"iterations":10000000,"colorIndex":4,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[0.44,17.75,41.63,62.25,86.75,100],"originX":-1.99,"originY":-2.74,"scale":217.8002},
    ]
})
const HopalongAttractors = new Attractor({
    name: "Hopalong Attractors",
    suggestedFilename: 'hopalong',
    algorithmText: <div>Hopalong attractors are defined by the equations:<br />
        <div className="eq">X<sub>n+1</sub> = y<sub>n</sub> - sqrt(abs(b * x<sub>n</sub> - c)) * sign(x<sub>n</sub>)</div>
        <div className="eq">Y<sub>n+1</sub> = a - x<sub>n</sub></div>
    </div>,
    // [var,min,max,step,mdefault], ...
    paramsNeeded: [['a', -2, 2, 0.01, 2], ['b', -2, 2, 0.01, 1], ['c', -2, 2, 0.01, 0]],

    iterator: (x, y, params) => {
        let xn = y - Math.sqrt(Math.abs(params.b * x - params.c)) * Math.sign(x)
        let yn = params.a - x
        return { x: xn, y: yn }
    },
    presets: [
        {"name": "Bubbles", "attractorParams": { "a": 2, "b": 1, "c": 0 }, "iterations": 10000000, "colorIndex": 5, "smoothingFactor": 0, "backgroundType": "light", "inverted": false, "colorStrengths": [-0.01, 11.72, 25.71, 44.32, 58.81, 73.29, 82.28, 91.14, 100] },
        {"name":"Crochet","attractorParams":{"a":-11,"b":0.05,"c":0.5},"iterations":10000000,"colorIndex":6,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[0,7.69,15.38,23.08,30.77,38.46,46.15,53.85,61.54,69.23,76.92,84.62,92.31,100],"originX":-46.82,"originY":-47.69,"scale":9.58},
        {"name":"Crochet #2","attractorParams":{"a":1.1,"b":0.5,"c":1},"iterations":10000000,"colorIndex":3,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[8,17.5,37.75,62.25,86.75,100],"originX":-122.32,"originY":-121.82,"scale":3.2621},        
    ]
})
const GumowskiMiraAttractors = new Attractor({
    name: "Gumowski-Mira Attractors",
    suggestedFilename: 'gumowski',
    algorithmText: <div>Gumowski-Mira attractors are defined by the equations:<br />
        <div className="eq">F(x) = c*x + 2*(1-c)*x<sup>2</sup> / (1+x<sup>2</sup>)</div>
        <div className="eq">X<sub>n+1</sub> = y<sub>n</sub> + a*(1-b*y<sub>n</sub><sup>2</sup>)*y<sub>n</sub> + F(x<sub>n</sub>)</div>
        <div className="eq">Y<sub>n+1</sub> = -x<sub>n</sub> + F(x<sub>n+1</sub>)</div>
    </div>,
    // [var,min,max,step,mdefault], ...
    paramsNeeded: [['a', -2, 2, 0.01, 0], ['b', -2, 2, 0.01, 0.5], ['c', -2, 2, 0.01, -0.75],['x', -1,1,0.01,0.1],['y', -1,1,0.01,0.1]],

    iterator: (x, y, params) => {
        const f = (fx) => params.c * fx + 2 * (1 - params.c) * (fx**2) / (1 + fx**2)
        let xn = y + params.a*(1-params.b*(y**2))*y + f(x)
        let yn = -x + f(xn)
        return { x: xn, y: yn }
    },
    presets: [
        {"name":"Hummingbird","attractorParams":{"a":0.008,"b":0.05,"c":-0.496,"x":0,"y":1},"iterations":30000000,"colorIndex":5,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[3.46,10.67,17.25,24.45,34.17,43.5,54.95,67.3,79,91.46,97.17,100],"originX":-15.48,"originY":-22.01,"scale":22.4376},    
        {"name":"Swirl","attractorParams":{"a":0.008,"b":0.05,"c":-0.45,"x":0,"y":1},"iterations":30000000,"colorIndex":1,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[0.13,32.75,64.63,91.63,100],"originX":-9.38,"originY":-11.33,"scale":37.4836},
        {"name":"Starfish","attractorParams":{"a":0.008,"b":0.05,"c":-0.9,"x":0,"y":1},"iterations":30000000,"colorIndex":0,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[0,12.5,25,37.5,50,62.5,75,87.5,100],"originX":-34.04,"originY":-36.29,"scale":11.1522},
        {"name":"Swircle","attractorParams":{"a":0.009,"b":0.05,"c":0.32,"x":0.5,"y":0.5},"iterations":30000000,"colorIndex":4,"smoothingFactor":0,"backgroundType":"light","inverted":false,"colorStrengths":[1.24,4.6,25.71,44.32,69.43,85.04,91.4,97.26,100],"originX":-6.86,"originY":-9,"scale":46.2659},
    ]
})

const ATTRACTORS = [
    CliffordAttractors,
    DeJongAttractors,
    HopalongAttractors,
    GumowskiMiraAttractors
]
ATTRACTORS.forEach((attr, idx) => attr.key = idx)

const FIRE_COLOR_SYSTEM = {
    name: "Fiery",
    minHitCount: 10,
    smoothingFactor: 0,
    defaultBackgroundType: 'light',
    colors: [
        '#fffec8',
        '#fffc80',
        '#ffe232',
        '#ff9b25',
        '#ff561e',
        '#e31a17',
        '#9c1110',
        '#550909',
        '#0b0101',
    ],
    colorStrengths: []
}
const BW_COLOR_SYSTEM = {
    name: "Black & White",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [
        '#FFFFFF',
        '#B0B0B0',
        '#808080',
        '#404040',
        '#000000',
    ],
    colorStrengths: []
}
export const COOL_BLUES_COLOR_SYSTEM = {
    name: "Cool Blues",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [
        '#e7fcfb', '#7ec7da', '#55acce', '#2788ab', '#1c667a', '#154353'
    ],
    colorStrengths: [8, 17.5, 37.75, 62.25, 86.75, 100]
}

export const BLUES_COLOR_SYSTEM = {
    name: "Blues",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [

        '#a3fdf3',
        '#81f5f4',
        '#5aeaf4',
        '#00d7f6',
        '#00c8f8',
        '#2098f8',
        '#1e79f8',
        '#245df8',
        '#282ff3',
        '#1306cc',
        '#12009f',
        '#060055',
    ],
    colorStrengths: [2.71, 6.17, 11.75, 18.21, 24.54, 33.88, 45.21, 54.42, 64.13, 70.33, 94.54, 100]
}

export const PURPLES_COLOR_SYSTEM = {
    name: "Purples",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [
        '#ffccfe',
        '#ffb8fd',
        '#ffa4fd',
        '#ff8efc',
        '#ff73fc',
        '#fb42fb',
        '#b919fa',
        '#9c17fa',
        '#8016fa',
        '#6d16fa',
        '#2d14f9',
        '#080c99',
    ],
    colorStrengths: [3.46, 10.67, 17.25, 33.33, 41.67, 50, 60.83, 69.92, 78, 86.96, 95.29, 100]
}

export const GREENS_COLOR_SYSTEM = {
    name: "Greens",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [
        '#fafaca',
        '#dcd443',
        '#97ba2b',
        '#51a12d',
        '#287869',
        '#1c6491',
        '#1b41c8',
        '#1752b1',
        '#1b008a',
    ],
    colorStrengths: [1.24, 4.6, 25.71, 44.32, 69.43, 85.04, 91.4, 97.26, 100]
}

export const RAINBOW_COLOR_SYSTEM = {
    name: "Rainbow",
    minHitCount: 10,
    smoothingFactor: 0,
    backgroundChoices: { light: 'white', dark: 'black' },
    defaultBackgroundType: 'light',
    colors: [
        '#d71519',
        '#ff7726',
        '#ff942a',
        '#ffa02a',
        '#ffc02d',
        '#c2d229',
        '#aecb27',
        '#89c024',
        '#17943b',
        '#0e826e',
        '#006ca5',
        '#0066b0',
        '#100eb1',
        '#0f0aaa',
    ],
    colorStrengths: []
}



const COLOR_SYSTEMS = [
    FIRE_COLOR_SYSTEM,
    BW_COLOR_SYSTEM,
    BLUES_COLOR_SYSTEM,
    COOL_BLUES_COLOR_SYSTEM,
    GREENS_COLOR_SYSTEM,
    PURPLES_COLOR_SYSTEM,
    RAINBOW_COLOR_SYSTEM,
]


// function HistogramCanvas(props) {
//     const canvasRef = useRef(null)

//     useEffect(() => {
//         const canvas = canvasRef.current
//         canvas.width = props.width
//         canvas.height = props.height
//         const context = canvas.getContext('2d')
//         let bars = props.bars
//         let barMx = props.width / (bars.length - 1)

//         context.clearRect(0, 0, context.canvas.width, context.canvas.height)
//         let x = 0
//         context.fillStyle = 'black'
//         context.beginPath()
//         context.moveTo(x, canvas.height - bars[0])
//         for (let i = 1; i < bars.length; i++) {
//             context.lineTo(i * barMx, canvas.height - bars[i])
//         }
//         context.lineTo(canvas.width, canvas.height)
//         context.lineTo(0, canvas.height)
//         context.closePath()
//         context.fill()

//     }, [props.runInfo])

//     return <canvas ref={canvasRef} {...props} />
// }
