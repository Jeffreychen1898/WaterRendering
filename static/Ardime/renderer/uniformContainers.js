class UniformContainer {
    /* @param { number | Array } */
    constructor(_uniformType, _data) {
        this.m_uniformType = _uniformType;
        this.m_shaders = new Map();
        this.m_data = _data;
    }

    /* @param { Shader } */
    connect(_shader) {
        if(this.m_shaders.has(_shader.id))
            return;

        this.m_shaders.set(_shader.id, false);
    }

    /* @param { number | Array } */
    set(_data) {
        this.m_data = _data;
        for(const k of this.m_shaders.keys())
            this.m_shaders.set(k, false);
    }

    getType() {
        return this.m_uniformType;
    }

    getData() {
        return this.m_data;
    }

    /* @param { number } */
    uniformUpdated(_shaderId) {
        this.m_shaders.set(_shaderId, true);
    }

    /* @param { number } */
    isUpdated(_shaderId) {
        return this.m_shaders.get(_shaderId);
    }
}

export default UniformContainer;
