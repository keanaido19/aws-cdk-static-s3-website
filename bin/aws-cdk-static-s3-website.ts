#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsCdkStaticS3WebsiteStack } from '../lib/aws-cdk-static-s3-website-stack';

const app = new cdk.App();
new AwsCdkStaticS3WebsiteStack(app, 'AwsCdkStaticS3WebsiteStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
    domainName: 'keanaido19.co.za',
    siteSubDomain: 'www',
});