import * as Shader from "./shader.js";
import * as Constants from "./../../../utils/constants.js";

class WebGL {
    constructor() {
    }

    /* @param { HTMLCanvasElement } */
    setup(_canvas) {
        const gl = _canvas.getContext("webgl2", {preserveDrawingBuffer: true});
        Constants.RenderingContext.WebGL = gl;

        if(!gl) {
            return false;
        }

		/* enable depth */
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		/* enable blending */
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		/* enable cullface */
		//gl.enable(gl.CULL_FACE);
		//gl.cullFace(gl.FRONT);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        return true;
    }

    /* @param { Shader, VerticesContainer } */
    render(_shader, _verticesContainer) {
        const gl = Constants.RenderingContext.WebGL;

        _shader.setAllAttributes(_verticesContainer.getAllAttributes());
        _shader.setIndicesData(_verticesContainer.getIndicesBuffer());

        _shader.bind();
        gl.drawElements(
            gl.TRIANGLES,
            _verticesContainer.getIndicesBuffer().getCount(),
            gl.UNSIGNED_SHORT,
            0
        );
    }

	/* @param { WEBGL Buffer Bits } */
	clear(_clearBits) {
		Constants.RenderingContext.WebGL.clear(_clearBits);
	}

	getDepthBufferBit() {
		return Constants.RenderingContext.WebGL.DEPTH_BUFFER_BIT;
	}

	getColorBufferBit() {
		return Constants.RenderingContext.WebGL.COLOR_BUFFER_BIT;
	}

	getStencilBufferBit() {
		return Constants.RenderingContext.WebGL.STENCIL_BUFFER_BIT;
	}
}

export {
    WebGL,
    Shader
};
