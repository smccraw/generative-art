import { useEffect } from "react"
import { FlourishB, FlourishHeron, FlourishPlay } from "../simulations/Flourishes"
import { FriendFollow } from "../simulations/FriendFollow"
export function AutoBotsPage() {
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
        <h1>Friends with Autonomous Bots</h1>
        <p>An autonomous bot (or autonomous agent) is an entity that makes it's own decisions about how to act in an environment primarily
            based on it's current internal state and its limited observations of the world around it. Typically there is no overall leader
            or central plan in place dictating how a bot behaves (often there are global forces like gravity at play however).
        </p>
        <p>One of the more popular genres of autobots is the "follow a friend" category. Bots will typically have 1 or more friends that they
            are attracted to (attempt to move closer to), while also attempting to keep a reasonable distance away from non-friends.
        </p>
        <p>Other categories include things like physics based bots, where the laws of physics are observed (gravity, collisions, friction, etc...), as well 
            as simple bots that mimick 'cells' in that they behave according to just a few simple rules and observations about their neighbors (<a href='https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life' >Conway's Game of Life</a> is a prime example of this).
        </p>
        <FriendFollow width={800} height={800} />
        <FlourishB width={800} height={800} />
        <FlourishHeron finishedArt={true} />
        <FlourishPlay finishedArt={true} />
        
    </div>
}

