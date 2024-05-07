import * as Constants from "./../utils/constants.js";
import * as Matrices from "./../utils/matrices.js";
import UniformContainer from "./uniformContainers.js";

class Camera2d {
    /* @param { number, number } */
    /* @param { number, number, number, number } */
    /* @param { number, number, number, number, number } */
    constructor(..._params) {
        this.m_camera = {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
			rotation: 0,
            near: 0,
            far: -1
        };
		this.m_baseProjection = null;
        if(_params.length == 2) {

            this.m_camera.width = _params[0];
            this.m_camera.height = _params[1];

        } else if(_params.length == 4) {

            this.m_camera.x = _params[0];
            this.m_camera.y = _params[1];
            this.m_camera.width = _params[2];
            this.m_camera.height = _params[3];

        } else if(_params.length == 5) {
            
            this.m_camera.x = _params[0];
            this.m_camera.y = _params[1];
            this.m_camera.width = _params[2];
            this.m_camera.height = _params[3];
            this.m_camera.far = _params[4];
        }

        this.m_uniformContainer = new UniformContainer(Constants.UniformTypes.Matrix4, null);

        this.m_cameraMatrix = null;
        this.createMatrix();
    }

	setBaseProjection(_matrix) {
		this.m_baseProjection = _matrix;
	}

    getUniformContainer() {
        return this.m_uniformContainer;
    }

    createMatrix() {
        const x = this.m_camera.x;
        const y = this.m_camera.y;
        const w = this.m_camera.width;
        const h = this.m_camera.height;
		const n = this.m_camera.near;
		const f = this.m_camera.far;

        let projection_matrix = Matrices.projection2d(-w / 2, w / 2, -h / 2, h / 2, n, f);
		if(this.m_baseProjection != null)
			projection_matrix = Constants.libraries.math.multiply(this.m_baseProjection, projection_matrix);
		const z_rotation_matrix = Matrices.rotateZ(-this.m_camera.rotation);
		const translation_matrix = Matrices.translate(-x, -y, 0);

		this.m_cameraMatrix = Constants.libraries.math.multiply(translation_matrix, z_rotation_matrix);
		this.m_cameraMatrix = Constants.libraries.math.multiply(this.m_cameraMatrix, projection_matrix);

        this.m_uniformContainer.set(this.m_cameraMatrix);
    }

    /* @param { number, number } */
    move(_x, _y) {
        this.m_camera.x += _x;
        this.m_camera.y += _y;
    }

    /* @param { number, number } */
    setPosition(_x, _y) {
        this.m_camera.x = _x;
        this.m_camera.y = _y;
    }

	/* @param { number, number } */
	setNearFar(_near, _far) {
		this.m_camera.near = _near;
		this.m_camera.far = _far;
	}

    /* @param { number, number } */
    resize(_w, _h) {
        this.m_camera.width = _w;
        this.m_camera.height = _h;
    }

	setAngle(_angle) {
		this.m_camera.rotation = _angle;
	}

	rotateAngle(_angle) {
		this.m_camera.rotation += _angle;
	}

	getPosition() {
		return {
			x: this.m_camera.x,
			y: this.m_camera.y
		};
	}

	getSize() {
		return {
			width: this.m_camera.width,
			height: this.m_camera.height
		};
	}

	getX() {
		return this.m_camera.x;
	}

	getY() {
		return this.m_camera.y;
	}

	getWidth() {
		return this.m_camera.width;
	}

	getHeight() {
		return this.m_camera.height;
	}

	getNear() {
		return this.m_camera.near;
	}

	getFar() {
		return this.m_camera.far;
	}

	getAngle() {
		return this.m_camera.rotation;
	}

    getMatrix() {
        return this.m_cameraMatrix;
    }
}

export default Camera2d;
