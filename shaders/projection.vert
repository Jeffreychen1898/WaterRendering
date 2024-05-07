precision mediump float;

attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;

varying vec3 v_fragmentPosition;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_lightPosition;
varying vec3 v_cameraPosition;

void main() {
	gl_Position = u_projection * vec4(a_position, 1.0);
	v_texCoord = a_texCoord;
	v_normal = a_normal;
	v_lightPosition = u_lightPosition;
	v_cameraPosition = u_cameraPosition;
	v_fragmentPosition = a_position;
}
