"use strict";

const process = require("node:process");
const fs = require("node:fs");
const child_process = require("node:child_process");

const root_dir = process.cwd();

process.chdir("./src/client");

fs.readdirSync(".")
	.filter(filename => !(filename == "main.client.ts"))
	.forEach(filename => fs.copyFileSync(filename, `${root_dir}/piano-npm/src/${filename}`))

process.chdir(`${root_dir}/piano-npm/src`); // ./piano-npm/src

fs.readdirSync(".")
	.filter(filename => filename.endsWith(".d.ts"))
	.forEach(filename => fs.unlinkSync(filename))

const processes = fs.readdirSync(".")
	.filter(filename => filename.split(".").length == 2)
	.filter(filename => filename.endsWith(".ts"))
	.map(filename =>
		new Promise((resolve, _reject) =>
		child_process.spawn("tsc", [
			"--declaration",
			"--emitDeclarationOnly",
			filename
		]).on("exit", code => {
			if(code === 0) {
				resolve();
			} else {
				// console.log(`Command tsc for ${filename} exited with code ${code}`);
				// reject(new Error(`Command tsc for ${filename} exited with code ${code}`));
			}
		})
		)
	);

async function main() {
	await Promise.all(processes);

	process.chdir(".."); // ./piano-npm
	child_process.spawnSync("rbxtsc");
	child_process.spawnSync("npm", ["pack"]);
	console.log("Successful");
}

main();
