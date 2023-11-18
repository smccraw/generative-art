import { useEffect } from "react"
import Harmonograph, {Harmonograph3D} from "../simulations/Harmonograph"

export function HarmonographsPage() {
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
        <h1>Harmonographs</h1>
        <p>
            A harmonograph is a mechanical apparatus that employs pendulums to create a geometric image (see <a href='https://en.wikipedia.org/wiki/Harmonograph'>Harmonograph</a>).
            To simulate the action of a pendulum, we can use the equation:<br /><br />
            <i style={{paddingLeft: 24}}>x(t)=A*sin(tf+p)*e<sup>-dt</sup></i><br/><br/>
            in which <i><strong>f</strong></i> represents frequency, <i><strong>p</strong></i> represents phase, <i><strong>A</strong></i> represents amplitude, <i><strong>d</strong></i> represents damping and <i><strong>t</strong></i> represents time.
        </p>
        <p>
            A typical harmonograph has 2 pendulums, one for the x-axis and one for the y-axis, that move in such a fashion to create an appealing pattern.
            To add even more texture to the image drawn, each pendulum will have 2 sets of frequencies superimposed with each other. Thus the final parametric equations
            will follow this general form:<br/><br/>
            <i style={{paddingLeft: 24}}>x(t)=A<sub>1</sub>*sin(t*f<sub>1</sub>+p<sub>1</sub>)*e<sup>-d<sub>1</sub>t</sup> + A<sub>2</sub>*sin(t*f<sub>2</sub>+p<sub>2</sub>)*e<sup>-d<sub>2</sub>t</sup></i><br/><br/>
            <i style={{paddingLeft: 24}}>y(t)=A<sub>3</sub>*sin(t*f<sub>3</sub>+p<sub>3</sub>)*e<sup>-d<sub>3</sub>t</sup> + A<sub>4</sub>*sin(t*f<sub>4</sub>+p<sub>4</sub>)*e<sup>-d<sub>4</sub>t</sup></i><br/><br/>
        </p>
        <hr style={{width: 800}}/>
        <Harmonograph width={800} height={800} />
        <br/>
        <hr style={{width: 800}}/>
        <Harmonograph3D width={800} height={800} />
        <h4>Additional References/Reading</h4>
        <a href={"https://walkingrandomly.com/?p=151"}>Harmonographs</a>
        <a href={"https://fronkonstin.com/2014/10/13/beautiful-curves-the-harmonograph/"}>Beautiful Curves</a>
        <br/>
        <br/>
    </div>
}
