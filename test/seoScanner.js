const assert = require('assert');

const SeoScanner = require('../index');

describe('Seo Scanner unit test', () => {
  it('Init SeoScanner with invalid output setting', () => {
    const invalidConfig = {
      outputFormat: '-x',
    };
    assert.throws(() => {      
      new SeoScanner(invalidConfig) // eslint-disable-line
    }, /Output format setting should be -f, -s or -c/);
  });
  
  it('Init SeoScanner with blank output path', () => {
    const invalidConfig = {
      outputFormat: '-f',
      outputPath:   ''
    };
    assert.throws(() => {      
      new SeoScanner(invalidConfig) // eslint-disable-line
    }, /Output path is not avaliable/);
  });

  it('Init SeoScanner with invalid seo rules setting', () => {
    const invalidConfig = {
      outputFormat:    '-s',
      seoRules:     [{
        selector:  'img',
        target:    'alt',
        condition: 'invalidCondition'
      }]
    };
    assert.throws(() => {
      new SeoScanner(invalidConfig) // eslint-disable-line
    }, /Invalid SEO rule setting, need to check condition/);
  });

  it('Init SeoScanner with invalid input', async () => {
    const validConfig = {
      outputFormat:    '-c',
      seoRules:     [{
        selector:  'img',
        target:    'alt',
        condition: 'without'
      }]
    };
    const seoScanner = new SeoScanner(validConfig);
    try {
      await seoScanner.detectHtml('invalid input')
    } catch (e) {
      assert(e.message.includes('Input should be HTML file path or readable stream'));
    }
  });

  it('Verify SEO rules', async () => {
    const validConfig = {
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
    const seoScanner = new SeoScanner(validConfig);
    const resultStream = await seoScanner.detectHtml('test/test_data.html');
    
    const expectResult = ['There are 1 <img> tag without alt attribute', 'The HTML has more than 1 <h1> tag', 'The HTML has more than 15 <strong> tag', 'There are 1 <head> tag without meta[name="description"] attribute'];
    let index = 0;
    resultStream.on('data', chunk => {      
      assert.equal(chunk, expectResult[index], `Expect SEO detect result should be ${expectResult[index]} instead of ${chunk}`);
      index += 1;
    })    
  });
});