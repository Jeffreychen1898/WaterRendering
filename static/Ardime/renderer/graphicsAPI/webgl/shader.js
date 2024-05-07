import * as Constants from "./../../../utils/constants.js";

let shaderIdCounter = 0;

class Shader {
    /* @param { string, string, attributes[], uniforms[] } */
    /* attributes [{ name: string, size: number }] */
    /* uniforms [{ name: string, value: UniformContainer }] */
    constructor(_vertexCode, _fragmentCode, _attributes, _uniforms) {
        this.id = shaderIdCounter;
        ++ shaderIdCounter;

        this.m_indexBuffer = null;
        this.m_vertexArray = null;
        this.m_attributeDetails = new Map();
        
        this.m_uniformContainers = [];

        this.m_program = createProgram(_vertexCode, _fragmentCode);
		this.bind();
        
        this.$setupAttributes(_attributes);
        if(_uniforms) this.$setupUniforms(_uniforms);
        this.$setupIndexBuffer();
    }

    getAttributesList() {
        const result = new Array(this.m_attributeDetails.size);
        let counter = 0;
        for(const attribute of this.m_attributeDetails.keys()) {
            const attribute_details = this.m_attributeDetails.get(attribute);
            result[counter] = {
                name: attribute,
                size: attribute_details.size,
                offset: attribute_details.offset
            };

            ++ counter;
        }

        return result;
    }

    bind() {
        const gl = Constants.RenderingContext.WebGL;

        gl.useProgram(this.m_program);
        gl.bindVertexArray(this.m_vertexArray);
    }

    /* @param { String, Float32Array } */
    setAttributeData(_attributeName, _data) {
        const gl = Constants.RenderingContext.WebGL;

        if(this.m_attributeDetails.has(_attributeName)) {
            this.bind();
            const vbo = this.m_attributeDetails.get(_attributeName).bufferObject;

            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, _data, gl.DYNAMIC_DRAW);
        } else {
            console.error(`[ERROR] Attribute "${_attributeName}" Cannot Be Found!`);
        }
    }

    /* @param { VerticesContainer } */
    setAllAttributes(_attributes) {
        for(const attribute of _attributes.getAttribList())
            this.setAttributeData(attribute, _attributes);
    }

    updateUniforms() {
        for(const uniform of this.m_uniformContainers) {
            if(!uniform.uniform.isUpdated(this.id)) {
                this.$setUniformData(uniform);
            }
        }
    }

    uniformIsUpdated() {
        for(const uniform of this.m_uniformContainers) {
            if(!uniform.uniform.isUpdated(this.id))
                return false;
        }

        return true;
    }

    /* @param { Array } */
    setIndicesData(_data) {
        const gl = Constants.RenderingContext.WebGL;

        this.bind();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.m_indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_data), gl.DYNAMIC_DRAW);
    }

    /* @private */
    /* @param { UniformContainer } */
    $setUniformData(_uniformContainer) {
        const gl = Constants.RenderingContext.WebGL;

        const data = _uniformContainer.uniform.getData();
        const location = _uniformContainer.location;
        switch(_uniformContainer.uniform.getType()) {
            case Constants.UniformTypes.Integer:
                gl.uniform1i(location, data);
                break;
            case Constants.UniformTypes.Float:
                gl.uniform1f(location, data);
                break;
            case Constants.UniformTypes.Vector2:
                gl.uniform2f(location, data[0], data[1]);
                break;
            case Constants.UniformTypes.Vector3:
                gl.uniform3f(location, data[0], data[1], data[2]);
                break;
            case Constants.UniformTypes.Vector4:
                gl.uniform4f(location, data[0], data[1], data[2], data[3]);
                break;
            case Constants.UniformTypes.Matrix4:
                gl.uniformMatrix4fv(location, gl.FALSE, new Float32Array(data.flat()));
                break;
            case Constants.UniformTypes.IntegerArray:
                gl.uniform1iv(location, data);
                break;
        }
    }

    $setupIndexBuffer() {
        const gl = Constants.RenderingContext.WebGL;

        this.m_indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.m_indexBuffer);
    }

    /* { name: string, size: number } */
    $setupAttributes(_attributes) {
        const gl = Constants.RenderingContext.WebGL;

        this.m_vertexArray = gl.createVertexArray();
        gl.bindVertexArray(this.m_vertexArray);

        let vertex_size = 0;
        for(const attribute of _attributes)
            vertex_size += attribute.size;

        let offset_counter = 0;
        for(const attribute of _attributes) {
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

            const attribute_location = gl.getAttribLocation(this.m_program, attribute.name);
            this.m_attributeDetails.set(attribute.name, {size: attribute.size, bufferObject: vbo, offset: offset_counter});

            gl.vertexAttribPointer(attribute_location,
                attribute.size,
                gl.FLOAT,
                gl.FALSE,
                vertex_size * Float32Array.BYTES_PER_ELEMENT,
                offset_counter * Float32Array.BYTES_PER_ELEMENT
            );
            gl.enableVertexAttribArray(attribute_location);

            offset_counter += attribute.size;
        }
    }

	/* @param {uniforms[]} */
    /* uniforms [{ name: string, value: UniformContainer }] */
    $setupUniforms(_uniforms) {
        const gl = Constants.RenderingContext.WebGL;

        for(const uniform of _uniforms) {
            const location = gl.getUniformLocation(this.m_program, uniform.name)
			uniform.value.connect(this);
            this.m_uniformContainers.push({ location: location, uniform: uniform.value });
        }
    }
}

/* @param { string, string } */
function createProgram(_vertexCode, _fragmentCode) {
    const gl = Constants.RenderingContext.WebGL;

    const vertex_shader = createShaderProgram(_vertexCode, gl.VERTEX_SHADER);
    const fragment_shader = createShaderProgram(_fragmentCode, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();

    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(`ERROR linking program! ${gl.getProgramInfoLog(program)}`);
    }

    //expensive :(
    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error(`ERROR validating program! ${gl.getProgramInfoLog(program)}`);
    }

    return program;
}

/* @param { string, gl_shader_type } */
function createShaderProgram(_shaderCode, _type) {
    const gl = Constants.RenderingContext.WebGL;

    const shader = gl.createShader(_type);
    gl.shaderSource(shader, _shaderCode);

    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`ERROR compiling shader! ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
}

export {
    Shader
};
