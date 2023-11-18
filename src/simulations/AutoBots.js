import Vector from "../Vector.js"
import colors, { ColorAutoLerper } from "../colors.js"
import utils from "../utils.js"
import { easeOutQuad } from '../easing.js'
import SketchTweaker from "../components/SketchTweaker.js"
import P5Controller from "../components/P5Controller.js"
import BotSystem, { Bot } from "../components/BotSystem.js"
import P5Canvas from "../components/P5Canvas.js"
import { VariableChangeSet, makeSelectorOptions, presetOrDef } from "../components/VariableChanger.js"
import colorSchemes from "../ColorSchemes.js"

const cos = Math.cos
const abs = Math.abs

const TWO_PI = Math.PI * 2
const FRAME_RATE = 120
export function KooshBall(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    let variableSet = new VariableChangeSet()

    let colorLerper = null
    variableSet.addNumberSlider('opacity', 'Opacity', 0.01, 1, 0.01, presetOrDef(props, 'opacity', 0.5))
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), presetOrDef(props, 'colorScheme', 9))

    botSys.CENTER_POS = new Vector(width / 2, height / 2)

    const addTestBots = () => {
        E2Bot.doSplash(controller, 256, 16, variableSet.getValue('colorScheme').colors)
    }

    botSys.initializeSystem = (sys, controller) => {
        let colorScheme = variableSet.getValue('colorScheme')
        botSys.reset();
        colorLerper = new ColorAutoLerper(colorScheme.colors, 0.0001)

        addTestBots()
    }

    botSys.onPreStep = () => {
        botSys.handleDeletes()
        botSys.bots.forEach((bot, idx) => {
            bot.step(botSys)
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: presetOrDef(props, 'seed', 1782),
        frameRate: presetOrDef(props, 'frameRate', FRAME_RATE),
        showBots: true,
        autoPauseAt: presetOrDef(props, 'autoPauseAt', 10000),
        finishedArt: !!props.finishedArt,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        botSys.bots.forEach((bot, idx) => {
            bot.paint(sketchBuffer, colorLerper, variableSet.getValue('opacity'))
        })
    }

    return <div id='friendfollow1' className='content-chunk'>
        <h3>Koosh Ball</h3>
        <p>Spindly little tendrils emerging from the center and then randomly wander outward from the center.
            Looks like a <a href='https://en.wikipedia.org/wiki/Koosh_ball'>Koosh ball</a> when it's done.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} finishedArt={controller.finishedArt} />
            <P5Canvas controller={controller} sketchName='kooshBall' />
            <p></p>
        </div>
    </div>
}

// Think splash of sand and as it builds up friction goes down because your riding on existing grains of sand
const E2_SPEED = 2.414
class E2Bot extends Bot {
    static doSplash(controller, botCount, waves, colors) {
        while (botCount > 0) {
            new E2Bot(controller, waves, colors)
            botCount--
        }
    }

    constructor(controller, waves, colors) {
        super()
        this.controller = controller
        this.botSys = controller.botSystem
        this.waves = waves
        this.colors = colors
        this.spawn()
        this.botSys.addBot(this)
    }
    spawn() {
        let botSys = this.botSys
        let rand = this.controller.rand
        this.angle = rand.random(TWO_PI)
        this.pos = new Vector(rand.random(0, 3), 0).rotate(this.angle).add(botSys.CENTER_POS)
        let rawSpeed = rand.random(E2_SPEED * 0.8, E2_SPEED * 1.2)
        this.vel = new Vector(rawSpeed, 0).rotate(this.angle)
        this.thetaD = rand.jitterRandom(0, 0.004)

        this.clr = colors.ensureColor255(rand.random(this.colors))

        this.overlayRadius = 2
        this.frameCount = 0
    }
    step(botSys) {
        this.frameCount++
        let friction = utils.mapEase(0, 16, this.waves, 0.89, 0.9925, easeOutQuad)
        if (this.waves === 1) {
            friction = 0.85
        } else if (this.waves === 0) {
            friction = 0.8
        }
        this.vel = this.vel.rotate(this.thetaD).mult(friction)  // rotate and add friction

        this.update(botSys.fixedVelocity, botSys.maxVelocity)

        if (abs(this.vel.x) <= 0.1 && abs(this.vel.y) <= 0.1) {
            if (this.waves > 0) {
                this.waves--
                this.spawn()
            } else {
                this.deleteRequested = true
            }
        }
    }
    paint(gb, colorLerper, opacity) {
        let alpha = colors.ensureAlpha255(opacity)
        let dx = this.pos.x - this.botSys.CENTER_POS.x
        let dy = this.pos.y - this.botSys.CENTER_POS.y

        let clr = this.clr
        gb.stroke(clr.r, clr.g, clr.b, alpha)
        gb.point(this.pos.x, this.pos.y)
        // mirrored 180 around the center
        gb.point(this.botSys.CENTER_POS.x - dx, this.botSys.CENTER_POS.y - dy)

        let exposeX, exposeY
        if (Math.abs(this.vel.x) >= Math.abs(this.vel.y)) {
            exposeX = 1
            exposeY = 0
        } else {
            exposeX = 0
            exposeY = 1
        }

        gb.stroke(255, 255, 255, Math.round(alpha / 3))
        gb.point(this.pos.x - exposeX, this.pos.y - exposeY)
        gb.point(this.botSys.CENTER_POS.x - dx - exposeX, this.botSys.CENTER_POS.y - dy - exposeY)

        gb.stroke(0, 0, 0, Math.round(alpha / 3))
        gb.point(this.pos.x + exposeX, this.pos.y + exposeY)
        gb.point(this.botSys.CENTER_POS.x - dx + exposeX, this.botSys.CENTER_POS.y - dy + exposeY)
    }
}

export function SpiralDecay(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    let variableSet = new VariableChangeSet()
    let controller
    let colorLerper = null
    variableSet.addNumberSlider('botCount', 'Bots', 1, 128, 1, presetOrDef(props, 'botCount', 32))
    variableSet.addNumberSlider('opacity', 'Opacity', 0.01, 1, 0.01, presetOrDef(props, 'opacity', 0.2))
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), presetOrDef(props, 'colorScheme', 9))

    botSys.CENTER_POS = new Vector(width / 2, height / 2)

    const rebirth = (bot) => {
        const rand = controller.rand
        let colorScheme = variableSet.getValue('colorScheme')
        bot.birthFrame = controller.frameCount
        bot.clr = colors.ensureColor255(rand.random(colorScheme.colors))
        bot.pos = new Vector(rand.random(controller.width), rand.random(controller.height))
        bot.angle = botSys.CENTER_POS.subtr(bot.pos).angle() + rand.jitterRandom(0.11)
        bot.initialAngle = bot.angle
        bot.oobFrames = 0
        bot.decayVel = 0
        bot.decayAcceleration = 0
        bot.speed = rand.randomBetween(0.5, 5.0);
        bot.speedMx = rand.randomBetween(0.996, 1.001);

        while (Math.abs(bot.decayAcceleration) < 0.00001) {
            bot.decayAcceleration = rand.jitterRandom(0.0008);
        }
    }

    botSys.initializeSystem = (sys, controller) => {
        const rand = controller.rand
        const botCount = variableSet.getValue('botCount', 32)
        let colorScheme = variableSet.getValue('colorScheme')
        botSys.reset();
        botSys.setAllElasticities(-1)
        colorLerper = new ColorAutoLerper(colorScheme.colors, 0.0001)
       
        for (let i = 0; i < botCount; i++) {
            let bot = new Bot()
            bot.id = i + 1
            rebirth(bot)

            bot.pos = new Vector(rand.jitterRandom(16), rand.jitterRandom(16)).add(botSys.CENTER_POS)
            bot.angle = bot.pos.subtr(botSys.CENTER_POS).angle() + rand.jitterRandom(0.11)
            bot.overlayRadius = 3

            botSys.addBot(bot)
        }
    }

    botSys.onPreStep = () => {
        botSys.bots.forEach((bot, idx) => {
            bot.vel = new Vector(bot.speed, 0).rotate(bot.angle)
            bot.angle += bot.decayVel
            bot.decayVel += bot.decayAcceleration

            bot.speed *= bot.speedMx;

            if (Math.abs(bot.speed) < 0.2) {
                bot.speedMx = 1.002
            }
            if (Math.abs(bot.angle - bot.initialAngle) > (Math.PI * 6)) { // done 3 full loops?
                rebirth(bot)
            }
            if (false === botSys.boundaries.isInBoundary(bot)) {
                bot.oobFrames++
                if (bot.oobFrames > 250) {
                    rebirth(bot)
                }
            } else {
                bot.oobFrames = 0
            }

            // 50 frame fade in on every rebirth
            bot.fadeAlpha = (bot.birthFrame > 0) ? Math.min(1, (controller.frameCount - bot.birthFrame) / 50) : 1
        })
    }

    controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'light',
        seed: presetOrDef(props, 'seed', 1782),
        frameRate: presetOrDef(props, 'frameRate', 24),
        showBots: true,
        autoPauseAt: presetOrDef(props, 'autoPauseAt', 10000),
        finishedArt: !!props.finishedArt,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let opacity = variableSet.getValue('opacity')
        botSys.bots.forEach((bot, idx) => {
            if (bot.lastPos) {
                sketchBuffer.stroke(bot.clr.r, bot.clr.g, bot.clr.b, colors.ensureAlpha255(opacity))
                sketchBuffer.line(bot.lastPos.x, bot.lastPos.y, bot.pos.x, bot.pos.y)
            }
        })
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots) {
            botSys.bots.forEach((bot) => {
                p5.stroke(0, 255, 255)
                p5.line(bot.pos.x, bot.pos.y, bot.pos.x + bot.vel.x * 4, bot.pos.y + bot.vel.y * 4)
            })
        }
    }
    return <div id='friendfollow1' className='content-chunk'>
        <h3>Spiral Decay</h3>
        <p>Spiral decay works kinda like that shopping cart with the sticky wheel. Each bot is giving a slight pull to the left or right that gets worse over time.
            Eventually if it gets into a tight spiral or it wanders off screen it is killed and new bot is reborn at a random spot on the canvas.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} finishedArt={controller.finishedArt} />
            <P5Canvas controller={controller} sketchName='kooshBall' />
            <p></p>
        </div>
    </div>
}