import { useEffect } from "react"
import {ArchesLineArt, SimpleTrigLineArt, TorusLineArt, FlowerLineArt} from "../simulations/LineArt"
import { StraightCircle, StraightCircle2, MechanicalBloom1, MechanicalBloom2} from "../simulations/Spirographs"

export function LineArtPage() {
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
        <h1>Line Art</h1>
        <p>Line art is a computerized version of the old Spirograph toy we played with as kids. Select the play button to generate
            the images below. If you want to watch an animated version, make sure the ShowBots icon is active before pressing play.
        </p>
        <SimpleTrigLineArt width={800} height={800} />
        <FlowerLineArt width={800} height={800} />
        <TorusLineArt width={800} height={800} />
        <ArchesLineArt width={800} height={800} />
        <MechanicalBloom1 width={800} height={800} />
        <MechanicalBloom2 width={800} height={800} />
        <StraightCircle width={800} height={800} />
        <StraightCircle2 width={800} height={800} />
    </div>
}

