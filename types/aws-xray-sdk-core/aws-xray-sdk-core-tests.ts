import AWSXRay = require('aws-xray-sdk-core');
import AWS = require('aws-sdk');
import http = require('http');
import https = require('https');
import url = require('url');

AWSXRay.plugins.EC2Plugin.getData((metadata?: AWSXRay.EC2Metadata) => { });
AWSXRay.plugins.ECSPlugin.getData((metadata?: AWSXRay.ECSMetadata) => { });
AWSXRay.plugins.ElasticBeanstalkPlugin.getData((metadata?: AWSXRay.ElasticBeanstalkMetadata) => { });

AWSXRay.config([AWSXRay.plugins.EC2Plugin, AWSXRay.plugins.ECSPlugin]);
AWSXRay.config([AWSXRay.plugins.ElasticBeanstalkPlugin]);

AWSXRay.setAWSWhitelist('/path/here');
AWSXRay.setAWSWhitelist({});
AWSXRay.setAWSWhitelist(); // $ExpectError
AWSXRay.setAWSWhitelist(null); // $ExpectError
AWSXRay.setAWSWhitelist(0); // $ExpectError

AWSXRay.appendAWSWhitelist('/path/here');
AWSXRay.appendAWSWhitelist({});
AWSXRay.appendAWSWhitelist(); // $ExpectError
AWSXRay.appendAWSWhitelist(null); // $ExpectError
AWSXRay.appendAWSWhitelist(0); // $ExpectError

AWSXRay.setStreamingThreshold(10);

AWSXRay.setLogger(console);
AWSXRay.getLogger().debug('debug');
AWSXRay.getLogger().info({ foo: 'bar' }, 'info');
AWSXRay.getLogger().warn('warn', 123);
AWSXRay.getLogger().error('error');

AWSXRay.setDaemonAddress('192.168.0.23:8080');

const traceId = '1-57fbe041-2c7ad569f5d6ff149137be86';
const segment = new AWSXRay.Segment('test', traceId);

AWSXRay.captureFunc('tracedFcn', () => 'OK', segment); // $ExpectType string
AWSXRay.captureFunc('tracedFcn', () => { return; }); // $ExpectType void
AWSXRay.captureFunc('tracedFcn', () => { throw new Error(); }); // $ExpectType never
let subsegment: AWSXRay.Subsegment | undefined;
AWSXRay.captureFunc('tracedFcn', (sub) => { subsegment = sub; }, segment); // $ExpectType void

async function fcn(seg?: AWSXRay.Subsegment) {
    if (seg) {
        seg.close();
    }
    return 'OK';
}
AWSXRay.captureAsyncFunc('tracedFcn', fcn, segment); // $ExpectType Promise<string>
AWSXRay.captureAsyncFunc('tracedFcn', fcn); // $ExpectType Promise<string>

function tracedFcn(callback: (param0: any, param1: any) => any) {
    callback('hello', 'there');
}
function callback(param0: any, param1: any) {
    console.log({ param0, param1 });
}
tracedFcn(AWSXRay.captureCallbackFunc('callback', callback));
tracedFcn(AWSXRay.captureCallbackFunc('callback', callback, segment));

const aws = AWSXRay.captureAWS(AWS);
AWSXRay.captureAWSClient(new aws.DynamoDB());

AWSXRay.captureHTTPs(http, true);
AWSXRay.captureHTTPs(https, true);

AWSXRay.captureHTTPsGlobal(http, true);
AWSXRay.captureHTTPsGlobal(https, true);

AWSXRay.capturePromise();

AWSXRay.utils.getCauseTypeFromHttpStatus(200); // $ExpectType "error" | "fault" | undefined
AWSXRay.utils.wildcardMatch('*', 'foo'); // $ExpectType boolean
AWSXRay.utils.LambdaUtils.validTraceData('moop'); // $ExpectType boolean
AWSXRay.utils.LambdaUtils.validTraceData(); // $ExpectType boolean
AWSXRay.utils.LambdaUtils.populateTraceData(segment, 'moop'); // $ExpectType boolean
AWSXRay.utils.processTraceData(); // $ExpectType { [key: string]: string; }
AWSXRay.utils.processTraceData('Root=1-58ed6027-14afb2e09172c337713486c0;'); // $ExpectType { [key: string]: string; }
const urlWithQuery: url.UrlWithStringQuery = url.parse('url');
const urlWithoutQuery: url.Url = AWSXRay.utils.objectWithoutProperties(urlWithQuery, ['query'], true);

new AWSXRay.database.SqlData();
new AWSXRay.database.SqlData('databaseVer', 'driverVer', 'user', 'url', 'queryType');
