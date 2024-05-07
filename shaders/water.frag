precision mediump float;

varying vec2 v_texCoord;
varying vec3 v_position;

uniform sampler2D u_underwaterTexture;
uniform sampler2D u_skyTexture;
uniform sampler2D u_dudvTexture;
uniform sampler2D u_normalTexture;

uniform vec3 u_cameraPosition;
uniform vec3 u_lightPosition;
uniform float u_movement;
uniform float u_gammaValue;
uniform vec4 u_waterLighting; // r: roughness, g: metallic, b: reflectivity, a: ambient

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
	float denominator = (NdotX * (1.0 - k) + k);

	denominator = max(denominator, EP);

	return NdotX / denominator;
}

float G(float alpha, vec3 N, vec3 V, vec3 L) {
	return G1(alpha, N, V) * G1(alpha, N, L);
}

vec3 F(vec3 F0, vec3 V, vec3 H) {
	return (F0 + (1.0 - F0) * pow(1.0 - max(dot(V, H), 0.0), 5.0));
}

vec3 PBR(vec3 albedo, vec3 halfway, vec3 view, vec3 light, vec3 normal)
{
	float roughness = u_waterLighting.r;
	float reflectivity = u_waterLighting.b;
	float metallic = u_waterLighting.g;

	vec3 ks = F(vec3(reflectivity), view, halfway);
	vec3 kd = (1.0 - ks) * (1.0 - metallic);

	float term_d = D(roughness * roughness, normal, halfway);
	float term_g = G(roughness * roughness, normal, view, light);
	float cook_torrence_numerator = term_d * term_g;
	float cook_torrence_denominator = 4.0 * max(dot(view, normal), 0.0) * max(dot(view, normal), 0.0);
	cook_torrence_denominator = max(cook_torrence_denominator, EP);

	float cook_torrence = cook_torrence_numerator / cook_torrence_denominator;
	vec3 lambert = albedo.rgb / PI;

	return kd * lambert + cook_torrence * ks;
}

void main() {
	/* calculate water normal */
	vec4 normal_map = texture2D(u_normalTexture, v_texCoord + vec2(u_movement, 0.0));
	normal_map = normal_map + texture2D(u_normalTexture, vec2(-v_texCoord.x + u_movement, v_texCoord.y + u_movement));
	normal_map.rg = normal_map.rg * 2.0 - 1.0;
	vec3 normal = normalize(normal_map.rgb);

	/* define variables */
	float sky_height = 800.0;
	float inv_gamma_value = 1.0 / u_gammaValue;
	vec2 underwater_texcoord = v_texCoord;

	vec3 light_direction = normalize(u_lightPosition - v_position);
	vec3 view_direction = normalize(u_cameraPosition - v_position);
	vec3 reflect_view_dir = reflect(vec3(0.0, 0.0, -1.0), normal);

	/* TEMPORARY: calculate sky reflection texture coordinate */
	/* Once I start using fbo, I will do reflection on a different shader */
	vec2 sky_relative_position = length(v_position - u_cameraPosition) * reflect_view_dir.xy;
	vec2 sky_position = sky_relative_position + v_position.xy;
	vec2 sky_texcoord = (sky_position + vec2(2000.0, 2000.0)) / 4000.0;

	/* get the pixels */
	//vec4 refract_pixel = pow(texture2D(u_underwaterTexture, underwater_texcoord), undo_gamma_correction);
	vec3 reflect_pixel = pow(texture2D(u_skyTexture, sky_texcoord).rgb, vec3(u_gammaValue));

	//float reflect_refract_mix = pow(abs(dot(normalize(u_cameraPosition - v_position), normal)), u_waterRefraction.x);
	//reflect_refract_mix = min(reflect_refract_mix, u_waterRefraction.y);
	
	vec3 halfway_vector = normalize(view_direction + light_direction);

	/* calculate lighting */
	vec3 ambient = vec3(u_waterLighting.a);
	vec3 pbr_lighting = ambient + PBR(vec3(1.0), halfway_vector, view_direction, light_direction, normal);
	//vec3 col = ambient + PDR(reflect_pixel, light_camera_avg_direction, camera_direction, light_direction, normal);
	vec3 col = reflect_pixel * pbr_lighting;

	//gl_FragColor = mix(reflect_pixel, refract_pixel, reflect_refract_mix);
	//gl_FragColor = mix(gl_FragColor, vec4(light_color, 1.0), u_waterLighting.r) + vec4(specular_light, 0.0);
	//vec3 exposure = vec3(u_waterLighting.b);
	//col = vec3(1.0) - exp(-exposure * col);
	gl_FragColor = vec4(col, 1.0);
	gl_FragColor = pow(gl_FragColor, vec4(vec3(inv_gamma_value), 1.0));
}
