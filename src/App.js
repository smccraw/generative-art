import './App.scss';
import { RecoilRoot } from 'recoil';
import {BrowserRouter as Router,Routes,Route,NavLink} from "react-router-dom";
import { HomePage } from './pages/HomePage';
import { TestBedPage } from './pages/TestBedPage';
import { AttractorsPage } from './pages/AttractorsPage';
import { HarmonographsPage } from './pages/HarmonographsPage';
import { ParametricEqPage } from './pages/ParametricEqsPage';
import { LineArtPage } from './pages/LineArtPage';
import { WigglesPage } from './pages/WigglesPage';
import { AutoBotsPage } from './pages/AutoBotsPage';
import { FinishedPage } from './pages/FinishedPage';

function App() {
  return (
    <RecoilRoot>
      <Router>
        <div className="App">
          <div className='navBar'>
            <div className='navLink'><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink></div>
            <div className='navLink'><NavLink to="/lineart" className={({ isActive }) => isActive ? 'active' : ''}>Lines</NavLink></div> 
            <div className='navLink'><NavLink to="/wiggles" className={({ isActive }) => isActive ? 'active' : ''}>Wiggles</NavLink></div> 
            <div className='navLink'><NavLink to="/parametrics" className={({ isActive }) => isActive ? 'active' : ''}>Parametric Eqs</NavLink></div> 
            <div className='navLink'><NavLink to="/attractors" className={({ isActive }) => isActive ? 'active' : ''}>Attractors</NavLink></div> 
            <div className='navLink'><NavLink to="/harmonographs" className={({ isActive }) => isActive ? 'active' : ''}>Harmonographs</NavLink></div> 
            <div className='navLink'><NavLink to="/autobots" className={({ isActive }) => isActive ? 'active' : ''}>AutoBots</NavLink></div> 
            <div className='navLink'><NavLink to="/finished" className={({ isActive }) => isActive ? 'active' : ''}>Finished</NavLink></div> 
            {/* <div className='navLink'><NavLink to="/testbed" className={({ isActive }) => isActive ? 'active' : ''}>Testing</NavLink></div>  */}
          </div>
          <div className="content-body">
            <Routes>
              <Route path="/autobots" element={<AutoBotsPage />} />
              <Route path="/wiggles" element={<WigglesPage />} />
              <Route path="/lineart" element={<LineArtPage />} />
              <Route path="/parametrics" element={<ParametricEqPage />} />
              <Route path="/attractors" element={<AttractorsPage />} />
              <Route path="/harmonographs" element={<HarmonographsPage />} />
              <Route path="/finished" element={<FinishedPage />} />
              <Route path="/testbed" element={<TestBedPage />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </RecoilRoot>
  );
}

export default App;
