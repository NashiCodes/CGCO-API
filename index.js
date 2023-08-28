"use strict";
import { QualWeb } from "@qualweb/core";
import fs from "fs";

const urlsResponse = await fetch(
  "https://wpteste2.ufjf.br/wp-json/acessibilidade/v1/pages_posts"
);

const sitesUrls = await urlsResponse.json();

sitesUrls.forEach(async (site) => {
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
  qualwebOptions.urls = [...site.urls];

  // Evaluates the given options - will only return after all urls have finished evaluating or resulted in an error
  const raw_report = await qualweb.evaluate(qualwebOptions);

  const report = cleanReport(raw_report);

  fs.writeFileSync(
    "./api/reports/".concat(site.id.concat("-emag.json")),
    JSON.stringify(report)
  );

  // Stops the QualWeb core engine
  await qualweb.stop();
});

function cleanReport(raw_report) {
  const report = {};

  for (const url in raw_report) {
    for (const module in raw_report[url].modules) {
      for (const rules in raw_report[url].modules[module].assertions) {
        if (
          raw_report[url].modules[module].assertions[rules].metadata[
            "outcome"
          ] === "inapplicable"
        ) {
          delete raw_report[url].modules[module].assertions[rules];
        }
      }
    }
    report[url] = {
      date: raw_report[url].system.date,
      metadata: raw_report[url].metadata,
      modules: raw_report[url].modules,
    };
  }
  return report;
}
