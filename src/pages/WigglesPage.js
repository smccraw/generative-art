import { useEffect } from "react"
import { WigglySplines, WigglySplineCircle } from "../simulations/Wiggles"
import { WigglySplineRope } from "../simulations/WigglyRope"

export function WigglesPage() {
    useEffect(()=> {
        if(document.location.hash !== '') {
          setTimeout(()=> {
              document
                .querySelector(document.location.hash)
                .scrollIntoView({ behavior: "smooth", block: "start" })
          }, 300)
        }
      }, [])

    return <div className="page-content">
        <h1>Splines that Wiggle</h1>
        <p>Straight lines and smooth curves make for some beautiful art, but randomness while it may look like squiggles
            at the small scale, can also come together to make some very interesting things.
        </p>
        <WigglySplines width={800} height={200} />
        <WigglySplineCircle width={800} height={800} />
        <WigglySplineRope width={1000} height={800} />
        <br />
        <p>Here are some of my favorites that I've generated using the above system.</p>
        <div className='favorites'>
            <img className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope1.jpg' alt="finished-artwork" />
            <img className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope2.jpg' alt="finished-artwork" />
            <img className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope4.jpg' alt="finished-artwork" />
            <img className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope3.jpg' alt="finished-artwork" />
            <img className='thumbnail' src='https://gen-art-images.s3.us-west-2.amazonaws.com/wigglyRope5.jpg' alt="finished-artwork" />
        </div>
    </div>
}

