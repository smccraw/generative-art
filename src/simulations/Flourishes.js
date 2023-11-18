import Vector from "../Vector"
import colors from "../colors"
import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot } from "../components/BotSystem"
import P5Canvas from "../components/P5Canvas"
import { drawFriendlyLines } from "../painters/LinePainters"
import { VariableChangeSet, makeSelectorOptions, presetOrDef } from "../components/VariableChanger.js"
import colorSchemes from "../ColorSchemes"

const COLORS = ['#154353', '#1c667a', '#2788ab', '#55acce', '#7ec7da', '#e7fcfb', '#b4e3fd']
const ANGLE_VELOCITY = (Math.PI * 2) / 1000
const ORBITOR_SPEED = Math.PI / 2
const FRIEND_SPEED = ORBITOR_SPEED * 0.9

export function FlourishB(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = (sys, controller) => {
        const rand = controller.rand
        botSys.reset();

        createFollow1FriendBots(botSys, 4, 1, COLORS, rand)
    }
    
    botSys.onPreStep = () => {
        const width = botSys.width, height = botSys.height
        botSys.bots.forEach((bot) => {
            let vbotF = botSys.bots[bot.friend]
            if (bot.orbitor) {
                let v = bot.pos.subtrScalars(width / 2, height / 2)
                let targetPos = v.unit().rotate(ANGLE_VELOCITY).mult(bot.orbitDist).addScalars(width / 2, height / 2)

                bot.vel = targetPos.subtr(bot.pos).unit().mult(ORBITOR_SPEED / 2)
            } else {
                let vx = (vbotF.pos.x - bot.pos.x) / 1000
                let vy = (vbotF.pos.y - bot.pos.y) / 1000

                bot.vel = bot.vel.addScalars(vx, vy).unit().mult(FRIEND_SPEED / 1.4)
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        autoPauseAt: 2050,
        showBots: true,
        finishedArt: true
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        sketchBuffer.strokeWeight(1)
        drawFriendlyLines(botSys, sketchBuffer, 0.07, { fadeIn: 125 })
    }

    return <div id='flourishb' className='content-chunk'>
        <h3>Flourish B</h3>
        <p>Sometime less is more, only having a few bots and one orbitor can create some stunning flourishes in just a few hundred frames.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='flourishB' enableMouseDragging={true} />
            <p>4 bots, each chasing one friend and one as a designated orbitor. Painted with a 7% opaque continuous pen between friends</p>
        </div>
    </div>
}

function createFollow1FriendBots(botSys, botCount, orbitors, colorSet, rand) {
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

export function FlourishHeron(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = (sys, controller) => {
        let colors = ['#ffccfe', '#ffb8fd', '#ffa4fd', '#ff8efc', '#9c17fa','#ff73fc', '#fb42fb', '#b919fa', '#ffcffe',  '#8016fa', '#6d16fa']
        const rand = controller.rand
        botSys.reset();

        if (rand.random() < 0.5) {
            colors = COLORS
        }
        createFollow1FriendBots(botSys, 4, 1, colors, rand)
    }
    
    botSys.onPreStep = () => {
        const width = botSys.width, height = botSys.height
        botSys.bots.forEach((bot) => {
            let vbotF = botSys.bots[bot.friend]
            if (bot.orbitor) {
                let v = bot.pos.subtrScalars(width / 2, height / 2)
                let targetPos = v.unit().rotate(ANGLE_VELOCITY).mult(bot.orbitDist).addScalars(width / 2, height / 2)

                bot.vel = targetPos.subtr(bot.pos).unit().mult(ORBITOR_SPEED / 2)
            } else {
                let vx = (vbotF.pos.x - bot.pos.x) / 1000
                let vy = (vbotF.pos.y - bot.pos.y) / 1000

                bot.vel = bot.vel.addScalars(vx, vy).unit().mult(FRIEND_SPEED / 1.4)
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 4743,
        autoPauseAt: 1020,
        showBots: true,
        finishedArt: true
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        sketchBuffer.strokeWeight(1)
        drawFriendlyLines(botSys, sketchBuffer, 0.07, { fadeIn: 125 })
    }

    return <div id='flourishheron' className='content-chunk'>
        <h3>Flourish Heron</h3>
        <p>Looks kinda like a heron out in the marshes.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='flourishHeron' enableMouseDragging={true} />
        </div>
    </div>
}

export function FlourishPlay(props) {
    let width = 800, height = 800
    let variableSet = new VariableChangeSet()
    variableSet.addNumberSlider('botCount', 'Bots', 2, 12, 1, presetOrDef(props, 'botCount',4))
    variableSet.addNumberSlider('orbitorCount', 'Orbitors', 1, 8, 1, presetOrDef(props, 'orbitorCount',1))
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), 8)

    let botSys = new BotSystem(width, height)
    botSys.initializeSystem = (sys, controller) => {
        const botCount = variableSet.getValue('botCount')
        const orbitorCount = variableSet.getValue('orbitorCount')
        const colorScheme = variableSet.getValue('colorScheme')
        const rand = controller.rand
        botSys.reset();

        let colors = rand.random(colorSchemes).colors
        while (colors.length <= 1) {
        colors = rand.random(colorSchemes).colors
        }
        createFollow1FriendBots(botSys, botCount, orbitorCount, colorScheme.colors, rand)
    }
    
    botSys.onPreStep = () => {
        const width = botSys.width, height = botSys.height
        botSys.bots.forEach((bot) => {
            let vbotF = botSys.bots[bot.friend]
            if (bot.orbitor) {
                let v = bot.pos.subtrScalars(width / 2, height / 2)
                let targetPos = v.unit().rotate(ANGLE_VELOCITY).mult(bot.orbitDist).addScalars(width / 2, height / 2)

                bot.vel = targetPos.subtr(bot.pos).unit().mult(ORBITOR_SPEED / 2)
            } else {
                let vx = (vbotF.pos.x - bot.pos.x) / 1000
                let vy = (vbotF.pos.y - bot.pos.y) / 1000

                bot.vel = bot.vel.addScalars(vx, vy).unit().mult(FRIEND_SPEED / 1.4)
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 8142,
        showBots: true,
        finishedArt: false,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        sketchBuffer.strokeWeight(1)
        drawFriendlyLines(botSys, sketchBuffer, 0.07, { fadeIn: 125 })
    }

    return <div id='flourishplay' className='content-chunk'>
        <h3>Flourish - Playground</h3>
        <p>
            Use the random seed generator to create your own flourishes.
        </p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='flourishP' enableMouseDragging={true} />
        </div>
    </div>
}