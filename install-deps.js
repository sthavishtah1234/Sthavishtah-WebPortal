const { execSync } = require("child_process")
const fs = require("fs")

console.log("🔧 Fixing dependency issues for Sthavishtah Yoga project...")

// Create .npmrc file if it doesn't exist
if (!fs.existsSync(".npmrc")) {
  console.log("Creating .npmrc file with legacy-peer-deps=true")
  fs.writeFileSync(".npmrc", "legacy-peer-deps=true\n")
}

// Clean npm cache
console.log("Cleaning npm cache...")
try {
  execSync("npm cache clean --force", { stdio: "inherit" })
} catch (error) {
  console.error("Error cleaning cache:", error.message)
}

// Remove node_modules and package-lock.json
console.log("Removing node_modules and package-lock.json...")
try {
  if (fs.existsSync("node_modules")) {
    if (process.platform === "win32") {
      execSync("rmdir /s /q node_modules", { stdio: "inherit" })
    } else {
      execSync("rm -rf node_modules", { stdio: "inherit" })
    }
  }

  if (fs.existsSync("package-lock.json")) {
    fs.unlinkSync("package-lock.json")
  }
} catch (error) {
  console.error("Error removing files:", error.message)
}

// Install dependencies with legacy-peer-deps
console.log("Installing dependencies with legacy-peer-deps...")
try {
  execSync("npm install --legacy-peer-deps", { stdio: "inherit" })
  console.log("✅ Dependencies installed successfully!")
} catch (error) {
  console.error("Error installing dependencies:", error.message)
  process.exit(1)
}
