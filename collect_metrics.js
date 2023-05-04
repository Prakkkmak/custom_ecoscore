import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import {
    computeEcoIndex,
    getEcoIndexGrade,
    computeGreenhouseGasesEmissionfromEcoIndex,
    computeWaterConsumptionfromEcoIndex,
} from './greenit-core/ecoindex.js';

// Declare enum of different scores
const SCORES_TYPES = {
    PERF: 'performance',
    ACCESS: 'accessibility',
    BEST_PRACTICES: 'best-practices',
    SEO: 'seo',
    PWA: 'pwa',
    ECO_INDEX: 'eco-index',
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const browserPort = (new URL(browser.wsEndpoint())).port;

    const options = {
        port: browserPort,
        output: 'json',
        logLevel: 'info',
    };

    const url = 'https://www.asi.fr/';

    if (!url) {
        console.error('Erreur: Veuillez fournir une URL');
        process.exit(1);
    }

    const lightHouseResults = await lighthouse(url, options);
    const scores = lightHouseResults.lhr.categories;


    const page = await browser.newPage();
    await page.goto(url);

    const dom = await page.evaluate(() => document.querySelectorAll('*').length);

    const req = await page.evaluate(() => performance.getEntriesByType('resource').length);

    const size = await page.evaluate(() =>
        performance.getEntriesByType('resource').reduce((acc, curr) => acc + curr.transferSize, 0) / 1024
    );

    const ecoIndex = computeEcoIndex(dom, req, size);

    const results = {
        performance: scores.performance.score * 100,
        accessibility: scores.accessibility.score * 100,
        best_practices: scores['best-practices'].score * 100,
        seo: scores.seo.score * 100,
        pwa: scores.pwa.score * 100,
        eco_index: ecoIndex,
    };

    // Print all results for loop

    for (const [key, value] of Object.entries(results)) {
        console.log(`${key}: ${value.toFixed(2)}`);
    }

    const sum = Object.values(results).reduce((acc, curr) => acc + curr, 0);
    const averageScore = sum / Object.values(results).length;

    console.log('custom score: ' + averageScore.toFixed(2));
    console.log('grade: ' + getGrade(averageScore));

    await browser.close();
}

function getGrade(score)
{
    if (score > 80) return "A";
    if (score > 70) return "B";
    if (score > 55) return "C";
    if (score > 40) return "D";
    if (score > 25) return "E";
    if (score > 10) return "F";
    return "G";
}

main();
