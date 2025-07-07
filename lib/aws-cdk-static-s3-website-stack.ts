import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import {SecurityPolicyProtocol, ViewerProtocolPolicy} from 'aws-cdk-lib/aws-cloudfront'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import {Construct} from 'constructs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface StaticSiteStackProps extends cdk.StackProps {
  domainName: string;
  siteSubDomain: string;
}

export class AwsCdkStaticS3WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    const { domainName, siteSubDomain } = props;
    const siteDomain= `${siteSubDomain}.${domainName}`;

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
      originAccessLevels: [cloudfront.AccessLevel.READ]
    });

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName });

    const siteCertificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      certificate: siteCertificate,
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
      domainNames: [siteDomain],
    });

    new route53.ARecord(this, 'SiteAliasRecord,', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset('./site-contents')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*']
    });

    new cdk.CfnOutput(this, 'SiteURL', { value: `https://${siteDomain}` });

  }
}
