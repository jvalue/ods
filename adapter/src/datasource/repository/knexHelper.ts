import {DatasourceInsertStatement} from "../model/DatasourceInsertStatement";


export class KnexHelper {
  static createDatasourceFromResultArray(result: any) {
    var test = [];
    for (var i in result) {
      var el = result[i];
      let protocolParameters = JSON.parse(el.protocol_parameters);
      let formatParameters = JSON.parse(el.format_parameters);
      let x = {
        "protocol": {
          "type": el.protocol_type,
          "parameters":
          protocolParameters

        },
        "format": {
          "type": el.format_type,
          "parameters": formatParameters
        },
        "metadata": {
          "author": el.author,
          "license": el.license,
          "displayName": el.display_name,
          "description": el.description,
          "creationTimestamp": el.creation_timestamp
        },
        "trigger": {
          "periodic": el.periodic,
          "firstExecution": el.first_execution,
          "interval": el.interval
        },
        "schema": el.schema,
        "id": el.id
      }
      console.log(x);
      test.push(x)
    }

    console.log("durch")
    console.log(test)


    return test;
  }

  static createDatasourceFromResult(result: any) {
    let protocolParameters = JSON.parse(result[0].protocol_parameters);
    let formatParameters = JSON.parse(result[0].format_parameters);
    let x = {
      "protocol": {
        "type": result[0].protocol_type,
        "parameters": protocolParameters
      },
      "format": {
        "type": result[0].format_type,
        "parameters": formatParameters
      },
      "metadata": {
        "author": result[0].author,
        "license": result[0].license,
        "displayName": result[0].display_name,
        "description": result[0].description,
        "creationTimestamp": result[0].creation_timestamp
      },
      "trigger": {
        "periodic": result[0].periodic,
        "firstExecution": result[0].first_execution,
        "interval": result[0].interval
      },
      "schema": result[0].schema,
      "id": result[0].id
    }
    console.log(x);


    return x;
  }

  static getInsertStatementForDataSource(req: any): DatasourceInsertStatement {
    return {
      format_parameters: req.body.format.parameters,
      format_type: req.body.format.type,
      author: req.body.metadata.author,
      creation_timestamp: new Date(Date.now()).toLocaleString(),
      description: req.body.metadata.description,
      display_name: req.body.metadata.displayName,
      license: req.body.metadata.license,
      protocol_parameters: req.body.protocol.parameters,
      protocol_type: req.body.protocol.type,
      first_execution: req.body.trigger.firstExecution,
      interval: req.body.trigger.interval,
      periodic: req.body.trigger.periodic
    };
  }

  //from: https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  static stringFromUTF8Array(data: any) {
    const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
    var count = data.length;
    var str = "";

    for (var index = 0; index < count;) {
      var ch = data[index++];
      if (ch & 0x80) {
        var extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || ((index + extra) > count))
          return null;

        ch = ch & (0x3F >> extra);
        for (; extra > 0; extra -= 1) {
          var chx = data[index++];
          if ((chx & 0xC0) != 0x80)
            return null;

          ch = (ch << 6) | (chx & 0x3F);
        }
      }

      str += String.fromCharCode(ch);
    }

    return str;
  }
}
