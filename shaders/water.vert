precision mediump float;

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_projection;

varying vec2 v_texCoord;
varying vec3 v_position;

void main() {
	gl_Position = u_projection * vec4(a_position, 1.0);
	v_texCoord = a_texCoord;
	v_position = a_position;
}
