import { useEffect } from "react"
import {ParametricEquationButterfly, ParametricEquationSand, ParametricEquationSmoke, 
    ParametricEquationSplat, ParametricEquationFireyButterFly, ParametricEquationSpirals} from "../simulations/ParametricEqs"

export function ParametricEqPage() {
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
        <h1>Parametric Equations</h1>
        <p>
            In mathematics, a parametric equation defines a group of quantities as functions of one or more independent variables called parameters (see <a href='https://en.wikipedia.org/wiki/Parametric_equation'>Parametric equation</a>).
            Specifically as it applies to generative art, the independent variable is usually <t>t</t>, which maps to time or to a frame counter. Each frame move t a little bit forward
            and then the X/Y coordinates are recalculated based on the new value of t.
            </p>
        <p>For example, one of the most well known parametric equations is the butterfly curve, discovered by 
            Temple H. Fay in 1989. It has these equations:<br/><br/>
            <i style={{paddingLeft: 20}}>x(t) = sin(t)*(e<sup>cos(t)</sup> - 2cos(4t) - sin<sup>5</sup>(t/12))</i><br/><br/>
            <i style={{paddingLeft: 20}}>y(t) = cos(t)*(e<sup>cos(t)</sup> - 2cos(4t) - sin<sup>5</sup>(t/12))</i>
            </p>
        <ParametricEquationButterfly width={800} height={800} />
        <ParametricEquationSand width={800} height={800} />
        <ParametricEquationSmoke width={800} height={800} />
        <ParametricEquationSplat width={800} height={800} />
        <ParametricEquationFireyButterFly width={800} height={800} />
        <ParametricEquationSpirals width={800} height={800} />
    </div>
}

