import Vector from "../Vector"
import colors from "../colors"
import SketchTweaker from "../components/SketchTweaker"
import P5Controller from "../components/P5Controller"
import BotSystem, { Bot, createFollow1FriendBots } from "../components/BotSystem"
import P5Canvas from "../components/P5Canvas"
import { BezierCurver, CardinalSplineCurver, BSplineCurver, iterateContiguousPoints } from '../Curvers';
import { drawSolidSpline } from "../painters/LinePainters"
import myBots from '../images/myBots.json'

const COLORS = ['#154353', '#1c667a', '#2788ab', '#55acce', '#7ec7da', '#e7fcfb', '#b4e3fd']
const ANGLE_VELOCITY = (Math.PI * 2) / 1000
const ORBITOR_SPEED = Math.PI / 2
const FRIEND_SPEED = 2

const FOLLOW_BOTS = 2
const SPLINE_BOTS = 4
const FRAMES_IN_DRAWING = 3000
const FRAMES_PER_SIN = 180

export function FlourishMaker(props) {
    let width = 800, height = 800
    let botSys = new BotSystem(width, height)
    let orbitor = botSys.bots[0]
    let sinusodial = botSys.bots[2]
    let follower = botSys.bots[1]

    botSys.initializeSystem = (sys, controller, beingReset) => {
        const rand = controller.rand
        botSys.reset();

        // run this to burn the correct # of random calls
        createFollow1FriendBots(botSys, FOLLOW_BOTS + 1, 1, COLORS, rand)
        let dx = width / (SPLINE_BOTS + 1)
        for (let i = 1; i <= SPLINE_BOTS; i++) {
            let bot = new Bot()
            bot.pos = new Vector(i * dx, height - 100)
            bot.splineBot = true
            bot.overlayRadius = 2
            bot.clr = colors.ensureColor255('cyan')
            botSys.addBot(bot)
        }

        // if (myBots && !beingReset) {
        //     botSys.deserializeBots(myBots)
        // }

        orbitor = botSys.bots[0]
        sinusodial = botSys.bots[2]
        follower = botSys.bots[1]
        orbitor.lastPos = null
        sinusodial.lastPos = null
        sinusodial.pos = new Vector(orbitor.pos)
        follower.lastPos = null
    }

    botSys.onPreStep = () => {
        const width = botSys.width, height = botSys.height
        let splineBots = botSys.getBotPoints('paired', (b) => b.splineBot)
        let curver = CardinalSplineCurver.makeFromPoints(splineBots, 0.5, 24, false)

        let myFc = botSys.frameCount
        while (myFc > FRAMES_IN_DRAWING) {
            myFc -= FRAMES_IN_DRAWING
        }
        let pos = curver.getPoint(myFc / FRAMES_IN_DRAWING)
        orbitor.setNewPosition(pos)
        if (orbitor.lastPos) {
            let normalVec = orbitor.pos.subtr(orbitor.lastPos).unit().normal()
            let t = (botSys.frameCount % FRAMES_PER_SIN) / FRAMES_PER_SIN
            let sinV = Math.sin(t * Math.PI * 2)
            let pos = orbitor.pos.add(normalVec.mult(sinV * 64))

            sinusodial.setNewPosition(pos)
        }

        let fVec = sinusodial.pos.subtr(follower.pos)
        follower.applyForce(fVec.unit().mult(0.0625))
    }

    botSys.dragBotHandler = (e) => {
        if (e.action === 'start') {
            if (e.keyOptions.shiftKey) {
                let bot = new Bot()
                bot.pos = new Vector(e.dragStartAt)
                bot.splineBot = true
                bot.overlayRadius = 2
                bot.clr = colors.ensureColor255('cyan')
                botSys.addBot(bot)
            }
            BotSystem.prototype.dragBotHandler.call(botSys, e)
        } else if (e.action === 'move') {
            if (e.dragBot) {
                let dx = e.dragNowAt.x - e.dragStartAt.x
                let dy = e.dragNowAt.y - e.dragStartAt.y

                e.dragBot.setNewPosition(e.originalPos.addScalars(dx, dy))
            }
        } else if (e.action === 'end') {

        }
    }

    let controller = new P5Controller({
        botSystem: botSys,
        backgroundType: 'dark',
        seed: 1782,
        autoPauseAt: FRAMES_IN_DRAWING,
        showBots: true,
        finishedArt: false
    })

    controller.eraseBackground = (p5, sketchBuffer) => {
        P5Controller.prototype.eraseBackground.call(controller, p5, sketchBuffer)
    }

    controller.updateSketch = (p5, sketchBuffer) => {
        sketchBuffer.strokeWeight(1)
        if (sinusodial.lastPos) {
            controller.setStrokeColor(sketchBuffer, sinusodial.clr, 64)
            sketchBuffer.line(sinusodial.lastPos.x, sinusodial.lastPos.y, sinusodial.pos.x, sinusodial.pos.y)
            // for (let pt of iterateBresenhamPoints(sinusodial.lastPos.x, sinusodial.lastPos.y, sinusodial.pos.x, sinusodial.pos.y, true)) {
            //     sketchBuffer.point(pt.x, pt.y)
            // }
        }
        controller.setStrokeColor(sketchBuffer, follower.clr, 64)
        sketchBuffer.line(follower.pos.x, follower.pos.y, sinusodial.pos.x, sinusodial.pos.y)
    }

    controller.updateOverlay = (p5, sketchBuffer) => {
        if (controller.showBots && botSys.bots.length > 0) {
            let splineBots = botSys.getBotPoints('paired', (b) => b.splineBot)
            let curver = CardinalSplineCurver.makeFromPoints(splineBots, 0.5, 24, false)
            // let curver = BSplineCurver.makeClamped(2, botSys.getBotPoints('flat'))

            p5.noFill()
            p5.strokeWeight(1)
            // drawSandSplineMulticolorGrains(sketchBuffer, curver, rand.randomIntBetween(24,36), rcg, 64, true)
            drawSolidSpline(p5, curver, { r: 255, g: 0, b: 255 }, 128, 0.0025)
        }

        // if (controller.showBots) {
        //     botSys.bots.forEach((bot) => {
        //         if (!bot.splineBot && typeof bot.friend === 'number') {
        //             let botF = botSys.bots[bot.friend]
        //             let vec = botF.pos.subtr(bot.pos).unit().mult(15)

        //             p5.stroke(255, 96)
        //             p5.line(bot.pos.x, bot.pos.y, bot.pos.x + vec.x, bot.pos.y + vec.y)
        //         }
        //     })
        // }
    }

    const saveToUserFile = async (blob, suggestedName) => {
        try {
            // Show the file save dialog.
            const handle = await window.showSaveFilePicker({ suggestedName: "myBots.json" });
            // Write the blob to the file.
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // Fail silently if the user has simply canceled the dialog.
            if (err.name !== 'AbortError') {
                console.error(err.name, err.message);
                return;
            }
        }
    }

    controller.onDownloadClicked = (controller, e) => {
        let botStuff = botSys.serializeBots(['splineBot', 'friend', 'orbitor', 'noPaint'])
        const blob = new Blob([JSON.stringify(botStuff, null, 2)], { type: 'application/json' });

        const supportsFileSystemAccess =
            'showSaveFilePicker' in window &&
            (() => {
                try {
                    return window.self === window.top;
                } catch {
                    return false;
                }
            })();
        if (supportsFileSystemAccess) {
            saveToUserFile(blob, "myBots.json")
        } else {
            const element = document.createElement("a");
            element.href = URL.createObjectURL(blob);
            element.download = "myBots.json";
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            element.remove();
        }
    }

    return <div className='content-chunk'>
        <h3>Flourish Maker</h3>
        <div className='simulation-holder'>
            <SketchTweaker controller={controller} />
            <P5Canvas controller={controller} sketchName='flourishMaker' enableMouseDragging={true} />
        </div>
    </div>
}