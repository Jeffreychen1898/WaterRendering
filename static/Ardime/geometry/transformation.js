import * as Constants from "./../utils/constants.js";
import * as Matrices from "./../utils/matrices.js";

function newTransformation() {
	return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}

function translate(_transformation, _x, _y, _z) {
	const translation_matrix = Matrices.translate(_x, _y, _z);
	return Constants.libraries.math.multiply(_transformation, translation_matrix);
}

function rotateX(_transformation, _angle) {
	const rotation_matrix = Matrices.rotateX(_angle);
	return Constants.libraries.math.multiply(_transformation, rotation_matrix);
}

function rotateY(_transformation, _angle) {
	const rotation_matrix = Matrices.rotateY(_angle);
	return Constants.libraries.math.multiply(_transformation, rotation_matrix);
}

function rotateZ(_transformation, _angle) {
	const rotation_matrix = Matrices.rotateZ(_angle);
	return Constants.libraries.math.multiply(_transformation, rotation_matrix);
}

function applyTransformation(_transformation, _point) {
	return Constants.libraries.math.multiply([..._point, 1], _transformation).flat();
}

export {
	newTransformation,
	translate,
	rotateX,
	rotateY,
	rotateZ,
	applyTransformation
};
