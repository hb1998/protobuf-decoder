const { uncompress } = require("snappyjs");
const { Root } = require("protobufjs");
const fs = require('fs');

const parseMultipartFormData = (request) => {
  const boundary = request.headers["content-type"].split(/boundary=/)[1];
  const boundaryRegex = new RegExp(`--${boundary}-?-?\r\n`, "g");
  const fieldNameMarker = "Content-Disposition: form-data; name=";
  const fieldNameRegex = new RegExp(`${fieldNameMarker}"([^"]*)"`);
  const blobContentMarker = "Content-Type: application/octet-stream";
  const blobContentRegex = new RegExp(blobContentMarker);
  const delimeter = "\r\n";

  return request.body.split(boundaryRegex).reduce((parsedFormData, part) => {
    if (part) {
      const field = fieldNameRegex.exec(part);
      if (field) {
        const fieldName = field[1];
        let fieldValue;

        const blobContent = blobContentRegex.exec(part);
        if (blobContent) {
          fieldValue = part.substring(
            blobContent.index + blobContentMarker.length + delimeter.length * 2,
            part.length - delimeter.length
          );
        } else {
          fieldValue = JSON.parse(
            part.substring(
              field.index +
                fieldNameMarker.length +
                1 + // Quotes
                fieldName.length +
                1 + // Quotes
                delimeter.length * 2,
              part.length - delimeter.length
            )
          );
        }

        parsedFormData[fieldName] = fieldValue;
      }
    }
    return parsedFormData;
  }, {});
};

const convertBinaryStringToUint8Array = (binaryString) => {
  const buffer = new ArrayBuffer(binaryString.length);
  const uint8Array = new Uint8Array(buffer);

  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i) & 0xff;
  }

  return uint8Array;
};

const decodeProtobufSerializedPayload = (encodedPayload, schema) => {
  const root = Root.fromJSON(schema);
  const PayloadMessage = root.lookupType("Payload");
  const decodedPayload = PayloadMessage.decode(encodedPayload);
  const payload = PayloadMessage.toObject(decodedPayload, {
    arrays: true,
  });
  return payload;
};

const decodeWritebackPayload = (request) => {
  const { schema, writebackPayload, nativePayload, autoUpdateData } =
    parseMultipartFormData(request);
  const compressedPayloadUint8 = convertBinaryStringToUint8Array(
    writebackPayload || nativePayload || autoUpdateData
  );
  const protobufEncodedPayload = uncompress(compressedPayloadUint8);
  const decodedPayload = decodeProtobufSerializedPayload(
    protobufEncodedPayload,
    schema
  );
  return decodedPayload;
};

// Copy as fetch (Node.js)
const request = {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyIiwiY3dzIjoiMyIsInZpc3VhbElkIjoiMjAwNjAiLCJzY29wZSI6eyJ3b3Jrc3BhY2VBZG1pbiI6dHJ1ZSwidmlzdWFsVXNlciI6dHJ1ZSwiY29tbWVudHMiOnRydWUsInNjaGVkdWxlciI6dHJ1ZSwid3JpdGVCYWNrQVBJIjp0cnVlLCJ2ZXJzaW9uaW5nIjp0cnVlLCJjdXN0b21UaGVtZSI6dHJ1ZSwiZGF0YUlucHV0Ijp0cnVlLCJleHBvcnRQREYiOnRydWUsImV4cG9ydFhMUyI6dHJ1ZSwiZGF0YUZsb3ciOnRydWUsIm1kZSI6dHJ1ZSwibWRlU2NkIjp0cnVlLCJtZGVXZWJob29rIjp0cnVlLCJtZGVBY2wiOnRydWUsImluZm9CcmlkZ2UiOnRydWUsImluZm9yaXZlciI6dHJ1ZX0sImF1ZCI6ImluZm9yaXZlciIsInJvbGVzIjpbeyJpZCI6IjEiLCJuYW1lIjoiV09SS1NQQUNFX0FETUlOIn0seyJpZCI6IjUiLCJuYW1lIjoiVklTVUFMX1VTRVIifV0sImlhdCI6MTcyODU1Mzk1NCwiZXhwIjoxNzI4NTU1NzU0fQ.-fHJxQr1qMvKW4q58Vwv-ZNay8uj7q_FreRecVyNfRw",
    "cache-control": "no-cache",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundary47acwLKvKRR4MDQn",
    "platform": "PowerBI",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "visual_version": "3.5.0.0",
    "x_request_cws": "e3f53631e41bcfe7b85ce463178b4360"
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "------WebKitFormBoundary47acwLKvKRR4MDQn\r\nContent-Disposition: form-data; name=\"schema\"\r\n\r\n{\"nested\":{\"Data\":{\"fields\":{\"Sum__Orders__Sales__U3VtKE9yZGVycy5TYWxlcyk__\":{\"type\":\"double\",\"id\":1},\"Orders.Category\":{\"type\":\"string\",\"id\":2},\"_cellMeta\":{\"type\":\"CellMeta\",\"id\":3},\"Ir Notes\":{\"type\":\"string\",\"id\":4},\"Last Updated At\":{\"type\":\"double\",\"id\":5},\"Last Updated By\":{\"type\":\"string\",\"id\":6}}},\"CellMeta\":{\"fields\":{\"measureGuid\":{\"type\":\"string\",\"id\":1},\"source\":{\"type\":\"string\",\"id\":2},\"scenarioId\":{\"type\":\"string\",\"id\":3},\"isAggregated\":{\"type\":\"bool\",\"id\":4},\"isPartOfAllocationRange\":{\"type\":\"bool\",\"id\":5},\"rowId\":{\"type\":\"string\",\"id\":6},\"columnId\":{\"type\":\"string\",\"id\":7},\"columnName\":{\"type\":\"string\",\"id\":8},\"isNull\":{\"type\":\"bool\",\"id\":9}}},\"Payload\":{\"fields\":{\"data\":{\"rule\":\"repeated\",\"type\":\"Data\",\"id\":10}}}}}\r\n------WebKitFormBoundary47acwLKvKRR4MDQn\r\nContent-Disposition: form-data; name=\"payload\"\r\n\r\n{\"writebackEnvironment\":\"Service\",\"writebackMode\":\"Mg==\",\"scenarioIds\":[\"0\"],\"incomingJsonDataLength\":4,\"compressionVersion\":1,\"sourceType\":10,\"visualFilter\":20,\"filterContextHash\":null}\r\n------WebKitFormBoundary47acwLKvKRR4MDQn\r\nContent-Disposition: form-data; name=\"writebackPayload\"; filename=\"blob\"\r\nContent-Type: application/octet-stream\r\n\r\n´\u0007ðfRÛ\u0001\t>`å\u0010t)A\u0012\nTechnology\u001aÃ\u0001\n-Sum__Orders__Sales__U3VtKE9yZGVycy5TYWxlcyk__\u0012\u0006Native\u001a\u00010 \u00012\fGrand__Total:9\u0019Y\u0004__²V\u0000\u0004B:\u001d;\u0000X¶<\u0000hH\u0000RØ\u0001\tÊ1ß¤&A\u0012\tFurniture\u001aÁþÝ\u0000.Ý\u0000\u00008\u0015X¾Ü\u0000\u00009\u0019:ÆÛ\u0000x¢\u0002\tÛMb\u0010ñ%A\u0012\u000fOffice Supplies\u001a\u0002þ¾\u0001=¾\u0000Z\t^\u0001Þ\t_h__T2ZmaWNlJTIwU3VwcGxpZXM__\u0001%ª5\u0002\u0004B[®\\\u0000Æ%\u00014Ó\u0001\txO\u001en¸AA\u001aÇ\u0001þ\u0014\u0001=\u0014\u0000;.à\u0002¾õ\u0000\u0000<2=\u0000ÂÖ\u0000\r\n------WebKitFormBoundary47acwLKvKRR4MDQn--\r\n",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
}

const decodedPayload = decodeWritebackPayload(request);
fs.writeFileSync('output.json', JSON.stringify(decodedPayload, null, 2));