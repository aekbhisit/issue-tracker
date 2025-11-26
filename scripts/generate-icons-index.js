const fs = require("fs")
const path = require("path")

const iconsDir = path.join(__dirname, "..", "apps", "admin", "public", "icons")
const outputFile = path.join(iconsDir, "index.tsx")

function toPascalCase(name) {
	return name
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("")
}

function makeExportName(base) {
	let pascal = toPascalCase(base)
	if (!pascal) {
		pascal = "Icon"
	}

	if (!pascal.toLowerCase().endsWith("icon")) {
		pascal = `${pascal}Icon`
	}

	if (!/^[A-Za-z_]/.test(pascal)) {
		pascal = `_${pascal}`
	}

	return pascal
}

const files = fs
	.readdirSync(iconsDir)
	.filter((file) => file.endsWith(".svg"))
	.sort((a, b) => a.localeCompare(b, "en"))

const usedNames = new Set()
const items = files.map((file) => {
	const baseName = file.replace(/\.svg$/i, "")
	let exportName = makeExportName(baseName)

	if (usedNames.has(exportName)) {
		let counter = 2
		let candidate = `${exportName}${counter}`
		while (usedNames.has(candidate)) {
			counter += 1
			candidate = `${exportName}${counter}`
		}
		exportName = candidate
	}

	usedNames.add(exportName)

	return { file, exportName }
})

const imports = items.map(({ file, exportName }) => `import ${exportName} from "./${file}"`).join("\n")
const entries = items.map(({ exportName }) => `  ${exportName},`).join("\n")

const content = `${imports}

const icons = {
${entries}
}

export default icons
export {
${entries}
}
`

fs.writeFileSync(outputFile, content)

