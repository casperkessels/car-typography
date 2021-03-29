import { csvParse, csvFormat } from "d3";
import tinify from 'tinify'
import fs from 'fs';
import request from 'request';
import jimp from 'jimp';
import sanitize from 'sanitize-filename';

// We just have 500 requests per month, then you have to register with a new email address
// Dashboard: https://tinify.com/dashboard/api#token/bm8wjr2BSfnPJT3ZnyQV8PD80Tzx1f0M/U2qRg5-zh3ew
tinify.key = "ls7YTKWV93Hb7vzRBNfktMghpV5VT5pw";
const filename = "data2.csv";

async function download(uri, filename) {
  return new Promise(function (resolve, reject) {
    try {
      request.head(uri, function (err, res, body) {
        if (err) return reject(err);
        const fileEnding = res.headers['content-type'].split('/')[1];
        const completeFilename = `${filename}.${fileEnding}`;
        request(uri).pipe(fs.createWriteStream(completeFilename)).on('close', () => resolve(completeFilename));
      });
    } catch (e) {
      reject(e);
    }
  })
};

async function tinifyImage(filename) {
  const source = tinify.fromFile(filename);
  // This awesome setting looks for the most interesting part in the image and focuses on it
  const resized = source.resize({
    method: "cover",
    width: 200,
    height: 200
  });
  const copyrighted = resized.preserve("copyright", "creation");
  const tinyFileName = `${filename.split('.')[0]}_tiny.${filename.split('.')[1]}`;
  await copyrighted.toFile(tinyFileName);
  return tinyFileName;
}

async function tinifyAll() {
  const fileContents = fs.readFileSync(filename, 'utf8')
  const data = await csvParse(fileContents);
  const totalRows = data.length;
  let counter = 1;
  for (const row of data) {
    console.log(`Row ${counter++}/${totalRows}`)
    const year = row.startYear;
    const make = row.Make;
    const model = row.Model;
    const image = row.Img;
    let hasChanges = false;

    if (!row.ImgTiny) {
      try {
        // Download image
        const imageFileName = sanitize(`${make}-${model}-${year}`.toLowerCase(), { replacement: '_' });
        console.log('image', image);
        const hqImagePath = await download(image, `assets/images/${imageFileName}`);
        console.log('hqImagePath', hqImagePath);
        row.ImgHQ = hqImagePath;

        // Tinify Image
        const tinyImagePath = await tinifyImage(hqImagePath);
        console.log('tinyImagePath', tinyImagePath);
        row.ImgTiny = tinyImagePath;
      } catch (error) {
        console.error(error);
      }
      hasChanges = true;
    }

    if (!row.ImgTinyGrey && row.ImgTiny) {
      try {
        const tinyGreyFileName = `${row.ImgTiny.split('.')[0]}_grey.${row.ImgTiny.split('.')[1]}`;
        console.log('tinyImagePath', tinyGreyFileName);

        const image = await jimp.read(row.ImgTiny);
        await image
          .greyscale() // set greyscale
          .quality(90)
          .writeAsync(tinyGreyFileName); // save

        row.ImgTinyGrey = tinyGreyFileName;
        hasChanges = true;
      } catch (err) {
        console.error(err)
      }
    }

    if (hasChanges) {
      const newFileContents = csvFormat(data);
      fs.writeFileSync(filename, newFileContents, 'utf8');
    }
  }
}



tinifyAll();