import React from "react"
import get from "lodash.get"
import forEach from "lodash.foreach"
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class ThreeCanvas extends React.Component {
    constructor(props) {
        super(props)
        this.canvasRef = React.createRef();
        this.width = get(props, 'width', 400)
        this.height = get(props, 'height', 400)

        this.animFn = this.animate.bind(this)
    }

    animate() {
        requestAnimationFrame(this.animFn);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    componentDidMount() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.canvasRef.current.appendChild(this.renderer.domElement);

        if (this.props.onCreateScene) {
            let outObjects = this.props.onCreateScene(this.renderer, this.width, this.height, this.props)
            this.scene = outObjects.scene
            this.camera = outObjects.camera
        }

        if (this.camera) {
            const controls = new OrbitControls(this.camera, this.renderer.domElement);
        }
        this.animate()
    }

    render() {
        return <div className='p5-canvas-holder' ref={this.canvasRef}></div>
    }
}