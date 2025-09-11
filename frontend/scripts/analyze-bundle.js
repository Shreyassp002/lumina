#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * This script provides bundle size analysis and optimization recommendations
 * for the Lumina NFT Marketplace frontend.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Analyzing bundle size...\n");

// Check if .next directory exists
const nextDir = path.join(__dirname, "../.next");
if (!fs.existsSync(nextDir)) {
  console.log("❌ No build found. Running build first...\n");
  try {
    execSync("npm run build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Function to get file size in KB
function getFileSizeInKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
  } catch (error) {
    return "N/A";
  }
}

// Function to analyze bundle
function analyzeBundleSize() {
  const staticDir = path.join(nextDir, "static");

  if (!fs.existsSync(staticDir)) {
    console.log("❌ Static directory not found");
    return;
  }

  console.log("📊 Bundle Analysis Results:\n");
  console.log("=".repeat(50));

  // Find JavaScript chunks
  const chunksDir = path.join(staticDir, "chunks");
  if (fs.existsSync(chunksDir)) {
    const chunks = fs
      .readdirSync(chunksDir)
      .filter((file) => file.endsWith(".js"))
      .map((file) => ({
        name: file,
        size: getFileSizeInKB(path.join(chunksDir, file)),
        path: path.join(chunksDir, file),
      }))
      .sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

    console.log("📦 JavaScript Chunks:");
    console.log("-".repeat(50));

    let totalSize = 0;
    chunks.forEach((chunk) => {
      const size = parseFloat(chunk.size);
      totalSize += size;

      // Color code based on size
      let sizeColor = "";
      if (size > 500) sizeColor = "🔴"; // Red for large chunks
      else if (size > 200) sizeColor = "🟡"; // Yellow for medium chunks
      else sizeColor = "🟢"; // Green for small chunks

      console.log(
        `${sizeColor} ${chunk.name.padEnd(40)} ${chunk.size.padStart(8)} KB`
      );
    });

    console.log("-".repeat(50));
    console.log(`📊 Total JS Size: ${totalSize.toFixed(2)} KB\n`);

    // Analyze specific chunks
    console.log("🎯 Key Chunks Analysis:");
    console.log("-".repeat(50));

    const keyChunks = {
      "react-query": chunks.find((c) => c.name.includes("react-query")),
      web3: chunks.find(
        (c) =>
          c.name.includes("web3") ||
          c.name.includes("wagmi") ||
          c.name.includes("viem")
      ),
      ui: chunks.find(
        (c) => c.name.includes("ui") || c.name.includes("lucide")
      ),
      main: chunks.find(
        (c) => c.name.includes("main") || c.name.includes("app")
      ),
    };

    Object.entries(keyChunks).forEach(([name, chunk]) => {
      if (chunk) {
        console.log(`📦 ${name.padEnd(15)}: ${chunk.size.padStart(8)} KB`);
      } else {
        console.log(
          `📦 ${name.padEnd(15)}: Not found (good for tree-shaking!)`
        );
      }
    });
  }

  // Find CSS files
  const cssDir = path.join(staticDir, "css");
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs
      .readdirSync(cssDir)
      .filter((file) => file.endsWith(".css"))
      .map((file) => ({
        name: file,
        size: getFileSizeInKB(path.join(cssDir, file)),
      }));

    if (cssFiles.length > 0) {
      console.log("\n🎨 CSS Files:");
      console.log("-".repeat(50));

      let totalCSSSize = 0;
      cssFiles.forEach((file) => {
        const size = parseFloat(file.size);
        totalCSSSize += size;
        console.log(`🎨 ${file.name.padEnd(40)} ${file.size.padStart(8)} KB`);
      });

      console.log("-".repeat(50));
      console.log(`📊 Total CSS Size: ${totalCSSSize.toFixed(2)} KB\n`);
    }
  }

  // Recommendations
  console.log("💡 Optimization Recommendations:");
  console.log("-".repeat(50));

  const recommendations = [];

  if (totalSize > 1000) {
    recommendations.push(
      "🔴 Total bundle size is large (>1MB). Consider more aggressive code splitting."
    );
  } else if (totalSize > 500) {
    recommendations.push("🟡 Bundle size is moderate. Monitor for growth.");
  } else {
    recommendations.push("🟢 Bundle size is good. Keep monitoring.");
  }

  const largeChunks = chunks.filter((c) => parseFloat(c.size) > 300);
  if (largeChunks.length > 0) {
    recommendations.push(
      `🔴 Found ${largeChunks.length} large chunks (>300KB). Consider splitting further.`
    );
  }

  if (!keyChunks["react-query"]) {
    recommendations.push("🟢 TanStack Query is properly tree-shaken or split.");
  }

  if (!keyChunks["web3"]) {
    recommendations.push("🟢 Web3 libraries are properly optimized.");
  }

  recommendations.forEach((rec) => console.log(rec));

  console.log("\n📈 Next Steps:");
  console.log("-".repeat(50));
  console.log('1. Run "npm run build:analyze" for detailed visual analysis');
  console.log("2. Check Core Web Vitals in production");
  console.log("3. Monitor bundle size in CI/CD pipeline");
  console.log("4. Review BUNDLE_OPTIMIZATION.md for detailed strategies");
}

// Run analysis
try {
  analyzeBundleSize();
} catch (error) {
  console.error("❌ Analysis failed:", error.message);
  process.exit(1);
}

console.log("\n✅ Bundle analysis complete!\n");
