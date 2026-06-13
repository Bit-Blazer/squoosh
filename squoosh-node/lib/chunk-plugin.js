/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { promises as fs } from 'fs';
import { basename } from 'path';

const defaultOpts = {
  prefix: 'chunk-url',
};

export default function chunkPlugin(opts) {
  opts = { ...defaultOpts, ...opts };

  const prefix = opts.prefix + ':';
  return {
    name: 'chunk-plugin',
    async resolveId(id, importer) {
      const cleanId = id.replace(/\0/g, '').split('?')[0];
      if (!cleanId.startsWith(prefix)) return;
      const realId = cleanId.slice(prefix.length);
      const resolveResult = await this.resolve(realId, importer);

      if (!resolveResult) {
        throw Error(`Cannot find ${realId}`);
      }
      return '\0' + prefix + resolveResult.id.replace(/\0/g, '') + '.virtual';
    },
    async load(id) {
      const cleanId = id.replace(/\0/g, '').split('?')[0];
      if (!cleanId.startsWith(prefix)) return;
      const realId = cleanId.slice(prefix.length).replace(/\.virtual$/, '');
      const source = await fs.readFile(realId);
      this.addWatchFile(realId);

      return `export default import.meta.ROLLUP_FILE_URL_${this.emitFile({
        type: 'chunk',
        source,
        id: realId,
      })}`;
    },
  };
}
