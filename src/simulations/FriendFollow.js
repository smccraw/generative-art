import Vector from "../Vector"
import colors, { ColorAutoLerper, RandomColorGenerator, StaticColorGenerator } from "../colors"
import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot, createFollow1FriendBots, handleFollow1FriendMove, resolveFriendships } from "../components/BotSystem"
import P5Canvas from "../components/P5Canvas"
import { VariableChangeSet, makeSelectorOptions, presetOrDef } from "../components/VariableChanger.js"
import { SweepingSandPainter, TriSandPainter, drawSandSplineMulticolorGrains } from "../painters/SandPainters"
import colorSchemes from "../ColorSchemes.js"
import { LineCurver } from "../Curvers.js"

export function FriendFollow(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    let variableSet = new VariableChangeSet()
    let painters = []
    let colorLerper = null
    variableSet.addNumberSlider('botCount', 'Bots', 4, 128, 1, presetOrDef(props, 'botCount',64))
    variableSet.addNumberSlider('orbitorCount', 'Orbitors', 1, 16, 1, presetOrDef(props, 'orbitorCount',4))
    variableSet.addNumberSlider('attraction', 'Attraction', 0.05, 1, 0.05, presetOrDef(props, 'attraction',1))
    variableSet.addNumberSlider('repulsion', 'Repulsion', 0.05, 1, 0.05, presetOrDef(props, 'repulsion',1))
    variableSet.addSeparator()
    variableSet.addSelector('paintType', 'Paint Type', makeSelectorOptions(['Tri-Sand', 'Sandy Sweeps', "Uniform Dots", 'Lines']), presetOrDef(props, 'paintType',1))
    variableSet.addNumberSlider('opacity', 'Opacity', 0.01, 1, 0.01, presetOrDef(props, 'opacity',0.05))
    variableSet.addSelector('colorScheme', "Colors", makeSelectorOptions(colorSchemes), presetOrDef(props, 'colorScheme',10))

    // botSys.friction = -0.2
    botSys.initializeSystem = (sys, controller) => {
        const botCount = variableSet.getValue('botCount')
        const orbitorCount = variableSet.getValue('orbitorCount')
        const opacity = variableSet.getValue('opacity')
        const paintType = variableSet.getValue('paintType')
        const colorScheme = variableSet.getValue('colorScheme')

        botSys.reset();
        colorLerper = new ColorAutoLerper(colorScheme.colors, 0.0001)

        botSys.spacialIndexSize = 35
        createFriendlyBots(botSys, botCount, orbitorCount, 10, controller.rand)
        botSys.buildSpatialIndex()
        painters = []

        if (paintType === 'Tri-Sand') {
            painters.push(new TriSandPainter(new ColorAutoLerper(colorScheme.colors, 0.0001), controller.rand.randomBetween(0.23, 0.30), controller, opacity))
            painters.push(new TriSandPainter(new ColorAutoLerper(colorScheme.colors, 0.00007), controller.rand.randomBetween(0.47, 0.53), controller, opacity))
            painters.push(new TriSandPainter(new ColorAutoLerper(colorScheme.colors, 0.00013), controller.rand.randomBetween(0.70, 0.77), controller, opacity))
        } else if (paintType === 'Sandy Sweeps') {
            painters.push(new SweepingSandPainter(new ColorAutoLerper(colorScheme.colors, 0.0001), controller.rand))
            painters.push(new SweepingSandPainter(new ColorAutoLerper(colorScheme.colors, 0.00007), controller.rand))
            painters.push(new SweepingSandPainter(new ColorAutoLerper(colorScheme.colors, 0.00013), controller.rand))
        }
    }

    botSys.onPreStep = () => {
        const attraction = variableSet.getValue('attraction')
        const repulsion = variableSet.getValue('repulsion')
        const width = botSys.width, height = botSys.height
        const ANGLE_VELOCITY = (Math.PI * 2) / 1000
        const ORBITOR_SPEED = Math.PI / 2
        const ORBIT_DIST_SPEED = 0.314
        const FRIEND_SPEED = ORBITOR_SPEED * 0.9
        const ATTRACT_BASE = 4
        const REPULSE_BASE = -3

        botSys.bots.forEach((bot, idx) => {
            if (bot.orbitor) {
                let v = bot.pos.subtrScalars(width / 2, height / 2)
                let targetPos = v.unit().rotate(ANGLE_VELOCITY).mult(bot.orbitDist).addScalars(width / 2, height / 2)
                bot.vel = targetPos.subtr(bot.pos).unit().mult(ORBITOR_SPEED)

                if (bot.orbitDist < bot.targetOrbitDist) {
                    bot.orbitDist += ORBIT_DIST_SPEED
                    if (bot.orbitDist >= bot.targetOrbitDist) {
                        bot.targetOrbitDist = Math.round(Math.min(width, height) / 2 - controller.rand.randomIntBetween(60, width / 2 - 20))
                    }
                } else {
                    bot.orbitDist -= ORBIT_DIST_SPEED
                    if (bot.orbitDist <= bot.targetOrbitDist) {
                        bot.targetOrbitDist = Math.round(Math.min(width, height) / 2 - controller.rand.randomIntBetween(60, width / 2 - 20))
                    }
                }
            } else {
                let idxF = 0
                let forces = new Vector(0, 0)

                while (idxF < botSys.bots.length) {
                    let vbotF = botSys.bots[idxF]

                    if (vbotF !== bot) {
                        let vec = vbotF.pos.subtr(bot.pos)
                        if (bot.friends.has(idxF)) {
                            if (vec.mag() > bot.personalSpace / 2) {
                                let attrVec = vec.unit().mult(ATTRACT_BASE * attraction)
                                if (vbotF.orbitor) {
                                    attrVec = attrVec.mult(2)
                                }
                                forces = forces.add(attrVec)
                            }
                        } else {
                            if (vec.mag() < bot.personalSpace) {
                                let dd = bot.personalSpace - vec.mag()

                                let repVec = vec.unit().mult(dd * REPULSE_BASE * repulsion)
                                forces = forces.add(repVec)
                            }
                            // everyone has a little attraction to orbitors
                            if (vbotF.orbitor) {
                                let attrVec = vec.unit().mult(ATTRACT_BASE * attraction / 2)
                                forces = forces.add(attrVec)
                            }
                        }
                    }

                    idxF++
                }

                let newVel = bot.vel.add(forces)
                if (newVel.mag() > FRIEND_SPEED) {
                    newVel = newVel.unit().mult(FRIEND_SPEED)
                }
                bot.vel = newVel
            }
        })
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: presetOrDef(props, 'seed', 1782),
        frameRate: presetOrDef(props, 'autoPauseAt', 120),
        showBots: true,
        autoPauseAt: presetOrDef(props, 'autoPauseAt', 10000),
        finishedArt: !!props.finishedArt,
        variableSet: variableSet
    })

    controller.updateSketch = (p5, sketchBuffer) => {
        let opacity = variableSet.getValue('opacity')
        const paintType = variableSet.getValue('paintType')

        botSys.bots.forEach((bot, idx) => {
            let friends = Array.from(bot.friends)
            // let friends = botSys.resolveFriendships(bot)

            friends.forEach((idxF) => {
                // only paint each friendship once
                if (idx < idxF) {
                    let botF = botSys.bots[idxF]
                    if (!bot.orbitor && !botF.orbitor) {
                        if (paintType === 'Uniform Dots') {
                            let vec = bot.pos.subtr(botF.pos)
                            let curver = new LineCurver(bot.xInt(), bot.yInt(), 0, botF.xInt(), botF.yInt(), 0)
                            drawSandSplineMulticolorGrains(sketchBuffer, curver, controller.rand.randomIntBetween(vec.mag() / 6, vec.mag() / 4), colorLerper, colors.ensureAlpha255(opacity), false)
                        } else if (paintType === 'Lines') {
                            let clr = colorLerper.getNextColor()
                            controller.setStrokeColor(sketchBuffer, clr, opacity)
                            sketchBuffer.line(bot.xInt(), bot.yInt(), botF.xInt(), botF.yInt())
                        } else {
                            painters.forEach((sand) => {
                                sand.render(sketchBuffer, bot.xInt(), bot.yInt(), botF.xInt(), botF.yInt())
                            })
                        }
                    }
                }
            })
        })
    }

    return <div id='friendfollow1' className='content-chunk'>
        <h3>Friend Follow</h3>
        <p>Perhaps the simplest and most straight forward implementation of friend follow bots. Bots are created randomly all over the canvas
            and then each bot randomly chooses a small handful of friends and attempts to navigate itself closer to these friends, while avoiding
            any non-friends. Use the attraction and repulsion sliders below to control how strong this influences are. In order to keep this system
            from just collapsing down into the center, a set of bots is selected to be orbitors, in that they do not attempt to move closer to
            friends, but instead orbit around the center at various random distances and let their friends come to them.</p>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} finishedArt={controller.finishedArt} />
            <P5Canvas controller={controller} sketchName='friends' enableMouseDragging={true} />
            <p></p>
        </div>
    </div>
}

function makeFriend(bots, idx1, idxFriend) {
    const bot1 = bots[idx1]
    if (bot1.friends.size < bot1.maxFriends && !bot1.friends.has(idxFriend)) {
        bot1.friends.add(idxFriend)
    }
}

export function createFriendlyBots(botSys, botCount, orbitors, maxFriends, rand) {
    const width = botSys.width, height = botSys.height
    const totalBots = botCount + orbitors
    for (let i = 0; i < totalBots; i++) {
        let bot = new Bot()
        let v = new Vector(width * 0.45 - rand.random(200), 0).rotate(rand.random(Math.PI * 2))
        bot.pos = new Vector(width / 2 + v.x, height / 2 + v.y)

        bot.overlayRadius = 2
        bot.clr = { r: 255, g: 0, b: 255 }
        bot.friends = new Set()
        bot.maxFriends = maxFriends
        bot.personalSpace = rand.randomIntBetween(20, 60)
        botSys.addBot(bot)
    }

    let i = 0
    while (i < orbitors) {
        let bot = botSys.bots[i++]
        bot.orbitor = true
        bot.orbitDist = Math.min(width, height) / 2 - rand.randomBetween(20, 120)
        bot.targetOrbitDist = Math.min(width, height) / 2 - rand.randomBetween(20, 120)
        bot.overlayRadius = 3
        bot.clr = colors.HTML_COLORS['orange']
    }

    for (i = 0; i < totalBots * 2.2; i++) {
        let idx1 = rand.randomIntBetween(0, totalBots)
        let idx2 = (idx1 + rand.randomIntBetween(0, 22)) % totalBots
        if (idx1 !== idx2) {
            makeFriend(botSys.bots, idx1, idx2)
            makeFriend(botSys.bots, idx2, idx1)
        }
    }
}