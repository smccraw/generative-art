import { useState } from "react"
import Vector from "../Vector"
import colors, {ColorLerper} from "../colors"
import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot } from "../components/BotSystem"
import P5Canvas from "../components/P5Canvas"
import { VariableChangeSet, makeSelectorOptions } from "../components/VariableChanger"
import initialize3dProjection, { rotateAroundX, rotateAroundY, rotateAroundZ } from "../projection3d.js"

const pow = Math.pow
const cos = Math.cos
const sin = Math.sin

const presets = [
    {name: "Custom" },
    {"d1": 0.0098, "d2": 0.0036, "d3": 0.0042, "d4": 0.0029, "f1": 1.984, "f2": 1.981, "f3": 3.014, "f4": 2.012, "p1": 1.2, "p2": 1.761, "p3": 2.784, "p4": 1.165, startOffset: 480, extraFrames1: 0, extraFrames2: 3750  },
    {"d1": 0.0026, "d2": 0.0088, "d3": 0.0033, "d4": 0.732, "f1": 2.013, "f2": 2.982, "f3": 1.99, "f4": 3.011, "p1": 2.375, "p2": 2.011, "p3": 0.902, "p4": 0.199, startOffset: 580, extraFrames1: 0, extraFrames2: 3750 },
    {"d1":0.0057,"d2":0.0074,"d3":0.0132,"d4":0.0141,"f1":2.011,"f2":2.982,"f3":2.019,"f4":1.982,"p1":0.83,"p2":0.993,"p3":2.035,"p4":2.274,"startOffset":223,"extraFrames1":0,"extraFrames2":3770},
    {"d1":0.0058,"d2":0.0139,"d3":0.0103,"d4":0.0011,"f1":1.983,"f2":3.018,"f3":3.016,"f4":2.02,"p1":0.284,"p2":2.158,"p3":0.69,"p4":1.691,"startOffset":120,"extraFrames1":0,"extraFrames2":3770},
    {"d1":0.0037,"d2":0.0002,"d3":0.0005,"d4":0.0144,"f1":1.984,"f2":1.99,"f3":2.983,"f4":2.989,"p1":2.426,"p2":1.134,"p3":3.051,"p4":0.408,"startOffset":0,"extraFrames1":0,"extraFrames2":3770},
    {f1:2, f2:6, f3:1.002, f4:3, d1:0.02, d2:0.0315, d3:0.02, d4:0.02, p1:Math.PI/16, p2:3*Math.PI/2, p3:13*Math.PI/16, p4:Math.PI,"startOffset":123,"extraFrames1":0,"extraFrames2":3770},
].map((c, idx) => { c.name = c.name || `Preset #${idx}`; return c })

const colorSchemes = [
    {name: "Cyan", defaultBackgroundType: 'light', colors: ['#7ec7da']},
    {name: "Purple", defaultBackgroundType: 'light', colors: ['#b919fa']},
    {name: "Yellow", defaultBackgroundType: 'light', colors: ['#ffe232']},
    {name: "Red", defaultBackgroundType: 'light', colors: ['#ff0000']},
    {name: "Black", defaultBackgroundType: 'light', colors: ['#000000']},
    {name: "White", defaultBackgroundType: 'light', colors: ['#ffffff']},
    {name: "Black & White",defaultBackgroundType: 'light',colors: ['#D0D0D0','#B0B0B0','#808080','#404040','#202020']},
    {name: "Purples", defaultBackgroundType: 'light', colors: ['#ffccfe','#ffb8fd','#ffa4fd','#ff8efc','#ff73fc','#fb42fb','#b919fa','#9c17fa','#8016fa','#6d16fa','#4e37f9']},
    {name: "Fiery",defaultBackgroundType: 'light',colors: ['#fffec8','#fffc80','#ffe232','#ff9b25','#ff561e','#e31a17','#9c1110']},
    {name: "Gilded",defaultBackgroundType: 'light',colors: ['#ffdc73','#ffcf40','#ffbf00','#bf9b30','#a67c00']},
    {name: "Greens",backgroundChoices: { light: 'white', dark: 'black' },defaultBackgroundType: 'light',colors: ['#fafaca','#dcd443','#97ba2b','#51a12d','#287869','#1c6491','#1b41c8']},
    {name: "Sandy",backgroundChoices: { light: 'white', dark: 'black' },defaultBackgroundType: 'light',colors: ['#e0d0b8', '#d9c1a0', '#b9a180', '#b29158', '#b19979', '#836c53']},
]
colorSchemes.forEach((cs) => {
    if (cs.colors.length > 1) {
        cs.colors = cs.colors.concat(Array.from( cs.colors).reverse())
    }
})

export default function Harmonograph(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    let controller
    let d1, d2, d3, d4, f1, f2, f3, f4, p1, p2, p3, p4
    let startOffset = 0
    let extraFrames1 = 0
    let extraFrames2 = 3750
    let framesPerT = 600
    let quickPreview = false
    let colorLerper = null
    botSys.initializeSystem = (sys, controller, forReset) => {
        botSys.reset();

        quickPreview = !!controller.variableSet.getValue('quickPreview')
        framesPerT = quickPreview ? 100 : 600
        extraFrames2 = 2 * Math.round(Math.PI * framesPerT) + extraFrames1

        let bot = new Bot()
        bot.overlayRadius = 2
        bot.clr = colors.ensureColor255('#FFFFFF')
        bot.extraFrames = extraFrames1
        botSys.addBot(bot)

        bot = new Bot()
        bot.overlayRadius = 2
        bot.clr = colors.ensureColor255('#b919fa')
        bot.extraFrames = extraFrames2
        botSys.addBot(bot)

        f1 = controller.variableSet.getValue('f1')
        f2 = controller.variableSet.getValue('f2')
        f3 = controller.variableSet.getValue('f3')
        f4 = controller.variableSet.getValue('f4')
        d1 = controller.variableSet.getValue('d1')
        d2 = controller.variableSet.getValue('d2')
        d3 = controller.variableSet.getValue('d3')
        d4 = controller.variableSet.getValue('d4')
        p1 = controller.variableSet.getValue('p1')
        p2 = controller.variableSet.getValue('p2')
        p3 = controller.variableSet.getValue('p3')
        p4 = controller.variableSet.getValue('p4')

        colorLerper = new ColorLerper(controller.variableSet.getValue('colorScheme').colors)
    }

    botSys.onPreStep = () => {
        botSys.bots.forEach((bot) => {
            let t = (startOffset + botSys.frameCount + bot.extraFrames) / framesPerT
            let dt1 = (d1 < 0) ? 100 * d1 / t : -d1 * t
            let dt2 = (d2 < 0) ? 100 * d2 / t : -d2 * t
            let dt3 = (d3 < 0) ? 100 * d3 / t : -d3 * t
            let dt4 = (d4 < 0) ? 100 * d4 / t : -d4 * t
            let x = pow(Math.E, dt1) * sin(f1 * t + p1) + pow(Math.E, dt2) * sin(f2 * t + p2)
            let y = pow(Math.E, dt3) * sin(f3 * t + p3) + pow(Math.E, dt4) * sin(f4 * t + p4)
            bot.setNewPosition(x * width * 0.24 + width / 2, y * height * 0.24 + height / 2)

            bot.clr = colorLerper.getColor(t/2)
        })

    }

    controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 3080,
        autoPauseAt: 25000,
        showBots: true,
        finishedArt: false
    })
    controller.onSeedChanged = () => {
        initVariables()
    }
    controller.paintCanvasForDownload = (p5, sketchBuffer) => {
        p5.clear()
        p5.image(sketchBuffer, 0, 0)

        let text = JSON.stringify({ d1, d2, d3, d4, f1, f2, f3, f4, p1, p2, p3, p4, startOffset, extraFrames1, extraFrames2 }) + ','
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText(text);
        } else {
            document.execCommand('copy', true, text);
        }
        console.log("Copied to the clipboard")
    }
    const limitDigits = (num, digits) => {
        return parseFloat(num.toFixed(digits))
    }
    const initVariables = () => {
        const rand = controller.rand
        let preview = (controller.variableSet) ? !!controller.variableSet.getValue('quickPreview') : false
        let preset = (controller.variableSet) ? controller.variableSet.getValue('preset') : null
        if (!preset || preset.name === 'Custom') {
            controller.variableSet = new VariableChangeSet()
                .addNumberSlider('d1', 'd1', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d2', 'd2', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d3', 'd3', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d4', 'd4', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addSeparator()
                .addNumberSlider('f1', 'f1', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f2', 'f2', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f3', 'f3', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f4', 'f4', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addSeparator()
                .addNumberSlider('p1', 'p1', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p2', 'p2', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p3', 'p3', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p4', 'p4', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addSeparator()
                .addSwitch('quickPreview', 'Wireframe', preview)
                .addSelector('preset', "Preset", makeSelectorOptions(presets), 0)
                .addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 0)
        } else {
            startOffset = preset.startOffset || startOffset
            extraFrames1 = preset.extraFrames1 || extraFrames1
            extraFrames2 = preset.extraFrames2 || extraFrames2

            controller.variableSet = new VariableChangeSet()
                .addNumberSlider('d1', 'd1', -1, 1, 0.0001, preset.d1)
                .addNumberSlider('d2', 'd2', -1, 1, 0.0001, preset.d2)
                .addNumberSlider('d3', 'd3', -1, 1, 0.0001, preset.d3)
                .addNumberSlider('d4', 'd4', -1, 1, 0.0001, preset.d4)
                .addSeparator()
                .addNumberSlider('f1', 'f1', 1, 4, 0.001, preset.f1)
                .addNumberSlider('f2', 'f2', 1, 4, 0.001, preset.f2)
                .addNumberSlider('f3', 'f3', 1, 4, 0.001, preset.f3)
                .addNumberSlider('f4', 'f4', 1, 4, 0.001, preset.f4)
                .addSeparator()
                .addNumberSlider('p1', 'p1', 0, 3.14, 0.001, preset.p1)
                .addNumberSlider('p2', 'p2', 0, 3.14, 0.001, preset.p2)
                .addNumberSlider('p3', 'p3', 0, 3.14, 0.001, preset.p3)
                .addNumberSlider('p4', 'p4', 0, 3.14, 0.001, preset.p4)
                .addSeparator()
                .addSwitch('quickPreview', 'Wireframe', preview)
                .addSelector('preset', "Preset", makeSelectorOptions(presets), controller.variableSet.getVariable('preset').value)
                .addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), controller.variableSet.getVariable('colorScheme').value)
        }
    }
    initVariables()

    controller.updateSketch = (p5, sketchBuffer) => {
        if (botSys.bots.length > 0) {
            sketchBuffer.strokeWeight(1)
            let bot1 = botSys.bots[0]
            let bot2 = botSys.bots[1]

            // if (controller.backgroundType === 'dark') {
            //     bot2.clr = colors.ensureColor255('#b919fa')
            // } else {
            //     bot2.clr = colors.ensureColor255('#000000')
            // }

            if (quickPreview) {
                if (botSys.frameCount > 1) {
                    controller.setStrokeColor(sketchBuffer, bot2.clr, 128)
                    sketchBuffer.line(bot2.lastPos.x, bot2.lastPos.y, bot2.pos.x, bot2.pos.y)
                    sketchBuffer.line(bot1.lastPos.x, bot1.lastPos.y, bot1.pos.x, bot1.pos.y)
                }
            } else {
                controller.setStrokeColor(sketchBuffer, bot2.clr, 32)
                sketchBuffer.line(bot1.pos.x, bot1.pos.y, bot2.pos.x, bot2.pos.y)

                if (botSys.frameCount > 1) {
                    sketchBuffer.line(bot1.lastPos.x, bot1.lastPos.y, bot1.pos.x, bot1.pos.y)
                    controller.setStrokeColor(sketchBuffer, bot2.clr, 64)
                    sketchBuffer.line(bot2.lastPos.x, bot2.lastPos.y, bot2.pos.x, bot2.pos.y)
                }
            }
        }
    }

    controller.onVariableChanged = (controller, vdef, changeSet) => {
        console.log( vdef, changeSet)
        if (vdef.name === 'preset' && vdef.value !== 0) {
            initVariables()
        } else if (vdef.name === 'colorScheme') {
            colorLerper = new ColorLerper(controller.variableSet.getValue('colorScheme').colors)
        }
        controller.reset()
    }

    return <div is='harmonograph' className='content-chunk'>
        <h3>Harmonographs</h3>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='harmonograph' />
            <p><a href={"https://walkingrandomly.com/?p=151"}>Harmonographs</a></p>
        </div>
    </div>
}

export function Harmonograph3D(props) {
    let width = 800, height = 800, depth = 800
    let projection = initialize3dProjection(width, height, depth, 0.55)
    let botSys = new BotSystem(width, height)
    let controller
    let d1, d2, d3, d4, f1, f2, f3, f4, p1, p2, p3, p4
    let startOffset = 0
    let extraFrames1 = 0
    let extraFrames2 = 3750
    let framesPerT = 600
    let quickPreview = false
    let colorLerper = null
    botSys.initializeSystem = (sys, controller, forReset) => {
        botSys.reset();

        quickPreview = !!controller.variableSet.getValue('quickPreview')
        framesPerT = quickPreview ? 100 : 600
        extraFrames2 = 2 * Math.round(Math.PI * framesPerT) + extraFrames1

        let bot = new Bot()
        bot.overlayRadius = 2
        bot.clr = colors.ensureColor255('#FFFFFF')
        bot.extraFrames = extraFrames1
        botSys.addBot(bot)

        bot = new Bot()
        bot.overlayRadius = 2
        bot.clr = colors.ensureColor255('#b919fa')
        bot.extraFrames = extraFrames2
        botSys.addBot(bot)

        f1 = controller.variableSet.getValue('f1')
        f2 = controller.variableSet.getValue('f2')
        f3 = controller.variableSet.getValue('f3')
        f4 = controller.variableSet.getValue('f4')
        d1 = controller.variableSet.getValue('d1')
        d2 = controller.variableSet.getValue('d2')
        d3 = controller.variableSet.getValue('d3')
        d4 = controller.variableSet.getValue('d4')
        p1 = controller.variableSet.getValue('p1')
        p2 = controller.variableSet.getValue('p2')
        p3 = controller.variableSet.getValue('p3')
        p4 = controller.variableSet.getValue('p4')

        colorLerper = new ColorLerper(controller.variableSet.getValue('colorScheme').colors)
    }

    botSys.onPreStep = () => {
        botSys.bots.forEach((bot) => {
            let t = (startOffset + botSys.frameCount + bot.extraFrames) / framesPerT
            let dt1 = (d1 < 0) ? 100 * d1 / t : -d1 * t
            let dt2 = (d2 < 0) ? 100 * d2 / t : -d2 * t
            let dt3 = (d3 < 0) ? 100 * d3 / t : -d3 * t
            let dt4 = (d4 < 0) ? 100 * d4 / t : -d4 * t
            let x = pow(Math.E, dt1) * sin(f1 * t + p1) + pow(Math.E, dt2) * sin(f2 * t + p2)
            let y = pow(Math.E, dt3) * sin(f3 * t + p3) + pow(Math.E, dt4) * sin(f4 * t + p4)
            let z = pow(Math.E, dt1) * sin(f2 * t + p3) + pow(Math.E, dt4) * cos(f1 * t + p2)
            bot.setNewPosition(x * width * 0.24 + width / 2, y * height * 0.24 + height / 2)
            bot.pos.z = z * depth * 0.24 + depth / 2
            bot.clr = colorLerper.getColor(t/2)
        })
    }

    controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 3080,
        autoPauseAt: 25000,
        showBots: true,
        finishedArt: false
    })
    controller.onSeedChanged = () => {
        initVariables()
    }
    controller.paintCanvasForDownload = (p5, sketchBuffer) => {
        p5.clear()
        p5.image(sketchBuffer, 0, 0)

        let text = JSON.stringify({ d1, d2, d3, d4, f1, f2, f3, f4, p1, p2, p3, p4, startOffset, extraFrames1, extraFrames2 }) + ','
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText(text);
        } else {
            document.execCommand('copy', true, text);
        }
        console.log("Copied to the clipboard")
    }
    const limitDigits = (num, digits) => {
        return parseFloat(num.toFixed(digits))
    }
    const initVariables = () => {
        const rand = controller.rand
        let preview = (controller.variableSet) ? !!controller.variableSet.getValue('quickPreview') : false
        let preset = (controller.variableSet) ? controller.variableSet.getValue('preset') : null
        if (!preset || preset.name === 'Custom') {
            controller.variableSet = new VariableChangeSet()
                .addNumberSlider('d1', 'd1', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d2', 'd2', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d3', 'd3', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addNumberSlider('d4', 'd4', -1, 1, 0.0001, limitDigits(rand.random(0, 0.015), 4))
                .addSeparator()
                .addNumberSlider('f1', 'f1', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f2', 'f2', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f3', 'f3', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addNumberSlider('f4', 'f4', 1, 4, 0.001, limitDigits(rand.random([2, 3]) + rand.jitterRandom(0.01, 0.02), 3))
                .addSeparator()
                .addNumberSlider('p1', 'p1', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p2', 'p2', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p3', 'p3', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addNumberSlider('p4', 'p4', 0, 3.14, 0.001, limitDigits(rand.random(0, Math.PI), 3))
                .addSeparator()
                .addSwitch('quickPreview', 'Wireframe', preview)
                .addSelector('preset', "Preset", makeSelectorOptions(presets), 0)
                .addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 0)
        } else {
            startOffset = preset.startOffset || startOffset
            extraFrames1 = preset.extraFrames1 || extraFrames1
            extraFrames2 = preset.extraFrames2 || extraFrames2

            controller.variableSet = new VariableChangeSet()
                .addNumberSlider('d1', 'd1', -1, 1, 0.0001, preset.d1)
                .addNumberSlider('d2', 'd2', -1, 1, 0.0001, preset.d2)
                .addNumberSlider('d3', 'd3', -1, 1, 0.0001, preset.d3)
                .addNumberSlider('d4', 'd4', -1, 1, 0.0001, preset.d4)
                .addSeparator()
                .addNumberSlider('f1', 'f1', 1, 4, 0.001, preset.f1)
                .addNumberSlider('f2', 'f2', 1, 4, 0.001, preset.f2)
                .addNumberSlider('f3', 'f3', 1, 4, 0.001, preset.f3)
                .addNumberSlider('f4', 'f4', 1, 4, 0.001, preset.f4)
                .addSeparator()
                .addNumberSlider('p1', 'p1', 0, 3.14, 0.001, preset.p1)
                .addNumberSlider('p2', 'p2', 0, 3.14, 0.001, preset.p2)
                .addNumberSlider('p3', 'p3', 0, 3.14, 0.001, preset.p3)
                .addNumberSlider('p4', 'p4', 0, 3.14, 0.001, preset.p4)
                .addSeparator()
                .addSwitch('quickPreview', 'Wireframe', preview)
                .addSelector('preset', "Preset", makeSelectorOptions(presets), controller.variableSet.getVariable('preset').value)
                .addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), controller.variableSet.getVariable('colorScheme').value)
        }
    }
    initVariables()

    controller.updateSketch = (p5, sketchBuffer) => {
        if (botSys.bots.length > 0) {
            sketchBuffer.strokeWeight(1)
            let bot1 = botSys.bots[0]
            let bot2 = botSys.bots[1]

            // if (controller.backgroundType === 'dark') {
            //     bot2.clr = colors.ensureColor255('#b919fa')
            // } else {
            //     bot2.clr = colors.ensureColor255('#000000')
            // }

            let pjp1 = projection.getProjectedPoint([bot1.pos.x, bot1.pos.y, bot1.pos.z])
            let pjp2 = projection.getProjectedPoint([bot2.pos.x, bot2.pos.y, bot2.pos.z])

            if (quickPreview) {
                if (botSys.frameCount > 1) {
                    controller.setStrokeColor(sketchBuffer, bot2.clr, 128)
                    sketchBuffer.line(bot2.lastProjectedPos.x, bot2.lastProjectedPos.y, pjp2[0], pjp2[1])
                    sketchBuffer.line(bot1.lastProjectedPos.x, bot1.lastProjectedPos.y, pjp1[0], pjp1[1])

                    sketchBuffer.stroke(128,128)
                    sketchBuffer.line(bot2.lastPos.x, bot2.lastPos.y, bot2.pos.x, bot2.pos.y)

                }
            } else {
                controller.setStrokeColor(sketchBuffer, bot2.clr, 32)
                sketchBuffer.line(pjp1[0], pjp1[1], pjp2[0], pjp2[1])

                if (botSys.frameCount > 1) {
                    sketchBuffer.line(bot1.lastProjectedPos.x, bot1.lastProjectedPos.y, pjp1[0], pjp1[1])
                    controller.setStrokeColor(sketchBuffer, bot2.clr, 64)
                    sketchBuffer.line(bot2.lastProjectedPos.x, bot2.lastProjectedPos.y, pjp2[0], pjp2[1])
                }
            }
            bot1.lastProjectedPos = {x: pjp1[0], y: pjp1[1]}
            bot2.lastProjectedPos = {x: pjp2[0], y: pjp2[1]}
        }
    }

    controller.onVariableChanged = (controller, vdef, changeSet) => {
        console.log( vdef, changeSet)
        if (vdef.name === 'preset' && vdef.value !== 0) {
            initVariables()
        } else if (vdef.name === 'colorScheme') {
            colorLerper = new ColorLerper(controller.variableSet.getValue('colorScheme').colors)
        }
        controller.reset()
    }

    return <div id='harmonograph3d' className='content-chunk'>
        <h3>Harmonographs - 3D</h3>
        <p>We can also add in the third dimension and plot the Z axis as well. This results in the same general pattern
            as the 2D version, but with a little depth to it. Notice how the paint is being applied in a slightly different
            location from the tracking bots. This was actually a bug in the code where I was not converting the tracking bots
            coordinates into 3D space like I was for the painting algorithm. I decided however to just leave it like this so
            you can see the difference between 3D space and it's 2D projection.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='harmonograph' />
        </div>
    </div>
}