"use strict";
import { QualWeb } from "@qualweb/core";
import fs from "fs";

const urlsResponse = await fetch(
  "https://wpteste2.ufjf.br/wp-json/acessibilidade/v1/pages_posts"
);

const urls = await urlsResponse.json();

urls.forEach(async (url) => {

  const plugins = {
    adBlock: true, // Default value = false
    stealth: true, // Default value = false
  };
  const qualweb = new QualWeb(plugins);

  const clusterOptions = {
    maxConcurrency: 1, // Performs several urls evaluations at the same time - the higher the number given, more resources will be used. Default value = 1
    timeout: 60 * 1000, // Timeout for loading page. Default value = 30 seconds
    monitor: true, // Displays urls information on the terminal. Default value = false
  };

  // check https://github.com/puppeteer/puppeteer/blob/v10.1.0/docs/api.md#puppeteerlaunchoptions
  // In most cases there's no need to give additional options. Just leave the field undefined
  const launchOptions = undefined;

  // Starts the QualWeb core engine
  await qualweb.start(clusterOptions, launchOptions);

  const raw_qualwebOptions = fs.readFileSync("./qualwebOptions.json", "utf8");
  const qualwebOptions = JSON.parse(raw_qualwebOptions);
  const raw_translate = fs.readFileSync("./pt.json", "utf8");
  //   qualwebOptions.translate = await fetch("./pt.json").then((res) => res.json());
  qualwebOptions.translate = JSON.parse(raw_translate);
  qualwebOptions.urls = [...url.urls];


  // Evaluates the given options - will only return after all urls have finished evaluating or resulted in an error
  const reports = await qualweb.evaluate(qualwebOptions);

  fs.writeFileSync(
    "./reports/".concat(url.id.concat("-emag.json")),
    JSON.stringify(reports)
  );

  // Stops the QualWeb core engine
  await qualweb.stop();
});