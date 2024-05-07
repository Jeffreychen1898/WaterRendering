precision mediump float;

varying vec3 v_fragmentPosition;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_lightPosition;
varying vec3 v_cameraPosition;

uniform sampler2D u_texture;
uniform float u_gammaValue;
//uniform vec3 u_lightIntensity; // r: ambient, g: specular, b: shiny

#define PI 3.1415926535
#define EP 0.0000000001

float D(float alpha, vec3 N, vec3 H) {
	float NdotHsq = pow(max(dot(N, H), 0.0), 2.0);
	float alphasq = pow(alpha, 2.0);
	float denominator = PI * pow(NdotHsq * (alphasq - 1.0) + 1.0, 2.0);

	denominator = max(denominator, EP);

	return alphasq / denominator;
}

float G1(float alpha, vec3 N, vec3 X) {
	float NdotX = max(dot(N, X), 0.0);
	float k = alpha / 2.0;
	float denominator = NdotX / (NdotX * (1.0 - k) + k);

	denominator = max(denominator, EP);

	return NdotX / denominator;
}

float G(float alpha, vec3 N, vec3 V, vec3 L) {
	return G1(alpha, N, V) * G1(alpha, N, L);
}

vec3 F(vec3 F0, vec3 V, vec3 H) {
	return (F0 + (vec3(1.0) - F0) * pow(1.0 - max(dot(V, H), 0.0), 5.0));
}

vec3 PDR(vec4 texture_fragment, vec3 halfway_vector, vec3 view_direction, vec3 light_direction, vec3 u_lightIntensity)
{
	vec3 light_color = vec3(1.0, 1.0, 1.0);
	float roughness = u_lightIntensity.r;
	float reflectivity = u_lightIntensity.g;
	float metallic = 0.0;

	vec3 Ks = F(vec3(reflectivity), v_normal, halfway_vector);
	vec3 cookTorrenceNumerator = D(roughness, v_normal, halfway_vector) * G(roughness, v_normal, view_direction, light_direction) * Ks;
	float cookTorrenceDenominator = 4.0 * max(dot(view_direction, v_normal), 0.0) * max(dot(light_direction, v_normal), 0.0);
	cookTorrenceDenominator = max(cookTorrenceDenominator, EP);

	vec3 cookTorrence = cookTorrenceNumerator / cookTorrenceDenominator;
	vec3 lambert = texture_fragment.rgb / PI;
	vec3 Kd = (vec3(1.0) - Ks) * (vec3(1.0) - metallic);

	vec3 BRDF = Kd * lambert + cookTorrence;

	return BRDF * light_color * max(dot(light_direction, v_normal), 0.0);
}

void main() {
	vec3 u_lightIntensity = vec3(1.0, 0.0, 0.0);
	/* define variables */
	vec4 gamma_correction = vec4(vec3(1.0 / u_gammaValue), 1.0);
	vec4 undo_gamma_correction = vec4(vec3(u_gammaValue), 1.0);

	//vec3 light_direction = max(normalize(v_lightPosition - v_fragmentPosition), 0.0);
	vec3 light_direction = normalize(vec3(0.0, 1.0, 1.0));
	vec3 view_direction = max(normalize(v_cameraPosition - v_fragmentPosition), 0.0);
	//vec3 light_reflection_direction = reflect(-light_direction, v_normal);
	vec3 halfway_vector = max(normalize(light_direction + view_direction), 0.0);

	/* retrieve texture fragment */
	vec4 texture_fragment = pow(texture2D(u_texture, v_texCoord), undo_gamma_correction);

	vec3 ambient = texture_fragment.rgb * 0.2;

	vec3 fragment_color = ambient + PDR(texture_fragment, halfway_vector, view_direction, light_direction, u_lightIntensity);

	vec3 exposure = vec3(u_lightIntensity.b);
	fragment_color = vec3(1.0) - exp(-exposure * fragment_color);

	gl_FragColor = pow(vec4(fragment_color, 1.0), gamma_correction);
}
