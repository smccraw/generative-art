

export function HomePage() {
    return <div className="about-content">
        <h1>Generative Art Playground</h1>
        <p>The Generative Art Playground is intended to be a place for those interested in playing around with
            using computers and algorithms to generate art. It all started with my own interest in exploring
            this space and as I encounter new and interesting techniques I will continue adding my discoveries here.
        </p>
        <p>If you have any comments, feedback or especially any pointers to new and interesting techniques, please
            drop me a line at <a href='mailto: smccraw116@gmail.com'>smccraw116@gmail.com</a>.
        </p>
        <p>Puruse the sections below or if you want to just jump in and look at the finished artwork, you can
            select the <a href='./finished'>Finished</a> tab above.
        </p>
        <h2>Lines, lines and more lines</h2>
        <p>The most obvious place for me to start was my memories of the old Spirograph toy I had as a kid. using
            just circles and ovals as templates you could generate seemingly endless patterns very easily. Computers
            take this concept to the next level, both algorithmically and in terms of painting abilities. Click any
            any of the below thumbs if you want to watch the animations of these images being generated.
        </p>
        <div className="thumbnail-set">
            <a href='./lineart#simpletrig'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/trigFlower_thumb.jpg'></img></a>
            <a href='./lineart#lineflower'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/trigFlower2_thumb.jpg'></img></a>
            <a href='./lineart#linetorus'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/lineTorus_thumb.jpg'></img></a>
            <a href='./lineart#linearches'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/lineArches_thumb.jpg'></img></a>
            <a href='./lineart#mechbloom1'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/mechanicalBloom1_thumb.jpg'></img></a>
            <a href='./lineart#mechbloom2'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/mechanicalBloom2_thumb.jpg'></img></a>
            <a href='./lineart#straightcircle'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/lineCircle_thumb.jpg'></img></a>
            <a href='./lineart#straightcircle2'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/lineCircle2_thumb.jpg'></img></a>
        </div>
        
        <h2>Wiggly Lines</h2>
        <p>Straight lines and smooth curves make for some beautiful art, but randomness while it may look like squiggles
            at the small scale, can also come together to make some very interesting things.
        </p>
         <div className="thumbnail-set">
            <a href='./wiggles#wigglysplines'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyLine.jpg'></img></a>
            <a href='./wiggles#wigglysplinecircle'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglySpline_thumb.jpg'></img></a>
            <a href='./wiggles#wigglyropes'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope4.jpg'></img></a>
          
        </div>

        <h2>Parametric Equations</h2>
        <p>Using mathematical algorithms to generate smooth shapes and curves,combined with different painting techniques.</p>
         <div className="thumbnail-set">
            <a href='./parametrics#parabutterfly'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/butterflyCurve1_thumb.jpg'></img></a>
            <a href='./parametrics#sandybutterfly'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/butterflyCurve2_thumb.jpg'></img></a>
            <a href='./parametrics#smokeybutterfly'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/butterflyCurve3_thumb.jpg'></img></a>
            <a href='./parametrics#parasplat'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/butterfly3D_thumb.jpg'></img></a>
            <a href='./parametrics#fierybutterfly'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/butterFireFly_thumb.jpg'></img></a>
            <a href='./parametrics#paraspirals'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/paraSpirals_thumb.jpg'></img></a>
        </div>

        <h2>Attractors</h2>
        <p>Strange or otherwise, these dynamic systems have a certain beauty to them.</p>
         <div className="thumbnail-set">
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/clifford1_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/clifford2_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/clifford3_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/dejong1_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/dejong2_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/hopalong_thumb.jpg'></img></a>
            <a href='./attractors'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/gumowski_thumb.jpg'></img></a>
        </div>

        <h2>Harmonographs - the Pendulum(s) Swing Both Ways</h2>
        <p>Dating back to the mid-19th century, drawing pictures with a swinging pendulum has fascinated mathematicians and inventors alike.</p>
         <div className="thumbnail-set">
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph_BW_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph1_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph2_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph3_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph4_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph5_thumb.jpg'></img></a>
            <a href='./harmonographs'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/harmonograph6_thumb.jpg'></img></a>
        </div>

        <h2>Autonomous Bots</h2>
        <p>An autonomous bot (or autonomous agent) is an entity that makes it's own decisions about how to act in an environment primarily
            based on it's current internal state and its limited observations of the world around it.
        </p>
         <div className="thumbnail-set">
            <a href='./autobots'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/friendFollow1_thumb.jpg'></img></a>
            <a href='./autobots#flourishb'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/flourishB_thumb.jpg'></img></a>
            <a href='./autobots#flourishheron'><img alt='thumbnail'>className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/flourishHeron_thumb.jpg'></img></a>
        </div>
    </div>
}
