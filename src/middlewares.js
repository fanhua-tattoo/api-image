'use strict';

const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const pathUtil = require('path');
const send = require('koa-send');
const fileType = require('file-type');
const readChunk = require('read-chunk');
const debug = require('debug')('app');


const identity = x => x;


exports.fetchIndex = fetchIndex;
exports.fetchImage = fetchImage;


function fetchIndex(config) {
  const _config = config || {};
  const imageRoot = _config.root || '/';


  return async function (ctx) {
    try {
      const dirPath = ctx.request.URL.searchParams.get('path') || '/';

      const fullPath = pathUtil.join(imageRoot, dirPath);

      const filePaths = await fs.readdirAsync(fullPath);
      const filesAndDirectories = await Promise.all(filePaths.map(async (filePath) => {
        const fullFilePath = pathUtil.join(fullPath, filePath);
        const stats = await fs.statAsync(fullFilePath);

        if (stats.isFile()) {
          const buffer = await readChunk(fullFilePath, 0, 4100);
          const type = fileType(buffer);

          if (type && type.mime.startsWith('image/')) {
            return {
              type: 'file',
              path: pathUtil.join(dirPath, filePath),
            };
          }
        } else if (stats.isDirectory()) {
          return {
            type: 'directory',
            path: pathUtil.join(dirPath, filePath, '/'),
          };
        }

        return null;
      }));


      filesAndDirectories.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'file' ? 1 : -1;
        }

        if (a.path !== b.path) {
          return a.path > b.path ? 1 : -1;
        }

        return 0;
      });


      if (fullPath !== imageRoot) {
        filesAndDirectories.unshift({
          type: 'directory',
          path: pathUtil.join(dirPath, '..'),
        });
      }

      ctx.body = {
        error: false,
        payload: filesAndDirectories.filter(identity),
      };
    } catch (err) {
      debug(err);
      ctx.status = 404;
    }
  };
}


function fetchImage(config) {
  const _config = config || {};
  const indexRoot = _config.root || '/';

  const sendOption = {
    maxage: 60 * 1000,
    immutable: false,
    root: indexRoot,
  };

  return async function (ctx) {
    try {
      const imagePath = ctx.request.URL.searchParams.get('path');
      ctx.assert(imagePath, 404);


      const fullPath = pathUtil.join(indexRoot, imagePath);
      const stats = await fs.statAsync(fullPath);
      ctx.assert(stats.isFile(), 404);


      await send(ctx, imagePath, sendOption);
    } catch (err) {
      debug(err);
      ctx.status = 404;
    }
  };
}
