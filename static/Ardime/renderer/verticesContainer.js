class VerticesContainer {
    /* @param { number, number } */
    constructor(_maxAttributes, _maxIndices) {
        this.m_indexBuffer = new IndicesArray(_maxIndices);

        this.m_attributesArr = new AttributeArray(_maxAttributes);
    }

    empty() {
        return this.m_indexBuffer.getCount() == 0;
    }

    /* @param {Shader} */
    setShader(_shader) {
		_shader.bind();

        const attributes = _shader.getAttributesList();
        this.m_attributesArr.clear();
        this.m_attributesArr.resetAttribDetails();

        for(const attrib of attributes)
            this.m_attributesArr.setAttribDetails(attrib.name, attrib.offset, attrib.size);
    }

    clear() {
        this.m_attributesArr.clear();
        this.m_indexBuffer.clear();
    }

    /* @param { vertices[] } */
    /* vertices [{ *attribute*: *data* }] */
    appendShape(_shape) {
        // check if the containers have enough space
        if(!this.m_indexBuffer.validateSize(_shape.length))
            return false;
        if(!this.m_attributesArr.validateSize(_shape.length))
            return false;
        
        // add the attributes
        for(const vertex of _shape) {
            const success = this.m_attributesArr.insert(vertex);
            if(!success)
                throw new Error("Invalid data");
        }

        //add index buffer
        let indices_counter = 0;
        const indices = new Uint16Array(3 * _shape.length - 6);
        for(let i=2;i<_shape.length;i++) {
            indices[indices_counter    ] = 0;
            indices[indices_counter + 1] = i - 1;
            indices[indices_counter + 2] = i;

            indices_counter += 3;
        }
        this.m_indexBuffer.insert(indices, _shape.length);

        return true;
    }

    getAllAttributes() {
        return this.m_attributesArr;
    }

    getIndicesBuffer() {
        return this.m_indexBuffer;
    }
}

class IndicesArray extends Uint16Array {
    /* @param { number } */
    constructor(_size) {
        super(_size);
        this.m_counter = 0;
        this.m_totalVertexCount = 0;
    }

    clear() {
        this.m_counter = 0;
        this.m_totalVertexCount = 0;
    }

    /* @param { Uint16Array, number } */
    insert(_data, _vertexCount) {
        if(this.m_counter + _data.length > super.length)
            return false;
        
        const modified_data = [..._data];
        for(const i in modified_data) {
            modified_data[i] = modified_data[i] + this.m_totalVertexCount;
        }

        super.set(modified_data, this.m_counter);
        this.m_counter += _data.length;

        this.m_totalVertexCount += _vertexCount;

        return true;
    }

    /* @param { number } */
    validateSize(_numOfVertices) {
        const required_size = 3 * _numOfVertices - 6;
        const total_vertex_count = this.m_totalVertexCount + _numOfVertices;
        
        return this.m_counter + required_size <= super.length && total_vertex_count < 0xFFFF;
    }

    getCount() {
        return this.m_counter;
    }
}

class AttributeArray extends Float32Array {
    /* @param { number } */
    constructor(_size) {
        super(_size);
        this.m_contentSize = 0;
        this.m_attribDetails = new Map();
        this.m_vertexLength = 0;
    }

    clear() {
        this.m_contentSize = 0;
    }

    resetAttribDetails() {
        this.m_vertexLength = 0;
        this.m_attribDetails.clear();
    }

    /* @param { string, number, number } */
    setAttribDetails(_name, _offset, _size) {
        this.m_attribDetails.set(_name, { offset: _offset, size: _size });
        this.m_vertexLength += _size;
    }

    /* @param { vertexData{} } */
    /* vertexData { *attribute*: *data* } */
    insert(_vertexData) {
        // validate the vertex data
        for(const key of this.m_attribDetails.keys()) {
            if(_vertexData[key] == undefined)
                return false;
        }

        // store the data
        for(const key of this.m_attribDetails.keys()) {
            const attribute_detail = this.m_attribDetails.get(key);
            super.set(_vertexData[key], this.m_contentSize + attribute_detail.offset);
        }
        this.m_contentSize += this.m_vertexLength;

        return true;
    }

    /* @param { number } */
    validateSize(_vertexCount) {
        return this.m_contentSize + _vertexCount * this.m_vertexLength < super.length;
    }

    /* @param { string } */
    getAttribDetail(_name) {
        return this.m_attribDetails.get(_name);
    }

    getAttribList() {
        return this.m_attribDetails.keys();
    }
}

export {
    VerticesContainer
};
