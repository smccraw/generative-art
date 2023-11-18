import AttractorCanvas from "../simulations/AttractorCanvas"

export function AttractorsPage() {
    return <div className="page-content">
        <h1>Attractors</h1>
        <p>
        In the mathematical field of dynamical systems, an attractor is a set of states toward which a system tends to evolve, 
        for a wide variety of starting conditions of the system (see <a href='https://en.wikipedia.org/wiki/Attractor'>Attractors</a>).
        An attractor is called strange if it has a fractal structure.
        </p>
        <p>
            Unlike parametric equations that move in an iterative fashion and we plot each point in relation to the previous point,
            attractors jump all over the place and instead we look for 'hotspots'. So we rely heavily on how many times the attractor
            visited any particular point instead of the order in which the points were visited. Then we plot those frequencies with colors and/or shading.
        </p>
        <p>
            Because frequency is a key aspect of visualizing an attractor, the number of iterations that you use when generating the image
            will greatly affect what the final image looks like. For that reason we usually run these simulations with millions of iterations,
            which means we do not want to visualize the actual drawing of the image like we've done with many of our other experiments. Even at
            120 frames per second it would take months to fully generate these images.
        </p>
        <hr style={{width: 800}}/>
        <AttractorCanvas width={800} height={800} />
        <br/>
        <h4>Additional References/Reading</h4>
        <a href='https://examples.holoviz.org/attractors/'>PyViz - Attractors in Python</a>
        <a href='https://paulbourke.net/fractals/peterdejong/'>Paul Bourke - Peter de Jong Attractors</a>
        <a href='https://www.architecture-performance.fr/ap_blog/plotting-hopalong-attractor-with-datashader-and-numba/'>Hopalong Attractors</a>
    </div>
}
