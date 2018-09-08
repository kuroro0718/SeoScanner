# SeoScanner
NPM module that scan HTML file for configurable SEO rules

# Install
require Node.JS v8.4.0 or above 

``` npm install git+https://github.com/kuroro0718/SeoScanner.git ```

# Usage

``` javascript
const SeoScanner = require('SeoScanner');

const config = {
  outputFormat:    '-s',
  seoRules:     [
    {
      selector:  'img',
      target:    'alt',
      condition: 'without'
    },
    {
      selector:  'h1',
      target:    1,
      condition: 'more than'
    },
    {
      selector:  'strong',
      target:    15,
      condition: 'more than'
    },
    {
      selector:  'head',
      target:    'meta[name="description"]',
      condition: 'without'
    }
  ]
};
const seoScanner = new SeoScanner(config);
const resultStream = await seoScanner.detectHtml('test/test_data.html');
```

* outputFormat: 
	1. -f analysis result will save into file
	2. -s analysis result is readable stream
	3. -c analysis result will output in console
* outputPath: output file path, only need it while outputFormat = -f
* seoRules: array of configurable SEO rule object
	1. selector need to analysis HTML tag
	2. target target attribute or number of tag need to meet condition
	3. condition
		* 'more than': check number of selector
		* 'without': check target is existing in selector or not
