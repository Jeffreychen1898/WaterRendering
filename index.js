const express = require("express");
const app = express();

const PORT = 8080;

app.use("/", express.static("static"));
app.use("/shaders", express.static("shaders"));

const server = app.listen(PORT, () => {
	console.log("server started on port: " + PORT);
});
