import type { Manifest } from '@player-tools/xlr';
import path from 'path';
import fs from 'fs';
import type { VisitorProps } from './types';

/** export all exported types in the file */
export function fileVisitor(args: VisitorProps): Manifest | undefined {
  const { sourceFiles, converter, outputDirectory } = args;

  const types = new Array<string>();

  sourceFiles.forEach((sourceFile) => {
    const convertedTypes = converter.convertSourceFile(sourceFile);
    if (convertedTypes.data.types.length > 0) {
      convertedTypes.data.types.forEach((type) => {
        fs.writeFileSync(
          path.join(outputDirectory, `${type.name}.json`),
          JSON.stringify(type, undefined, 4)
        );
      });

      types.push(...convertedTypes.convertedTypes);
    }
  });

  if (types.length === 0) {
    return undefined;
  }

  const manifest: Manifest = {
    pluginName: 'Types',
    capabilities: new Map([['Types', types]]),
  };

  return manifest;
}
