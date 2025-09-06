const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("🔍 Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("Contract verified successfully!")
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Contract already verified!")
        } else if (
            e.message.toLowerCase().includes("task not found") ||
            e.message.toLowerCase().includes("verify:verify")
        ) {
            console.log("⚠️  Verification plugin not available - skipping verification")
        } else {
            console.log("❌ Verification failed:", e.message)
        }
    }   
}

module.exports = { verify }
