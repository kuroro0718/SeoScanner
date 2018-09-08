const cheerio = require('cheerio');
const debug = require('debug')('SeoScanner');
const fs = require('fs-extra');
const path = require('path');
const Stream = require('stream');

const VALID_OUTPUT_FORMATS = ['-f', '-s', '-c'];
const VALID_CONDITIONS = ['without', 'more than'];

async function fetchRawHtml(inputStream) {
  let rawHtml = '';
  inputStream.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    inputStream.on('data', chunk => {
      rawHtml += chunk;      
    });
  
    inputStream.on('error', error => {
      reject(error);
    });

    inputStream.on('end', () => {
      debug('There will be no more data.');
      resolve(rawHtml);
    });
  })
}

function analyseHtml(seoRules, rawHtml) {
  const report = [];
  const $ = cheerio.load(rawHtml);
  seoRules.forEach(element => {
    if (element.condition === 'without') {
      const regEx = /meta\[(\S+)\]/;
      let missingCount = 0;
      if (regEx.test(element.target)) {
        const head = cheerio.load($(element.selector).html());
        const content = head(element.target).attr('content');    
        // If there isn't any matched attribute, then assign missing count
        missingCount = content === undefined ? 1 : 0;
      } else {
        const missingAttr = $(element.selector).filter(el => $(el).attr(element.target) === undefined);
        missingCount = missingAttr.length;
      }

      report.push(`There are ${missingCount} <${element.selector}> tag without ${element.target} attribute`);
    } else if (element.condition === 'more than') {
      const selectedTag = $(element.selector);
      if (selectedTag.length > element.target) {
        report.push(`The HTML has more than ${element.target} <${element.selector}> tag`);
      }
    }
  });

  return report;
}

class SeoScanner {
  constructor(config) {
    if (VALID_OUTPUT_FORMATS.indexOf(config.outputFormat) === -1) {
      throw new Error('Output format setting should be -f, -s or -c');
    }    
    // Verify output path is avaliable
    if (config.outputFormat === '-f' && (!fs.pathExistsSync(path.dirname(config.outputPath)) || path.basename(config.outputPath) === '')) {
      throw new Error('Output path is not avaliable');
    }

    // Verify SEO rules setting
    config.seoRules.forEach(element => {
      if (VALID_CONDITIONS.indexOf(element.condition) === -1) {
        throw new Error('Invalid SEO rule setting, need to check condition');
      }
    })

    this.seoRules = config.seoRules;
    this.outputFormat = config.outputFormat;
    this.outputPath = config.outputPath;
  }

  async detectHtml(input) {
    let rawHtml = '';
    if (fs.pathExistsSync(input)) {
      rawHtml = await fetchRawHtml(fs.createReadStream(input));
    } else if (input instanceof Stream.Readable) {
      rawHtml = await fetchRawHtml(input);
    } else {
      throw new Error('Input should be HTML file path or readable stream');
    } 

    const analysisReport = analyseHtml(this.seoRules, rawHtml);
    switch (this.outputFormat) {
      case '-f': {
        const logWriter = fs.createWriteStream(this.outputPath);
        logWriter.on('error', err => {
          throw new Error(err);
        })
        analysisReport.forEach(p => logWriter.write(`${p}\n`));
        logWriter.end();  

        return 'Output SEO report is done';
      }
      case '-s': {
        const resultStream = new Stream.Readable({
          read() {
            analysisReport.forEach(element => {
              this.push(`${element}`);
            }) 
            this.push(null); // Finish output data    
          }
        });
        
        return resultStream;
      }
      default: 
        console.info(analysisReport);
        return analysisReport;
    }
  }
}

module.exports = SeoScanner;