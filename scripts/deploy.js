const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  QuadraticDAO — Deployment Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(
    `  Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. Deploy QuadraticToken
  console.log("1/2  Deploying QuadraticToken...");
  const QuadraticToken = await ethers.getContractFactory("QuadraticToken");
  const token = await QuadraticToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`     ✓  QuadraticToken deployed at: ${tokenAddress}`);

  // 2. Deploy QuadraticDAO
  console.log("2/2  Deploying QuadraticDAO...");
  const QuadraticDAO = await ethers.getContractFactory("QuadraticDAO");
  const dao = await QuadraticDAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log(`     ✓  QuadraticDAO deployed at:   ${daoAddress}`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nUpdate your frontend/src/config/contracts.js with:");
  console.log(
    JSON.stringify(
      {
        TOKEN_ADDRESS: tokenAddress,
        DAO_ADDRESS: daoAddress,
      },
      null,
      2
    )
  );

  // Output for GitHub Actions / CI environments
  if (process.env.GITHUB_OUTPUT) {
    const fs = require("fs");
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `TOKEN_ADDRESS=${tokenAddress}\nDAO_ADDRESS=${daoAddress}\n`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
