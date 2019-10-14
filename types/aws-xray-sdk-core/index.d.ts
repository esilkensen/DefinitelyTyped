// Type definitions for aws-xray-sdk-core 2.3
// Project: https://github.com/aws/aws-xray-sdk-node/tree/master/packages/core
// Definitions by: Erik Silkensen <https://github.com/esilkensen>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.5

/// <reference types="node"/>
import * as http from "http";
import * as https from "https";

import * as AWS from "aws-sdk";

export namespace plugins {
    /**
     * Exposes the AWS EC2 plugin.
     */
    const EC2Plugin: Plugin<EC2Metadata>;

    /**
     * Exposes the AWS ECS plugin.
     */
    const ECSPlugin: Plugin<ECSMetadata>;

    /**
     * Exposes the AWS Elastic Beanstalk plugin.
     */
    const ElasticBeanstalkPlugin: Plugin<ElasticBeanstalkMetadata>;
}

export interface Plugin<T> {
    /**
     * A function to get data from the plugin.
     * @param callback - The callback for the plugin loader.
     */
    getData(callback: (metadata?: T) => void): void;

    originName: string;
}

export interface EC2Metadata {
    ec2: {
        instance_id: string;
        availability_zone: string;
    };
}

export interface ECSMetadata {
    ecs: {
        container: string;
    };
}

export interface ElasticBeanstalkMetadata {
    elastic_beanstalk: {
        environment: string;
        version_label: string;
        deployment_id: number;
    };
}

export type PluginMetadata =
    | EC2Metadata
    | ECSMetadata
    | ElasticBeanstalkMetadata;

/**
 * Enables use of plugins to capture additional data for segments.
 * @param plugins - A configurable subset of AWSXRay.plugins.
 */
export function config(plugins: Array<Plugin<PluginMetadata>>): void;

/**
 * Overrides the default whitelisting file to specify what params to capture on each AWS Service call.
 * If a service or API is not listed, no additional data is captured.
 * @param source - The path to the custom whitelist file, or a whitelist source JSON object.
 */
export function setAWSWhitelist(source: string | object): void;

/**
 * Appends to the default whitelisting file to specify what params to capture on each AWS Service call.
 * @param source - The path to the custom whitelist file, or a whitelist source JSON object.
 */
export function appendAWSWhitelist(source: string | object): void;

/**
 * Overrides the default streaming threshold (100).
 * The threshold represents the maximum number of subsegments on a single segment before
 * the SDK beings to send the completed subsegments out of band of the main segment.
 * Reduce this threshold if you see the 'Segment too large to send' error.
 * @param threshold - The new threshold to use.
 */
export function setStreamingThreshold(threshold: number): void;

export interface Logger {
    debug(...args: any[]): any;
    info(...args: any[]): any;
    warn(...args: any[]): any;
    error(...args: any[]): any;
}

/**
 * Set your own logger for the SDK.
 * @param logger - A logger which responds to debug/info/warn/error calls.
 */
export function setLogger(logObj: Logger): void;

/**
 * Gets the set logger for the SDK.
 */
export function getLogger(): Logger;

/**
 * Configures the address and port the daemon is expected to be on.
 * @param address - Address of the daemon the segments should be sent to.  Expects 'x.x.x.x', ':yyyy' or 'x.x.x.x:yyyy' IPv4 formats.
 */
export function setDaemonAddress(address: string): void;

/**
 * Wrap to automatically capture information for the segment.
 * @param name - The name of the new subsegment.
 * @param fcn - The function context to wrap. Can take a single 'subsegment' argument.
 * @param [parent] - The parent for the new subsegment, for manual mode.
 * @return Returns the result if any by executing the provided function.
 */
export function captureFunc<T>(name: string, fcn: (subsegment?: Subsegment) => T, parent?: Segment | Subsegment): T;

/**
 * Wrap to automatically capture information for the sub/segment.  You must close the segment
 * manually from within the function.
 * @param name - The name of the new subsegment.
 * @param fcn - The function context to wrap. Must take a single 'subsegment' argument and call 'subsegment.close([optional error])' when the async function completes.
 * @param [parent] - The parent for the new subsegment, for manual mode.
 * @return Returns a promise by executing the provided async function.
 */
export function captureAsyncFunc<T>(
    name: string,
    fcn: (subsegment?: Subsegment) => T,
    parent?: Segment | Subsegment,
): T;

/**
 * Wrap to automatically capture information for the sub/segment. This wraps the callback and returns a function.
 * when executed, all arguments are passed through accordingly. An additional argument is appended to gain access to the newly created subsegment.
 * For this reason, always call the captured callback with the full list of arguments.
 * @param name - The name of the new subsegment.
 * @param fcn - The function context to wrap. Can take a single 'subsegment' argument.
 * @param [parent] - The parent for the new subsegment, for manual mode.
 */
export function captureCallbackFunc<T>(
    name: string,
    fcn: (...args: any[]) => T,
    parent?: Segment | Subsegment,
): (...args: any[]) => T;

/**
 * Configures the AWS SDK to automatically capture information for the segment.
 * All created clients will automatically be captured.  See 'captureAWSClient'
 * for additional details.
 */
export function captureAWS(awssdk: typeof AWS): typeof AWS;

/**
 * Configures any AWS Client instance to automatically capture information for the segment.
 * For manual mode, a param with key called 'Segment' is required as a part of the AWS
 * call paramaters, and must reference a Segment or Subsegment object.
 * @param service - An instance of a AWS service to wrap.
 */
export function captureAWSClient<T extends AWS.Service>(service: T): T;

/**
 * Wraps the http/https.request() and .get() calls to automatically capture information for the segment.
 * Returns an instance of the HTTP or HTTPS module that is patched.
 * @param module - The built in Node.js HTTP or HTTPS module.
 * @param downstreamXRayEnabled - when true, adds a "traced:true" property to the subsegment
 *   so the AWS X-Ray service expects a corresponding segment from the downstream service.
 */
export function captureHTTPs<T extends typeof http | typeof https>(mod: T, downstreamXRayEnabled: boolean): T;

/**
 * Wraps the http/https.request() and .get() calls to automatically capture information for the segment.
 * This patches the built-in HTTP and HTTPS modules globally. If using a 3rd party HTTP library,
 * it should still use HTTP under the hood. Be sure to patch globally before requiring the 3rd party library.
 * 3rd party library compatibility is best effort. Some incompatibility issues may arise.
 * @param module - The built in Node.js HTTP or HTTPS module.
 * @param downstreamXRayEnabled - when true, adds a "traced:true" property to the subsegment
 *   so the AWS X-Ray service expects a corresponding segment from the downstream service.
 */
export function captureHTTPsGlobal(mod: typeof https | typeof http, downstreamXRayEnabled: boolean): void;

/**
 * Patches native Promise libraries provided by V8 engine so all subsegments generated within Promise are
 * attached to the correct parent.
 */
export const capturePromise: {
    (): void;
    patchThirdPartyPromise(Promise: any): void;
};

/**
 * Exposes various helper methods.
 */
export namespace utils {
    /**
     * Checks a HTTP response code, where 4xx are 'error' and 5xx are 'fault'.
     * @param status - the HTTP response sattus code.
     * @returns 'error', 'fault' or nothing on no match
     */
    function getCauseTypeFromHttpStatus(status: number): 'error' | 'fault' | undefined;

    /**
     * Performs a case-insensitive wildcard match against two strings. This method works with pseduo-regex chars; specifically ? and * are supported.
     *   An asterisk (*) represents any combination of characters
     *   A question mark (?) represents any single character
     *
     * @param pattern - the regex-like pattern to be compared against.
     * @param text - the string to compare against the pattern.
     */
    function wildcardMatch(pattern: string, text: string): boolean;

    namespace LambdaUtils {
        function validTraceData(xAmznTraceId?: string): boolean;
        function populateTraceData(segment: Segment, xAmznTraceId: string): boolean;
    }

    /**
     * Splits out the data from the trace id format.  Used by the middleware.
     * @param traceData - The additional trace data (typically in req.headers.x-amzn-trace-id).
     */
    function processTraceData(traceData?: string): { [key: string]: string };

    /**
     * Makes a shallow copy of an object without given keys - keeps prototype
     * @param obj - The object to copy
     * @param [keys=[]] - The keys that won't be copied
     * @param [preservePrototype=false] - If true also copy prototype properties
     */
    function objectWithoutProperties<T extends object, K extends keyof T>(obj: T, keys?: K[], preservePrototype?: boolean): Omit<T, K>;
}

/**
 * Exposes the SqlData class.
 */
export namespace database {
    class SqlData {
        database_version?: string;
        driver_version?: string;
        preparation?: string;
        url?: string;
        user?: string;

        /**
         * Represents a SQL database call.
         * @param databaseVer - The version on the database (user supplied).
         * @param driverVer - The version on the database driver (user supplied).
         * @param user - The user associated to the database call.
         * @param queryType - The SQL query type.
         */
        constructor(databaseVer?: string, driverVer?: string, user?: string, url?: string, queryType?: string);
    }
}

/**
 * Middleware Utils module.
 *
 * Exposes various configuration and helper methods to be used by the middleware.
 */
export namespace middleware {
    const defaultName: string | undefined;
    const dynamicNaming: boolean;
    const hostPattern: string | null;

    interface SampleRequest {
        host: string;
        httpMethod: string;
        urlPath: string;
        serviceType?: string;
    }

    interface RulesConfig {
        version: number;
        default: DefaultRuleConfig;
        rules?: RuleConfig[];
    }

    interface DefaultRuleConfig {
        fixed_target: number;
        rate: number;
    }

    type RuleConfig = RuleConfigV1 | RuleConfigV2;

    interface RuleConfigV1 extends BaseRuleConfig {
        service_name: string;
    }

    interface RuleConfigV2 extends BaseRuleConfig {
        host: string;
    }

    interface BaseRuleConfig {
        http_method: string;
        url_path: string;
        fixed_target: number;
        rate: number;
        description?: string;
    }

    type Rule = LocalRule | DefaultLocalRule;

    interface LocalRule {
        host: string;
        http_method: string;
        url_path: string;
        fixed_target: number;
        rate: number;
        reservoir: LocalReservoir;
    }

    interface DefaultLocalRule {
        default: boolean;
        reservoir: LocalReservoir;
    }

    class LocalReservoir {
        fixedTarget: number;
        fallbackRate: number;

        /**
         * Represents a LocalReservoir object that keeps track of the number of traces per second sampled and
         * the fixed rate for a given sampling rule defined locally.
         * It also decides if a given trace should be sampled or not based on the state of current second.
         * @param fixedTarget - An integer value to specify the maximum number of traces per second to sample.
         * @param fallbackRate - A value between 0 and 1 indicating the sampling rate after the maximum traces per second has been hit.
         */
        constructor(fixedTarget: number, fallbackRate: number);

        isSampled(): boolean;
    }

    interface Statistics {
        requestCount: number;
        borrowCount: number;
        sampledCount: number;
    }

    class SamplingRule {
        constructor(
            name: string,
            priority: number,
            rate: number,
            reservoirSize: number,
            host: string,
            httpMethod: string,
            urlPath: string,
            serviceName: string,
            serviceType: string,
        );

        match(sampleRequest: SampleRequest): boolean;

        snapshotStatistics(): Statistics;

        merge(rule: SamplingRule): void;

        isDefault(): boolean;

        incrementRequestCount(): void;

        incrementBorrowCount(): void;

        incrementSampledCount(): void;

        setRate(rate: number): void;

        getRate(): number;

        getName(): string;

        getPriority(): number;

        getReservoir(): Reservoir;

        resetStatistics(): void;

        canBorrow(): boolean;

        everMatched(): boolean;

        timeToReport(): number;
    }

    /**
     * Represents a Reservoir object that keeps track of the number of traces per second sampled and
     * the fixed rate for a given sampling rule. This information is fetched from X-Ray serivce.
     * It decides if a given trace should be borrowed or sampled or not sampled based on the state of current second.
     */
    class Reservoir {
        constructor();

        borrowOrTake(now: number, canBorrow: boolean): 'take' | 'borrow' | false | void;

        adjustThisSec(now: number): void;

        loadNewQuota(quota?: number, TTL?: number, interval?: number): void;

        timeToReport(): boolean;
    }

    interface Target {
        quota?: number;
        TTL?: number;
        interval?: number;
        rate: number;
    }

    /**
     * The default sampler used to make sampling decisions when the decisions are absent in the incoming requests.
     * The sampler use pollers to poll sampling rules from X-Ray service.
     */
    namespace sampler {
        /**
         * The local sampler used to make sampling decisions when the decisions are absent in the incoming requests
         * and the default sampler needs to fall back on local rules. It will also be the primary sampler
         * if the default sampler is disabled.
         */
        interface LocalSampler {
            /**
             * Makes a sample decision based on the sample request.
             * @param sampleRequest - Contains information for rules matching.
             */
            shouldSample(sampleRequest: SampleRequest): boolean;

            /**
             * Set local rules for making sampling decisions.
             */
            setLocalRules(source?: string | RulesConfig): void;

            rules: Rule[];
        }

        /**
         * The RulePoller that periodically fetch sampling rules from X-Ray service
         * and load them into RuleCache.
         */
        interface RulePoller {
            start(): void;
        }

        /**
         * The TargetPoller that periodically fetch sampling targets from X-Ray service
         * and load them into RuleCache.
         */
        interface TargetPoller {
            interval: number;

            start(): void;
        }

        /**
         * The rule cache that stores sampling rules fetched from X-Ray service.
         */
        interface RuleCache {
            /**
             * Tries to find a valid rule that matches the sample request.
             * @param sampleRequest - Contains information for rules matching.
             * @param now - Current epoch in seconds.
             */
            getMatchedRule(sampleRequest: SampleRequest, now: number): SamplingRule | undefined | null;

            /**
             * Load rules fetched from X-Ray service in order sorted by priorities.
             * @param rules - Newly fetched rules to load.
             */
            loadRules(rules: SamplingRule[]): void;

            /**
             * Load targets fetched from X-Ray service.
             * @param targetsMapping - Newly fetched targets map with rule name as key.
             */
            loadTargets(targetsMapping: { [ruleName: string]: Target }): void;

            getRules(): SamplingRule[];

            timestamp(now: number): void;

            getLastUpdated(): number;
        }

        const localSampler: LocalSampler;
        const rulePoller: RulePoller;
        const targetPoller: TargetPoller;
        const ruleCache: RuleCache;
        const started: boolean;

        /**
         * Makes a sample decision based on the sample request.
         * @param sampleRequest - Contains information for rules matching.
         */
        function shouldSample(sampleRequest: SampleRequest): boolean;

        /**
         * Set local rules in case there is a need to fallback.
         */
        function setLocalRules(source?: string | RulesConfig): void;

        /**
         * Start the pollers to poll sampling rules and targets from X-Ray service.
         */
        function start(): void;
    }

    /**
     * Enables dynamic naming for segments via the middleware. Use 'AWSXRay.middleware.enableDynamicNaming()'.
     * @param [hostPattern] - The pattern to match the host header. See the README on dynamic and fixed naming modes.
     */
    function enableDynamicNaming(hostPattern?: string): void;

    /**
     * Splits out the 'x-amzn-trace-id' header params from the incoming request.  Used by the middleware.
     * @param req - The request object from the incoming call.
     */
    function processHeaders(req: http.IncomingMessage): { [key: string]: string };

    /**
     * Resolves the name of the segment as determined by fixed or dynamic mode options. Used by the middleware.
     * @param hostHeader - The string from the request.headers.host property.
     */
    function resolveName(hostHeader?: string): string;

    /**
     * Resolves the sampling decision as determined by the values given and options set. Used by the middleware.
     * @param amznTraceHeader - The object as returned by the processHeaders function.
     * @param segment - The string from the request.headers.host property.
     * @param res - The response object from the incoming call.
     */
    function resolveSampling(amznTraceHeader: object, segment: Segment, res: http.ServerResponse): void;

    /**
     * Sets the default name of created segments. Used with the middleware.
     * Can be overridden by the AWS_XRAY_TRACING_NAME environment variable.
     * @param name - The default name for segments created in the middleware.
     */
    function setDefaultName(name: string): void;

    function disableCentralizedSampling(): void;

    /**
     * Overrides the default sampling rules file to specify at what rate to sample at for specific routes.
     * The base sampling rules file can be found at /lib/resources/default_sampling_rules.json
     * @param source - The path to the custom sampling rules file, or the source JSON object.
     */
    function setSamplingRules(source: string | RulesConfig): void;

    /**
     * Exposes the IncomingRequestData, to capture incoming request data.
     * For use with middleware.
     */
    class IncomingRequestData {
        request: { [key: string]: any };

        /**
         * Represents an incoming HTTP/HTTPS call.
         * @param req - The request object from the HTTP/HTTPS call.
         */
        constructor(req: http.IncomingMessage);

        /**
         * Closes the local and automatically captures the response data.
         * @param res - The response object from the HTTP/HTTPS call.
         */
        close(res: http.ServerResponse): void;
    }
}

/**
 * Gets the current namespace of the context.
 * Used for supporting functions that can be used in automatic mode.
 */
export function getNamespace(): Segment | Subsegment;

/**
 * Resolves the current segment or subsegment, checks manual and automatic modes.
 * Used for supporting functions that can be used in both manual and automatic modes.
 * @param segment - The segment manually provided, if provided.
 */
export function resolveSegment(segment: Segment | Subsegment): Segment | Subsegment;

/**
 * Returns the current segment or subsegment. For use with automatic mode only.
 */
export function getSegment(): Segment | Subsegment;

/**
 * Sets the current segment or subsegment.  For use with automatic mode only.
 * @param segment - The sub/segment to set.
 */
export function setSegment(segment: Segment | Subsegment): void;

/**
 * Returns true if in automatic mode, otherwise false.
 */
export function isAutomaticMode(): boolean;

/**
 * Enables automatic mode. Automatic mode uses 'continuation-local-storage'.
 * @see https://github.com/othiym23/node-continuation-local-storage
 */
export function enableAutomaticMode(): void;

/**
 * Disables automatic mode. Current segment or subsegment then must be passed manually
 * via the parent optional on captureFunc, captureAsyncFunc etc.
 */
export function enableManualMode(): void;

/**
 * Sets the context missing strategy if no context missing strategy is set using the environment variable with
 * key AWS_XRAY_CONTEXT_MISSING. The context missing strategy's contextMissing function will be called whenever
 * trace context is not found.
 * @param strategy - The strategy to set. Valid string values are 'LOG_ERROR' and 'RUNTIME_ERROR'.
 *                   Alternatively, a custom function can be supplied, which takes a error message string.
 */
export function setContextMissingStrategy(strategy: string | ((msg: string) => any)): void;

/**
 * Exposes the segment class.
 */
export class Segment {
    trace_id: string;
    id: string;
    start_time: number;
    name: string;
    in_progress: boolean;
    counter: number;
    parent_id?: string;
    origin?: string;

    /**
     * Represents a segment.
     * @param name - The name of the subsegment.
     * @param [rootId] - The trace ID of the spawning parent, included in the 'X-Amzn-Trace-Id' header of the incoming request.  If one is not supplied, it will be generated.
     * @param [parentId] - The sub/segment ID of the spawning parent, included in the 'X-Amzn-Trace-Id' header of the incoming request.
     */
    constructor(name: string, rootId?: string, parentId?: string);

    /**
     * Adds incoming request data to the http block of the segment.
     * @param data - The data of the property to add.
     */
    addIncomingRequestData(data: middleware.IncomingRequestData): void;

    /**
     * Adds a key-value pair that can be queryable through GetTraceSummaries.
     * Only acceptable types are string, float/int and boolean.
     * @param key - The name of key to add.
     * @param value - The value to add for the given key.
     */
    addAnnotation(key: string, value: boolean | string | number): void;

    /**
     * Adds a key-value pair to the metadata.default attribute when no namespace is given.
     * Metadata is not queryable, but is recorded.
     * @param key - The name of the key to add.
     * @param value - The value of the associated key.
     * @param [namespace] - The property name to put the key/value pair under.
     */
    addMetadata(key: string, value: object | null, namespace?: string): void;

    /**
     * Adds data about the AWS X-Ray SDK onto the segment.
     * @param data - Object that contains the version of the SDK, and other information.
     */
    setSDKData(data: object): void;

    setMatchedSamplingRule(ruleName: string): void;

    /**
     * Adds data about the service into the segment.
     * @param data - Object that contains the version of the application, and other information.
     */
    setServiceData(data: object): void;

    /**
     * Adds a service with associated version data into the segment.
     * @param data - The associated AWS data.
     */
    addPluginData(data: object): void;

    /**
     * Adds a new subsegment to the array of subsegments.
     * @param name - The name of the new subsegment to append.
     */
    addNewSubsegment(name: string): Subsegment;

    /**
     * Adds a subsegment to the array of subsegments.
     * @param subsegment - The subsegment to append.
     */
    addSubsegment(subsegment: Subsegment): void;

    /**
     * Removes the subsegment from the subsegments array, used in subsegment streaming.
     */
    removeSubsegment(subsegment: Subsegment): void;

    /**
     * Adds error data into the segment.
     * @param err - The error to capture.
     * @param [remote] - Flag for whether the exception caught was remote or not.
     */
    addError(err: Error | string, remote?: boolean): void;

    /**
     * Adds fault flag to the subsegment.
     */
    addFaultFlag(): void;

    /**
     * Adds error flag to the subsegment.
     */
    addErrorFlag(): void;

    /**
     * Adds throttle flag to the subsegment.
     */
    addThrottleFlag(): void;

    /**
     * Returns a boolean indicating whether or not the segment has been closed.
     */
    isClosed(): boolean;

    /**
     * Each segment holds a counter of open subsegments.  This increments the counter.
     * @param [additional] - An additional amount to increment.  Used when adding subsegment trees.
     */
    incrementCounter(additional?: number): void;

    /**
     * Each segment holds a counter of open subsegments.  This decrements
     * the counter such that it can be called from a child and propagate up.
     */
    decrementCounter(): void;

    /**
     * Closes the current segment.  This automatically sets the end time.
     * @param [err] - The error to capture.
     * @param [remote] - Flag for whether the exception caught was remote or not.
     */
    close(err?: Error | string, remote?: boolean): void;

    /**
     * Sends the segment to the daemon.
     */
    flush(): void;

    format(): string;

    toString(): string;
}

/**
 * Exposes the subsegment class.
 */
export class Subsegment {
    id: string;
    name: string;
    start_time: number;
    in_progress: boolean;
    counter: number;

    /**
     * Represents a subsegment.
     * @param name - The name of the subsegment.
     */
    constructor(name: string);

    /**
     * Nests a new subsegment to the array of subsegments.
     * @param name - The name of the new subsegment to append.
     * @returns The newly created subsegment.
     */
    addNewSubsegment(name: string): Subsegment;

    /**
     * Adds a subsegment to the array of subsegments.
     * @param subsegment - The subsegment to append.
     */
    addSubsegment(subsegment: Subsegment): void;

    /**
     * Removes the subsegment from the subsegments array, used in subsegment streaming.
     */
    removeSubsegment(subsegment: Subsegment): void;

    /**
     * Adds a property with associated data into the subsegment.
     * @param name - The name of the property to add.
     * @param data - The data of the property to add.
     */
    addAttribute(name: string, data: object): void;

    /**
     * Adds a subsegement id to record ordering.
     * @param id - A subsegment id.
     */
    addPrecursorId(id: string): void;

    /**
     * Adds a key-value pair that can be queryable through GetTraceSummaries.
     * Only acceptable types are string, float/int and boolean.
     * @param key - The name of key to add.
     * @param value - The value to add for the given key.
     */
    addAnnotation(key: string, value: boolean | string | number): void;

    /**
     * Adds a key-value pair to the metadata.default attribute when no namespace is given.
     * Metadata is not queryable, but is recorded.
     * @param key - The name of the key to add.
     * @param value - The value of the associated key.
     * @param [namespace] - The property name to put the key/value pair under.
     */
    addMetadata(key: string, value: object | null, namespace?: string): void;

    addSqlData(sqlData: any): void;

    /**
     * Adds an error with associated data into the subsegment.
     * To handle propagating errors, the subsegment also sets a copy of the error on the
     * root segment.  As the error passes up the execution stack, a reference is created
     * on each subsegment to the originating subsegment.
     * @param err - The error to capture.
     * @param [remote] - Flag for whether the exception caught was remote or not.
     */
    addError(err: Error | string, remote?: boolean): void;

    /**
     * Adds data for an outgoing HTTP/HTTPS call.
     * @param req - The request object from the HTTP/HTTPS call.
     * @param res - The response object from the HTTP/HTTPS call.
     * @param downstreamXRayEnabled - when true, adds a "traced": true hint to generated subsegments such that the AWS X-Ray service expects a corresponding segment from the downstream service.
     */
    addRemoteRequestData(req: http.ClientRequest, res: http.IncomingMessage, downstreamXRayEnabled: boolean): void;

    /**
     * Adds fault flag to the subsegment.
     */
    addFaultFlag(): void;

    /**
     * Adds error flag to the subsegment.
     */
    addErrorFlag(): void;

    /**
     * Adds throttle flag to the subsegment.
     */
    addThrottleFlag(): void;

    /**
     * Closes the current subsegment.  This automatically captures any exceptions and sets the end time.
     * @param [err] - The error to capture.
     * @param [remote] - Flag for whether the exception caught was remote or not.
     */
    close(err?: Error | string, remote?: boolean): void;

    /**
     * Each subsegment holds a counter of open subsegments.  This increments
     * the counter such that it can be called from a child and propagate up.
     * @param [additional] - An additional amount to increment.  Used when adding subsegment trees.
     */
    incrementCounter(additional?: number): void;

    /**
     * Each subsegment holds a counter of its open subsegments.  This decrements
     * the counter such that it can be called from a child and propagate up.
     */
    decrementCounter(): void;

    /**
     * Returns a boolean indicating whether or not the subsegment has been closed.
     */
    isClosed(): boolean;

    /**
     * Sends the subsegment to the daemon.
     */
    flush(): void;

    /**
     * Returns true if the subsegment was streamed in its entirety
     */
    streamSubsegments(): boolean | void;

    /**
     * Returns the formatted, trimmed subsegment JSON string to send to the daemon.
     */
    format(): string;

    /**
     * Returns the formatted subsegment JSON string.
     */
    toString(): string;

    toJSON(): { [key: string]: any };
}

export namespace SegmentUtils {
    function getCurrentTime(): number;

    function setOrigin(origin: any): void;

    function setPluginData(pluginData: any): void;

    function setSDKData(sdkData: any): void;

    function setServiceData(serviceData: any): void;

    /**
     * Overrides the default streaming threshold (100).
     * The threshold represents the maximum number of subsegments on a single segment before
     * the SDK beings to send the completed subsegments out of band of the main segment.
     * Reduce this threshold if you see the 'Segment too large to send' error.
     * @param threshold - The new threshold to use.
     */
    function setStreamingThreshold(threshold: number): void;

    function getStreamingThreshold(): number;
}
