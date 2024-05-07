import * as Constants from "../utils/constants.js";
import * as Methods from "../utils/methods.js";

let counter = 1;

class Texture {
    /* @param { string|Uint8Array, properties{}, function } */
    /* properties { smooth: boolean } */
    constructor(_source, _properties, _callback) {
        this.m_texture = null;
        this.properties = processProperties(_properties);
        this.id = counter ++;

        if(typeof _source == "string") {

            const image = new Image();
            image.onload = () => {
                this.properties.width = image.width;
                this.properties.height = image.height;

                const canvas = createCanvasImage(image);
                this.$createWebGLTexture(canvas);
                
                if(typeof _callback == "function") _callback();
            }
            image.src = _source;
            image.setAttribute("crossOrigin", "");

        } else if(_source instanceof Uint8Array) {
            this.properties.width = _properties.width;
            this.properties.height = _properties.height;
            
            const channels = 4;
            const pixel_count = _source.length / channels;
            if(typeof this.properties.width != "number" || typeof this.properties.height != "number")
                throw new Error("[ERROR] Texture missing a width and height property!");
            if(this.properties.width * this.properties.height != pixel_count)
                throw new RangeError("[ERROR] Cannot create texture due to an invalid number of pixels!");

            this.$createWebGLTexture(_source);

        }
    }

    /* @param { number } */
    bind(_textureSlot, a) {
        const gl = Constants.RenderingContext.WebGL;

        gl.activeTexture(gl.TEXTURE0 + _textureSlot);
        gl.bindTexture(gl.TEXTURE_2D, this.m_texture);
    }

    /* @param { Uint8Array|HTMLCanvasElement } */
    $createWebGLTexture(_data) {
        const gl = Constants.RenderingContext.WebGL;

        this.m_texture = gl.createTexture();
        this.bind(0, 1);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.properties.width, this.properties.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, _data);

        const magnification_type = this.properties.smooth ? gl.LINEAR : gl.NEAREST;

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magnification_type);
    }
}

/* @param { Image } */
function createCanvasImage(_image) {
    const canvas = document.createElement("canvas");

    canvas.width = _image.width;
    canvas.height = _image.height;

    const ctx = canvas.getContext("2d");
    ctx.scale(1, -1);
    ctx.drawImage(_image, 0, -canvas.height);

    return canvas;
}

/* @param { properties{} } */
/* properties { smooth: boolean } */
function processProperties(_properties) {
    if(!_properties)
        return null;
    
    const default_options = {
        smooth: true
    };
    return Methods.processOptions(default_options, _properties);
}

export default Texture;
