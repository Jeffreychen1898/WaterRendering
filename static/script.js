//import * as Ardime from "/Ardime/index.js";

const MAP = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
	[1, 1, 1, 2, 2, 1, 1, 1, 1, 1],
	[1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
	[1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
	[1, 1, 1, 2, 2, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const MOVE_SPEED = 10;
const ROTATE_SPEED = 0.1;
const DEFAULT_WATER_MOVEMENT_SPEED = 1;
const DEFAULT_LIGHT_HEIGHT = 1000;
const DEFAULT_CAMERA_HEIGHT = 200;
const DEFAULT_GAMMA_VALUE = 2.2;
const DEFAULT_LIGHT_POSITION = { x: 800, y: 800 };

const DEFAULT_WATER_LIGHTING = [0.5, 0.3, 1.0, 0.2];

const TOTAL_LOAD_CONTENT = 10;

let camera_height = DEFAULT_CAMERA_HEIGHT;
let light_height = DEFAULT_LIGHT_HEIGHT;
let water_movement_speed = DEFAULT_WATER_MOVEMENT_SPEED;

let cube_top_image = null;
let cube_side_image = null;
let underwater_image = null;
let sky_image = null;
let water_dudv_map = null;
let water_normal_map = null;
let loaded_counter;

let projection_shader = null;
let water_shader = null;
let projection_shader_code = {fragment: "", vertex: ""};
let water_shader_code = {fragment: "", vertex: ""};

let uniform_light_position = null;
let uniform_camera_position = null;
let uniform_gamma_value = null;
let uniform_water_lighting = null;
let uniform_water_movement = null;

let water_movement = 0;

let keyset = null;
let renderer = null;
let performance = new Ardime.Performance();

window.onload = () => {
	// setup the movement controls
	keyset = new Set();
	document.addEventListener("keydown", keyPressed);
	document.addEventListener("keyup", keyReleased);
	
	// setup the renderer
	const renderer_config = {
		canvas: "canvas",
		width: 800,
		height: 600
	};

	Ardime.useLibrary("mathjs", math);
	renderer = new Ardime.Renderer(renderer_config);

	// set the camera to support 2.5d
	renderer.getCamera().setNearFar(1000, -1000);
	renderer.getCamera().setBaseProjection([
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, -1, -1, 0],
		[0, 0, 0, 1],
	]);

	// set uniform variables
	uniform_light_position = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Vector3,
		[DEFAULT_LIGHT_POSITION.x, DEFAULT_LIGHT_POSITION.y,
		light_height]
	);
	uniform_camera_position = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Vector3,
		[renderer.getCamera().getX(), renderer.getCamera().getY(),
		camera_height]
	);
	uniform_gamma_value = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Float,
		DEFAULT_GAMMA_VALUE
	);
	uniform_water_movement = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Float,
		water_movement
	);
	uniform_water_lighting = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Vector4,
		DEFAULT_WATER_LIGHTING
	);
	/*uniform_light_intensity = new Ardime.UniformContainer(
		Ardime.Const.UniformTypes.Vector3,
		DEFAULT_LIGHT_VALUES
	);*/

	// uniform variable controls
	setupEventListeners();
	setupSliderElements();

	// load images
	loaded_counter = 0;
	cube_top_image = new Ardime.Image("/top.png", {smooth: false}, loadingCallback);
	cube_side_image = new Ardime.Image("/side.png", {smooth: false}, loadingCallback);
	underwater_image = new Ardime.Image("underwater.png", {smooth: true}, loadingCallback);
	sky_image = new Ardime.Image("sky.jpeg", {smooth: true}, loadingCallback);
	water_dudv_map = new Ardime.Image("water_dudv.jpeg", {smooth: true}, loadingCallback);
	water_normal_map = new Ardime.Image("water_normal.jpeg", {smooth: true}, loadingCallback);

	// load shaders
	loadShader("/shaders/projection.vert", (result) => { projection_shader_code.vertex = result }, loadingCallback);
	loadShader("/shaders/projection.frag", (result) => { projection_shader_code.fragment = result }, loadingCallback);

	loadShader("/shaders/water.vert", (result) => { water_shader_code.vertex = result }, loadingCallback);
	loadShader("/shaders/water.frag", (result) => { water_shader_code.fragment = result }, loadingCallback);
}

function render() {

	renderer.clear({ depth: true });

	// render the map
	renderMap();

	// render the water
	renderWater();

	renderer.flush();
}

function renderWater() {
	renderer.bindTexture(underwater_image, 0);
	renderer.bindTexture(sky_image, 1);
	renderer.bindTexture(water_dudv_map, 2);
	renderer.bindTexture(water_normal_map, 3);
	const water_shape = renderer.draw.shape.new();
	renderer.draw.shape.vertex(water_shape, {
		a_position: [-500, -500, -1],
		a_texCoord: [0, 1]
	}, true);
	renderer.draw.shape.vertex(water_shape, {
		a_position: [1500, -500, -1],
		a_texCoord: [1, 1]
	}, true);
	renderer.draw.shape.vertex(water_shape, {
		a_position: [1500, 1500, -1],
		a_texCoord: [1, 0]
	}, true);
	renderer.draw.shape.vertex(water_shape, {
		a_position: [-500, 1500, -1],
		a_texCoord: [0, 0]
	}, true);
	renderer.draw.shape.draw(water_shape, water_shader);
}

function renderMap() {
	for(let i=0;i<MAP.length;++i) {
		for(let j=0;j<MAP[i].length;++j) {
			if(MAP[i][j] == 0)
				continue;
			if(MAP[i][j] == 1) {
				renderTileTop(j * 100, i * 100, 0);
				continue;
			}
			// render the top
			renderTileTop(j * 100, i * 100, 100);
			// render the back
			if(i == 0 || MAP[i - 1][j] != 2)
				renderTileFront(j * 100, i * 100, -1);
			// render the front
			if(i == MAP.length - 1 || MAP[i + 1][j] != 2)
				renderTileFront(j * 100, i * 100 + 100, 1);
			// render the left
			if(j == 0 || MAP[i][j - 1] != 2)
				renderTileLeft(j * 100, i * 100, -1);
			// render the right
			if(j == MAP[i].length - 1 || MAP[i][j + 1] != 2)
				renderTileLeft(j * 100 + 100, i * 100, 1);
		}
	}
}

function renderTileTop(x, y, z) {
	renderer.bindTexture(cube_top_image, 0);
	const test_shape = renderer.draw.shape.new();
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y+100, z],
		a_texCoord: [0, 0],
		a_normal: [0, 0, 1]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x+100, y+100, z],
		a_texCoord: [1, 0],
		a_normal: [0, 0, 1]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x+100, y, z],
		a_texCoord: [1, 1],
		a_normal: [0, 0, 1]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y, z],
		a_texCoord: [0, 1],
		a_normal: [0, 0, 1]
	}, true);

	renderer.draw.shape.draw(test_shape, projection_shader);
}

function renderTileFront(x, y, n) {
	renderer.bindTexture(cube_side_image, 0);
	const test_shape = renderer.draw.shape.new();
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y, 0],
		a_texCoord: [0, 0],
		a_normal: [0, n, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x+100, y, 0],
		a_texCoord: [1, 0],
		a_normal: [0, n, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x+100, y, 100],
		a_texCoord: [1, 1],
		a_normal: [0, n, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y, 100],
		a_texCoord: [0, 1],
		a_normal: [0, n, 0]
	}, true);

	renderer.draw.shape.draw(test_shape, projection_shader);
}

function renderTileLeft(x, y, n) {
	renderer.bindTexture(cube_side_image, 0);
	const test_shape = renderer.draw.shape.new();
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y, 0],
		a_texCoord: [0, 0],
		a_normal: [n, 0, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y+100, 0],
		a_texCoord: [1, 0],
		a_normal: [n, 0, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y+100, 100],
		a_texCoord: [1, 1],
		a_normal: [n, 0, 0]
	}, true);
	renderer.draw.shape.vertex(test_shape, {
		a_position: [x, y, 100],
		a_texCoord: [0, 1],
		a_normal: [n, 0, 0]
	}, true);

	renderer.draw.shape.draw(test_shape, projection_shader);
}

function update() {
	performance.stop();
	//console.log(1 / performance.getElapsedTime(Ardime.Const.Time.Seconds));
	performance.start();

	// camera controls
	const camera_angle = renderer.getCamera().getAngle();
	
	if(keyset.has(65)) // move left
		renderer.getCamera().move(-Math.cos(camera_angle) * MOVE_SPEED, -Math.sin(camera_angle) * MOVE_SPEED);
	if(keyset.has(68)) // move right
		renderer.getCamera().move(Math.cos(camera_angle) * MOVE_SPEED, Math.sin(camera_angle) * MOVE_SPEED);
	if(keyset.has(87)) // move up
		renderer.getCamera().move(Math.sin(camera_angle) * MOVE_SPEED, -Math.cos(camera_angle) * MOVE_SPEED);
	if(keyset.has(83)) // move down
		renderer.getCamera().move(-Math.sin(camera_angle) * MOVE_SPEED, Math.cos(camera_angle) * MOVE_SPEED);

	if(keyset.has(69)) // turn clockwise
		renderer.getCamera().rotateAngle(ROTATE_SPEED);
	if(keyset.has(81)) // turn counterclockwise
		renderer.getCamera().rotateAngle(-ROTATE_SPEED);

	if(keyset.has(9)) // tab
		renderer.getCamera().setAngle(0);

	renderer.getCamera().createMatrix();

	// move the water
	water_movement += 0.001 * water_movement_speed;
	water_movement %= 1 * water_movement_speed;
	uniform_water_movement.set(water_movement);

	// update camera position
	//uniform_camera_position.set([renderer.getCamera().getX(), renderer.getCamera().getY(), camera_height]);
	uniform_camera_position.set([renderer.getCamera().getX(), renderer.getCamera().getY() + 400, camera_height]);
	uniform_light_position.set([ DEFAULT_LIGHT_POSITION.x, DEFAULT_LIGHT_POSITION.y, light_height ]);
}

function keyPressed(e) {
	if(!keyset.has(e.keyCode))
		keyset.add(e.keyCode);

	if(e.keyCode == 9)
		e.preventDefault();
}

function keyReleased(e) {
	if(keyset.has(e.keyCode))
		keyset.delete(e.keyCode);

	if(e.keyCode == 9)
		e.preventDefault();
}

function loadingCallback() {
	++ loaded_counter
	if(loaded_counter == TOTAL_LOAD_CONTENT) {
		
		// create uniform containers
		const texture_uniform_container = new Ardime.UniformContainer(Ardime.Const.UniformTypes.Integer, 0);
		const texture_uniform_container2 = new Ardime.UniformContainer(Ardime.Const.UniformTypes.Integer, 1);
		const texture_uniform_container3 = new Ardime.UniformContainer(Ardime.Const.UniformTypes.Integer, 2);
		const texture_uniform_container4 = new Ardime.UniformContainer(Ardime.Const.UniformTypes.Integer, 3);

		// compile shaders
		projection_shader = renderer.create.shader(
			projection_shader_code.vertex,
			projection_shader_code.fragment,
			[
				{ name: "a_position", size: 3 },
				{ name: "a_texCoord", size: 2 },
				{ name: "a_normal", size: 3 }
			],
			[
				{ name: "u_projection", value: renderer.getCamera().getUniformContainer() },
				{ name: "u_texture", value: texture_uniform_container },
				{ name: "u_lightPosition", value: uniform_light_position },
				{ name: "u_cameraPosition", value: uniform_camera_position },
				{ name: "u_gammaValue", value: uniform_gamma_value }
				//{ name: "u_lightIntensity", value: uniform_light_intensity }
			]
		);

		water_shader = renderer.create.shader(
			water_shader_code.vertex,
			water_shader_code.fragment,
			[
				{ name: "a_position", size: 3 },
				{ name: "a_texCoord", size: 2 }
			],
			[
				{ name: "u_projection", value: renderer.getCamera().getUniformContainer() },
				{ name: "u_underwaterTexture", value: texture_uniform_container },
				{ name: "u_skyTexture", value: texture_uniform_container2 },
				{ name: "u_dudvTexture", value: texture_uniform_container3 },
				{ name: "u_normalTexture", value: texture_uniform_container4 },
				{ name: "u_cameraPosition", value: uniform_camera_position },
				{ name: "u_lightPosition", value: uniform_light_position },
				{ name: "u_movement", value: uniform_water_movement },
				{ name: "u_gammaValue", value: uniform_gamma_value },
				{ name: "u_waterLighting", value: uniform_water_lighting }
			]
		);

		gameloop();
	}
}

function gameloop() {

	render();
	update();

	requestAnimationFrame(gameloop);

}

function loadShader(url, setVariable, callback) {
	fetch(url).then(result => result.text()).then((result) => {
		
		if(typeof setVariable == "function")
			setVariable(result);

		if(typeof callback == "function")
			callback();
	});
}

function setupSliderElements() {
	const slider_helper_inputs = document.getElementsByClassName("slider-helper-input");
	for(const each_input of slider_helper_inputs) {
		each_input.addEventListener("keydown", e => sliderHelperInputChange(each_input, e));

		const slider = document.getElementById(each_input.getAttribute("data-slider"));
		slider.addEventListener("change", e => each_input.value = slider.value );
	}

	const slider_tab_nav_btns = document.getElementsByClassName("slider-tab-nav-btn");
	for(const each_button of slider_tab_nav_btns) {
		each_button.addEventListener("click", e => sliderTabNavBtnClick(each_button));
	}

	const trackpads = document.getElementsByClassName("trackpad");
	for(const each_trackpad of trackpads) {
		const trackpad_joystick_x = Number(each_trackpad.getAttribute("data-x")) * 100;
		const trackpad_joystick_y = Number(each_trackpad.getAttribute("data-y")) * 100;

		const children_nodes = each_trackpad.children;
		children_nodes[0].style.left = trackpad_joystick_x + "%";
		children_nodes[0].style.right = trackpad_joystick_y + "%";

		each_trackpad.addEventListener("mousedown", e => each_trackpad.setAttribute("data-mousedown", "true"));
		each_trackpad.addEventListener("mouseup", e => each_trackpad.setAttribute("data-mousedown", "false"));
		each_trackpad.addEventListener("click", (e) => {
			const bounding_rect = each_trackpad.getBoundingClientRect();

			const trackpad_width = each_trackpad.clientWidth;
			const trackpad_height = each_trackpad.clientHeight;
			const mouse_x = e.clientX - bounding_rect.left - document.body.scrollLeft;
			const mouse_y = e.clientY - bounding_rect.top - document.body.scrollTop;

			children_nodes[0].style.left = (100 * mouse_x / trackpad_width) + "%";
			children_nodes[0].style.top = (100 * mouse_y / trackpad_height) + "%";
		});
	}
}

function sliderTabNavBtnClick(elem) {
	const corresponding_tab_id = elem.getAttribute("data-tab");
	if(corresponding_tab_id.length == 0)
		return;

	const get_selected_button = document.getElementsByClassName("selected-nav");
	get_selected_button[0].classList.remove("selected-nav");

	elem.classList.add("selected-nav");

	const get_selected_tab = document.getElementsByClassName("target-tab");
	get_selected_tab[0].classList.remove("target-tab");

	const corresponding_tab = document.getElementById(corresponding_tab_id);
	corresponding_tab.classList.add("target-tab");
}

function sliderHelperInputChange(elem, e) {
	// numbers only
	if(isNaN(Number(elem.value + e.key)) && e.key.length == 1) {
		e.preventDefault()
		return;
	};

	const slider = document.getElementById(elem.getAttribute("data-slider"));
	slider.value = elem.value + e.key;
	// call the slider change function
}

/* add action to the sliders */
function setupEventListeners() {
	setSliderAction("gamma-correction", DEFAULT_GAMMA_VALUE, (elem) => {
		uniform_gamma_value.set(elem.value);
	});
	setSliderAction("water-speed", DEFAULT_WATER_MOVEMENT_SPEED, (elem) => {
		water_movement_speed = elem.value;
	});
	setSliderAction("water-roughness", DEFAULT_WATER_LIGHTING[0], (elem) => {
		const water_metallic = getElementValue("water-metallic");
		const water_reflectivity = getElementValue("water-reflectivity");
		const water_ambient = getElementValue("water-ambient");
		uniform_water_lighting.set([ elem.value, water_metallic, water_reflectivity, water_ambient ]);
	});
	setSliderAction("water-metallic", DEFAULT_WATER_LIGHTING[1], (elem) => {
		const water_roughness = getElementValue("water-roughness");
		const water_reflectivity = getElementValue("water-reflectivity");
		const water_ambient = getElementValue("water-ambient");
		uniform_water_lighting.set([ water_roughness, elem.value, water_reflectivity, water_ambient ]);
	});
	setSliderAction("water-reflectivity", DEFAULT_WATER_LIGHTING[2], (elem) => {
		const water_metallic = getElementValue("water-metallic");
		const water_roughness = getElementValue("water-roughness");
		const water_ambient = getElementValue("water-ambient");
		uniform_water_lighting.set([ water_roughness, water_metallic, elem.value, water_ambient ]);
	});
	setSliderAction("water-ambient", DEFAULT_WATER_LIGHTING[3], (elem) => {
		const water_metallic = getElementValue("water-metallic");
		const water_reflectivity = getElementValue("water-reflectivity");
		const water_roughness = getElementValue("water-roughness");
		uniform_water_lighting.set([ water_roughness, water_metallic, water_reflectivity, elem.value ]);
	});
	setSliderAction("sun-height", DEFAULT_LIGHT_HEIGHT, (elem) => {
		light_height = elem.value;
	});
	/*setSliderAction("water-light-intensity", DEFAULT_WATER_LIGHT_VALUES[1], (elem) => {
		const water_reflectivity = getElementValue("water-reflectivity");
		const water_brightness = getElementValue("water-brightness");
		uniform_water_lighting.set([ water_brightness, elem.value, water_reflectivity ]);
	});
	setSliderAction("water-brightness", DEFAULT_WATER_LIGHT_VALUES[0], (elem) => {
		const water_specular_intensity = getElementValue("water-light-intensity");
		const water_reflectivity = getElementValue("water-reflectivity");
		uniform_water_lighting.set([ elem.value, water_specular_intensity, water_reflectivity ]);
	});
	setSliderAction("water-distortion-factor", DEFAULT_WATER_DISTORTION, (elem) => {
		uniform_water_distortion.set(elem.value);
	});
	setSliderAction("water-max-refraction", DEFAULT_WATER_REFRACTION_MAX, (elem) => {
		const refraction_factor = getElementValue("water-reflection-factor");
		uniform_water_refraction.set([ refraction_factor, elem.value ]);
	});
	setSliderAction("water-reflection-factor", DEFAULT_WATER_REFLECTION_FACTOR, (elem) => {
		const refraction_max = getElementValue("water-max-refraction");
		uniform_water_refraction.set([ elem.value, refraction_max ]);
	});
	setSliderAction("ambient-light-intensity", DEFAULT_LIGHT_VALUES[0], (elem) => {
		const specular_light_intensity = getElementValue("specular-light-intensity");
		const grass_reflectivity = getElementValue("grass-reflectivity");
		uniform_light_intensity.set([ elem.value, specular_light_intensity, grass_reflectivity ]);
	});
	setSliderAction("specular-light-intensity", DEFAULT_LIGHT_VALUES[1], (elem) => {
		const ambient_light_intensity = getElementValue("ambient-light-intensity");
		const grass_reflectivity = getElementValue("grass-reflectivity");
		uniform_light_intensity.set([ ambient_light_intensity, elem.value, grass_reflectivity ]);
	});
	setSliderAction("grass-reflectivity", DEFAULT_LIGHT_VALUES[2], (elem) => {
		const ambient_light_intensity = getElementValue("ambient-light-intensity");
		const specular_light_intensity = getElementValue("specular-light-intensity");
		uniform_light_intensity.set([ ambient_light_intensity, specular_light_intensity, elem.value ]);
	});
	setSliderAction("camera-height", DEFAULT_CAMERA_HEIGHT, (elem) => {
		camera_height = elem.value;
	});*/
}

function setSliderAction(id, val, callback) {
	const elem = document.getElementById(id);
	elem.value = val

	const input_elem = document.getElementById(elem.getAttribute("data-input"));
	input_elem.value = val;

	if(typeof callback == "function")
		elem.addEventListener("change", function() { callback(this); });
}

function getElementValue(id) {
	return document.getElementById(id).value;
}
