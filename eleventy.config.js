require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require('sharp');

const CMS_REPO = "i-dot-ai/ai-gov-uk-cms-content";
const ASSETS_FOLDER = "./_site/assets";

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("components/");
  eleventyConfig.addPassthroughCopy("public/");

  // Copy static assets over from CMS repo
  eleventyConfig.on("eleventy.before", async ({ dir, runMode, outputMode }) => {
    if (!process.env.CMS_CONTENT_REPO_TOKEN) {
      throw new Error("CMS_CONTENT_REPO_TOKEN is not set");
    }

    // Get all entries in CMS folder
    const assets = await axios.get(
      `https://api.github.com/repos/${CMS_REPO}/contents/static/images/uploads`,
      {
        headers: {
          Authorization: `token ${process.env.CMS_CONTENT_REPO_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    // create ./_site/assets folder if it doesn't already exist
    if (!fs.existsSync(ASSETS_FOLDER)) {
      fs.mkdirSync(ASSETS_FOLDER, { recursive: true });
    }

    // loop through each asset, and copy over if it doesn't already exist
    for (const asset of assets.data) {
      const localFilePath = path.resolve(
        __dirname,
        `${ASSETS_FOLDER}/${asset.name}`
      );
      if (!fs.existsSync(localFilePath)) {

        const response = await axios({
          url: asset.download_url,
          method: "GET",
          responseType: "stream",
          headers: {
            Authorization: `token ${process.env.CMS_CONTENT_REPO_TOKEN}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        const writer = fs.createWriteStream(localFilePath);
        const finished = new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        response.data.pipe(writer);
        await finished; 

      }

      // OPTIMISE IMAGES
      const MAX_IMAGE_WIDTH = 2200; // based on 2 x container width
      const ACCEPTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
      if (ACCEPTED_FORMATS.some(ext => asset.name.endsWith(ext))) {

        const filePath = `.${(localFilePath.match(/\/_site\/.*$/) || [])[0]}`;

        console.log('Optimising image: ', localFilePath);
        fs.rename(filePath, `${filePath}.bak`, async (err) => {
          
          // resize and save to original file
          await sharp(`${filePath}.bak`)
          .resize(MAX_IMAGE_WIDTH, null, {
            withoutEnlargement: true 
          })
          .toFile(filePath);

          // resize and save to webp
          await sharp(`${filePath}.bak`)
          .resize(MAX_IMAGE_WIDTH, null, {
            withoutEnlargement: true 
          })
          .toFormat('webp')
          .toFile(`${filePath}.webp`);

          // delete original
          fs.unlink(`${filePath}.bak`, (cb) => {});

        });

      }

    }

  });
};
