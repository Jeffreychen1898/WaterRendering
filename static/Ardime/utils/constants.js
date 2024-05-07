const UniformTypes = {
    Integer: 0,
    Float: 1,
    Vector2: 2,
    Vector3: 3,
    Vector4: 4,
    Matrix4: 5,
    IntegerArray: 6
};

let RenderingContext = {
    WebGL: null
};

/* variables for performance time output type */
const Time = {
    Millisec: 0,
    Seconds: 1,
    Minutes: 2,
    Hours: 3
};

/* ============ do not export out of lib ============ */
const MAX_ATTRIBUTES = 50_000;
const MAX_INDICES = 10_000;

/* variables to access certain libraries */
const libraries = {
    math: null
};

/* ============ exports ============= */
/* constants to export */
const ExportConst = {
	UniformTypes,
	RenderingContext,
	Time
};

export {
    UniformTypes,
    RenderingContext,
    MAX_ATTRIBUTES,
    MAX_INDICES,
    Time,
    libraries,
	ExportConst
};
