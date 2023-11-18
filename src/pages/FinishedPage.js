import { useState } from "react"
export function FinishedPage() {
    let [activeTab, setActiveTab] = useState(0)
    let pieces = []

    if (activeTab === 0) {
        pieces.push(finishedWorkItem('trigFlower.jpg'))
        pieces.push(finishedWorkItem('trigFlower2.jpg'))
        pieces.push(finishedWorkItem('lineTorus.jpg'))
        pieces.push(finishedWorkItem('lineArches.jpg'))
        pieces.push(finishedWorkItem('mechanicalBloom1.jpg'))
        pieces.push(finishedWorkItem('mechanicalBloom2.jpg'))
        pieces.push(finishedWorkItem('lineCircle.jpg'))
        pieces.push(finishedWorkItem('lineCircle2.jpg'))
    } else if (activeTab === 1) {
        pieces.push(finishedWorkItem('wigglyRope1.jpg'))
        pieces.push(finishedWorkItem('wigglyRope2.jpg'))
        pieces.push(finishedWorkItem('wigglyRope4.jpg'))
        pieces.push(finishedWorkItem('wigglyRope3.jpg'))
        pieces.push(finishedWorkItem('wigglyRope5.jpg'))
        pieces.push(finishedWorkItem('wigglySpline.jpg'))
    } else if (activeTab === 2) {
        pieces.push(finishedWorkItem('butterflyCurve1.jpg'))
        pieces.push(finishedWorkItem('butterflyCurve2.jpg'))
        pieces.push(finishedWorkItem('butterflyCurve3.jpg'))
        pieces.push(finishedWorkItem('butterfly3D.jpg'))
        pieces.push(finishedWorkItem('butterFireFly.jpg'))
        pieces.push(finishedWorkItem('paraSpirals.jpg'))
    } else if (activeTab === 3) {
        pieces.push(finishedWorkItem('clifford1.jpg'))
        pieces.push(finishedWorkItem('clifford2.jpg'))
        pieces.push(finishedWorkItem('clifford3.jpg'))
        pieces.push(finishedWorkItem('dejong1.jpg'))
        pieces.push(finishedWorkItem('dejong2.jpg'))
        pieces.push(finishedWorkItem('hopalong.jpg'))
        pieces.push(finishedWorkItem('gumowski.jpg'))
    } else if (activeTab === 4) {
        pieces.push(finishedWorkItem('harmonograph.jpg'))
        pieces.push(finishedWorkItem('harmonograph_BW.jpg'))
        pieces.push(finishedWorkItem('harmonograph1.jpg'))
        pieces.push(finishedWorkItem('harmonograph2.jpg'))
        pieces.push(finishedWorkItem('harmonograph3.jpg'))
        pieces.push(finishedWorkItem('harmonograph4.jpg'))
        pieces.push(finishedWorkItem('harmonograph5.jpg'))
        pieces.push(finishedWorkItem('harmonograph6.jpg'))
    } else if (activeTab === 5) {
        pieces.push(finishedWorkItem('flourishB.jpg'))
        pieces.push(finishedWorkItem('flourishHeron.jpg'))
        pieces.push(finishedWorkItem('flourishBird.jpg'))
        pieces.push(finishedWorkItem('friendFollow1.jpg'))
        pieces.push(finishedWorkItem('FriendChaser2Orbitals.jpg'))
        pieces.push(finishedWorkItem('FriendChaserAxisRestricted.jpg', 'Friendly autobots but restricted to X/Y axis movement'))
        pieces.push(finishedWorkItem('FriendChaserNoOrbitals.jpg'))
    }


    return <div className="about-content">
        <h1>Gallery of Finished Works</h1>
        <div className='tab-bar'>
            <div className={`tab ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>Lines</div>
            <div className={`tab ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>Wiggles</div>
            <div className={`tab ${activeTab === 2 ? "active" : ""}`} onClick={() => setActiveTab(2)}>Parametric</div>
            <div className={`tab ${activeTab === 3 ? "active" : ""}`} onClick={() => setActiveTab(3)}>Attractors</div>
            <div className={`tab ${activeTab === 4 ? "active" : ""}`} onClick={() => setActiveTab(4)}>Harmonographs</div>
            <div className={`tab ${activeTab === 5 ? "active" : ""}`} onClick={() => setActiveTab(5)}>Autobots</div>
        </div>
        <div className='work-display'>
            {pieces}
        </div>
    </div>
}

function finishedWorkItem(imageName, tagLine) {
    let key = imageName.split('.')[0]
    let srcUrl = 'https://gen-art-images.s3.us-west-2.amazonaws.com/' + imageName

    if (tagLine) {
        return <div key={key} className='finished-piece'>
            <img className='thumbnail' src={srcUrl} />
            <div className='tag-line'>{tagLine}</div>
        </div>
    } else {
        return <div key={key} className='finished-piece'><img className='thumbnail' src={srcUrl} /></div>
    }

}