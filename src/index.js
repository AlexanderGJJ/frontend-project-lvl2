import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import parse from './parsers';
import format from './formatters';

const getFullPath = (filepath) => path.resolve(process.cwd(), filepath);
const readFile = (filename) => fs.readFileSync(getFullPath(filename), 'utf-8');
const createAst = (obj1, obj2) => {
  const keys = _.union(_.keys(obj1), _.keys(obj2)).sort();
  const iter = (key) => {
    if (!_.has(obj2, key)) {
      return { type: 'deleted', key, value: obj1[key] };
    }

    if (!_.has(obj1, key)) {
      return { type: 'added', key, value: obj2[key] };
    }

    if (_.isObject(obj1[key]) && _.isObject(obj2[key])) {
      return { type: 'ast', key, children: createAst(obj1[key], obj2[key]) };
    }

    if (obj1[key] === obj2[key]) {
      return { type: 'unchanged', key, value: obj1[key] };
    }

    return {
      type: 'changed', key, valueAfter: obj2[key], valueBefore: obj1[key],
    };
  };

  const ast = keys.map((key) => iter(key));
  return ast;
};

const genDiff = (filepath1, filepath2, formatType = 'nested') => {
  const content1 = readFile(getFullPath(filepath1));
  const content2 = readFile(getFullPath(filepath2));
  const extensionName1 = path.extname(getFullPath(filepath1)).slice(1);
  const extensionName2 = path.extname(getFullPath(filepath2)).slice(1);

  const data1 = parse(content1, extensionName1);
  const data2 = parse(content2, extensionName2);
  const data = createAst(data1, data2);

  return format(data, formatType);
};

export default genDiff;
