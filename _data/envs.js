require("dotenv").config();

module.exports = {
  runMode: process.env.ELEVENTY_RUN_MODE,
  buildHook: process.env.BUILD_HOOK,
  cmsContentRepoToken: process.env.CMS_CONTENT_REPO_TOKEN,
};
