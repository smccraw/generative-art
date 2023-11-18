import { StraightCircle, MechanicalBloom2} from "../simulations/Spirographs"
import { FlourishB } from "../simulations/Flourishes"

export function TestBedPage() {
    return <div className="page-content">
        Test Bed Page

        <FlourishB width={800} height={800} />
        {/* <ThreeCanvas width={800} height={800} onCreateScene={createScene} background={'#ffffff'}/> */}
    </div>
}
