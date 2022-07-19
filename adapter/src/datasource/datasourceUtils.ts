import express from 'express';

import { DatasourceInsertStatement } from './model/DatasourceInsertStatement';

export class DatasourceUtils {
  static getInsertStatementForDataSource(
    req: express.Request,
  ): DatasourceInsertStatement {
    const body = req.body as Record<string, Record<string, unknown>>;
    return {
      format_parameters: body.format.parameters,
      format_type: body.format.type,
      author: body.metadata.author,
      creation_timestamp: new Date(Date.now()).toLocaleString(),
      description: body.metadata.description,
      display_name: body.metadata.displayName,
      license: body.metadata.license,
      protocol_parameters: body.protocol.parameters,
      protocol_type: body.protocol.type,
      first_execution: body.trigger.firstExecution,
      interval: body.trigger.interval,
      periodic: body.trigger.periodic,
    };
  }

  // From: https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  static stringFromUTF8Array(data: Uint8Array): string | null {
    const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
    const count = data.length;
    let str = '';

    for (let index = 0; index < count; ) {
      let ch = data[index++];
      if (ch & 0x80) {
        let extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || index + extra > count) {
          return null;
        }

        ch = ch & (0x3f >> extra);
        for (; extra > 0; extra -= 1) {
          const chx = data[index++];
          if ((chx & 0xc0) !== 0x80) {
            return null;
          }

          ch = (ch << 6) | (chx & 0x3f);
        }
      }

      str += String.fromCharCode(ch);
    }

    return str;
  }
}
